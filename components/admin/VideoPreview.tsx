"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { captureThumbnail, formatDuration } from "@/lib/videoThumb";

/**
 * A local video shown as a real thumbnail with its length. Tap to play it right there, so you can
 * check exactly which clip it is before naming it.
 */
export function VideoPreview({ src, className = "" }: { src: string; className?: string }) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let made: string | null = null;
    captureThumbnail(src).then((r) => {
      if (cancelled) {
        if (r.thumb) URL.revokeObjectURL(r.thumb);
        return;
      }
      made = r.thumb;
      setThumb(r.thumb);
      setDuration(r.duration);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [src]);

  return (
    <div className={`relative aspect-[3/4] shrink-0 overflow-hidden rounded-lg bg-ink ${className}`}>
      {playing ? (
        <video src={src} controls autoPlay playsInline className="size-full bg-ink object-contain" onEnded={() => setPlaying(false)} />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label="Play this video" className="group relative block size-full">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="size-full object-cover" />
          )}
          {loading && <span className="absolute inset-0 animate-pulse bg-ash" aria-hidden />}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white transition group-hover:bg-black/75">
              <Play className="size-5 translate-x-px" fill="currentColor" />
            </span>
          </span>
          {duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
              {formatDuration(duration)}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
