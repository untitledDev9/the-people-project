const isCloudinary = (url: string) => url.includes("res.cloudinary.com") && url.includes("/upload/");

/** Inserts Cloudinary delivery transforms (auto format and quality, max width) into an upload URL. */
export function optimize(url: string | null | undefined, width = 800): string | null {
  if (!url) return null;
  if (!isCloudinary(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

/** Poster frame for a Cloudinary video. */
export function videoPoster(url: string | null | undefined, width = 800): string | null {
  if (!url || !isCloudinary(url)) return null;
  return url.replace("/upload/", `/upload/so_0,f_jpg,q_auto,w_${width}/`).replace(/\.\w+$/, ".jpg");
}

/**
 * Sources to try in order: a web-safe H.264 MP4 (iPhone HEVC .mov will not play in every browser),
 * then the original upload. Non-Cloudinary URLs (demo clips) are returned as they are.
 */
export function videoSources(url: string | null | undefined): { src: string; type?: string }[] {
  if (!url) return [];
  if (!isCloudinary(url)) return [{ src: url }];
  const h264 = url.replace("/upload/", "/upload/f_mp4,vc_h264,q_auto/").replace(/\.\w+$/, ".mp4");
  return h264 === url ? [{ src: url }] : [{ src: h264, type: "video/mp4" }, { src: url }];
}
