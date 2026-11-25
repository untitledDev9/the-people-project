"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RefreshCw, Trash2, Video, X } from "lucide-react";
import { VideoPreview } from "@/components/admin/VideoPreview";
import { checkFile, uploadDirect, type MediaKind, type UploadHandle } from "@/lib/upload";
import { formatRecorded } from "@/lib/videoThumb";
import * as admin from "@/services/admin";
import type { UploadAsset } from "@/types";

type Status = "idle" | "uploading" | "done" | "error";

/**
 * Picks a file and uploads it to Cloudinary right away, in the background, so by the time the rest
 * of the form is filled in the video is usually already there.
 */
export function useMediaUpload(kind: MediaKind) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<UploadAsset | null>(null);
  const handle = useRef<UploadHandle | null>(null);
  const assetRef = useRef<UploadAsset | null>(null);
  const previewRef = useRef<string | null>(null);

  const discard = useCallback(
    (a: UploadAsset | null) => {
      if (a) admin.discardUpload(kind, a.publicId).catch(() => {}); // best effort
    },
    [kind],
  );

  const start = useCallback(
    (f: File) => {
      const h = uploadDirect(f, kind, setProgress);
      handle.current = h;
      setStatus("uploading");
      setProgress(0);
      setError(null);
      h.promise
        .then((a) => {
          if (handle.current !== h) return discard(a); // replaced or removed while uploading
          assetRef.current = a;
          setAsset(a);
          setStatus("done");
        })
        .catch((err) => {
          if (handle.current !== h || err?.cancelled) return;
          setStatus("error");
          setError(err?.message ?? "Upload failed. Please try again.");
        });
    },
    [kind, discard],
  );

  const reset = useCallback(
    (discardUploaded: boolean) => {
      handle.current?.cancel();
      handle.current = null;
      if (discardUploaded) discard(assetRef.current);
      assetRef.current = null;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
      setFile(null);
      setPreview(null);
      setAsset(null);
      setProgress(0);
      setStatus("idle");
      setError(null);
    },
    [discard],
  );

  const pick = useCallback(
    (f: File | null) => {
      if (!f) return;
      const problem = checkFile(f, kind);
      if (problem) {
        reset(true);
        setStatus("error");
        setError(problem);
        return;
      }
      reset(true);
      const url = URL.createObjectURL(f);
      previewRef.current = url;
      setFile(f);
      setPreview(url);
      start(f);
    },
    [kind, reset, start],
  );

  // Leaving the page with an upload that was never saved: stop it and remove the orphan.
  useEffect(
    () => () => {
      handle.current?.cancel();
      discard(assetRef.current);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [discard],
  );

  return {
    kind,
    file,
    preview,
    progress,
    status,
    error,
    asset,
    uploading: status === "uploading",
    pick,
    clear: () => reset(true),
    /** Call after the participant is saved: the file is now attached, so do not delete it. */
    markSaved: () => reset(false),
    retry: () => file && start(file),
  };
}

export type MediaUpload = ReturnType<typeof useMediaUpload>;

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n > 10 * 1024 * 1024 ? 0 : 1)} MB`;

export function MediaField({
  upload,
  label,
  existingUrl,
  removeExisting,
  onRemoveExisting,
  hint,
  onMultiple,
}: {
  upload: MediaUpload;
  label: string;
  existingUrl?: string | null;
  removeExisting?: boolean;
  onRemoveExisting?: (remove: boolean) => void;
  hint?: string;
  /** When set, the picker allows several files and hands them all to this callback if more than one is chosen. */
  onMultiple?: (files: File[]) => void;
}) {
  const isVideo = upload.kind === "video";
  const showExisting = Boolean(existingUrl) && !upload.file && !removeExisting;
  const Icon = isVideo ? Video : ImagePlus;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 1 && onMultiple) onMultiple(files);
    else upload.pick(files[0] ?? null);
    e.target.value = ""; // allow picking the same file again
  };

  const pickerButtons = (replace: boolean) => (
    <div className="flex flex-wrap gap-2">
      <label className="btn-solid cursor-pointer !px-4">
        <Icon className="size-4" />
        {replace ? "Replace" : isVideo ? "Choose video" : "Choose photo"}
        <input type="file" accept={isVideo ? "video/*" : "image/jpeg,image/png,image/webp"} multiple={Boolean(onMultiple)} onChange={onFile} className="sr-only" />
      </label>
      <label className="btn-outline cursor-pointer !px-4">
        <Camera className="size-4" />
        {isVideo ? "Record" : "Take photo"}
        <input
          type="file"
          accept={isVideo ? "video/*" : "image/*"}
          capture={isVideo ? "environment" : "user"}
          onChange={onFile}
          className="sr-only"
        />
      </label>
    </div>
  );

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        {hint && <span className="text-xs text-stone">{hint}</span>}
      </div>

      <div className="rounded-xl border border-dashed border-ink/25 bg-white/40 p-4">
        {upload.file ? (
          <div>
            <div className="flex gap-4">
              {isVideo ? (
                <VideoPreview src={upload.preview ?? ""} className="w-28 sm:w-36" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={upload.preview ?? undefined} alt="Selected photo" className="aspect-[4/5] w-28 shrink-0 rounded-lg object-cover sm:w-36" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{upload.file.name}</p>
                <p className="text-xs text-stone">
                  {mb(upload.file.size)}
                  {isVideo && formatRecorded(upload.file) ? ` · Recorded ${formatRecorded(upload.file)}` : ""}
                </p>

                {upload.status === "uploading" && (
                  <div className="mt-3" role="status" aria-live="polite">
                    <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-ember transition-[width]" style={{ width: `${upload.progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-sm">Uploading… {upload.progress}%</p>
                    <p className="text-xs text-stone">Keep this page open. You can keep filling in the details.</p>
                  </div>
                )}
                {upload.status === "done" && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-green-800">
                    <Check className="size-4" /> Uploaded
                  </p>
                )}
                {upload.status === "error" && (
                  <div role="alert" className="mt-3">
                    <p className="text-sm text-red-700">{upload.error}</p>
                    <button type="button" onClick={upload.retry} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
                      <RefreshCw className="size-3.5" /> Try again
                    </button>
                  </div>
                )}

                <button type="button" onClick={upload.clear} className="mt-3 inline-flex items-center gap-1.5 text-sm text-stone hover:text-ink">
                  <X className="size-4" /> {upload.status === "uploading" ? "Cancel" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        ) : showExisting ? (
          <div>
            {isVideo ? (
              <video src={existingUrl!} controls playsInline preload="metadata" className="mb-3 aspect-video w-full rounded-lg bg-ink" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={existingUrl!} alt="Current photo" className="mb-3 aspect-[4/5] w-40 rounded-lg object-cover" />
            )}
            <div className="flex flex-wrap items-center gap-3">
              {pickerButtons(true)}
              {onRemoveExisting && (
                <button type="button" onClick={() => onRemoveExisting(true)} className="inline-flex items-center gap-1.5 px-2 py-3 text-sm text-red-700">
                  <Trash2 className="size-4" /> Remove current
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <Icon className="size-8 text-stone" aria-hidden />
            {removeExisting && onRemoveExisting ? (
              <p className="text-sm text-stone">
                Current {isVideo ? "video" : "photo"} will be removed when you save.{" "}
                <button type="button" onClick={() => onRemoveExisting(false)} className="underline underline-offset-4">Undo</button>
              </p>
            ) : (
              <p className="text-sm text-stone">{isVideo ? "Pick a video from your phone, or record one now." : "Optional. The video thumbnail is used if you skip this."}</p>
            )}
            {pickerButtons(false)}
            {upload.error && <p role="alert" className="text-sm text-red-700">{upload.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
