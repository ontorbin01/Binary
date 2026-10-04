import React, { useEffect, useState } from "react";
import { X, Flag, Send, MessageCircle } from "lucide-react";
import { apiGet, apiPost, bn } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export default function CommentDrawer({ reel, onClose }) {
  const { user } = useApp();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (reel) apiGet(`/reels/${reel.id}/comments`).then(setComments);
  }, [reel]);

  if (!reel) return null;

  const submit = async () => {
    if (!text.trim()) return;
    if (!user) { toast.error("মন্তব্য করতে লগইন করুন"); return; }
    const c = await apiPost("/comments", { reel_id: reel.id, user_name: user.name, text: text.trim() });
    setComments((prev) => [...prev, c]);
    setText("");
  };

  const report = async (id) => {
    await apiPost(`/comments/${id}/report`, {});
    toast.success("মন্তব্যটি অ্যাডমিনের কাছে রিপোর্ট করা হয়েছে");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        data-testid="comment-drawer"
        className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[75vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <MessageCircle className="w-5 h-5 text-brand-green" />
            {bn(comments.length)} টি মন্তব্য
          </div>
          <button onClick={onClose} data-testid="comment-close-btn"><X className="w-6 h-6 text-slate-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 scrollbar-none">
          {comments.length === 0 && <p className="text-center text-slate-400 py-8">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি করুন!</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-green text-white flex items-center justify-center font-semibold shrink-0">
                {c.user_name?.[0] || "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{c.user_name}</p>
                <p className="text-sm text-slate-600">{c.text}</p>
              </div>
              <button onClick={() => report(c.id)} data-testid="comment-report-btn" className="text-slate-400 hover:text-destructive shrink-0">
                <Flag className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-4 border-t">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="একটি মন্তব্য লিখুন..."
            data-testid="comment-input"
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button onClick={submit} data-testid="comment-submit-btn" className="bg-brand-green text-white rounded-full p-2.5">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
