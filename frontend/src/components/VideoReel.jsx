import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, MapPin, Play, Pause, Volume2, VolumeX, ShieldCheck, Flag, ShoppingBag } from "lucide-react";
import { bn, taka, apiPost } from "../lib/api";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export default function VideoReel({ reel, isActive, muted, onToggleMute, onOpenComments, onOpenSeller, onOrder }) {
  const videoRef = useRef(null);
  const { user } = useApp();
  const [playing, setPlaying] = useState(true);
  const [likes, setLikes] = useState(reel.likes);
  const [liked, setLiked] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const seller = reel.seller || {};
  const perishable = reel.product_type === "perishable";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [isActive]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const doLike = async (fromDouble = false) => {
    if (fromDouble && liked) { setShowBigHeart(true); setTimeout(() => setShowBigHeart(false), 800); return; }
    const res = await apiPost(`/reels/${reel.id}/like`, { user: user?.phone || "guest" });
    setLikes(res.likes);
    setLiked(res.liked);
    if (res.liked && fromDouble) { setShowBigHeart(true); setTimeout(() => setShowBigHeart(false), 800); }
  };

  const share = async () => {
    const url = `${window.location.origin}/?reel=${reel.id}`;
    const data = { title: reel.product_title, text: `${reel.product_title} - গ্রামেরঘর বিডি`, url };
    if (navigator.share) {
      try { await navigator.share(data); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("লিংক কপি করা হয়েছে!");
    }
  };

  const reportReel = async () => {
    await apiPost(`/reels/${reel.id}/report`, {});
    toast.success("ভিডিওটি অ্যাডমিনের কাছে রিপোর্ট করা হয়েছে");
  };

  return (
    <div className="h-full w-full relative flex flex-col justify-end bg-black overflow-hidden" data-testid={`reel-${reel.id}`}>
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.poster}
        loop muted={muted} playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onClick={togglePlay}
        onDoubleClick={() => doLike(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

      {showBigHeart && (
        <Heart className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-white fill-rose-500 animate-heart-pop pointer-events-none z-20" />
      )}

      {!playing && (
        <button onClick={togglePlay} data-testid="video-play-pause-btn"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/40 rounded-full p-5 backdrop-blur-sm">
          <Play className="w-10 h-10 text-white fill-white" />
        </button>
      )}

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold text-sm drop-shadow">গ্রামেরঘর <span className="text-amber-400">বিডি</span></span>
        </div>
        <button onClick={onToggleMute} data-testid="video-mute-btn" className="bg-black/40 backdrop-blur-sm rounded-full p-2">
          {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* right action bar */}
      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5 z-20">
        <button onClick={() => onOpenSeller(seller.id)} data-testid={`seller-avatar-${reel.id}`} className="relative">
          <img src={seller.avatar} alt={seller.name} className="w-12 h-12 rounded-full border-2 border-white object-cover" />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold">+</span>
        </button>
        <button onClick={() => doLike(false)} data-testid="video-like-btn" className="flex flex-col items-center gap-1">
          <Heart className={`w-8 h-8 drop-shadow ${liked ? "fill-rose-500 text-rose-500" : "text-white"} transition-transform active:scale-125`} />
          <span className="text-white text-xs font-semibold">{bn(likes)}</span>
        </button>
        <button onClick={() => onOpenComments(reel)} data-testid="video-comment-btn" className="flex flex-col items-center gap-1">
          <MessageCircle className="w-8 h-8 text-white drop-shadow" />
          <span className="text-white text-xs font-semibold">{bn(reel.comment_count || 0)}</span>
        </button>
        <button onClick={share} data-testid="video-share-btn" className="flex flex-col items-center gap-1">
          <Share2 className="w-8 h-8 text-white drop-shadow" />
          <span className="text-white text-xs font-semibold">শেয়ার</span>
        </button>
        <button onClick={reportReel} data-testid="video-report-btn" className="flex flex-col items-center gap-1">
          <Flag className="w-6 h-6 text-white/70 drop-shadow" />
        </button>
      </div>

      {/* bottom product overlay */}
      <div className="relative z-10 p-4 pb-32 pr-20 space-y-2.5">
        <button onClick={() => onOpenSeller(seller.id)} className="flex items-center gap-2 text-white/90 text-sm">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="font-medium">{seller.village}, {seller.district}</span>
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> ১০০% খাঁটি
          </span>
          {perishable && (
            <span className="inline-flex items-center gap-1 bg-blue-600/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
              এসক্রো সুরক্ষিত
            </span>
          )}
        </div>
        <h3 className="text-white text-lg font-bold leading-snug drop-shadow">{reel.product_title}</h3>
        <p className="text-white/80 text-sm line-clamp-2 max-w-md">{reel.description}</p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-amber-400 text-2xl font-bold">{taka(reel.price)}</span>
          <span className="text-white/70 text-sm">/ {reel.price_unit}</span>
        </div>
        <button onClick={() => onOrder(reel)} data-testid="order-now-btn"
          className="mt-2 w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-colors active:scale-95">
          <ShoppingBag className="w-5 h-5" /> দ্রুত অর্ডার করুন
        </button>
      </div>
    </div>
  );
}
