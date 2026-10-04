import React from "react";
import { Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { useApp } from "../context/AppContext";
import { bn, taka } from "../lib/api";

export default function CartView({ onOrder }) {
  const { cart, removeFromCart, updateQty } = useApp();
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-none bg-brand-cream p-4 pb-28">
      <h1 className="text-xl font-bold text-slate-900 mb-4">আমার কার্ট ({bn(cart.length)})</h1>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-300 mb-3" />
          <p className="text-slate-500">আপনার কার্ট খালি</p>
          <p className="text-sm text-slate-400">ফিড থেকে পছন্দের পণ্য যোগ করুন</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-3 flex gap-3 border shadow-sm" data-testid={`cart-item-${c.id}`}>
                <img src={c.poster} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm line-clamp-1">{c.product_title}</p>
                  <p className="text-amber-600 font-bold">{taka(c.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQty(c.id, c.qty - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-6 text-center font-semibold">{bn(c.qty)}</span>
                    <button onClick={() => updateQty(c.id, c.qty + 1)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(c.id)} data-testid={`cart-remove-${c.id}`} className="text-destructive self-start"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 mt-4 border shadow-sm">
            <div className="flex items-center justify-between font-bold text-lg">
              <span className="text-slate-700">সর্বমোট</span>
              <span className="text-brand-green">{taka(total)}</span>
            </div>
            <button onClick={() => onOrder(cart[0])} data-testid="cart-checkout-btn"
              className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-full">
              চেকআউট করুন
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">* প্রতিটি পণ্য আলাদা বিক্রেতার, একটি একটি করে অর্ডার নিশ্চিত করুন</p>
          </div>
        </>
      )}
    </div>
  );
}
