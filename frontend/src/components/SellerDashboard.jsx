import React, { useEffect, useState } from "react";
import { LogOut, Upload, Package, Truck, Plus, MapPin, ShieldCheck, Clock, Star, Pencil } from "lucide-react";
import { apiGet, apiPost, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";
import WalletDeposit from "./WalletDeposit";
import WithdrawForm from "./WithdrawForm";
import EditProfileModal from "./EditProfileModal";
import { toast } from "sonner";

export default function SellerDashboard() {
  const { user, logout, categories, loadReels } = useApp();
  const [tab, setTab] = useState("upload");
  const [walletTab, setWalletTab] = useState("deposit");
  const [seller, setSeller] = useState(null);
  const [myReels, setMyReels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    if (!user?.seller_id) return;
    apiGet(`/sellers/${user.seller_id}`).then(setSeller).catch(() => {});
    apiGet(`/seller/${user.seller_id}/reels`).then(setMyReels);
    apiGet(`/seller/${user.seller_id}/orders`).then(setOrders);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  return (
    <div className="h-full overflow-y-auto scrollbar-none bg-brand-cream pb-28">
      <div className="bg-gradient-to-br from-brand-greenDark to-emerald-800 p-5 text-white">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-xl font-bold text-slate-950">{user.name[0]}</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold">{user.name}</h2>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">খামারি</span>
            </div>
            <p className="text-emerald-100 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.village}, {user.district}</p>
          </div>
          <button onClick={() => setEditOpen(true)} data-testid="seller-edit-profile-btn" className="bg-white/20 rounded-full p-2"><Pencil className="w-5 h-5" /></button>
          <button onClick={logout} data-testid="seller-logout-btn" className="bg-white/20 rounded-full p-2"><LogOut className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <SBadge icon={<Package className="w-4 h-4" />} label="সম্পন্ন অর্ডার" value={bn(seller?.completed_orders ?? 0)} />
          <SBadge icon={<Star className="w-4 h-4" />} label="রেটিং" value={`${bn(seller?.rating ?? 5)}★`} />
          <SBadge icon={<Truck className="w-4 h-4" />} label="ডেলিভারি" value={seller?.avg_delivery || "নতুন"} />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-3 sticky top-0 bg-brand-cream z-10">
        {[["upload", "পণ্য আপলোড"], ["inventory", "আমার পণ্য"], ["orders", "অর্ডার"], ["wallet", "ওয়ালেট"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} data-testid={`seller-tab-${id}`}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${tab === id ? "bg-brand-green text-white" : "bg-white border text-slate-600"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === "upload" && <UploadForm user={user} categories={categories} onDone={() => { load(); loadReels(); setTab("inventory"); }} />}
        {tab === "inventory" && <Inventory reels={myReels} />}
        {tab === "orders" && <Orders orders={orders} />}
        {tab === "wallet" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 bg-slate-200/70 rounded-full p-1">
              <button onClick={() => setWalletTab("deposit")} data-testid="wallet-subtab-deposit"
                className={`py-2 rounded-full text-sm font-semibold ${walletTab === "deposit" ? "bg-white text-brand-green shadow" : "text-slate-500"}`}>টাকা যোগ করুন</button>
              <button onClick={() => setWalletTab("withdraw")} data-testid="wallet-subtab-withdraw"
                className={`py-2 rounded-full text-sm font-semibold ${walletTab === "withdraw" ? "bg-white text-brand-green shadow" : "text-slate-500"}`}>টাকা তুলুন</button>
            </div>
            {walletTab === "deposit" ? <WalletDeposit /> : <WithdrawForm />}
          </div>
        )}
      </div>

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function SBadge({ icon, label, value }) {
  return (
    <div className="bg-white/15 rounded-2xl p-2.5 backdrop-blur text-center">
      <div className="flex justify-center text-amber-300 mb-0.5">{icon}</div>
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-emerald-100">{label}</p>
    </div>
  );
}

function UploadForm({ user, categories, onDone }) {
  const [form, setForm] = useState({
    product_title: "", category: "", product_type: "non_perishable",
    price: "", price_unit: "কেজি", description: "",
    district: user.district || "", village: user.village || "", poster: "", video_url: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.product_title || !form.category || !form.price) { toast.error("শিরোনাম, ক্যাটাগরি ও মূল্য আবশ্যক"); return; }
    setLoading(true);
    try {
      await apiPost("/reels", { ...form, seller_id: user.seller_id, price: Number(form.price) });
      toast.success("পণ্যটি সফলভাবে আপলোড হয়েছে! 🎉");
      onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "আপলোড ব্যর্থ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm space-y-3" data-testid="seller-upload-form">
      <h3 className="font-bold text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-brand-green" /> নতুন রিল/পণ্য আপলোড</h3>
      <In label="পণ্যের নাম" value={form.product_title} onChange={(v) => set("product_title", v)} testid="upload-title-input" />
      <div>
        <label className="text-sm font-medium text-slate-700">ক্যাটাগরি</label>
        <select value={form.category} onChange={(e) => set("category", e.target.value)} data-testid="upload-category-select"
          className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green">
          <option value="">ক্যাটাগরি নির্বাচন</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">পণ্যের ধরন</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button onClick={() => set("product_type", "non_perishable")} data-testid="upload-type-nonperishable"
            className={`rounded-xl border-2 py-2 text-sm font-semibold ${form.product_type === "non_perishable" ? "border-brand-green bg-brand-surface" : "border-slate-200"}`}>অপচনশীল</button>
          <button onClick={() => set("product_type", "perishable")} data-testid="upload-type-perishable"
            className={`rounded-xl border-2 py-2 text-sm font-semibold ${form.product_type === "perishable" ? "border-brand-green bg-brand-surface" : "border-slate-200"}`}>পচনশীল (হাইপার-লোকাল)</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <In label="মূল্য (৳)" value={form.price} onChange={(v) => set("price", v)} type="number" testid="upload-price-input" />
        <In label="একক (কেজি/লিটার)" value={form.price_unit} onChange={(v) => set("price_unit", v)} testid="upload-unit-input" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <In label="জেলা" value={form.district} onChange={(v) => set("district", v)} testid="upload-district-input" />
        <In label="গ্রাম" value={form.village} onChange={(v) => set("village", v)} testid="upload-village-input" />
      </div>
      <In label="ছবির URL (ঐচ্ছিক)" value={form.poster} onChange={(v) => set("poster", v)} testid="upload-poster-input" />
      <In label="ভিডিও URL (ঐচ্ছিক)" value={form.video_url} onChange={(v) => set("video_url", v)} testid="upload-video-input" />
      <div>
        <label className="text-sm font-medium text-slate-700">বিবরণ</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="upload-desc-input" rows={2}
          className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
      </div>
      <button onClick={submit} disabled={loading} data-testid="upload-submit-btn"
        className="w-full bg-brand-green text-white font-bold py-3 rounded-full disabled:opacity-60 flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> {loading ? "আপলোড হচ্ছে..." : "পণ্য প্রকাশ করুন"}
      </button>
    </div>
  );
}

function In({ label, value, onChange, type = "text", testid }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
        className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
    </div>
  );
}

function Inventory({ reels }) {
  if (reels.length === 0) return <p className="text-sm text-slate-400 text-center py-10">এখনো কোনো পণ্য নেই। নতুন পণ্য আপলোড করুন।</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {reels.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm" data-testid={`inventory-${r.id}`}>
          <img src={r.poster} alt="" className="w-full h-28 object-cover" />
          <div className="p-2.5">
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{r.product_title}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-amber-600 font-bold text-sm">{taka(r.price)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{r.status === "approved" ? "লাইভ" : r.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Orders({ orders }) {
  if (orders.length === 0) return <p className="text-sm text-slate-400 text-center py-10">এখনো কোনো অর্ডার আসেনি।</p>;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-2xl p-3 flex gap-3 border shadow-sm" data-testid={`seller-order-${o.id}`}>
          <img src={o.poster} alt="" className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm line-clamp-1">{o.product_title}</p>
            <p className="text-xs text-slate-500">ক্রেতা: {o.user_name} · {o.phone}</p>
            <p className="text-xs text-slate-500">{o.district}, {o.address} · পরিমাণ {bn(o.qty)}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-amber-600 font-bold text-sm">{taka(o.amount)}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {o.escrow ? <ShieldCheck className="w-3 h-3" /> : <Truck className="w-3 h-3" />} {o.escrow ? "এসক্রো" : "কুরিয়ার"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {o.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
