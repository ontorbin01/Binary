import React from "react";
import { useApp } from "../context/AppContext";

export default function CategoriesView() {
  const { categories, setActiveCategory, loadReels, setView, activeCategory } = useApp();
  const pick = (name) => { setActiveCategory(name); loadReels(name); setView("feed"); };
  return (
    <div className="h-full overflow-y-auto scrollbar-none bg-brand-cream p-4 pb-24">
      <h1 className="text-xl font-bold text-slate-900 mb-1">সকল ক্যাটাগরি</h1>
      <p className="text-sm text-slate-500 mb-4">গ্রামের সেরা পণ্য ক্যাটাগরি অনুযায়ী দেখুন</p>
      <button onClick={() => { setActiveCategory(null); loadReels(); setView("feed"); }} data-testid="cat-all-btn"
        className={`mb-3 text-sm font-semibold px-4 py-2 rounded-full ${!activeCategory ? "bg-brand-green text-white" : "bg-white border text-slate-600"}`}>
        সব পণ্য দেখুন
      </button>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((c) => (
          <button key={c.id} onClick={() => pick(c.name)} data-testid={`cat-${c.id}`}
            className="relative rounded-2xl overflow-hidden h-32 group shadow-sm border">
            <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-3 text-left">
              <span className="text-2xl">{c.icon}</span>
              <p className="text-white font-bold">{c.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
