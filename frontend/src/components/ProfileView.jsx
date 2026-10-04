import React, { useEffect, useState } from "react";
import { LogOut, Wallet, Package, ShieldCheck, Clock, Truck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { apiGet, bn, taka } from "../lib/api";

export default function ProfileView({ onLogin, onLegal }) {
  const { user, logout } = useApp();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) apiGet("/orders", { phone: user.phone }).then(setOrders);
  }, [user]);

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-brand-cream p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-green flex items-center justify-center mb-4">
          <ShieldCheck className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">লগইন করুন</h2>
        <p className="text-sm text-slate-500 mb-5 mt-1">অর্ডার করতে ও প্রোফাইল দেখতে লগইন করুন</p>
        <button onClick={onLogin} data-testid="profile-login-btn" className="bg-brand-green text-white font-bold px-8 py-3 rounded-full">লগইন / রেজিস্টার</button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-none bg-brand-cream pb-28">
      <div className="bg-gradient-to-br from-brand-green to-emerald-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl font-bold text-slate-950">{user.name[0]}</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-emerald-100 text-sm">{user.phone}</p>
          </div>
          <button onClick={logout} data-testid="logout-btn" className="bg-white/20 rounded-full p-2"><LogOut className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
            <Wallet className="w-5 h-5 text-amber-300 mb-1" />
            <p className="text-xs text-emerald-100">এসক্রো ওয়ালেট</p>
            <p className="font-bold">{taka(user.wallet || 0)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
            <Package className="w-5 h-5 text-amber-300 mb-1" />
            <p className="text-xs text-emerald-100">মোট অর্ডার</p>
            <p className="font-bold">{bn(orders.length)}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-800 mb-3">আমার অর্ডারসমূহ</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">এখনো কোনো অর্ডার নেই</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl p-3 flex gap-3 border shadow-sm" data-testid={`order-${o.id}`}>
                <img src={o.poster} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm line-clamp-1">{o.product_title}</p>
                  <p className="text-xs text-slate-500">পরিমাণ: {bn(o.qty)} · {taka(o.amount)}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {o.escrow ? <ShieldCheck className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                      {o.escrow ? "এসক্রো সুরক্ষিত" : "কুরিয়ার"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> {o.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onLegal} data-testid="profile-legal-btn" className="w-full mt-5 text-sm text-slate-500 underline">গোপনীয়তা নীতি ও এসক্রো শর্তাবলী</button>
      </div>
    </div>
  );
}
