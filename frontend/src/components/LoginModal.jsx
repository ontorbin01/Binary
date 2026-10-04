import React, { useState } from "react";
import { X, Leaf, ShoppingBag, Tractor } from "lucide-react";
import { useApp } from "../context/AppContext";
import { DISTRICTS } from "../lib/api";
import { toast } from "sonner";

export default function LoginModal({ onClose }) {
  const { login, register } = useApp();
  const [mode, setMode] = useState("login"); // login | register
  const [role, setRole] = useState("buyer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    if (!phone.trim()) { toast.error("মোবাইল নম্বর দিন"); return; }
    setLoading(true);
    try { await login(phone.trim()); onClose(); }
    catch (e) {
      const msg = e?.response?.data?.detail || "লগইন ব্যর্থ";
      toast.error(msg);
      if (e?.response?.status === 404) setMode("register");
    }
    finally { setLoading(false); }
  };

  const doRegister = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("নাম ও মোবাইল নম্বর দিন"); return; }
    if (role === "seller" && (!district || !village.trim())) { toast.error("খামারির জন্য জেলা ও গ্রাম দিন"); return; }
    setLoading(true);
    try { await register({ name: name.trim(), phone: phone.trim(), role, district, village: village.trim(), avatar: avatar.trim() }); onClose(); }
    catch (e) {
      const msg = e?.response?.data?.detail || "রেজিস্ট্রেশন ব্যর্থ";
      toast.error(msg);
      if (e?.response?.status === 409) setMode("login");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div data-testid="login-modal" className="relative w-full max-w-sm bg-brand-cream rounded-3xl p-6 animate-slide-up max-h-[92vh] overflow-y-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400" /></button>
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-green flex items-center justify-center mb-3"><Leaf className="w-7 h-7 text-amber-400" /></div>
          <h2 className="text-lg font-bold text-slate-900">গ্রামেরঘর বিডি</h2>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 rounded-full p-1 mb-5">
          <button onClick={() => setMode("login")} data-testid="auth-tab-login"
            className={`py-2 rounded-full text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-brand-green shadow" : "text-slate-500"}`}>লগইন</button>
          <button onClick={() => setMode("register")} data-testid="auth-tab-register"
            className={`py-2 rounded-full text-sm font-semibold transition-all ${mode === "register" ? "bg-white text-brand-green shadow" : "text-slate-500"}`}>রেজিস্ট্রেশন</button>
        </div>

        {mode === "login" ? (
          <div className="space-y-3">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} placeholder="মোবাইল নম্বর (01XXXXXXXXX)" data-testid="login-phone-input"
              className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
            <button onClick={doLogin} disabled={loading} data-testid="login-submit-btn"
              className="w-full bg-brand-green text-white font-bold py-3 rounded-full disabled:opacity-60">
              {loading ? "অপেক্ষা করুন..." : "লগইন করুন"}
            </button>
            <p className="text-xs text-slate-400 text-center">অ্যাকাউন্ট নেই? উপরে "রেজিস্ট্রেশন" ট্যাবে যান</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setRole("buyer")} data-testid="role-buyer-btn"
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all ${role === "buyer" ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
                <ShoppingBag className={`w-6 h-6 ${role === "buyer" ? "text-brand-green" : "text-slate-400"}`} />
                <span className="text-sm font-semibold text-slate-700">আমি ক্রেতা</span>
              </button>
              <button onClick={() => setRole("seller")} data-testid="role-seller-btn"
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all ${role === "seller" ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
                <Tractor className={`w-6 h-6 ${role === "seller" ? "text-brand-green" : "text-slate-400"}`} />
                <span className="text-sm font-semibold text-slate-700">আমি বিক্রেতা</span>
              </button>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" data-testid="login-name-input"
              className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="মোবাইল নম্বর (01XXXXXXXXX)" data-testid="register-phone-input"
              className="w-full bg-white border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="প্রোফাইল ছবির URL (ঐচ্ছিক)" data-testid="register-avatar-input"
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
            <button onClick={doRegister} disabled={loading} data-testid="register-submit-btn"
              className="w-full bg-brand-green text-white font-bold py-3 rounded-full disabled:opacity-60">
              {loading ? "অপেক্ষা করুন..." : "রেজিস্ট্রেশন করুন"}
            </button>
          </div>
        )}
        <p className="text-xs text-slate-400 text-center mt-4">প্রবেশ করে আপনি আমাদের শর্তাবলী মেনে নিচ্ছেন</p>
      </div>
    </div>
  );
}
