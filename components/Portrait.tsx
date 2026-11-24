import { optimize } from "@/lib/media";
import { pad } from "@/lib/format";

/** Approved portrait, or a quiet typographic placeholder when none was uploaded. */
export function Portrait({
  url,
  number,
  alt,
  width = 800,
  priority = false,
  className = "",
}: {
  url: string | null;
  number: number;
  alt: string;
  width?: number;
  priority?: boolean;
  className?: string;
}) {
  const src = optimize(url, width);
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
