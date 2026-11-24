import * as admin from "@/services/admin";
import type { UploadAsset } from "@/types";

export type MediaKind = "image" | "video";

export const MAX_IMAGE = 10 * 1024 * 1024; // Cloudinary free plan: 10 MB per image
export const MAX_VIDEO = 100 * 1024 * 1024; // Cloudinary free plan: 100 MB per video

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|mkv)$/i;

/** Returns an error message, or null when the file is acceptable. */
export function checkFile(file: File, kind: MediaKind): string | null {
  if (kind === "image") {
    if (!IMAGE_TYPES.includes(file.type)) return "Use a JPEG, PNG or WebP image.";
    if (file.size > MAX_IMAGE) return `Image is too large (max ${MAX_IMAGE / 1024 / 1024} MB).`;
    return null;
  }
  // Phones sometimes report an empty type for videos, so fall back to the extension.
  if (!file.type.startsWith("video/") && !VIDEO_EXT.test(file.name)) return "That doesn't look like a video file.";
  if (file.size > MAX_VIDEO) {
    return `Video is too large (${Math.round(file.size / 1024 / 1024)} MB, max ${MAX_VIDEO / 1024 / 1024} MB). Trim it or lower the recording quality.`;
  }
  return null;
}

const CHUNK = 6 * 1024 * 1024; // Cloudinary needs >= 5 MB per chunk (except the last)
const CHUNK_FROM = 12 * 1024 * 1024; // smaller files go up in one request

export interface UploadHandle {
  promise: Promise<UploadAsset>;
  cancel: () => void;
}

/**
 * Uploads a file straight from the browser to Cloudinary using parameters signed by our API, so
 * big videos never pass through Vercel or the API server. Large files are sent in chunks, and each
 * chunk is retried, which survives the flaky connections you get on mobile data.
 */
export function uploadDirect(file: File, kind: MediaKind, onProgress: (percent: number) => void): UploadHandle {
  let cancelled = false;
  let current: XMLHttpRequest | null = null;

  function send(
    sign: Awaited<ReturnType<typeof admin.signUpload>>,
    body: Blob,
    headers: Record<string, string>,
    onBytes: (loaded: number) => void,
  ) {
    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      current = xhr;
      const form = new FormData();
      for (const [k, v] of Object.entries(sign.params)) form.append(k, String(v));
      form.append("api_key", sign.apiKey);
      form.append("signature", sign.signature);
      form.append("file", body, file.name);
      xhr.open("POST", sign.uploadUrl);
      for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => e.lengthComputable && onBytes(e.loaded);
      xhr.onload = () => {
        let json: any = null;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {
          /* non-JSON error page */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(Object.assign(new Error(json?.error?.message ?? `Upload failed (${xhr.status})`), { fatal: xhr.status < 500 }));
      };
      xhr.onerror = () => reject(new Error("Network problem during upload."));
      xhr.ontimeout = () => reject(new Error("The upload timed out."));
      xhr.onabort = () => reject(Object.assign(new Error("Upload cancelled"), { fatal: true, cancelled: true }));
      xhr.send(form);
    });
  }

  async function run(): Promise<UploadAsset> {
    const sign = await admin.signUpload(kind);
    let result: any;

    if (file.size <= CHUNK_FROM) {
      result = await send(sign, file, {}, (loaded) => onProgress(Math.round((loaded / file.size) * 100)));
    } else {
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      for (let start = 0; start < file.size; start += CHUNK) {
        const end = Math.min(start + CHUNK, file.size);
        const blob = file.slice(start, end);
        for (let attempt = 1; ; attempt++) {
          if (cancelled) throw Object.assign(new Error("Upload cancelled"), { cancelled: true });
          try {
            result = await send(
              sign,
              blob,
              { "X-Unique-Upload-Id": uid, "Content-Range": `bytes ${start}-${end - 1}/${file.size}` },
              (loaded) => onProgress(Math.round(((start + loaded) / file.size) * 100)),
            );
            break;
          } catch (err: any) {
            if (err.fatal || attempt >= 4) throw err;
            await new Promise((r) => setTimeout(r, 1000 * attempt)); // back off, then retry this chunk
          }
        }
      }
    }

    if (!result?.secure_url || !result?.public_id) throw new Error("Upload finished but Cloudinary returned no file.");
    onProgress(100);
    return { url: result.secure_url as string, publicId: result.public_id as string };
  }

  return {
    promise: run(),
    cancel: () => {
      cancelled = true;
      current?.abort();
    },
  };
}
