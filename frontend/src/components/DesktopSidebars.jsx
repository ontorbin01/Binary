import React, { useEffect, useState } from "react";
import { Leaf, TrendingUp, Users, ShieldCheck, Sliders, FileText } from "lucide-react";
import { apiGet, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";

export function LeftSidebar({ onLegal }) {
  const { categories, view, setView, setActiveCategory, loadReels } = useApp();
  const pick = (cat) => { setActiveCategory(cat); loadReels(cat); setView("feed"); };
  return (
    <aside className="w-64 hidden lg:flex flex-col gap-4 h-[88vh] sticky top-6">
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center"><Leaf className="w-5 h-5 text-amber-400" /></div>
          <div>
            <p className="text-white font-bold leading-none">গ্রামেরঘর <span className="text-amber-400">বিডি</span></p>
            <p className="text-slate-400 text-[11px] mt-0.5">গ্রামের সেরা পণ্য</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md flex-1 overflow-y-auto scrollbar-none">
        <p className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">মেনু</p>
        <NavBtn active={view === "feed"} onClick={() => { setActiveCategory(null); loadReels(); setView("feed"); }} label="ভিডিও ফিড" />
        <NavBtn active={view === "categories"} onClick={() => setView("categories")} label="সকল ক্যাটাগরি" />
        <NavBtn active={view === "cart"} onClick={() => setView("cart")} label="আমার কার্ট" />
        <NavBtn active={view === "profile"} onClick={() => setView("profile")} label="আমার প্রোফাইল" />
        <p className="text-slate-400 text-xs font-semibold mt-5 mb-3 uppercase tracking-wide">ক্যাটাগরি</p>
        {categories.map((c) => (
          <button key={c.id} onClick={() => pick(c.name)} data-testid={`side-cat-${c.id}`}
            className="w-full flex items-center gap-2 text-slate-300 hover:text-amber-400 hover:bg-slate-700/40 rounded-lg px-2 py-2 text-sm transition-colors">
            <span>{c.icon}</span> {c.name}
          </button>
        ))}
        <button onClick={onLegal} data-testid="side-legal-btn" className="w-full flex items-center gap-2 text-slate-400 hover:text-white mt-4 text-sm px-2 py-2">
          <FileText className="w-4 h-4" /> গোপনীয়তা ও এসক্রো নীতি
        </button>
      </div>
    </aside>
  );
}

function NavBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium mb-1 transition-colors ${active ? "bg-brand-green text-white" : "text-slate-300 hover:bg-slate-700/40"}`}>
      {label}
    </button>
  );
}

export function RightSidebar() {
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { apiGet("/admin/metrics").then(setMetrics).catch(() => {}); }, []);
  return (
    <aside className="w-72 hidden md:flex flex-col gap-4 h-[88vh] sticky top-6">
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-md">
        <p className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" /> প্ল্যাটফর্ম পরিসংখ্যান</p>
        <div className="space-y-3">
          <Stat icon={<Users className="w-4 h-4" />} label="মোট ব্যবহারকারী" value={metrics ? bn(metrics.total_users) : "—"} />
          <Stat icon={<ShieldCheck className="w-4 h-4" />} label="ভেরিফাইড কৃষক" value={metrics ? bn(metrics.total_sellers) : "—"} />
          <Stat icon={<TrendingUp className="w-4 h-4" />} label="মোট লেনদেন (GMV)" value={metrics ? taka(metrics.gmv) : "—"} />
        </div>
      </div>
      <div className="bg-gradient-to-br from-emerald-700 to-brand-green rounded-2xl p-5 text-white">
        <ShieldCheck className="w-8 h-8 text-amber-300 mb-2" />
        <p className="font-bold">এসক্রো সুরক্ষা</p>
        <p className="text-sm text-emerald-100 mt-1">পণ্য বুঝে পাওয়ার পর বিক্রেতা টাকা পান। ১০০% নিরাপদ কেনাকাটা।</p>
      </div>
    </aside>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-amber-400">{icon}</div>
      <div>
        <p className="text-slate-400 text-[11px]">{label}</p>
        <p className="text-white font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}
