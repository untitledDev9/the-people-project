/**
 * Grabs a real frame from a local video so you can tell which clip it is. A bare <video> shows the
 * very first frame, which is usually black (or nothing at all on phones) until it is played.
 * Resolves with thumb = null when the browser cannot decode the file (e.g. iPhone HEVC in Chrome).
 */
export function captureThumbnail(src: string, maxWidth = 480): Promise<{ thumb: string | null; duration: number | null }> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    let finished = false;

    const finish = (thumb: string | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : null;
      v.removeAttribute("src");
      v.load();
      resolve({ thumb, duration });
    };
    const timer = setTimeout(() => finish(null), 10000);

    v.onerror = () => finish(null);
    v.onloadeddata = () => {
      const d = v.duration;
      // A little way in: past the black/blurry opening frame, but still inside very short clips.
      v.currentTime = Number.isFinite(d) && d > 0 ? Math.min(1, Math.max(0.05, d * 0.1)) : 0.05;
    };
    v.onseeked = () => {
      try {
        const scale = Math.min(1, maxWidth / (v.videoWidth || maxWidth));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((v.videoWidth || 1) * scale));
        canvas.height = Math.max(1, Math.round((v.videoHeight || 1) * scale));
        canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob ? URL.createObjectURL(blob) : null), "image/jpeg", 0.8);
      } catch {
        finish(null);
      }
    };
    v.src = src;
  });
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** When the clip was recorded (the file's own timestamp), e.g. "24 Nov, 15:42". */
export function formatRecorded(file: File) {
  if (!file.lastModified) return "";
  return new Date(file.lastModified).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
