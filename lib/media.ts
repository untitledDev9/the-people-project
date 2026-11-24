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
