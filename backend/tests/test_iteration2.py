"""Iteration-2 feature tests: role login, seller flows, wallet deposits, admin deposit action, metrics."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://farm-to-door-bd.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def seller(s):
    phone = f"019{uuid.uuid4().int % 10**8:08d}"
    r = s.post(f"{API}/auth/login", json={
        "name": "TEST_Seller", "phone": phone,
        "role": "seller", "district": "বগুড়া", "village": "শেরপুর"
    })
    assert r.status_code == 200
    u = r.json()
    assert u.get("seller_id"), f"seller_id missing in login response: {u}"
    return {"phone": phone, "user": u, "seller_id": u["seller_id"]}


@pytest.fixture(scope="module")
def buyer(s):
    phone = f"018{uuid.uuid4().int % 10**8:08d}"
    r = s.post(f"{API}/auth/login", json={"name": "TEST_Buyer2", "phone": phone, "role": "buyer"})
    assert r.status_code == 200
    u = r.json()
    assert u.get("seller_id") in (None, "", False) or "seller_id" not in u or u["seller_id"] is None
    return {"phone": phone, "user": u}


# ---------- Role login & get user ----------
class TestRoleLogin:
    def test_seller_login_creates_seller(self, seller):
        assert seller["seller_id"].startswith("seller-user-")

    def test_buyer_login_no_seller(self, buyer):
        assert buyer["user"].get("seller_id") is None

    def test_get_user_by_phone(self, s, buyer):
        r = s.get(f"{API}/users/{buyer['phone']}")
        assert r.status_code == 200
        assert r.json()["phone"] == buyer["phone"]

    def test_get_user_404(self, s):
        r = s.get(f"{API}/users/00000000000")
        assert r.status_code == 404


# ---------- Seller reel upload ----------
class TestSellerUpload:
    def test_upload_reel_defaults(self, s, seller):
        payload = {
            "seller_id": seller["seller_id"],
            "product_title": "TEST_খাঁটি গুড়",
            "category": "মধু",
            "product_type": "non_perishable",
            "price": 300,
            "price_unit": "কেজি",
            "description": "টেস্ট আপলোড",
        }
        r = s.post(f"{API}/reels", json=payload)
        assert r.status_code == 200, r.text
        reel = r.json()
        assert reel["status"] == "approved"
        assert reel["poster"]  # defaulted from category image
        assert reel["video_url"]  # defaulted
        # appears in public feed
        feed = s.get(f"{API}/reels").json()
        assert any(x["id"] == reel["id"] for x in feed)
        # appears in seller inventory
        inv = s.get(f"{API}/seller/{seller['seller_id']}/reels").json()
        assert any(x["id"] == reel["id"] for x in inv)
        # stash for next test
        pytest.shared_reel_id = reel["id"]

    def test_seller_orders(self, s, seller, buyer):
        reel_id = pytest.shared_reel_id
        # place an order on this seller's reel
        order_payload = {
            "reel_id": reel_id, "user_name": buyer["user"]["name"], "phone": buyer["phone"],
            "district": "Dhaka", "address": "test addr", "qty": 1,
            "payment_method": "bkash", "trxid": "TRX_TEST_1",
        }
        o = s.post(f"{API}/orders", json=order_payload)
        assert o.status_code == 200, o.text
        orders = s.get(f"{API}/seller/{seller['seller_id']}/orders").json()
        assert any(x["id"] == o.json()["id"] for x in orders)


# ---------- Wallet deposit flow ----------
class TestWalletDeposit:
    def test_create_deposit_pending(self, s, buyer):
        amount = 500
        r = s.post(f"{API}/wallet/deposit", json={
            "phone": buyer["phone"], "user_name": buyer["user"]["name"],
            "method": "bkash", "amount": amount, "trxid": "TRXDEP1", "sender_number": "01999999999",
        })
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "pending"
        pytest.deposit_id = d["id"]
        pytest.deposit_amount = amount

        # user list
        lst = s.get(f"{API}/wallet/deposits", params={"phone": buyer["phone"]}).json()
        assert any(x["id"] == d["id"] for x in lst)

    def test_admin_list_includes(self, s):
        all_dep = s.get(f"{API}/admin/deposits").json()
        assert any(x["id"] == pytest.deposit_id for x in all_dep)

    def test_metrics_pending_deposits(self, s):
        m = s.get(f"{API}/admin/metrics").json()
        assert "pending_deposits" in m
        assert m["pending_deposits"] >= 1

    def test_approve_credits_wallet(self, s, buyer):
        before = s.get(f"{API}/users/{buyer['phone']}").json()["wallet"]
        r = s.post(f"{API}/admin/deposits/{pytest.deposit_id}/action", json={"action": "approve"})
        assert r.status_code == 200
        after = s.get(f"{API}/users/{buyer['phone']}").json()["wallet"]
        assert after == before + pytest.deposit_amount
        # second approve should NOT credit again (status no longer pending)
        r2 = s.post(f"{API}/admin/deposits/{pytest.deposit_id}/action", json={"action": "approve"})
        assert r2.status_code == 200
        after2 = s.get(f"{API}/users/{buyer['phone']}").json()["wallet"]
        assert after2 == after

    def test_reject_does_not_credit(self, s, buyer):
        # create new deposit
        r = s.post(f"{API}/wallet/deposit", json={
            "phone": buyer["phone"], "user_name": buyer["user"]["name"],
            "method": "nagad", "amount": 200, "trxid": "TRXDEP2", "sender_number": "01888888888",
        })
        dep_id = r.json()["id"]
        before = s.get(f"{API}/users/{buyer['phone']}").json()["wallet"]
        s.post(f"{API}/admin/deposits/{dep_id}/action", json={"action": "reject"})
        after = s.get(f"{API}/users/{buyer['phone']}").json()["wallet"]
        assert after == before
        all_dep = s.get(f"{API}/admin/deposits").json()
        this = next(x for x in all_dep if x["id"] == dep_id)
        assert this["status"] == "rejected"
