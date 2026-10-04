import React, { useEffect, useState } from "react";
import { X, Lock, TrendingUp, Users, ShieldCheck, Wallet, Film, Sliders, Ban, Flag, Trash2, Check, AlertTriangle } from "lucide-react";
import { apiGet, apiPost, apiPut, bn, taka } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export default function AdminDashboard({ onClose }) {
  const { adminAuthed, setAdminAuthed, settings, setSettings } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("metrics");

  const doLogin = async () => {
    try {
      await apiPost("/admin/login", { username, password });
      setAdminAuthed(true);
      toast.success("অ্যাডমিন লগইন সফল");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "লগইন ব্যর্থ");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900 overflow-y-auto scrollbar-none">
      <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-white font-bold"><Sliders className="w-5 h-5 text-amber-400" /> সুপার অ্যাডমিন ড্যাশবোর্ড</div>
        <button onClick={onClose} data-testid="admin-close-btn" className="text-slate-400"><X className="w-6 h-6" /></button>
      </div>

      {!adminAuthed ? (
        <div className="max-w-sm mx-auto mt-20 bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-3"><Lock className="w-7 h-7 text-amber-400" /></div>
            <h2 className="text-white font-bold text-lg">পাসওয়ার্ড সুরক্ষিত</h2>
            <p className="text-slate-400 text-sm">অ্যাডমিন প্যানেলে প্রবেশ করুন</p>
          </div>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ইউজারনেম" data-testid="admin-username-input"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-amber-500" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} placeholder="পাসওয়ার্ড" data-testid="admin-password-input"
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-amber-500" />
          <button onClick={doLogin} data-testid="admin-login-btn" className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-full">প্রবেশ করুন</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-4 pb-20">
          <div className="flex gap-2 overflow-x-auto scrollbar-none mb-5">
            {[["metrics", "পরিসংখ্যান"], ["gateway", "গেটওয়ে"], ["commission", "কমিশন"], ["deposits", "ডিপোজিট"], ["moderation", "মডারেশন"], ["users", "ব্যবহারকারী"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} data-testid={`admin-tab-${id}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold ${tab === id ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === "metrics" && <Metrics />}
          {tab === "gateway" && <Gateway settings={settings} setSettings={setSettings} />}
          {tab === "commission" && <Commission settings={settings} setSettings={setSettings} />}
          {tab === "deposits" && <Deposits />}
          {tab === "moderation" && <Moderation />}
          {tab === "users" && <UsersTab />}
        </div>
      )}
    </div>
  );
}

function Metrics() {
  const [m, setM] = useState(null);
  useEffect(() => { apiGet("/admin/metrics").then(setM); }, []);
  if (!m) return <p className="text-slate-400">লোড হচ্ছে...</p>;
  const cards = [
    { icon: <Users className="w-6 h-6" />, label: "মোট ব্যবহারকারী", value: bn(m.total_users), color: "from-blue-600 to-blue-800" },
    { icon: <ShieldCheck className="w-6 h-6" />, label: "ভেরিফাইড কৃষক", value: bn(m.total_sellers), color: "from-emerald-600 to-emerald-800" },
    { icon: <TrendingUp className="w-6 h-6" />, label: "মোট GMV / লেনদেন", value: taka(m.gmv), color: "from-amber-600 to-amber-800" },
    { icon: <Wallet className="w-6 h-6" />, label: "পেন্ডিং এসক্রো", value: taka(m.pending_escrow), color: "from-purple-600 to-purple-800" },
    { icon: <Film className="w-6 h-6" />, label: "রিপোর্টেড রিল", value: bn(m.reported_reels), color: "from-rose-600 to-rose-800" },
    { icon: <AlertTriangle className="w-6 h-6" />, label: "রিপোর্টেড মন্তব্য", value: bn(m.reported_comments), color: "from-orange-600 to-orange-800" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div key={i} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-white`}>
          <div className="opacity-80 mb-2">{c.icon}</div>
          <p className="text-2xl font-bold">{c.value}</p>
          <p className="text-xs opacity-80 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function Gateway({ settings, setSettings }) {
  const [form, setForm] = useState({ bkash_number: "", nagad_number: "", rocket_number: "" });
  const [gateways, setGateways] = useState({ bkash: true, nagad: true, cod: true });
  useEffect(() => {
    if (settings) { setForm({ bkash_number: settings.bkash_number, nagad_number: settings.nagad_number, rocket_number: settings.rocket_number }); setGateways(settings.gateways); }
  }, [settings]);

  const save = async () => {
    const updated = await apiPut("/admin/settings", { ...form, gateways });
    setSettings(updated);
    toast.success("গেটওয়ে সেটিংস সংরক্ষিত হয়েছে");
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
      <h3 className="text-white font-bold">পেমেন্ট গেটওয়ে ম্যানেজার</h3>
      {[["bkash_number", "বিকাশ নম্বর", "bkash"], ["nagad_number", "নগদ নম্বর", "nagad"], ["rocket_number", "রকেট নম্বর", "rocket"]].map(([k, label, g]) => (
        <div key={k}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-300 text-sm">{label}</label>
            {gateways[g] !== undefined && (
              <button onClick={() => setGateways((p) => ({ ...p, [g]: !p[g] }))} data-testid={`gateway-toggle-${g}`}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gateways[g] ? "bg-emerald-600 text-white" : "bg-slate-600 text-slate-300"}`}>
                {gateways[g] ? "চালু" : "বন্ধ"}
              </button>
            )}
          </div>
          <input value={form[k] || ""} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} data-testid={`admin-${g}-number-input`}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <span className="text-slate-300 text-sm">ক্যাশ অন ডেলিভারি</span>
        <button onClick={() => setGateways((p) => ({ ...p, cod: !p.cod }))} data-testid="gateway-toggle-cod"
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gateways.cod ? "bg-emerald-600 text-white" : "bg-slate-600 text-slate-300"}`}>
          {gateways.cod ? "চালু" : "বন্ধ"}
        </button>
      </div>
      <button onClick={save} data-testid="admin-save-gateway-btn" className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-full">সংরক্ষণ করুন</button>
    </div>
  );
}

function Commission({ settings, setSettings }) {
  const [val, setVal] = useState(7);
  useEffect(() => { if (settings) setVal(settings.commission_percent); }, [settings]);
  const save = async () => {
    const updated = await apiPut("/admin/settings", { commission_percent: Number(val) });
    setSettings(updated);
    toast.success(`কমিশন ${bn(val)}% এ সেট করা হয়েছে`);
  };
  return (
    <div className="bg-slate-800 rounded-2xl p-5">
      <h3 className="text-white font-bold mb-1">কমিশন কন্ট্রোলার</h3>
      <p className="text-slate-400 text-sm mb-5">প্ল্যাটফর্ম সেলার কমিশন (গ্লোবাল)</p>
      <div className="text-center mb-5">
        <span className="text-5xl font-bold text-amber-400">{bn(val)}%</span>
      </div>
      <input type="range" min="0" max="15" step="0.5" value={val} onChange={(e) => setVal(e.target.value)} data-testid="admin-commission-slider"
        className="w-full accent-amber-500" />
      <div className="flex justify-between text-slate-500 text-xs mt-1"><span>০%</span><span>১৫%</span></div>
      <button onClick={save} data-testid="admin-save-commission-btn" className="w-full mt-5 bg-amber-500 text-slate-950 font-bold py-3 rounded-full">কমিশন আপডেট করুন</button>
    </div>
  );
}

function Moderation() {
  const [reels, setReels] = useState([]);
  const [comments, setComments] = useState([]);
  const load = () => {
    apiGet("/admin/moderation/reels").then(setReels);
    apiGet("/admin/moderation/comments").then(setComments);
  };
  useEffect(() => { load(); }, []);

  const reelAction = async (id, action) => { await apiPost(`/admin/reels/${id}/action`, { action }); toast.success(action === "remove" ? "ভিডিও সরানো হয়েছে" : "অনুমোদন দেওয়া হয়েছে"); load(); };
  const commentAction = async (id, action) => { await apiPost(`/admin/comments/${id}/action`, { action }); toast.success(action === "remove" ? "মন্তব্য সরানো হয়েছে" : "অনুমোদিত"); load(); };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Film className="w-5 h-5 text-amber-400" /> রিপোর্টেড রিল ({bn(reels.length)})</h3>
        {reels.length === 0 ? <p className="text-slate-500 text-sm">কোনো রিপোর্ট নেই</p> : (
          <div className="space-y-2">
            {reels.map((r) => (
              <div key={r.id} className="bg-slate-800 rounded-2xl p-3 flex gap-3 items-center" data-testid={`mod-reel-${r.id}`}>
                <img src={r.poster} alt="" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1"><p className="text-white text-sm font-semibold line-clamp-1">{r.product_title}</p><p className="text-slate-400 text-xs">{r.category}</p></div>
                <button onClick={() => reelAction(r.id, "remove")} data-testid={`admin-remove-video-btn`} className="bg-rose-600 text-white p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => reelAction(r.id, "approve")} data-testid={`admin-approve-video-btn`} className="bg-emerald-600 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-400" /> রিপোর্টেড মন্তব্য ({bn(comments.length)})</h3>
        {comments.length === 0 ? <p className="text-slate-500 text-sm">কোনো রিপোর্ট নেই</p> : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-slate-800 rounded-2xl p-3 flex gap-3 items-center" data-testid={`mod-comment-${c.id}`}>
                <div className="flex-1"><p className="text-white text-sm">{c.text}</p><p className="text-slate-400 text-xs mt-1">{c.user_name} · {c.product_title}</p></div>
                <button onClick={() => commentAction(c.id, "remove")} data-testid={`admin-remove-comment-btn`} className="bg-rose-600 text-white p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => commentAction(c.id, "approve")} data-testid={`admin-approve-comment-btn`} className="bg-emerald-600 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const load = () => { apiGet("/admin/users").then(setUsers); };
  useEffect(() => { load(); }, []);
  const action = async (id, a) => { await apiPost(`/admin/users/${id}/action`, { action: a }); toast.success("সম্পন্ন হয়েছে"); load(); };
  return (
    <div className="space-y-2">
      <h3 className="text-white font-bold mb-3">ব্যবহারকারী ম্যানেজমেন্ট</h3>
      {users.map((u) => (
        <div key={u.id} className="bg-slate-800 rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-user-${u.id}`}>
          <div className="w-10 h-10 rounded-full bg-brand-green text-white flex items-center justify-center font-bold">{u.name[0]}</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">{u.name} {u.banned && <span className="text-rose-400 text-xs">(ব্যানড)</span>} {u.flagged && <span className="text-amber-400 text-xs">(ফ্ল্যাগড)</span>}</p>
            <p className="text-slate-400 text-xs">{u.phone} · {u.role}</p>
          </div>
          <button onClick={() => action(u.id, "flag")} data-testid={`user-flag-${u.id}`} className="text-amber-400 p-2"><Flag className="w-4 h-4" /></button>
          <button onClick={() => action(u.id, u.banned ? "unban" : "ban")} data-testid={`user-ban-${u.id}`} className="text-rose-400 p-2"><Ban className="w-4 h-4" /></button>
          <button onClick={() => action(u.id, "delete")} data-testid={`user-delete-${u.id}`} className="text-slate-400 p-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}


function Deposits() {
  const [deposits, setDeposits] = useState([]);
  const load = () => { apiGet("/admin/deposits").then(setDeposits); };
  useEffect(() => { load(); }, []);
  const action = async (id, a) => { await apiPost(`/admin/deposits/${id}/action`, { action: a }); toast.success(a === "approve" ? "অনুমোদিত ও ব্যালেন্স যোগ হয়েছে" : "বাতিল করা হয়েছে"); load(); };
  const badge = (s) => s === "approved" ? "bg-emerald-600" : s === "rejected" ? "bg-rose-600" : "bg-amber-600";
  return (
    <div className="space-y-2">
      <h3 className="text-white font-bold mb-3">ওয়ালেট ডিপোজিট যাচাই</h3>
      {deposits.length === 0 && <p className="text-slate-500 text-sm">কোনো ডিপোজিট অনুরোধ নেই</p>}
      {deposits.map((d) => (
        <div key={d.id} className="bg-slate-800 rounded-2xl p-3 flex items-center gap-3" data-testid={`admin-deposit-${d.id}`}>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">{taka(d.amount)} <span className="text-slate-400 text-xs font-normal">· {d.method}</span> <span className={`text-[10px] text-white px-2 py-0.5 rounded-full ${badge(d.status)}`}>{d.status}</span></p>
            <p className="text-slate-400 text-xs">{d.user_name} · প্রেরক: {d.sender_number} · TrxID: {d.trxid}</p>
          </div>
          {d.status === "pending" && (
            <>
              <button onClick={() => action(d.id, "approve")} data-testid={`deposit-approve-${d.id}`} className="bg-emerald-600 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button>
              <button onClick={() => action(d.id, "reject")} data-testid={`deposit-reject-${d.id}`} className="bg-rose-600 text-white p-2 rounded-lg"><X className="w-4 h-4" /></button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
