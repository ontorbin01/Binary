import React, { useState } from "react";
import { X, Copy, ShieldCheck, Truck, Banknote, Check, ChevronRight } from "lucide-react";
import { apiPost, bn, taka, DISTRICTS } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export default function OrderModal({ reel, onClose }) {
  const { user, settings, clearCart } = useApp();
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState(reel?.qty || 1);
  const [form, setForm] = useState({
    user_name: user?.name || "", phone: user?.phone || "", district: "", thana: "", address: "",
  });
  const [payment, setPayment] = useState("");
  const [trxid, setTrxid] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!reel) return null;
  const perishable = reel.product_type === "perishable";
  const total = reel.price * qty;
  const advance = perishable ? Math.round(total * 0.5) : 100;
  const gatewayNo = payment === "nagad" ? settings?.nagad_number : settings?.bkash_number;
  const needTrx = perishable || payment === "bkash" || payment === "nagad" || payment === "cod";

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const next = () => {
    if (step === 1) {
      if (!form.user_name || !form.phone || !form.district || !form.address) {
        toast.error("সব তথ্য পূরণ করুন"); return;
      }
    }
    if (step === 2 && !payment) { toast.error("পেমেন্ট মাধ্যম নির্বাচন করুন"); return; }
    setStep(step + 1);
  };

  const submit = async () => {
    if (needTrx && !trxid.trim()) { toast.error("অনুগ্রহ করে TrxID দিন"); return; }
    setSubmitting(true);
    try {
      await apiPost("/orders", { ...form, reel_id: reel.id, qty, payment_method: payment, trxid: trxid.trim() });
      toast.success("অর্ডার সফলভাবে নিশ্চিত হয়েছে! 🎉");
      clearCart();
      onClose(true);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "অর্ডার করতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const copyNo = () => { navigator.clipboard.writeText(gatewayNo || ""); toast.success("নম্বর কপি হয়েছে"); };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={() => onClose(false)}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        data-testid="checkout-modal"
        className="relative w-full max-w-lg bg-brand-cream rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto scrollbar-none animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-brand-cream z-10 flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-slate-900">অর্ডার করুন — ধাপ {bn(step)}/৩</h2>
          <button onClick={() => onClose(false)} data-testid="checkout-close-btn"><X className="w-6 h-6 text-slate-500" /></button>
        </div>

        {/* product header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b">
          <img src={reel.poster} alt="" className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm line-clamp-1">{reel.product_title}</p>
            <p className="text-amber-600 font-bold">{taka(reel.price)} <span className="text-slate-400 text-xs font-normal">/ {reel.price_unit}</span></p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full border px-2 py-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-minus" className="w-6 h-6 text-lg font-bold text-slate-600">−</button>
            <span className="w-6 text-center font-semibold">{bn(qty)}</span>
            <button onClick={() => setQty(qty + 1)} data-testid="qty-plus" className="w-6 h-6 text-lg font-bold text-slate-600">+</button>
          </div>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-3">
              <Field label="নাম" testid="order-name-input" value={form.user_name} onChange={(v) => set("user_name", v)} />
              <Field label="মোবাইল নম্বর" testid="order-phone-input" value={form.phone} onChange={(v) => set("phone", v)} />
              <div>
                <label className="text-sm font-medium text-slate-700">জেলা</label>
                <select value={form.district} onChange={(e) => set("district", e.target.value)} data-testid="order-district-select"
                  className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green">
                  <option value="">জেলা নির্বাচন করুন</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Field label="থানা / উপজেলা" testid="order-thana-input" value={form.thana} onChange={(v) => set("thana", v)} />
              <Field label="গ্রাম / বাড়ির ঠিকানা" testid="order-address-input" value={form.address} onChange={(v) => set("address", v)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {perishable ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                  <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">এসক্রো সুরক্ষা</p>
                    <p className="text-xs text-blue-700 mt-1">পচনশীল পণ্য — ৫০% অগ্রিম এসক্রো পেমেন্ট আবশ্যক। আপনার টাকা আমাদের কাছে নিরাপদ, পণ্য বুঝে পাওয়ার পর বিক্রেতা পাবেন। হাইপার-লোকাল ডেলিভারি ৩-৬ ঘণ্টায়।</p>
                  </div>
                </div>
              ) : (
                <div className="bg-brand-surface border border-emerald-200 rounded-2xl p-4 flex gap-3">
                  <Truck className="w-6 h-6 text-brand-green shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-green text-sm">ক্যাশ অন ডেলিভারি সুবিধা</p>
                    <p className="text-xs text-slate-600 mt-1">অপচনশীল পণ্য — কুরিয়ার/লোকাল শিপিং। মাত্র ৳১০০ অগ্রিম ডেলিভারি চার্জ টোকেন (বিকাশ/নগদ) দিয়ে অর্ডার নিশ্চিত করুন, বাকি টাকা পণ্য হাতে পেয়ে দিন।</p>
                  </div>
                </div>
              )}

              <p className="text-sm font-medium text-slate-700 pt-1">পেমেন্ট মাধ্যম</p>
              {!perishable && (
                <PayOption id="cod" active={payment} setActive={setPayment} color="#1b4d3e" label="ক্যাশ অন ডেলিভারি" sub="৳১০০ টোকেন বিকাশ/নগদে" icon={<Banknote className="w-5 h-5" />} />
              )}
              <PayOption id="bkash" active={payment} setActive={setPayment} color="#e2136e" label="বিকাশ" sub={settings?.gateways?.bkash ? "চালু" : "বন্ধ"} disabled={!settings?.gateways?.bkash} />
              <PayOption id="nagad" active={payment} setActive={setPayment} color="#f7921e" label="নগদ" sub={settings?.gateways?.nagad ? "চালু" : "বন্ধ"} disabled={!settings?.gateways?.nagad} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white border rounded-2xl p-4 space-y-2 text-sm">
                <Row label="পণ্যের মূল্য" value={taka(total)} />
                <Row label={perishable ? "এসক্রো অগ্রিম (৫০%)" : "ডেলিভারি চার্জ টোকেন"} value={taka(advance)} highlight />
                {!perishable && <Row label="ডেলিভারিতে প্রদেয়" value={taka(total)} />}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">নিচের {payment === "nagad" ? "নগদ" : payment === "bkash" ? "বিকাশ" : "বিকাশ/নগদ"} নম্বরে <b>{taka(advance)}</b> সেন্ড মানি করুন</p>
                <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border">
                  <span className="font-bold text-lg text-slate-900 tracking-wide">{gatewayNo || settings?.bkash_number}</span>
                  <button onClick={copyNo} data-testid="copy-number-btn" className="flex items-center gap-1 text-brand-green text-sm font-semibold">
                    <Copy className="w-4 h-4" /> কপি
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Transaction ID (TrxID)</label>
                <input value={trxid} onChange={(e) => setTrxid(e.target.value)}
                  data-testid={payment === "nagad" ? "nagad-trxid-input" : "bkash-trxid-input"}
                  placeholder="যেমন: BKX9A7C2D1"
                  className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-brand-green" />
                <p className="text-xs text-slate-500 mt-1">অ্যাডমিন TrxID যাচাই করে অর্ডার সম্পন্ন করবেন।</p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-brand-cream border-t p-4 flex gap-3">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="px-5 py-3 rounded-full border font-semibold text-slate-600">পেছনে</button>}
          {step < 3 ? (
            <button onClick={next} data-testid="checkout-next-btn" className="flex-1 bg-brand-green text-white font-bold py-3 rounded-full flex items-center justify-center gap-1">
              পরবর্তী <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} data-testid="checkout-confirm-btn" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-full flex items-center justify-center gap-2 disabled:opacity-60">
              <Check className="w-5 h-5" /> {submitting ? "প্রসেসিং..." : "অর্ডার নিশ্চিত করুন"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, testid }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
        className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
    </div>
  );
}

function PayOption({ id, active, setActive, color, label, sub, icon, disabled }) {
  return (
    <button disabled={disabled} onClick={() => setActive(id)} data-testid={`pay-${id}-btn`}
      className={`w-full flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-all ${active === id ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"} ${disabled ? "opacity-40" : ""}`}>
      <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: color }}>
        {icon || label[0]}
      </span>
      <div className="flex-1 text-left">
        <p className="font-semibold text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      {active === id && <Check className="w-5 h-5 text-brand-green" />}
    </button>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold ${highlight ? "text-amber-600" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
