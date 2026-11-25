"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RefreshCw, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getDuplicates, getErrorMessage } from "@/lib/api";
import { pad } from "@/lib/format";
import { VideoPreview } from "@/components/admin/VideoPreview";
import { takePendingFiles } from "@/lib/pendingFiles";
import { formatRecorded } from "@/lib/videoThumb";
import { checkFile, uploadDirect, type UploadHandle } from "@/lib/upload";
import * as admin from "@/services/admin";
import type { SlotInfo, UploadAsset } from "@/types";

const META_KEY = "pp:last-meta"; // shared with the single-person form
const MAX_PARALLEL = 3; // phones and mobile data do better with a few uploads at a time
const MAX_FILES = 40;

type Status = "queued" | "uploading" | "done" | "error";

interface Item {
  id: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  asset: UploadAsset | null;
  error: string | null;
  name: string;
  consent: boolean;
  savedNumber: number | null;
  saving: boolean;
  saveError: string | null;
  duplicateOf: string | null; // name clash waiting for "different person"
}

const today = () => new Date().toISOString().slice(0, 10);
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(n > 10 * 1024 * 1024 ? 0 : 1)} MB`;
let counter = 0;

export function BulkUploader() {
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [dateMet, setDateMet] = useState(today());
  const [location, setLocation] = useState("");
  const [eventName, setEventName] = useState("");
  const [consentAll, setConsentAll] = useState(false);
  const [slots, setSlots] = useState<SlotInfo | null>(null);
  const [saving, setSaving] = useState(false);

  const handles = useRef(new Map<string, UploadHandle>());
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  const refreshSlots = useCallback(() => {
    admin.getSlots().then(setSlots).catch(() => {});
  }, []);

  useEffect(() => {
    refreshSlots();
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) ?? "null");
      if (m) {
        setLocation(m.location ?? "");
        setEventName(m.eventName ?? "");
      }
    } catch {
      /* ignore */
    }
  }, [refreshSlots]);

  const patch = useCallback((id: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }, []);

  const discard = (asset: UploadAsset | null) => {
    if (asset) admin.discardUpload("video", asset.publicId).catch(() => {});
  };

  const startUpload = useCallback(
    (item: Item) => {
      if (handles.current.has(item.id)) return; // guards against a double start in dev strict mode
      const h = uploadDirect(item.file, "video", (progress) => patch(item.id, { progress }));
      handles.current.set(item.id, h);
      patch(item.id, { status: "uploading", progress: 0, error: null });
      h.promise
        .then((asset) => {
          if (handles.current.get(item.id) !== h) return discard(asset); // removed while uploading
          handles.current.delete(item.id);
          patch(item.id, { status: "done", asset, progress: 100 });
        })
        .catch((err) => {
          if (handles.current.get(item.id) !== h) return;
          handles.current.delete(item.id);
          if (err?.cancelled) return;
          patch(item.id, { status: "error", error: err?.message ?? "Upload failed." });
        });
    },
    [patch],
  );

  // Upload queue: keep up to MAX_PARALLEL running.
  useEffect(() => {
    let free = MAX_PARALLEL - items.filter((i) => i.status === "uploading").length;
    for (const it of items) {
      if (free <= 0) break;
      if (it.status === "queued") {
        startUpload(it);
        free--;
      }
    }
  }, [items, startUpload]);

  // Leaving the page: stop everything and remove uploads that were never saved.
  useEffect(
    () => () => {
      handles.current.forEach((h) => h.cancel());
      handles.current.clear();
      for (const i of itemsRef.current) {
        URL.revokeObjectURL(i.preview);
        if (i.savedNumber === null) discard(i.asset);
      }
    },
    [],
  );

  function addFiles(list: FileList | File[] | null) {
    if (!list?.length) return;
    const room = MAX_FILES - items.length;
    const rejected: string[] = [];
    const fresh: Item[] = [];
    for (const file of Array.from(list)) {
      if (fresh.length >= room) {
        rejected.push(`${file.name}: too many files at once (max ${MAX_FILES})`);
        continue;
      }
      const problem = checkFile(file, "video");
      if (problem) {
        rejected.push(`${file.name}: ${problem}`);
        continue;
      }
      fresh.push({
        id: `b${++counter}`,
        file,
        preview: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
        asset: null,
        error: null,
        name: "",
        consent: consentAll,
        savedNumber: null,
        saving: false,
        saveError: null,
        duplicateOf: null,
      });
    }
    if (rejected.length) toast.error(rejected.slice(0, 3).join(" · ") + (rejected.length > 3 ? ` (+${rejected.length - 3} more)` : ""));
    if (fresh.length) setItems((prev) => [...prev, ...fresh]);
  }

  // Videos picked in the single add form arrive here.
  useEffect(() => {
    const handed = takePendingFiles();
    if (handed.length) addFiles(handed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function remove(id: string) {
    const it = itemsRef.current.find((i) => i.id === id);
    if (!it) return;
    handles.current.get(id)?.cancel();
    handles.current.delete(id);
    URL.revokeObjectURL(it.preview);
    if (it.savedNumber === null) discard(it.asset);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function retry(id: string) {
    handles.current.delete(id);
    patch(id, { status: "queued", error: null, progress: 0 });
  }

  function setConsentForAll(v: boolean) {
    setConsentAll(v);
    setItems((prev) => prev.map((i) => (i.savedNumber === null ? { ...i, consent: v } : i)));
  }

  /** Save one row. Returns true when it was created. */
  async function saveOne(id: string, confirmNew: boolean): Promise<boolean> {
    const it = itemsRef.current.find((i) => i.id === id);
    if (!it || !it.asset || !it.name.trim() || it.savedNumber !== null) return false;
    patch(id, { saving: true, saveError: null, duplicateOf: null });
    try {
      const created = await admin.createParticipant({
        displayName: it.name.trim(),
        biography: "",
        quote: "",
        dateMet,
        eventName: eventName.trim(),
        location: location.trim(),
        consentConfirmed: it.consent,
        isPublished: it.consent,
        confirmNew,
        removePortrait: false,
        removeVideo: false,
        portraitAsset: null,
        videoAsset: it.asset,
      });
      patch(id, { saving: false, savedNumber: created.number });
      return true;
    } catch (err) {
      const dupes = getDuplicates(err);
      if (dupes) patch(id, { saving: false, duplicateOf: dupes.map((d) => `#${pad(d.number)}`).join(", ") });
      else patch(id, { saving: false, saveError: getErrorMessage(err) });
      return false;
    }
  }

  async function saveAll() {
    setSaving(true);
    // One at a time and in the order shown, so numbers follow the order of the list.
    let saved = 0;
    for (const it of itemsRef.current) {
      if (it.status === "done" && it.name.trim() && it.savedNumber === null && !it.duplicateOf) {
        if (await saveOne(it.id, false)) saved++;
      }
    }
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ location: location.trim(), eventName: eventName.trim() }));
    } catch {
      /* private mode */
    }
    setSaving(false);
    refreshSlots();
    if (saved) toast.success(`Saved ${saved} ${saved === 1 ? "person" : "people"}`);
    else toast.error("Nothing to save yet. Each video needs to finish uploading and have a name.");
  }

  const pending = items.filter((i) => i.savedNumber === null);
  const ready = pending.filter((i) => i.status === "done" && i.name.trim() && !i.duplicateOf);
  const uploadingCount = pending.filter((i) => i.status === "uploading" || i.status === "queued").length;
  const savedItems = items.filter((i) => i.savedNumber !== null);

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Bulk add</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Add many at once</h1>
      <p className="mt-3 text-sm text-stone">
        Pick several videos. They upload in the background, a few at a time. Give each one a name, then save them all.
        {slots && <> Numbers start at <strong className="text-ink">#{pad(slots.next)}</strong>{slots.vacant.length ? " (filling empty numbers first)" : ""} and follow the order of the list.</>}
      </p>

      <label className="mt-8 flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-ink/30 bg-white/40 px-6 py-10 text-center hover:bg-white/70">
        <Upload className="size-8 text-stone" aria-hidden />
        <span className="btn-solid pointer-events-none !px-6">Choose videos</span>
        <span className="text-sm text-stone">Select as many as you like (up to {MAX_FILES}). Each can be up to 100 MB.</span>
        <input type="file" accept="video/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} className="sr-only" />
      </label>

      <fieldset className="mt-6 grid gap-4 rounded-xl border border-ink/15 p-4 sm:grid-cols-3 sm:p-5">
        <legend className="eyebrow px-2">Applies to everyone in this batch</legend>
        <div>
          <span className="label">Date met</span>
          <input type="date" value={dateMet} onChange={(e) => setDateMet(e.target.value)} className="field" />
        </div>
        <div>
          <span className="label">Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} className="field" />
        </div>
        <div>
          <span className="label">Event</span>
          <input value={eventName} onChange={(e) => setEventName(e.target.value)} maxLength={120} className="field" />
        </div>
        <label className="flex items-start gap-3 sm:col-span-3">
          <input type="checkbox" checked={consentAll} onChange={(e) => setConsentForAll(e.target.checked)} className="mt-1 size-5" />
          <span className="text-sm leading-relaxed">
            <strong>Everyone here gave consent and can be published.</strong> You can still untick a single person below. People without
            consent are saved as private drafts.
          </span>
        </label>
      </fieldset>

      {items.length > 0 && (
        <ul className="mt-8 space-y-4">
          {pending.map((it, idx) => (
            <li key={it.id} className="rounded-xl border border-ink/15 bg-white/50 p-4">
              <div className="flex gap-4">
                <VideoPreview src={it.preview} className="w-20 sm:w-28" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      <span className="text-stone">{idx + 1}.</span> {it.file.name}{" "}
                      <span className="font-normal text-stone">· {mb(it.file.size)}</span>
                      {formatRecorded(it.file) && <span className="block text-xs font-normal text-stone">Recorded {formatRecorded(it.file)}</span>}
                    </p>
                    <button type="button" onClick={() => remove(it.id)} aria-label={`Remove ${it.file.name}`} className="-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-stone hover:bg-sand hover:text-ink">
                      <X className="size-4" />
                    </button>
                  </div>

                  {it.status === "queued" && <p className="mt-2 text-sm text-stone">Waiting to upload…</p>}
                  {it.status === "uploading" && (
                    <div className="mt-2" role="status" aria-live="polite">
                      <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-ember transition-[width]" style={{ width: `${it.progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-stone">Uploading… {it.progress}%</p>
                    </div>
                  )}
                  {it.status === "done" && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-green-800"><Check className="size-4" /> Uploaded</p>
                  )}
                  {it.status === "error" && (
                    <div role="alert" className="mt-2">
                      <p className="text-sm text-red-700">{it.error}</p>
                      <button type="button" onClick={() => retry(it.id)} className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4">
                        <RefreshCw className="size-3.5" /> Try again
                      </button>
                    </div>
                  )}

                  <input
                    value={it.name}
                    onChange={(e) => patch(it.id, { name: e.target.value, duplicateOf: null })}
                    maxLength={80}
                    autoComplete="off"
                    placeholder="Display name *"
                    aria-label={`Display name for ${it.file.name}`}
                    className="field mt-3"
                  />
                  <label className="mt-3 flex items-center gap-3">
                    <input type="checkbox" checked={it.consent} onChange={(e) => patch(it.id, { consent: e.target.checked })} className="size-5" />
                    <span className="text-sm">Consent given (publish)</span>
                  </label>

                  {it.duplicateOf && (
                    <div role="alert" className="mt-3 rounded-lg bg-sand/70 p-3 text-sm">
                      Someone named <strong>{it.name.trim()}</strong> is already in the project ({it.duplicateOf}).
                      <div className="mt-2 flex flex-wrap gap-3">
                        <button type="button" disabled={it.saving} onClick={() => saveOne(it.id, true)} className="font-medium underline underline-offset-4">
                          A different person, save
                        </button>
                        <button type="button" onClick={() => patch(it.id, { duplicateOf: null, name: "" })} className="text-stone underline underline-offset-4">
                          Change the name
                        </button>
                      </div>
                    </div>
                  )}
                  {it.saveError && <p role="alert" className="mt-3 text-sm text-red-700">{it.saveError}</p>}
                  {it.saving && <p className="mt-3 text-sm text-stone">Saving…</p>}
                </div>
              </div>
            </li>
          ))}

          {savedItems.length > 0 && (
            <li className="rounded-xl bg-green-50 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-green-900"><Check className="size-4" /> Saved this session</p>
              <ul className="mt-2 space-y-1 text-sm text-green-900">
                {savedItems.map((s) => (
                  <li key={s.id}>#{pad(s.savedNumber!)} {s.name.trim()}{s.consent ? " · published" : " · draft"}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  savedItems.forEach((s) => URL.revokeObjectURL(s.preview));
                  setItems((prev) => prev.filter((i) => i.savedNumber === null));
                }}
                className="mt-3 text-sm underline underline-offset-4"
              >
                Clear this list
              </button>
            </li>
          )}
        </ul>
      )}

      <div className="sticky bottom-0 z-10 -mx-5 mt-8 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={saveAll} disabled={saving || ready.length === 0} className="btn-solid">
            {saving ? "Saving…" : ready.length ? `Save ${ready.length} ${ready.length === 1 ? "person" : "people"}` : "Save"}
          </button>
          <Link href="/sharp/participants" className="btn-outline">Done</Link>
          {pending.length > 0 && (
            <p className="text-sm text-stone sm:ml-2">
              {uploadingCount > 0 ? `${uploadingCount} still uploading. Keep this page open. ` : ""}
              {pending.length - ready.length - uploadingCount > 0 ? "Some still need a name." : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
