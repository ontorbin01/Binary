import React, { useRef, useState } from "react";
import { X, Camera, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { DISTRICTS } from "../lib/api";
import { toast } from "sonner";

export default function EditProfileModal({ onClose }) {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [village, setVillage] = useState(user?.village || "");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("ছবি ৩MB এর কম হতে হবে"); return; }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 256;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setLoading(true);
    try { await updateProfile({ name: name.trim(), avatar, district, village: village.trim() }); onClose(); }
    catch (e) { toast.error("আপডেট ব্যর্থ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div data-testid="edit-profile-modal" className="relative w-full max-w-sm bg-brand-cream rounded-3xl p-6 animate-slide-up max-h-[92vh] overflow-y-auto scrollbar-none" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-5 h-5 text-slate-400" /></button>
        <h2 className="text-lg font-bold text-slate-900 mb-4">প্রোফাইল সম্পাদনা</h2>

        <div className="flex flex-col items-center mb-5">
          <div className="relative">
            {avatar ? (
              <img src={avatar} alt="" className="w-24 h-24 rounded-2xl object-cover border" data-testid="edit-avatar-preview" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-green flex items-center justify-center"><User className="w-10 h-10 text-amber-300" /></div>
            )}
            <button onClick={() => fileRef.current?.click()} data-testid="edit-avatar-upload-btn"
              className="absolute -bottom-2 -right-2 bg-amber-500 rounded-full p-2 shadow-lg"><Camera className="w-4 h-4 text-slate-950" /></button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="edit-avatar-file-input" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">নাম</label>
            <input value={name} onChange={(e) => setName(e.target.value)} data-testid="edit-name-input"
              className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">প্রোফাইল ছবির URL</label>
            <input value={avatar.startsWith("data:") ? "" : avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." data-testid="edit-avatar-url-input"
              className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
            <p className="text-xs text-slate-400 mt-1">ছবি আপলোড করুন অথবা URL দিন</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">জেলা</label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} data-testid="edit-district-select"
              className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green">
              <option value="">জেলা নির্বাচন করুন</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">গ্রাম / এলাকা</label>
            <input value={village} onChange={(e) => setVillage(e.target.value)} data-testid="edit-village-input"
              className="w-full mt-1 bg-white border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <button onClick={save} disabled={loading} data-testid="edit-profile-save-btn"
            className="w-full bg-brand-green text-white font-bold py-3 rounded-full disabled:opacity-60">
            {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
