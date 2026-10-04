"""GramerGhor BD backend API tests."""
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


# ---------- Public reels ----------
class TestReels:
    def test_get_reels(self, s):
        r = s.get(f"{API}/reels", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6
        for reel in data:
            assert reel["status"] == "approved"
            assert "seller" in reel and reel["seller"] is not None
            assert "comment_count" in reel
            assert "_id" not in reel

    def test_like_toggle(self, s):
        user = f"TEST_{uuid.uuid4().hex[:6]}"
        r1 = s.post(f"{API}/reels/reel-1/like", json={"user": user})
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["liked"] is True
        r2 = s.post(f"{API}/reels/reel-1/like", json={"user": user})
        d2 = r2.json()
        assert d2["liked"] is False
        assert d2["likes"] == d1["likes"] - 1

    def test_report_reel(self, s):
        # use reel-6 to not affect others; then unreport via admin
        r = s.post(f"{API}/reels/reel-6/report")
        assert r.status_code == 200
        assert r.json()["ok"] is True


# ---------- Auth ----------
class TestAuth:
    def test_login_create(self, s):
        phone = f"019{uuid.uuid4().int % 10**8:08d}"
        # Iteration 3: login no longer auto-creates; use register
        r = s.post(f"{API}/auth/register", json={"name": "TEST_Buyer", "phone": phone, "role": "buyer"})
        assert r.status_code == 200
        u = r.json()
        assert u["phone"] == phone
        assert u["name"] == "TEST_Buyer"
        assert "id" in u

    def test_login_existing(self, s):
        r = s.post(f"{API}/auth/login", json={"name": "whatever", "phone": "01711000001"})
        assert r.status_code == 200
        assert r.json()["phone"] == "01711000001"

    def test_login_banned(self, s):
        # Create a user, ban them, verify 403
        phone = f"018{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_ToBan", "phone": phone, "role": "buyer"})
        # fetch id via admin users
        users = s.get(f"{API}/admin/users").json()
        uid = next(u["id"] for u in users if u["phone"] == phone)
        s.post(f"{API}/admin/users/{uid}/action", json={"action": "ban"})
        r = s.post(f"{API}/auth/login", json={"name": "x", "phone": phone})
        assert r.status_code == 403
        # cleanup
        s.post(f"{API}/admin/users/{uid}/action", json={"action": "delete"})


# ---------- Comments ----------
class TestComments:
    def test_get_add_report(self, s):
        r = s.get(f"{API}/reels/reel-1/comments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        add = s.post(f"{API}/comments", json={
            "reel_id": "reel-1", "user_name": "TEST_User",
            "avatar": None, "text": "TEST_comment"
        })
        assert add.status_code == 200
        cid = add.json()["id"]

        rep = s.post(f"{API}/comments/{cid}/report")
        assert rep.status_code == 200


# ---------- Sellers ----------
class TestSellers:
    def test_get_seller(self, s):
        r = s.get(f"{API}/sellers/seller-1")
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "seller-1"
        assert "rating" in d and "completed_orders" in d
        assert isinstance(d.get("reels"), list)

    def test_missing_seller(self, s):
        r = s.get(f"{API}/sellers/nonexistent")
        assert r.status_code == 404


# ---------- Orders ----------
class TestOrders:
    def test_non_perishable_requires_trxid(self, s):
        payload = {"reel_id": "reel-1", "user_name": "TEST_X", "phone": "01711000009",
                   "district": "Dhaka", "address": "A", "qty": 1, "payment_method": "bkash", "trxid": ""}
        r = s.post(f"{API}/orders", json=payload)
        assert r.status_code == 400

    def test_non_perishable_order(self, s):
        payload = {"reel_id": "reel-1", "user_name": "TEST_X", "phone": "01711000009",
                   "district": "Dhaka", "address": "A", "qty": 1, "payment_method": "bkash", "trxid": "TRX123"}
        r = s.post(f"{API}/orders", json=payload)
        assert r.status_code == 200
        o = r.json()
        assert o["escrow"] is False
        assert o["advance_amount"] == 100
        assert o["status"] == "নিশ্চিত"

    def test_perishable_cod_rejected(self, s):
        payload = {"reel_id": "reel-4", "user_name": "TEST_X", "phone": "01711000009",
                   "district": "Dhaka", "address": "A", "qty": 2, "payment_method": "cod", "trxid": ""}
        r = s.post(f"{API}/orders", json=payload)
        assert r.status_code == 400

    def test_perishable_requires_trxid(self, s):
        payload = {"reel_id": "reel-5", "user_name": "TEST_X", "phone": "01711000009",
                   "district": "Dhaka", "address": "A", "qty": 1, "payment_method": "bkash", "trxid": ""}
        r = s.post(f"{API}/orders", json=payload)
        assert r.status_code == 400

    def test_perishable_valid(self, s):
        payload = {"reel_id": "reel-3", "user_name": "TEST_X", "phone": "01711000009",
                   "district": "Dhaka", "address": "A", "qty": 2, "payment_method": "nagad", "trxid": "TRX999"}
        r = s.post(f"{API}/orders", json=payload)
        assert r.status_code == 200
        o = r.json()
        assert o["escrow"] is True
        assert o["advance_amount"] == round(120 * 2 * 0.5)

    def test_get_orders_by_phone(self, s):
        r = s.get(f"{API}/orders", params={"phone": "01711000009"})
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert all(o["phone"] == "01711000009" for o in orders)
        assert len(orders) >= 2


# ---------- Admin ----------
class TestAdmin:
    def test_admin_login_wrong(self, s):
        r = s.post(f"{API}/admin/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401

    def test_admin_login_ok(self, s):
        r = s.post(f"{API}/admin/login", json={"username": "admin", "password": "Rumpaontu15@"})
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_metrics(self, s):
        r = s.get(f"{API}/admin/metrics")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_users", "total_sellers", "gmv", "pending_escrow",
                  "reported_reels", "reported_comments"]:
            assert k in d

    def test_settings_update(self, s):
        payload = {"bkash_number": "01700-999999", "commission_percent": 8.5,
                   "gateways": {"bkash": True, "nagad": True, "cod": False}}
        r = s.put(f"{API}/admin/settings", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["bkash_number"] == "01700-999999"
        assert d["commission_percent"] == 8.5
        assert d["gateways"]["cod"] is False
        # verify persisted
        g = s.get(f"{API}/settings").json()
        assert g["bkash_number"] == "01700-999999"
        # restore
        s.put(f"{API}/admin/settings", json={"bkash_number": "01700-123456",
                                              "commission_percent": 7.0,
                                              "gateways": {"bkash": True, "nagad": True, "cod": True}})

    def test_moderation_lists(self, s):
        r1 = s.get(f"{API}/admin/moderation/reels")
        assert r1.status_code == 200
        assert isinstance(r1.json(), list)
        r2 = s.get(f"{API}/admin/moderation/comments")
        assert r2.status_code == 200

    def test_reel_remove_hides_from_feed(self, s):
        # report+remove reel-6, confirm not in /api/reels, then re-approve
        s.post(f"{API}/reels/reel-6/report")
        rem = s.post(f"{API}/admin/reels/reel-6/action", json={"action": "remove"})
        assert rem.status_code == 200
        reels = s.get(f"{API}/reels").json()
        assert not any(r["id"] == "reel-6" for r in reels)
        # restore
        s.post(f"{API}/admin/reels/reel-6/action", json={"action": "approve"})
        reels = s.get(f"{API}/reels").json()
        assert any(r["id"] == "reel-6" for r in reels)

    def test_comment_remove(self, s):
        add = s.post(f"{API}/comments", json={"reel_id": "reel-1", "user_name": "TEST_Z",
                                               "avatar": None, "text": "TEST_remove_me"})
        cid = add.json()["id"]
        s.post(f"{API}/comments/{cid}/report")
        r = s.post(f"{API}/admin/comments/{cid}/action", json={"action": "remove"})
        assert r.status_code == 200
        comments = s.get(f"{API}/reels/reel-1/comments").json()
        assert not any(c["id"] == cid for c in comments)

    def test_users_lifecycle(self, s):
        phone = f"017{uuid.uuid4().int % 10**8:08d}"
        s.post(f"{API}/auth/register", json={"name": "TEST_U", "phone": phone, "role": "buyer"})
        users = s.get(f"{API}/admin/users").json()
        u = next(x for x in users if x["phone"] == phone)
        uid = u["id"]
        for action in ["flag", "ban", "unban", "delete"]:
            r = s.post(f"{API}/admin/users/{uid}/action", json={"action": action})
            assert r.status_code == 200
        users2 = s.get(f"{API}/admin/users").json()
        assert not any(x["id"] == uid for x in users2)
