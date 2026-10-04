import React, { useEffect, useState } from "react";
import { Banknote, Clock, CheckCircle2, XCircle, ArrowDownToLine } from "lucide-react";
import { apiGet, apiPost, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

const METHODS = [
  { id: "bkash", label: "বিকাশ", color: "#e2136e" },
  { id: "nagad", label: "নগদ", color: "#f7921e" },
  { id: "rocket", label: "রকেট", color: "#8b2fa0" },
];

export default function WithdrawForm() {
  const { user, refreshUser } = useApp();
  const [method, setMethod] = useState("bkash");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [list, setList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => { if (user) apiGet("/wallet/withdrawals", { phone: user.phone }).then(setList); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const submit = async () => {
    if (!number.trim()) { toast.error("আপনার বিকাশ/নগদ/রকেট নম্বর দিন"); return; }
    if (!amount || Number(amount) <= 0) { toast.error("সঠিক পরিমাণ লিখুন"); return; }
    if (Number(amount) > (user?.wallet || 0)) { toast.error("ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setSubmitting(true);
    try {
      await apiPost("/wallet/withdraw", { phone: user.phone, user_name: user.name, method, number: number.trim(), amount: Number(amount) });
      toast.success("উত্তোলনের অনুরোধ জমা হয়েছে! অ্যাডমিন অনুমোদনের পর টাকা পাঠানো হবে।");
      setAmount(""); setNumber("");
      load(); refreshUser();
    } catch (e) { toast.error(e?.response?.data?.detail || "অনুরোধ জমা দিতে সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  const badge = (s) => {
    if (s === "approved") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> পরিশোধিত</span>;
    if (s === "rejected") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> বাতিল</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> অপেক্ষমাণ</span>;
  };

  return (
    <div className="space-y-4" data-testid="withdraw-section">
      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><ArrowDownToLine className="w-5 h-5 text-brand-green" /> টাকা তুলুন (উইথড্র)</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {METHODS.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)} data-testid={`withdraw-method-${m.id}`}
              className={`rounded-xl border-2 py-2 text-sm font-semibold transition-all ${method === m.id ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
              <span className="w-2.5 h-2.5 rounded-full inline-block mr-1" style={{ background: m.color }} />
              {m.label}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={`আপনার ${METHODS.find(m=>m.id===method).label} নম্বর`} data-testid="withdraw-number-input"
            className="w-full bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="উত্তোলনের পরিমাণ (৳)" data-testid="withdraw-amount-input"
            className="w-full bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          <p className="text-xs text-slate-500">উপলব্ধ ব্যালেন্স: <b className="text-brand-green">{taka(user?.wallet || 0)}</b></p>
          <button onClick={submit} disabled={submitting} data-testid="withdraw-submit-btn"
            className="w-full bg-brand-green hover:bg-brand-greenDark text-white font-bold py-3 rounded-full disabled:opacity-60 flex items-center justify-center gap-2">
            <Banknote className="w-5 h-5" /> {submitting ? "জমা হচ্ছে..." : "উত্তোলনের অনুরোধ করুন"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-2">উত্তোলন ইতিহাস</h3>
        {list.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">কোনো উত্তোলন অনুরোধ নেই</p> : (
          <div className="space-y-2">
            {list.map((w) => (
              <div key={w.id} className="bg-white rounded-xl p-3 border flex items-center justify-between" data-testid={`withdraw-${w.id}`}>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{taka(w.amount)} <span className="text-slate-400 text-xs font-normal">· {w.method} · {w.number}</span></p>
                  <p className="text-xs text-slate-500">{bn(new Date(w.created_at).toLocaleDateString("bn-BD"))}</p>
                </div>
                {badge(w.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
