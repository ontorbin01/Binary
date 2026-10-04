import React from "react";
import { Home, Film, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useApp } from "../context/AppContext";

const items = [
  { id: "home", label: "হোম", icon: Home },
  { id: "feed", label: "ফিড", icon: Film },
  { id: "categories", label: "ক্যাটাগরি", icon: LayoutGrid },
  { id: "cart", label: "কার্ট", icon: ShoppingBag },
  { id: "profile", label: "প্রোফাইল", icon: User },
];

export default function BottomNav() {
  const { view, setView, cart } = useApp();
  return (
    <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 flex items-center justify-around px-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button key={it.id} onClick={() => setView(it.id)} data-testid={`nav-${it.id}-btn`}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${active ? "text-amber-400" : "text-slate-400"}`}>
            <Icon className={`w-6 h-6 ${active ? "fill-amber-400/20" : ""}`} />
            <span className="text-[10px] font-medium">{it.label}</span>
            {it.id === "cart" && cart.length > 0 && (
              <span className="absolute -top-0.5 right-0 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cart.length}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
