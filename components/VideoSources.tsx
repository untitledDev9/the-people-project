import { videoSources } from "@/lib/media";

/** <source> tags for a video URL; use inside <video>. */
export function VideoSources({ url }: { url: string | null | undefined }) {
  return (
    <>
      {videoSources(url).map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </>
  );
}
