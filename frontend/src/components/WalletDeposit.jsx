import React, { useEffect, useState } from "react";
import { Wallet, Copy, Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { apiGet, apiPost, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

const METHODS = [
  { id: "bkash", label: "বিকাশ", color: "#e2136e", key: "bkash_number" },
  { id: "nagad", label: "নগদ", color: "#f7921e", key: "nagad_number" },
  { id: "rocket", label: "রকেট", color: "#8b2fa0", key: "rocket_number" },
];

export default function WalletDeposit() {
  const { user, settings, refreshUser } = useApp();
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [trxid, setTrxid] = useState("");
  const [sender, setSender] = useState("");
  const [deposits, setDeposits] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => { if (user) apiGet("/wallet/deposits", { phone: user.phone }).then(setDeposits); };
  useEffect(() => { load(); refreshUser(); /* eslint-disable-next-line */ }, []);

  const activeMethod = METHODS.find((m) => m.id === method);
  const number = settings?.[activeMethod.key] || "—";

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error("সঠিক পরিমাণ লিখুন"); return; }
    if (!trxid.trim() || !sender.trim()) { toast.error("TrxID ও প্রেরকের নম্বর দিন"); return; }
    setSubmitting(true);
    try {
      await apiPost("/wallet/deposit", {
        phone: user.phone, user_name: user.name, method,
        amount: Number(amount), trxid: trxid.trim(), sender_number: sender.trim(),
      });
      toast.success("ডিপোজিট অনুরোধ জমা হয়েছে! অ্যাডমিন যাচাইয়ের পর ব্যালেন্স যোগ হবে।");
      setAmount(""); setTrxid(""); setSender("");
      load();
    } catch (e) { toast.error("জমা দিতে সমস্যা হয়েছে"); }
    finally { setSubmitting(false); }
  };

  const copyNo = () => { navigator.clipboard.writeText(number); toast.success("নম্বর কপি হয়েছে"); };

  const statusBadge = (s) => {
    if (s === "approved") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> অনুমোদিত</span>;
    if (s === "rejected") return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> বাতিল</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> অপেক্ষমাণ</span>;
  };

  return (
    <div className="space-y-4" data-testid="wallet-deposit-section">
      <div className="bg-gradient-to-br from-brand-green to-emerald-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 text-emerald-100 text-sm"><Wallet className="w-5 h-5 text-amber-300" /> এসক্রো ওয়ালেট ব্যালেন্স</div>
        <p className="text-3xl font-bold mt-1">{taka(user?.wallet || 0)}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Plus className="w-5 h-5 text-brand-green" /> টাকা যোগ করুন (অ্যাড মানি)</h3>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {METHODS.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)} data-testid={`deposit-method-${m.id}`}
              className={`rounded-xl border-2 py-2 text-sm font-semibold transition-all ${method === m.id ? "border-brand-green bg-brand-surface" : "border-slate-200 bg-white"}`}>
              <span className="w-2.5 h-2.5 rounded-full inline-block mr-1" style={{ background: m.color }} />
              {m.label}
            </button>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
          <p className="text-xs text-slate-600 mb-1">অ্যাডমিনের {activeMethod.label} নম্বরে সেন্ড মানি করুন:</p>
          <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border">
            <span className="font-bold text-slate-900 tracking-wide" data-testid="deposit-admin-number">{number}</span>
            <button onClick={copyNo} data-testid="deposit-copy-btn" className="flex items-center gap-1 text-brand-green text-sm font-semibold"><Copy className="w-4 h-4" /> কপি</button>
          </div>
        </div>

        <div className="space-y-2.5">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="পরিমাণ (৳)" data-testid="deposit-amount-input"
            className="w-full bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="আপনার প্রেরক মোবাইল নম্বর" data-testid="deposit-sender-input"
            className="w-full bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          <input value={trxid} onChange={(e) => setTrxid(e.target.value)} placeholder="Transaction ID (TrxID)" data-testid="deposit-trxid-input"
            className="w-full bg-white border rounded-xl px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-brand-green" />
          <button onClick={submit} disabled={submitting} data-testid="deposit-submit-btn"
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-full disabled:opacity-60">
            {submitting ? "জমা হচ্ছে..." : "যাচাইয়ের জন্য জমা দিন"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-2">ডিপোজিট ইতিহাস</h3>
        {deposits.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">এখনো কোনো ডিপোজিট নেই</p> : (
          <div className="space-y-2">
            {deposits.map((d) => (
              <div key={d.id} className="bg-white rounded-xl p-3 border flex items-center justify-between" data-testid={`deposit-${d.id}`}>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{taka(d.amount)} <span className="text-slate-400 text-xs font-normal">· {d.method}</span></p>
                  <p className="text-xs text-slate-500">TrxID: {d.trxid}</p>
                </div>
                {statusBadge(d.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
