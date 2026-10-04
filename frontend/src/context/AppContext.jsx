import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiGet, apiPost } from "../lib/api";
import { toast } from "sonner";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("gg_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("gg_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [reels, setReels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [view, setView] = useState("feed"); // feed | categories | cart | profile | admin | home
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const loadReels = useCallback(async (category) => {
    const data = await apiGet("/reels", category ? { category } : undefined);
    setReels(data);
  }, []);

  useEffect(() => {
    loadReels();
    apiGet("/categories").then(setCategories);
    apiGet("/settings").then(setSettings);
  }, [loadReels]);

  useEffect(() => localStorage.setItem("gg_cart", JSON.stringify(cart)), [cart]);

  const login = async (name, phone) => {
    const u = await apiPost("/auth/login", { name, phone, role: "buyer" });
    setUser(u);
    localStorage.setItem("gg_user", JSON.stringify(u));
    toast.success(`স্বাগতম, ${u.name}!`);
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gg_user");
    setView("feed");
    toast.info("আপনি লগআউট করেছেন");
  };

  const addToCart = (reel) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === reel.id);
      if (exist) return prev.map((c) => (c.id === reel.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...reel, qty: 1 }];
    });
    toast.success("পণ্যটি কার্টে যোগ করা হয়েছে!");
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const updateQty = (id, qty) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, qty) } : c)));
  const clearCart = () => setCart([]);

  const value = {
    user, setUser, login, logout,
    cart, addToCart, removeFromCart, updateQty, clearCart,
    reels, loadReels, setReels,
    categories, settings, setSettings,
    view, setView,
    adminAuthed, setAdminAuthed,
    activeCategory, setActiveCategory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
