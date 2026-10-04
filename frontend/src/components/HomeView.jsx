import React, { useEffect, useState } from "react";
import { TrendingUp, Users, ShieldCheck, Play, Sliders, ArrowRight } from "lucide-react";
import { apiGet, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";

export default function HomeView() {
  const { setView, categories, reels, setActiveCategory, loadReels } = useApp();
  const [m, setM] = useState(null);
  useEffect(() => { apiGet("/admin/metrics").then(setM).catch(() => {}); }, []);

  const pick = (name) => { setActiveCategory(name); loadReels(name); setView("feed"); };

  return (
    <div className="h-full overflow-y-auto scrollbar-none bg-brand-cream pb-28">
      <div className="relative bg-gradient-to-br from-brand-greenDark via-brand-green to-emerald-800 text-white p-6 pb-10 rounded-b-3xl overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-500/20 blur-2xl" />
        <p className="text-amber-300 font-semibold text-sm">স্বাগতম 👋</p>
        <h1 className="text-2xl font-bold leading-snug mt-1">গ্রামের সেরা পণ্য,<br />সরাসরি আপনার দরজায়</h1>
        <p className="text-emerald-100 text-sm mt-2 max-w-sm">ভিডিওতে দেখে কিনুন খাঁটি মধু, তাজা ফল, ঘানি ভাঙা তেল ও আরও অনেক কিছু — সরাসরি কৃষকের কাছ থেকে।</p>
        <button onClick={() => { setActiveCategory(null); loadReels(); setView("feed"); }} data-testid="home-watch-feed-btn"
          className="mt-4 inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-full">
          <Play className="w-4 h-4 fill-slate-950" /> ভিডিও ফিড দেখুন
        </button>
      </div>

      <div className="px-4 -mt-5">
        <div className="grid grid-cols-3 gap-2">
          <HomeStat icon={<Users className="w-4 h-4" />} label="ব্যবহারকারী" value={m ? bn(m.total_users) : "—"} />
          <HomeStat icon={<ShieldCheck className="w-4 h-4" />} label="কৃষক" value={m ? bn(m.total_sellers) : "—"} />
          <HomeStat icon={<TrendingUp className="w-4 h-4" />} label="লেনদেন" value={m ? taka(m.gmv) : "—"} />
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">জনপ্রিয় ক্যাটাগরি</h2>
          <button onClick={() => setView("categories")} className="text-brand-green text-sm font-semibold flex items-center gap-1" data-testid="home-all-cat-btn">সব <ArrowRight className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
          {categories.map((c) => (
            <button key={c.id} onClick={() => pick(c.name)} data-testid={`home-cat-${c.id}`} className="shrink-0 w-24 bg-white rounded-2xl border shadow-sm overflow-hidden">
              <img src={c.image} alt={c.name} className="w-full h-20 object-cover" />
              <p className="text-xs font-semibold text-slate-700 py-2 text-center">{c.icon} {c.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="font-bold text-slate-900 mb-3">ট্রেন্ডিং পণ্য</h2>
        <div className="grid grid-cols-2 gap-3">
          {reels.slice(0, 4).map((r) => (
            <button key={r.id} onClick={() => setView("feed")} className="bg-white rounded-2xl border shadow-sm overflow-hidden text-left" data-testid={`home-reel-${r.id}`}>
              <img src={r.poster} alt="" className="w-full h-28 object-cover" />
              <div className="p-2.5">
                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{r.product_title}</p>
                <p className="text-amber-600 font-bold text-sm mt-1">{taka(r.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-emerald-700 to-brand-green rounded-2xl p-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-amber-300" /></div>
          <div className="text-left flex-1"><p className="font-semibold text-sm">এসক্রো সুরক্ষিত কেনাকাটা</p><p className="text-emerald-100 text-xs">পণ্য বুঝে পাওয়ার পর বিক্রেতা টাকা পান — ১০০% নিরাপদ</p></div>
        </div>
      </div>
    </div>
  );
}

function HomeStat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-3 border shadow-sm text-center">
      <div className="flex justify-center text-brand-green mb-1">{icon}</div>
      <p className="font-bold text-slate-900 text-sm">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
