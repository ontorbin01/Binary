from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

app = FastAPI()
api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


# ---------------- Models ----------------
class AuthInput(BaseModel):
    name: Optional[str] = ""
    phone: str
    role: str = "buyer"
    district: Optional[str] = ""
    village: Optional[str] = ""
    avatar: Optional[str] = ""


class ProfileInput(BaseModel):
    phone: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None


class WithdrawInput(BaseModel):
    phone: str
    user_name: str
    method: str  # bkash | nagad | rocket
    number: str
    amount: float


class ReelInput(BaseModel):
    seller_id: str
    product_title: str
    category: str
    product_type: str = "non_perishable"  # perishable | non_perishable
    price: float
    price_unit: str = "কেজি"
    description: str = ""
    district: Optional[str] = ""
    village: Optional[str] = ""
    poster: Optional[str] = None
    video_url: Optional[str] = None


class DepositInput(BaseModel):
    phone: str
    user_name: str
    method: str  # bkash | nagad | rocket
    amount: float
    trxid: str
    sender_number: str


class CommentInput(BaseModel):
    reel_id: str
    user_name: str
    avatar: Optional[str] = None
    text: str


class OrderInput(BaseModel):
    reel_id: str
    user_name: str
    phone: str
    district: str
    thana: Optional[str] = ""
    address: str
    qty: int = 1
    payment_method: str  # cod | bkash | nagad
    trxid: Optional[str] = ""


class AdminLoginInput(BaseModel):
    username: str
    password: str


class SettingsInput(BaseModel):
    bkash_number: Optional[str] = None
    nagad_number: Optional[str] = None
    rocket_number: Optional[str] = None
    commission_percent: Optional[float] = None
    gateways: Optional[dict] = None


# ---------------- Seed Data ----------------
SELLERS = [
    {
        "id": "seller-1", "name": "রফিকুল ইসলাম", "avatar": "https://images.unsplash.com/photo-1761296796745-f709cd1c1738?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
        "village": "বুড়িগোয়ালিনী", "district": "সাতক্ষীরা",
        "banner": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 452, "rating": 4.9, "avg_delivery": "২৪ ঘণ্টা", "verified": True,
        "tags": ["#খাঁটি_মধু", "#সুন্দরবনের_মধু", "#চাকের_মধু"],
    },
    {
        "id": "seller-2", "name": "আব্দুল করিম", "avatar": "https://images.unsplash.com/photo-1740477138822-906f6b845579?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
        "village": "শেরপুর", "district": "বগুড়া",
        "banner": "https://images.unsplash.com/photo-1739418346381-fe21fabfa196?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 318, "rating": 4.8, "avg_delivery": "৩৬ ঘণ্টা", "verified": True,
        "tags": ["#সরিষার_তেল", "#ঘানি_ভাঙা", "#খাঁটি_তেল"],
    },
    {
        "id": "seller-3", "name": "শফিকুল আলম", "avatar": "https://images.unsplash.com/photo-1759755487703-91f22c31bfbd?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
        "village": "বাঘা", "district": "রাজশাহী",
        "banner": "https://images.unsplash.com/photo-1685478677352-43868751fb8e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 601, "rating": 4.7, "avg_delivery": "৪৮ ঘণ্টা", "verified": True,
        "tags": ["#রাজশাহীর_আম", "#হিমসাগর", "#তাজা_ফল"],
    },
    {
        "id": "seller-4", "name": "মর্জিনা বেগম", "avatar": "https://images.unsplash.com/photo-1740477138822-906f6b845579?crop=entropy&cs=srgb&fm=jpg&q=85&w=201",
        "village": "ত্রিশাল", "district": "ময়মনসিংহ",
        "banner": "https://images.unsplash.com/photo-1723393303888-a6f513867737?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 274, "rating": 4.9, "avg_delivery": "৪ ঘণ্টা", "verified": True,
        "tags": ["#তাজা_দুধ", "#খাঁটি_দুধ", "#গরুর_দুধ"],
    },
    {
        "id": "seller-5", "name": "জামাল উদ্দিন", "avatar": "https://images.unsplash.com/photo-1761296796745-f709cd1c1738?crop=entropy&cs=srgb&fm=jpg&q=85&w=201",
        "village": "চলনবিল", "district": "সিরাজগঞ্জ",
        "banner": "https://images.unsplash.com/photo-1507991426709-5bbee2c6a189?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 189, "rating": 4.6, "avg_delivery": "৩ ঘণ্টা", "verified": True,
        "tags": ["#তাজা_মাছ", "#দেশি_মাছ", "#চলনবিলের_মাছ"],
    },
    {
        "id": "seller-6", "name": "সুফিয়া খাতুন", "avatar": "https://images.unsplash.com/photo-1740477138822-906f6b845579?crop=entropy&cs=srgb&fm=jpg&q=85&w=202",
        "village": "ধামরাই", "district": "ঢাকা",
        "banner": "https://images.unsplash.com/photo-1520408222757-6f9f95d87d5d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
        "completed_orders": 143, "rating": 4.8, "avg_delivery": "৭২ ঘণ্টা", "verified": True,
        "tags": ["#মাটির_হাঁড়ি", "#হস্তশিল্প", "#মাটির_তৈরি"],
    },
]

REELS = [
    {
        "id": "reel-1", "seller_id": "seller-1", "product_title": "সুন্দরবনের খাঁটি চাকের মধু",
        "category": "মধু", "product_type": "non_perishable", "price": 950, "price_unit": "কেজি",
        "description": "সুন্দরবনের প্রাকৃতিক চাক থেকে সংগ্রহ করা ১০০% খাঁটি মধু। কোনো ভেজাল নেই।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-farmer-hands-holding-fresh-produce-41584-large.mp4",
        "poster": "https://images.unsplash.com/photo-1587049352851-8d4e89133924?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 1243, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
    {
        "id": "reel-2", "seller_id": "seller-2", "product_title": "ঘানি ভাঙা খাঁটি সরিষার তেল",
        "category": "তেল", "product_type": "non_perishable", "price": 240, "price_unit": "লিটার",
        "description": "বগুড়ার ঐতিহ্যবাহী ঘানি ভাঙা খাঁটি সরিষার তেল। ঝাঁঝালো ও সুগন্ধি।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-fresh-vegetables-in-a-field-41583-large.mp4",
        "poster": "https://images.unsplash.com/photo-1739418346381-fe21fabfa196?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 876, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
    {
        "id": "reel-3", "seller_id": "seller-3", "product_title": "রাজশাহীর প্রিমিয়াম হিমসাগর আম",
        "category": "ফল", "product_type": "perishable", "price": 120, "price_unit": "কেজি",
        "description": "বাঘার বাগান থেকে তাজা হিমসাগর আম। রাসায়নিক মুক্ত, গাছপাকা।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-picking-fresh-apples-41586-large.mp4",
        "poster": "https://images.unsplash.com/photo-1685478677352-43868751fb8e?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 2109, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
    {
        "id": "reel-4", "seller_id": "seller-4", "product_title": "খামারের তাজা গরুর দুধ",
        "category": "দুধ", "product_type": "perishable", "price": 90, "price_unit": "লিটার",
        "description": "প্রতিদিন সকালে দোহানো খাঁটি গরুর দুধ। ৩-৬ ঘণ্টায় হাইপার-লোকাল ডেলিভারি।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-farm-field-4075-large.mp4",
        "poster": "https://images.unsplash.com/photo-1723393303888-a6f513867737?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 654, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
    {
        "id": "reel-5", "seller_id": "seller-5", "product_title": "চলনবিলের তাজা দেশি মাছ",
        "category": "মাছ", "product_type": "perishable", "price": 520, "price_unit": "কেজি",
        "description": "চলনবিল থেকে সদ্য ধরা তাজা দেশি মাছ। বরফ ছাড়াই ৩ ঘণ্টায় ডেলিভারি।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-fish-swimming-in-an-aquarium-4075-large.mp4",
        "poster": "https://images.unsplash.com/photo-1507991426709-5bbee2c6a189?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 987, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
    {
        "id": "reel-6", "seller_id": "seller-6", "product_title": "হাতে তৈরি মাটির হাঁড়ি ও শিল্প",
        "category": "হস্তশিল্প", "product_type": "non_perishable", "price": 350, "price_unit": "পিস",
        "description": "গ্রামীণ কারিগরের হাতে তৈরি নিখুঁত মাটির হাঁড়ি ও শোপিস।",
        "video_url": "https://assets.mixkit.co/videos/preview/mixkit-potter-shaping-a-clay-pot-on-a-wheel-9476-large.mp4",
        "poster": "https://images.unsplash.com/photo-1520408222757-6f9f95d87d5d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600",
        "likes": 432, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    },
]

CATEGORIES = [
    {"id": "cat-honey", "name": "মধু", "icon": "🍯", "image": "https://images.unsplash.com/photo-1587049352851-8d4e89133924?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-oil", "name": "তেল ও ঘি", "icon": "🫒", "image": "https://images.unsplash.com/photo-1739418346381-fe21fabfa196?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-fruit", "name": "তাজা ফল", "icon": "🥭", "image": "https://images.unsplash.com/photo-1685478677352-43868751fb8e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-milk", "name": "দুধ", "icon": "🥛", "image": "https://images.unsplash.com/photo-1723393303888-a6f513867737?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-fish", "name": "মাছ", "icon": "🐟", "image": "https://images.unsplash.com/photo-1507991426709-5bbee2c6a189?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-rice", "name": "চাল ও শস্য", "icon": "🌾", "image": "https://images.unsplash.com/photo-1728895604559-a4e16081504e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
    {"id": "cat-craft", "name": "হস্তশিল্প", "icon": "🏺", "image": "https://images.unsplash.com/photo-1520408222757-6f9f95d87d5d?crop=entropy&cs=srgb&fm=jpg&q=85&w=400"},
]

SEED_COMMENTS = [
    {"id": new_id(), "reel_id": "reel-1", "user_name": "নাদিয়া আক্তার", "avatar": None, "text": "মধু কি সত্যিই খাঁটি? আগে অর্ডার করেছিলাম, দারুণ ছিল!", "created_at": now_iso(), "reported": False, "status": "visible"},
    {"id": new_id(), "reel_id": "reel-1", "user_name": "করিম উদ্দিন", "avatar": None, "text": "ঢাকায় ডেলিভারি দেন কি?", "created_at": now_iso(), "reported": False, "status": "visible"},
    {"id": new_id(), "reel_id": "reel-3", "user_name": "সুমন হোসেন", "avatar": None, "text": "আমের দাম একটু বেশি মনে হচ্ছে।", "created_at": now_iso(), "reported": False, "status": "visible"},
]


async def seed():
    if await db.sellers.count_documents({}) == 0:
        await db.sellers.insert_many([dict(s) for s in SELLERS])
    if await db.reels.count_documents({}) == 0:
        await db.reels.insert_many([dict(r) for r in REELS])
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([dict(c) for c in CATEGORIES])
    if await db.comments.count_documents({}) == 0:
        await db.comments.insert_many([dict(c) for c in SEED_COMMENTS])
    if await db.settings.count_documents({"id": "global"}) == 0:
        await db.settings.insert_one({
            "id": "global",
            "bkash_number": "01700-123456",
            "nagad_number": "01800-654321",
            "rocket_number": "01900-112233",
            "commission_percent": 7.0,
            "gateways": {"bkash": True, "nagad": True, "cod": True},
        })
    if await db.users.count_documents({}) == 0:
        await db.users.insert_many([
            {"id": new_id(), "name": "আয়েশা সিদ্দিকা", "phone": "01711000001", "role": "buyer", "wallet": 500, "banned": False, "flagged": False, "created_at": now_iso()},
            {"id": new_id(), "name": "তানভীর আহমেদ", "phone": "01711000002", "role": "buyer", "wallet": 0, "banned": False, "flagged": True, "created_at": now_iso()},
        ])


# ---------------- Helpers ----------------
async def enrich_reel(reel):
    seller = await db.sellers.find_one({"id": reel["seller_id"]}, {"_id": 0})
    reel["seller"] = seller
    reel["comment_count"] = await db.comments.count_documents({"reel_id": reel["id"], "status": "visible"})
    return reel


# ---------------- Public Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "GramerGhor BD API"}


def yt_thumb(url):
    import re
    m = re.search(r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})", url or "")
    return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg" if m else None


@api_router.post("/auth/register")
async def register(data: AuthInput):
    existing = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="এই নম্বরটি আগে থেকেই নিবন্ধিত। অনুগ্রহ করে লগইন করুন।")
    if not data.name:
        raise HTTPException(status_code=400, detail="নাম আবশ্যক")
    user = {"id": new_id(), "name": data.name, "phone": data.phone, "role": data.role,
            "wallet": 0, "banned": False, "flagged": False, "avatar": data.avatar or "",
            "district": data.district, "village": data.village,
            "seller_id": None, "created_at": now_iso()}
    if data.role == "seller":
        seller_id = f"seller-user-{user['id'][:8]}"
        seller = {
            "id": seller_id, "name": data.name, "avatar": data.avatar or "",
            "village": data.village or "গ্রাম", "district": data.district or "ঢাকা",
            "banner": "https://images.unsplash.com/photo-1728895604559-a4e16081504e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
            "completed_orders": 0, "rating": 5.0, "avg_delivery": "নতুন", "verified": False,
            "tags": [], "user_phone": data.phone,
        }
        await db.sellers.insert_one(dict(seller))
        user["seller_id"] = seller_id
    await db.users.insert_one(dict(user))
    user.pop("_id", None)
    return user


@api_router.post("/auth/login")
async def login(data: AuthInput):
    user = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="এই নম্বরে কোনো অ্যাকাউন্ট নেই। অনুগ্রহ করে রেজিস্ট্রেশন করুন।")
    if user.get("banned"):
        raise HTTPException(status_code=403, detail="আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।")
    return user


@api_router.put("/profile")
async def update_profile(data: ProfileInput):
    update = {k: v for k, v in data.model_dump().items() if v is not None and k != "phone"}
    if not update:
        raise HTTPException(status_code=400, detail="আপডেট করার কিছু নেই")
    res = await db.users.update_one({"phone": data.phone}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি")
    user = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    if user.get("seller_id"):
        s_update = {k: v for k, v in update.items() if k in ("name", "avatar", "district", "village")}
        if s_update:
            await db.sellers.update_one({"id": user["seller_id"]}, {"$set": s_update})
    return user


@api_router.get("/users/{phone}")
async def get_user(phone: str):
    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি")
    return user


@api_router.get("/reels")
async def get_reels(category: Optional[str] = None):
    query = {"status": "approved"}
    if category:
        query["category"] = category
    reels = await db.reels.find(query, {"_id": 0}).to_list(100)
    for r in reels:
        await enrich_reel(r)
    return reels


@api_router.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, body: dict):
    user = body.get("user", "guest")
    reel = await db.reels.find_one({"id": reel_id}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="রিল পাওয়া যায়নি")
    liked_by = reel.get("liked_by", [])
    if user in liked_by:
        liked_by.remove(user)
        liked = False
    else:
        liked_by.append(user)
        liked = True
    likes = reel.get("likes", 0) + (1 if liked else -1)
    await db.reels.update_one({"id": reel_id}, {"$set": {"liked_by": liked_by, "likes": likes}})
    return {"likes": likes, "liked": liked}


@api_router.post("/reels/{reel_id}/report")
async def report_reel(reel_id: str):
    await db.reels.update_one({"id": reel_id}, {"$set": {"reported": True}})
    return {"ok": True}


@api_router.get("/reels/{reel_id}/comments")
async def get_comments(reel_id: str):
    comments = await db.comments.find({"reel_id": reel_id, "status": "visible"}, {"_id": 0}).to_list(200)
    return comments


@api_router.post("/comments")
async def add_comment(data: CommentInput):
    comment = {"id": new_id(), "reel_id": data.reel_id, "user_name": data.user_name,
               "avatar": data.avatar, "text": data.text, "created_at": now_iso(),
               "reported": False, "status": "visible"}
    await db.comments.insert_one(dict(comment))
    comment.pop("_id", None)
    return comment


@api_router.post("/comments/{comment_id}/report")
async def report_comment(comment_id: str):
    await db.comments.update_one({"id": comment_id}, {"$set": {"reported": True}})
    return {"ok": True}


@api_router.get("/sellers/{seller_id}")
async def get_seller(seller_id: str):
    seller = await db.sellers.find_one({"id": seller_id}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="বিক্রেতা পাওয়া যায়নি")
    reels = await db.reels.find({"seller_id": seller_id, "status": "approved"}, {"_id": 0}).to_list(100)
    seller["reels"] = reels
    return seller


@api_router.get("/categories")
async def get_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(100)


DEFAULT_VIDEOS = [
    "https://assets.mixkit.co/videos/preview/mixkit-farmer-hands-holding-fresh-produce-41584-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-fresh-vegetables-in-a-field-41583-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-picking-fresh-apples-41586-large.mp4",
]


@api_router.post("/reels")
async def create_reel(data: ReelInput):
    seller = await db.sellers.find_one({"id": data.seller_id}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="বিক্রেতা পাওয়া যায়নি")
    cat = await db.categories.find_one({"name": data.category}, {"_id": 0})
    video_url = data.video_url or DEFAULT_VIDEOS[0]
    poster = data.poster or yt_thumb(video_url) or (cat.get("image") if cat else None)
    reel = {
        "id": new_id(), "seller_id": data.seller_id, "product_title": data.product_title,
        "category": data.category, "product_type": data.product_type, "price": data.price,
        "price_unit": data.price_unit, "description": data.description,
        "district": data.district or seller.get("district"),
        "village": data.village or seller.get("village"),
        "poster": poster,
        "video_url": video_url,
        "likes": 0, "liked_by": [], "status": "approved", "reported": False, "created_at": now_iso(),
    }
    await db.reels.insert_one(dict(reel))
    reel.pop("_id", None)
    return reel


@api_router.get("/seller/{seller_id}/reels")
async def seller_reels(seller_id: str):
    return await db.reels.find({"seller_id": seller_id, "status": {"$ne": "removed"}}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/seller/{seller_id}/orders")
async def seller_orders(seller_id: str):
    return await db.orders.find({"seller_id": seller_id}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/wallet/deposit")
async def wallet_deposit(data: DepositInput):
    deposit = {
        "id": new_id(), "phone": data.phone, "user_name": data.user_name,
        "method": data.method, "amount": data.amount, "trxid": data.trxid,
        "sender_number": data.sender_number, "status": "pending", "created_at": now_iso(),
    }
    await db.deposits.insert_one(dict(deposit))
    deposit.pop("_id", None)
    return deposit


@api_router.get("/wallet/deposits")
async def wallet_deposits(phone: str):
    return await db.deposits.find({"phone": phone}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/wallet/withdraw")
async def wallet_withdraw(data: WithdrawInput):
    user = await db.users.find_one({"phone": data.phone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="ব্যবহারকারী পাওয়া যায়নি")
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="সঠিক পরিমাণ লিখুন")
    if (user.get("wallet", 0) or 0) < data.amount:
        raise HTTPException(status_code=400, detail="ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই")
    withdraw = {
        "id": new_id(), "phone": data.phone, "user_name": data.user_name,
        "method": data.method, "number": data.number, "amount": data.amount,
        "status": "pending", "created_at": now_iso(),
    }
    await db.withdrawals.insert_one(dict(withdraw))
    withdraw.pop("_id", None)
    return withdraw


@api_router.get("/wallet/withdrawals")
async def wallet_withdrawals(phone: str):
    return await db.withdrawals.find({"phone": phone}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/orders")
async def create_order(data: OrderInput):
    reel = await db.reels.find_one({"id": data.reel_id}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="পণ্য পাওয়া যায়নি")
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0})
    total = reel["price"] * data.qty
    perishable = reel["product_type"] == "perishable"

    if perishable:
        delivery_type = "hyper_local"
        escrow = True
        advance_amount = round(total * 0.5)
        if data.payment_method == "cod":
            raise HTTPException(status_code=400, detail="পচনশীল পণ্যের জন্য ৫০% অগ্রিম এসক্রো পেমেন্ট আবশ্যক।")
        if not data.trxid:
            raise HTTPException(status_code=400, detail="এসক্রো পেমেন্টের জন্য TrxID আবশ্যক।")
    else:
        delivery_type = "courier"
        escrow = False
        advance_amount = 100  # delivery charge token via bKash/Nagad
        if not data.trxid:
            raise HTTPException(status_code=400, detail="অগ্রিম ডেলিভারি চার্জ টোকেনের (৳১০০) জন্য TrxID আবশ্যক।")

    order = {
        "id": new_id(), "reel_id": data.reel_id, "seller_id": reel["seller_id"],
        "product_title": reel["product_title"], "price": reel["price"], "price_unit": reel["price_unit"],
        "poster": reel.get("poster"), "user_name": data.user_name, "phone": data.phone,
        "district": data.district, "thana": data.thana, "address": data.address, "qty": data.qty,
        "amount": total, "advance_amount": advance_amount, "payment_method": data.payment_method,
        "trxid": data.trxid, "delivery_type": delivery_type, "escrow": escrow,
        "product_type": reel["product_type"],
        "commission": round(total * (settings.get("commission_percent", 7) / 100)),
        "status": "নিশ্চিত" if (data.trxid or data.payment_method == "cod") else "অপেক্ষমাণ",
        "created_at": now_iso(),
    }
    await db.orders.insert_one(dict(order))
    order.pop("_id", None)
    return order


@api_router.get("/orders")
async def get_orders(phone: Optional[str] = None):
    query = {"phone": phone} if phone else {}
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return s


# ---------------- Admin Routes ----------------
@api_router.post("/admin/login")
async def admin_login(data: AdminLoginInput):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        return {"ok": True, "token": "admin-session"}
    raise HTTPException(status_code=401, detail="ভুল ইউজারনেম বা পাসওয়ার্ড")


@api_router.get("/admin/metrics")
async def admin_metrics():
    users = await db.users.count_documents({})
    sellers = await db.sellers.count_documents({"verified": True})
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    gmv = sum(o.get("amount", 0) for o in orders)
    pending_escrow = sum(o.get("advance_amount", 0) for o in orders if o.get("escrow"))
    pending_videos = await db.reels.count_documents({"status": "pending"})
    reported_reels = await db.reels.count_documents({"reported": True})
    reported_comments = await db.comments.count_documents({"reported": True})
    pending_deposits = await db.deposits.count_documents({"status": "pending"})
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    return {
        "total_users": users, "total_sellers": sellers, "gmv": gmv,
        "total_orders": len(orders), "pending_escrow": pending_escrow,
        "pending_videos": pending_videos, "reported_reels": reported_reels,
        "reported_comments": reported_comments, "pending_deposits": pending_deposits,
        "pending_withdrawals": pending_withdrawals,
    }


@api_router.get("/admin/deposits")
async def admin_deposits():
    return await db.deposits.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/deposits/{deposit_id}/action")
async def deposit_action(deposit_id: str, body: dict):
    action = body.get("action")
    deposit = await db.deposits.find_one({"id": deposit_id}, {"_id": 0})
    if not deposit:
        raise HTTPException(status_code=404, detail="ডিপোজিট পাওয়া যায়নি")
    if action == "approve" and deposit["status"] == "pending":
        await db.deposits.update_one({"id": deposit_id}, {"$set": {"status": "approved"}})
        await db.users.update_one({"phone": deposit["phone"]}, {"$inc": {"wallet": deposit["amount"]}})
    elif action == "reject" and deposit["status"] == "pending":
        await db.deposits.update_one({"id": deposit_id}, {"$set": {"status": "rejected"}})
    return {"ok": True}


@api_router.get("/admin/withdrawals")
async def admin_withdrawals():
    return await db.withdrawals.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/withdrawals/{withdraw_id}/action")
async def withdraw_action(withdraw_id: str, body: dict):
    action = body.get("action")
    w = await db.withdrawals.find_one({"id": withdraw_id}, {"_id": 0})
    if not w:
        raise HTTPException(status_code=404, detail="অনুরোধ পাওয়া যায়নি")
    if w["status"] != "pending":
        return {"ok": True}
    if action == "approve":
        user = await db.users.find_one({"phone": w["phone"]}, {"_id": 0})
        if (user.get("wallet", 0) or 0) < w["amount"]:
            await db.withdrawals.update_one({"id": withdraw_id}, {"$set": {"status": "rejected", "note": "অপর্যাপ্ত ব্যালেন্স"}})
            raise HTTPException(status_code=400, detail="ব্যবহারকারীর ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই")
        await db.withdrawals.update_one({"id": withdraw_id}, {"$set": {"status": "approved"}})
        await db.users.update_one({"phone": w["phone"]}, {"$inc": {"wallet": -w["amount"]}})
    elif action == "reject":
        await db.withdrawals.update_one({"id": withdraw_id}, {"$set": {"status": "rejected"}})
    return {"ok": True}


@api_router.put("/admin/settings")
async def update_settings(data: SettingsInput):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.settings.update_one({"id": "global"}, {"$set": update})
    return await db.settings.find_one({"id": "global"}, {"_id": 0})


@api_router.get("/admin/moderation/reels")
async def moderation_reels():
    return await db.reels.find({"reported": True}, {"_id": 0}).to_list(200)


@api_router.get("/admin/moderation/comments")
async def moderation_comments():
    comments = await db.comments.find({"reported": True}, {"_id": 0}).to_list(200)
    for c in comments:
        reel = await db.reels.find_one({"id": c["reel_id"]}, {"_id": 0})
        c["product_title"] = reel["product_title"] if reel else ""
    return comments


@api_router.post("/admin/reels/{reel_id}/action")
async def reel_action(reel_id: str, body: dict):
    action = body.get("action")
    if action == "remove":
        await db.reels.update_one({"id": reel_id}, {"$set": {"status": "removed", "reported": False}})
    elif action == "approve":
        await db.reels.update_one({"id": reel_id}, {"$set": {"status": "approved", "reported": False}})
    return {"ok": True}


@api_router.post("/admin/comments/{comment_id}/action")
async def comment_action(comment_id: str, body: dict):
    action = body.get("action")
    if action == "remove":
        await db.comments.update_one({"id": comment_id}, {"$set": {"status": "removed", "reported": False}})
    elif action == "approve":
        await db.comments.update_one({"id": comment_id}, {"$set": {"reported": False}})
    return {"ok": True}


@api_router.get("/admin/users")
async def admin_users():
    return await db.users.find({}, {"_id": 0}).to_list(500)


@api_router.post("/admin/users/{user_id}/action")
async def user_action(user_id: str, body: dict):
    action = body.get("action")
    if action == "ban":
        await db.users.update_one({"id": user_id}, {"$set": {"banned": True}})
    elif action == "unban":
        await db.users.update_one({"id": user_id}, {"$set": {"banned": False}})
    elif action == "flag":
        await db.users.update_one({"id": user_id}, {"$set": {"flagged": True}})
    elif action == "delete":
        await db.users.delete_one({"id": user_id})
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
