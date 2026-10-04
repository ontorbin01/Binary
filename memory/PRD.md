# GramerGhor BD (গ্রামেরঘর বিডি) — PRD

## Original Problem Statement
Video-first (Reels/Shorts style) e-commerce marketplace connecting rural Bangladeshi producers directly with urban/local buyers. Mobile-first PWA-style, 100% Bangla UI, earthy rural aesthetics + sleek TikTok/Reels feel. Dual-view responsive (mobile full-screen vertical feed + desktop framed phone with sidebars).

## User Choices
- Data: Full backend (FastAPI + MongoDB)
- Auth: Simple mock login (name + phone)
- Reels content: Free sample videos (agri theme) + Unsplash poster fallbacks
- Payment: Manual bKash/Nagad TrxID submission + admin verification (NO real gateway — MOCKED by design)
- Admin password: admin / Rumpaontu15@

## Architecture
- Backend: FastAPI, Motor/MongoDB, all routes under /api. UUID string ids, `_id` excluded. Seed on startup (idempotent): 6 sellers, 6 reels, 7 categories, comments, global settings, 2 users.
- Frontend: React 19, Tailwind (Hind Siliguri global font, brand green #1b4d3e + amber #d97706), lucide-react icons, sonner toasts. Context-based state (AppContext) + localStorage for session & cart.

## User Personas
- Buyer (urban/local): browses reels, orders, pays advance via TrxID.
- Seller (rural producer): trust profile, can report comments (not delete).
- Super Admin: platform metrics, gateway/commission control, moderation, user management.

## Core Requirements (static)
- Vertical reels feed w/ play-pause, mute, like, comment, share, product overlay, order CTA.
- Comment section with report-to-admin.
- Seller profile trust metrics (completed orders, rating, avg delivery, hashtag tags).
- Order flow: non-perishable = ৳100 delivery token via TrxID (+COD); perishable = 50% escrow advance via TrxID, COD blocked, hyper-local.
- Super Admin: live metrics, gateway number manager, commission slider, moderation queue (reels+comments), user ban/flag/delete.
- Bangla privacy policy + escrow terms.

## Implemented (2026-06)
- All backend endpoints (iteration 1: 23 pytest cases; iteration 2: 11 cases — all passing 100%).
- Dual-view responsive shell (single-Screen responsive layout), reels feed, comment drawer, seller modal, 3-step checkout, admin dashboard, home/categories/cart/profile views, login & legal modals.
- Iteration 2: Buyer/Seller role separation at login; dedicated Seller Dashboard (product/reel upload with location tags, inventory, incoming orders, wallet); Admin panel removed from all public views and moved to secret route `/admin-secret-portal` (password gated); Wallet Deposit / Add Money (dynamic admin bKash/Nagad/Rocket numbers + TrxID + sender number) with admin verification tab that credits wallet on approval.
- Verified end-to-end via testing agent (backend 100% 34/34, frontend 100% on new flows).

## Known Minor Items (non-blocking)
- No auth middleware on /api/admin/* and POST /api/reels (mock-login MVP by design).
- Deposit state machine is loose (reject↔approve) but no double-credit (approve requires status=pending).

## Backlog
- P1: Seller-side upload/dashboard to post own reels; real notification of order status changes.
- P2: Real bKash/Nagad gateway; order status lifecycle (packed/shipped/delivered) + escrow release action in admin.
- P2: Pagination on /api/admin/users and /api/orders.
