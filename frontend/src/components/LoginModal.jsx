import React, { useState } from "react";
import { X, Leaf, ShoppingBag, Tractor } from "lucide-react";
import { useApp } from "../context/AppContext";
import { DISTRICTS } from "../lib/api";
import { toast } from "sonner";

export default function LoginModal({ onClose }) {
  const { login } = useApp();
  const [role, setRole] = useState("buyer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("নাম ও মোবাইল নম্বর দিন"); return; }
    if (role === "seller" && (!district || !village.trim())) { toast.error("খামারির জন্য জেলা ও গ্রাম দিন"); return; }
    setLoading(true);
    try { await login(name.trim(), phone.trim(), role, district, village.trim()); onClose(); }
    catch (e) { toast.error(e?.response?.data?.detail || "লগইন ব্যর্থ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div data-testid="login-modal" className="relative w-full max-w-sm bg-brand-cream rounded-3xl p-6 animate-slide-up max-h-[92vh] overflow-y-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400" /></button>
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-green flex items-center justify-center mb-3"><Leaf className="w-7 h-7 text-amber-400" /></div>
          <h2 className="text-lg font-bold text-slate-900">গ্রামেরঘর বিডি</h2>
          <p className="text-sm text-slate-500">লগইন বা রেজিস্টার করুন</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setRole("buyer")} data-testid="role-buyer-btn"
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all ${role === "buyer" ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
            <ShoppingBag className={`w-6 h-6 ${role === "buyer" ? "text-brand-green" : "text-slate-400"}`} />
            <span className="text-sm font-semibold text-slate-700">আমি ক্রেতা</span>
          </button>
          <button onClick={() => setRole("seller")} data-testid="role-seller-btn"
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all ${role === "seller" ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
            <Tractor className={`w-6 h-6 ${role === "seller" ? "text-brand-green" : "text-slate-400"}`} />
            <span className="text-sm font-semibold text-slate-700">আমি বিক্রেতা/খামারি</span>
          </button>
        </div>

        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" data-testid="login-name-input"
            className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="মোবাইল নম্বর (01XXXXXXXXX)" data-testid="login-phone-input"
            className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          {role === "seller" && (
            <>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} data-testid="login-district-select"
                className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green">
                <option value="">জেলা নির্বাচন করুন</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="গ্রাম / এলাকার নাম" data-testid="login-village-input"
                className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
            </>
          )}
          <button onClick={submit} disabled={loading} data-testid="login-submit-btn"
            className="w-full bg-brand-green text-white font-bold py-3 rounded-full disabled:opacity-60">
            {loading ? "অপেক্ষা করুন..." : "প্রবেশ করুন"}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">প্রবেশ করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন</p>
      </div>
    </div>
  );
}
