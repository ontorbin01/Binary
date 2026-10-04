import React, { useEffect, useRef, useState } from "react";
import VideoReel from "./VideoReel";
import { useApp } from "../context/AppContext";

export default function ReelsFeed({ onOpenComments, onOpenSeller, onOrder }) {
  const { reels } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number(entry.target.dataset.idx);
            setActiveIdx(idx);
          }
        });
      },
      { root: containerRef.current, threshold: [0.6] }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  return (
    <div
      ref={containerRef}
      data-testid="reels-feed"
      className="h-full w-full overflow-y-scroll snap-y-mandatory scrollbar-none bg-black"
    >
      {reels.map((reel, i) => (
        <div
          key={reel.id}
          data-idx={i}
          ref={(el) => (itemRefs.current[i] = el)}
          className="h-full w-full snap-start snap-always"
          style={{ scrollSnapStop: "always" }}
        >
          <VideoReel
            reel={reel}
            isActive={i === activeIdx}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onOpenComments={onOpenComments}
            onOpenSeller={onOpenSeller}
            onOrder={onOrder}
          />
        </div>
      ))}
      {reels.length === 0 && (
        <div className="h-full flex items-center justify-center text-white/70">কোনো রিল পাওয়া যায়নি</div>
      )}
    </div>
  );
}
