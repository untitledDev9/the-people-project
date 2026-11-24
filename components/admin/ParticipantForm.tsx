"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { MediaField, useMediaUpload } from "@/components/admin/MediaField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { getDuplicates, getErrorMessage } from "@/lib/api";
import { pad, toDateInput } from "@/lib/format";
import { optimize } from "@/lib/media";
import * as admin from "@/services/admin";
import type { AdminParticipant, DuplicateMatch, ParticipantPayload, SlotInfo } from "@/types";

type Errors = Partial<Record<"displayName" | "dateMet" | "publish" | "quote" | "biography", string>>;
type Then = "next" | "list";

// Remembered between people so a day of introductions does not mean retyping the same place/event.
const META_KEY = "pp:last-meta";
const today = () => new Date().toISOString().slice(0, 10);

export function ParticipantForm({ initial }: { initial?: AdminParticipant }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(initial);
  const topRef = useRef<HTMLDivElement>(null);
  const thenRef = useRef<Then>("next");

  const [person, setPerson] = useState<AdminParticipant | undefined>(initial);
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [biography, setBiography] = useState(initial?.biography ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [dateMet, setDateMet] = useState(initial ? toDateInput(initial.dateMet) : today());
  const [eventName, setEventName] = useState(initial?.eventName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [consent, setConsent] = useState(initial?.consentConfirmed ?? false);
  const [published, setPublished] = useState(initial?.isPublished ?? false);
  const [removePortrait, setRemovePortrait] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [dupes, setDupes] = useState<DuplicateMatch[] | null>(null);
  const [returningBusy, setReturningBusy] = useState(false);
  const [slots, setSlots] = useState<SlotInfo | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const video = useMediaUpload("video");
  const photo = useMediaUpload("image");
  const uploading = video.uploading || photo.uploading;

  const refreshSlots = useCallback(() => {
    admin.getSlots().then(setSlots).catch(() => {});
  }, []);

  useEffect(() => {
    if (editing) return;
    refreshSlots();
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) ?? "null");
      if (m) {
        setLocation(m.location ?? "");
        setEventName(m.eventName ?? "");
      }
    } catch {
      /* ignore a corrupt value */
    }
  }, [editing, refreshSlots]);

  function validate(): boolean {
    const e: Errors = {};
    if (!displayName.trim()) e.displayName = "Display name is required.";
    if (!dateMet) e.dateMet = "Date met is required.";
    if (quote.length > 300) e.quote = "Keep the quote under 300 characters.";
    if (biography.length > 2000) e.biography = "Keep the introduction under 2,000 characters.";
    if (published && !consent) e.publish = "Confirm consent before publishing.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function payload(confirmNew: boolean): ParticipantPayload {
    return {
      displayName: displayName.trim(),
      biography: biography.trim(),
      quote: quote.trim(),
      dateMet,
      eventName: eventName.trim(),
      location: location.trim(),
      consentConfirmed: consent,
      isPublished: consent && published,
      confirmNew,
      removePortrait,
      removeVideo,
      portraitAsset: photo.asset,
      videoAsset: video.asset,
    };
  }

  function resetForNext() {
    setDisplayName("");
    setBiography("");
    setQuote("");
    setConsent(false);
    setPublished(false);
    setErrors({});
    setDateMet(today());
    refreshSlots();
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save(confirmNew: boolean, then: Then) {
    setBusy(true);
    try {
      if (person) {
        const updated = await admin.updateParticipant(person.id, payload(confirmNew));
        setPerson(updated);
        setPublished(updated.isPublished);
        setRemovePortrait(false);
        setRemoveVideo(false);
        video.markSaved();
        photo.markSaved();
        toast.success("Changes saved");
      } else {
        const created = await admin.createParticipant(payload(confirmNew));
        video.markSaved();
        photo.markSaved();
        try {
          localStorage.setItem(META_KEY, JSON.stringify({ location: location.trim(), eventName: eventName.trim() }));
        } catch {
          /* private mode */
        }
        toast.success(`Saved as #${pad(created.number)}${created.isPublished ? " and published" : ""}`);
        setSavedCount((n) => n + 1);
        if (then === "list") router.push("/sharp/participants");
        else resetForNext();
      }
      setDupes(null);
    } catch (err) {
      const found = getDuplicates(err);
      if (found) setDupes(found);
      else toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function submit(then: Then) {
    if (uploading) return toast.error("Hold on, the upload is still running.");
    if (!validate()) return toast.error("Please fix the highlighted fields.");
    thenRef.current = then;
    save(false, then);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(editing ? "list" : "next");
  }

  async function markReturning(id: string) {
    setReturningBusy(true);
    try {
      const p = await admin.logReturning(id);
      toast.success(`Logged as meeting #${pad(p.number)} again. No new number used.`);
      setDupes(null);
      video.clear();
      photo.clear();
      if (thenRef.current === "list") router.push("/sharp/participants");
      else resetForNext();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReturningBusy(false);
    }
  }

  async function confirmDelete() {
    if (!person) return;
    setBusy(true);
    try {
      await admin.deleteParticipant(person.id);
      toast.success(`#${pad(person.number)} deleted. The number is empty and will be filled by the next person you add.`);
      router.push("/sharp/participants");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  const primaryLabel = busy
    ? "Saving…"
    : uploading
      ? `Uploading ${video.uploading ? video.progress : photo.progress}%…`
      : editing
        ? "Save changes"
        : "Save & add next";

  const fillsGap = slots ? slots.vacant.length > 0 : false;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl">
      <div ref={topRef} className="scroll-mt-4" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{editing ? "Edit participant" : "New participant"}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">
            {person ? `#${pad(person.number)} ${person.displayName}` : slots ? `Add #${pad(slots.next)}` : "Add a person"}
          </h1>
        </div>
        {person && <Link href={`/sharp/participants/${person.id}/preview`} className="btn-outline">Preview profile</Link>}
        {!editing && <Link href="/sharp/participants/bulk" className="btn-outline">Add many at once</Link>}
      </div>

      {!editing && (
        <p className="mt-3 text-sm text-stone">
          {fillsGap && slots
            ? `This person fills the empty number #${pad(slots.next)}. `
            : "The number is assigned automatically. "}
          {slots && slots.vacant.length > 1 && <>Other empty numbers: {slots.vacant.slice(1, 8).map((n) => `#${pad(n)}`).join(", ")}{slots.vacant.length > 8 ? "…" : ""}. </>}
          {savedCount > 0 && <strong className="text-ink">{savedCount} saved this session.</strong>}
        </p>
      )}
      {editing && <p className="mt-3 text-sm text-stone">The number stays with this person and cannot be changed.</p>}

      <div className="mt-8 space-y-6">
        <MediaField
          upload={video}
          label="Video"
          existingUrl={person?.videoUrl}
          removeExisting={removeVideo}
          onRemoveExisting={setRemoveVideo}
          hint="Uploads as soon as you pick it"
        />

        <Field label="Display name *" error={errors.displayName}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="done"
            className="field"
            placeholder="First name or approved display name"
            aria-invalid={Boolean(errors.displayName)}
          />
        </Field>

        <fieldset className="space-y-4 rounded-xl border border-ink/15 p-4 sm:p-5">
          <legend className="eyebrow px-2">Consent and publication</legend>
          <label className="flex items-start gap-3 py-1">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                // Quick path: consent given means publish, unless you untick it again.
                if (!editing) setPublished(e.target.checked);
                else if (!e.target.checked) setPublished(false);
              }}
              className="mt-1 size-5"
            />
            <span className="text-sm leading-relaxed">
              <strong>Consent confirmed.</strong> This person agreed to have their name, photo/video and the details here shared publicly.
            </span>
          </label>
          <label className={`flex items-start gap-3 py-1 ${consent ? "" : "opacity-50"}`}>
            <input type="checkbox" checked={published} disabled={!consent} onChange={(e) => setPublished(e.target.checked)} className="mt-1 size-5" />
            <span className="text-sm leading-relaxed">
              <strong>Publish on the website.</strong> Leave unticked to keep them as a private draft.
            </span>
          </label>
          {errors.publish && <p role="alert" className="text-sm text-red-700">{errors.publish}</p>}
        </fieldset>

        <details open={editing} className="group rounded-xl border border-ink/15 p-4 sm:p-5">
          <summary className="cursor-pointer select-none text-sm font-medium">
            More details <span className="font-normal text-stone">(date, place, event, introduction, quote, photo)</span>
          </summary>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Field label="Date met *" error={errors.dateMet}>
              <input type="date" value={dateMet} onChange={(e) => setDateMet(e.target.value)} className="field" aria-invalid={Boolean(errors.dateMet)} />
            </Field>
            <Field label="Location">
              <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} className="field" />
            </Field>
            <Field label="Event" className="sm:col-span-2">
              <input value={eventName} onChange={(e) => setEventName(e.target.value)} maxLength={120} className="field" />
            </Field>
            <Field label="Short introduction" error={errors.biography} hint={`${biography.length}/2000`} className="sm:col-span-2">
              <textarea value={biography} onChange={(e) => setBiography(e.target.value)} rows={5} className="field" />
            </Field>
            <Field label="Quote (optional)" error={errors.quote} hint={`${quote.length}/300`} className="sm:col-span-2">
              <input value={quote} onChange={(e) => setQuote(e.target.value)} className="field" />
            </Field>
            <div className="sm:col-span-2">
              <MediaField
                upload={photo}
                label="Portrait photo (optional)"
                existingUrl={removePortrait ? null : optimize(person?.portraitUrl, 400)}
                removeExisting={removePortrait}
                onRemoveExisting={setRemovePortrait}
              />
            </div>
          </div>
        </details>
      </div>

      {/* Sticky on phones so the save buttons are always under your thumb. */}
      <div className="sticky bottom-0 z-10 -mx-5 mt-8 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={busy || uploading} className="btn-solid">{primaryLabel}</button>
          {!editing && (
            <button type="button" disabled={busy || uploading} onClick={() => submit("list")} className="btn-outline">
              Save &amp; finish
            </button>
          )}
          <Link href="/sharp/participants" className="btn-outline">{editing ? "Cancel" : "Done"}</Link>
          {editing && person && (
            <button type="button" onClick={() => setDeleteOpen(true)} className="btn-outline !border-red-700/40 text-red-700 hover:!border-red-700 hover:!bg-red-700 hover:!text-white sm:ml-auto">
              <Trash2 className="size-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(dupes)}
        title="Is this someone new?"
        confirmLabel="Yes, a different person"
        busy={busy || returningBusy}
        onConfirm={() => save(true, thenRef.current)}
        onCancel={() => setDupes(null)}
      >
        <p>Someone named <strong>{displayName.trim()}</strong> is already in the project. The project counts unique people, not encounters.</p>
        <ul className="mt-4 space-y-2">
          {dupes?.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-sand/60 px-3 py-2 text-ink">
              <span>#{pad(d.number)} {d.displayName}</span>
              <button type="button" disabled={returningBusy} onClick={() => markReturning(d.id)} className="text-xs font-medium underline underline-offset-4">
                It&apos;s them, log as returning
              </button>
            </li>
          ))}
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this participant?"
        confirmLabel="Delete permanently"
        destructive
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      >
        {person && (
          <>
            <strong>#{pad(person.number)} {person.displayName}</strong> and their uploaded photo and video will be permanently
            removed. Nobody else is renumbered: <strong>#{pad(person.number)}</strong> becomes an empty number, and the next
            person you add takes it. To just hide them from the site, unpublish instead.
          </>
        )}
      </ConfirmDialog>
    </form>
  );
}

function Field({ label, error, hint, className = "", children }: { label: string; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        {hint && <span className="text-xs text-stone">{hint}</span>}
      </div>
      {children}
      {error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
