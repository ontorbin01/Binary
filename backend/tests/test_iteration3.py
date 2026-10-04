"""Iteration-3 feature tests:
- Login/Register split: login 404 for unregistered; register 409 on dup; seller role creates seller_id
- PUT /profile mirrors to seller
- /wallet/withdraw balance guards + list
- Admin withdrawals: approve deducts wallet; approve w/ insufficient -> 400 & rejected; reject w/o deduct
- /admin/metrics has pending_withdrawals + pending_deposits
- Seller reel upload with YouTube URL sets img.youtube.com poster
"""
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


# ---------- Auth split ----------
class TestAuthSplit:
    def test_login_unregistered_404(self, s):
        phone = f"011{uuid.uuid4().int % 10**8:08d}"
        r = s.post(f"{API}/auth/login", json={"phone": phone})
        assert r.status_code == 404

    def test_register_then_login(self, s):
        phone = f"019{uuid.uuid4().int % 10**8:08d}"
        r = s.post(f"{API}/auth/register", json={
            "name": "TEST_I3_Buyer", "phone": phone, "role": "buyer",
            "avatar": "https://example.com/a.png",
        })
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["phone"] == phone
        assert u["avatar"] == "https://example.com/a.png"
        assert u.get("seller_id") in (None, "")

        # dup register
        r2 = s.post(f"{API}/auth/register", json={
            "name": "dup", "phone": phone, "role": "buyer"
        })
        assert r2.status_code == 409

        # login works now
        r3 = s.post(f"{API}/auth/login", json={"phone": phone})
        assert r3.status_code == 200
        assert r3.json()["phone"] == phone

    def test_register_seller_creates_seller_doc(self, s):
        phone = f"018{uuid.uuid4().int % 10**8:08d}"
        r = s.post(f"{API}/auth/register", json={
            "name": "TEST_I3_Seller", "phone": phone, "role": "seller",
            "district": "ঢাকা", "village": "ধামরাই",
        })
        assert r.status_code == 200
        u = r.json()
        assert u["seller_id"] and u["seller_id"].startswith("seller-user-")
        # seller doc fetchable
        sr = s.get(f"{API}/sellers/{u['seller_id']}")
        assert sr.status_code == 200
        sd = sr.json()
        assert sd["name"] == "TEST_I3_Seller"
        assert sd["village"] == "ধামরাই"


# ---------- Profile mirror ----------
class TestProfileMirror:
    def test_profile_mirrors_to_seller(self, s):
        phone = f"017{uuid.uuid4().int % 10**8:08d}"
        reg = s.post(f"{API}/auth/register", json={
            "name": "TEST_PM", "phone": phone, "role": "seller",
            "district": "ঢাকা", "village": "A",
        }).json()
        sid = reg["seller_id"]
        r = s.put(f"{API}/profile", json={
            "phone": phone, "name": "TEST_PM2",
            "avatar": "https://ex.com/x.jpg",
            "district": "বগুড়া", "village": "শেরপুর",
        })
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["name"] == "TEST_PM2"
        assert u["avatar"] == "https://ex.com/x.jpg"
        # seller mirror
        sd = s.get(f"{API}/sellers/{sid}").json()
        assert sd["name"] == "TEST_PM2"
        assert sd["avatar"] == "https://ex.com/x.jpg"
        assert sd["village"] == "শেরপুর"
        assert sd["district"] == "বগুড়া"

    def test_profile_404(self, s):
        r = s.put(f"{API}/profile", json={"phone": "00000000000", "name": "x"})
        assert r.status_code == 404


# ---------- Withdraw guards ----------
class TestWithdraw:
    def test_withdraw_insufficient_balance(self, s):
        phone = f"016{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_W", "phone": phone, "role": "seller",
                                              "district": "ঢাকা", "village": "A"})
        r = s.post(f"{API}/wallet/withdraw", json={
            "phone": phone, "user_name": "TEST_W", "method": "bkash",
            "number": "01999999999", "amount": 100,
        })
        assert r.status_code == 400

    def test_withdraw_success_and_list(self, s):
        phone = f"015{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_W2", "phone": phone, "role": "seller",
                                              "district": "ঢাকা", "village": "A"})
        # Credit wallet via deposit+approve
        dep = s.post(f"{API}/wallet/deposit", json={
            "phone": phone, "user_name": "TEST_W2", "method": "bkash",
            "amount": 500, "trxid": "WTX1", "sender_number": "01999999999",
        }).json()
        s.post(f"{API}/admin/deposits/{dep['id']}/action", json={"action": "approve"})
        # Now withdraw
        r = s.post(f"{API}/wallet/withdraw", json={
            "phone": phone, "user_name": "TEST_W2", "method": "bkash",
            "number": "01999999999", "amount": 200,
        })
        assert r.status_code == 200, r.text
        w = r.json()
        assert w["status"] == "pending"
        assert w["amount"] == 200
        pytest.i3_withdraw_phone = phone
        pytest.i3_withdraw_id = w["id"]

        # list
        lst = s.get(f"{API}/wallet/withdrawals", params={"phone": phone}).json()
        assert any(x["id"] == w["id"] for x in lst)

    def test_admin_list_and_metrics(self, s):
        lst = s.get(f"{API}/admin/withdrawals").json()
        assert any(x["id"] == pytest.i3_withdraw_id for x in lst)
        m = s.get(f"{API}/admin/metrics").json()
        assert "pending_withdrawals" in m
        assert "pending_deposits" in m
        assert m["pending_withdrawals"] >= 1

    def test_admin_approve_deducts(self, s):
        phone = pytest.i3_withdraw_phone
        wid = pytest.i3_withdraw_id
        before = s.get(f"{API}/users/{phone}").json()["wallet"]
        r = s.post(f"{API}/admin/withdrawals/{wid}/action", json={"action": "approve"})
        assert r.status_code == 200
        after = s.get(f"{API}/users/{phone}").json()["wallet"]
        assert after == before - 200
        # withdrawal state is approved
        lst = s.get(f"{API}/admin/withdrawals").json()
        this = next(x for x in lst if x["id"] == wid)
        assert this["status"] == "approved"

    def test_admin_approve_insufficient_rejects(self, s):
        """Create withdrawal, drain wallet via another withdraw+approve so insufficient at second approve.
        We'll construct scenario by crafting withdraw > balance manually, but withdraw endpoint blocks.
        Instead: user has balance 300 after prior test; create withdraw 300; then before admin approves,
        issue another withdraw+approve to deplete. Simpler: mongo-manipulate not available; use fresh user.
        """
        phone = f"014{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_W3", "phone": phone, "role": "seller",
                                              "district": "ঢাকা", "village": "A"})
        dep = s.post(f"{API}/wallet/deposit", json={
            "phone": phone, "user_name": "TEST_W3", "method": "bkash",
            "amount": 100, "trxid": "WTX2", "sender_number": "01999999999",
        }).json()
        s.post(f"{API}/admin/deposits/{dep['id']}/action", json={"action": "approve"})
        # user has 100
        w1 = s.post(f"{API}/wallet/withdraw", json={
            "phone": phone, "user_name": "TEST_W3", "method": "bkash",
            "number": "01999999999", "amount": 100,
        }).json()
        w2 = s.post(f"{API}/wallet/withdraw", json={
            "phone": phone, "user_name": "TEST_W3", "method": "bkash",
            "number": "01999999999", "amount": 100,
        }).json()
        # Approve w1 - succeeds (balance 100 -> 0)
        r1 = s.post(f"{API}/admin/withdrawals/{w1['id']}/action", json={"action": "approve"})
        assert r1.status_code == 200
        # Approve w2 - balance 0 insufficient -> 400 + mark rejected
        r2 = s.post(f"{API}/admin/withdrawals/{w2['id']}/action", json={"action": "approve"})
        assert r2.status_code == 400
        lst = s.get(f"{API}/admin/withdrawals").json()
        this = next(x for x in lst if x["id"] == w2["id"])
        assert this["status"] == "rejected"
        # wallet still 0
        assert s.get(f"{API}/users/{phone}").json()["wallet"] == 0

    def test_admin_reject_no_deduct(self, s):
        phone = f"013{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_W4", "phone": phone, "role": "seller",
                                              "district": "ঢাকা", "village": "A"})
        dep = s.post(f"{API}/wallet/deposit", json={
            "phone": phone, "user_name": "TEST_W4", "method": "bkash",
            "amount": 300, "trxid": "WTX3", "sender_number": "01999999999",
        }).json()
        s.post(f"{API}/admin/deposits/{dep['id']}/action", json={"action": "approve"})
        w = s.post(f"{API}/wallet/withdraw", json={
            "phone": phone, "user_name": "TEST_W4", "method": "bkash",
            "number": "01999999999", "amount": 150,
        }).json()
        before = s.get(f"{API}/users/{phone}").json()["wallet"]
        r = s.post(f"{API}/admin/withdrawals/{w['id']}/action", json={"action": "reject"})
        assert r.status_code == 200
        after = s.get(f"{API}/users/{phone}").json()["wallet"]
        assert after == before


# ---------- YouTube thumbnail ----------
class TestYouTubePoster:
    def test_youtube_url_sets_thumbnail(self, s):
        phone = f"012{uuid.uuid4().int % 10**8:08d}"
        u = s.post(f"{API}/auth/register", json={
            "name": "TEST_YT", "phone": phone, "role": "seller",
            "district": "ঢাকা", "village": "A",
        }).json()
        sid = u["seller_id"]
        yt = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        r = s.post(f"{API}/reels", json={
            "seller_id": sid, "product_title": "TEST_YT_Reel", "category": "মধু",
            "product_type": "non_perishable", "price": 100,
            "video_url": yt,
        })
        assert r.status_code == 200, r.text
        reel = r.json()
        assert reel["video_url"] == yt
        assert reel["poster"] and "img.youtube.com" in reel["poster"]
        assert "dQw4w9WgXcQ" in reel["poster"]
        # Appears in feed
        feed = s.get(f"{API}/reels").json()
        assert any(x["id"] == reel["id"] for x in feed)
