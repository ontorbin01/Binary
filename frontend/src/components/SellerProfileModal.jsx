import React, { useEffect, useState } from "react";
import { X, CheckCircle2, Truck, Star, Package, MapPin } from "lucide-react";
import { apiGet, bn, taka } from "../lib/api";

export default function SellerProfileModal({ sellerId, onClose, onOrder }) {
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    if (sellerId) apiGet(`/sellers/${sellerId}`).then(setSeller);
  }, [sellerId]);

  if (!sellerId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        data-testid="seller-profile-modal"
        className="relative w-full max-w-lg bg-brand-cream sm:rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto scrollbar-none animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {!seller ? (
          <div className="h-64 flex items-center justify-center text-slate-500">লোড হচ্ছে...</div>
        ) : (
          <>
            <div className="relative h-40">
              <img src={seller.banner} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={onClose} data-testid="seller-close-btn" className="absolute top-3 right-3 bg-black/40 rounded-full p-2">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="px-5 pb-6 -mt-10 relative">
              <div className="flex items-end gap-3">
                {seller.avatar ? (
                  <img src={seller.avatar} alt={seller.name} className="w-20 h-20 rounded-2xl border-4 border-brand-cream object-cover" />
                ) : (
                  <span className="w-20 h-20 rounded-2xl border-4 border-brand-cream bg-brand-green text-white flex items-center justify-center font-bold text-3xl">{seller.name?.[0] || "?"}</span>
                )}
                <div className="pb-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl font-bold text-slate-900">{seller.name}</h2>
                    {seller.verified && <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />}
                  </div>
                  <p className="text-sm text-slate-600 flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-600" /> {seller.village}, {seller.district}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Metric icon={<Package className="w-5 h-5" />} label="সম্পন্ন অর্ডার" value={`${bn(seller.completed_orders)}+`} />
                <Metric icon={<Star className="w-5 h-5" />} label="গড় রেটিং" value={`${bn(seller.rating)}★`} />
                <Metric icon={<Truck className="w-5 h-5" />} label="গড় ডেলিভারি" value={seller.avg_delivery} />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {seller.tags?.map((t) => (
                  <span key={t} className="text-xs font-semibold text-brand-green bg-brand-surface px-3 py-1.5 rounded-full">{t}</span>
                ))}
              </div>

              <h3 className="font-semibold text-slate-800 mt-6 mb-3">বিক্রেতার পণ্যসমূহ</h3>
              <div className="grid grid-cols-2 gap-3">
                {seller.reels?.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl overflow-hidden border shadow-sm" data-testid={`seller-product-${r.id}`}>
                    <img src={r.poster} alt={r.product_title} className="w-full h-28 object-cover" />
                    <div className="p-2.5">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{r.product_title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-amber-600 font-bold text-sm">{taka(r.price)}</span>
                        <button onClick={() => { onOrder({ ...r, seller }); onClose(); }} className="text-xs bg-brand-green text-white px-2.5 py-1 rounded-full">অর্ডার</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center border shadow-sm">
      <div className="flex justify-center text-brand-green mb-1">{icon}</div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
