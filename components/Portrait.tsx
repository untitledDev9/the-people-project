import { optimize, videoPoster } from "@/lib/media";
import { pad } from "@/lib/format";

/**
 * The approved portrait. With no photo, the video's own first frame is used as the picture, and only
 * when there is no video either does it fall back to a quiet typographic placeholder.
 */
export function Portrait({
  url,
  videoUrl = null,
  number,
  alt,
  width = 800,
  priority = false,
  className = "",
}: {
  url: string | null;
  videoUrl?: string | null;
  number: number;
  alt: string;
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  const src = optimize(url, width) ?? videoPoster(videoUrl, width);
  return (
    <div className={`relative aspect-[4/5] w-full overflow-hidden bg-sand ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex size-full items-center justify-center" role="img" aria-label={alt}>
          <span className="display text-6xl text-beige">{pad(number)}</span>
        </div>
      )}
    </div>
  );
}
