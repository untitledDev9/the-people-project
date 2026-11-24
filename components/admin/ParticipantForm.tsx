"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { getDuplicates, getErrorMessage } from "@/lib/api";
import { pad, toDateInput } from "@/lib/format";
import { optimize } from "@/lib/media";
import * as admin from "@/services/admin";
import type { AdminParticipant, DuplicateMatch } from "@/types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

type Errors = Partial<Record<"displayName" | "dateMet" | "portrait" | "video" | "publish" | "quote" | "biography", string>>;

export function ParticipantForm({ initial }: { initial?: AdminParticipant }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(initial);

  const [person, setPerson] = useState<AdminParticipant | undefined>(initial);
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [biography, setBiography] = useState(initial?.biography ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [dateMet, setDateMet] = useState(initial ? toDateInput(initial.dateMet) : new Date().toISOString().slice(0, 10));
  const [eventName, setEventName] = useState(initial?.eventName ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [consent, setConsent] = useState(initial?.consentConfirmed ?? false);
  const [published, setPublished] = useState(initial?.isPublished ?? false);
  const [portrait, setPortrait] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [removePortrait, setRemovePortrait] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [dupes, setDupes] = useState<DuplicateMatch[] | null>(null);
  const [returningBusy, setReturningBusy] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!portrait) return setPortraitPreview(null);
    const url = URL.createObjectURL(portrait);
    setPortraitPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [portrait]);

  function pickFile(kind: "portrait" | "video", file: File | null) {
    const setter = kind === "portrait" ? setPortrait : setVideo;
    if (!file) return setter(null);
    const types = kind === "portrait" ? IMAGE_TYPES : VIDEO_TYPES;
    const max = kind === "portrait" ? MAX_IMAGE : MAX_VIDEO;
    if (!types.includes(file.type)) {
      setErrors((e) => ({ ...e, [kind]: kind === "portrait" ? "Use a JPEG, PNG or WebP image." : "Use an MP4, WebM or MOV video." }));
      return setter(null);
    }
    if (file.size > max) {
      setErrors((e) => ({ ...e, [kind]: `File is too large (max ${max / 1024 / 1024} MB).` }));
      return setter(null);
    }
    setErrors((e) => ({ ...e, [kind]: undefined }));
    setter(file);
    if (kind === "portrait") setRemovePortrait(false);
    else setRemoveVideo(false);
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!displayName.trim()) e.displayName = "Display name is required.";
    if (!dateMet) e.dateMet = "Date met is required.";
    if (quote.length > 300) e.quote = "Keep the quote under 300 characters.";
    if (biography.length > 2000) e.biography = "Keep the introduction under 2,000 characters.";
    if (published && !consent) e.publish = "Confirm consent before publishing.";
    setErrors((prev) => ({ portrait: prev.portrait, video: prev.video, ...e }));
    return Object.keys(e).length === 0;
  }

  function buildForm(confirmNew: boolean) {
    const f = new FormData();
    f.set("displayName", displayName.trim());
    f.set("biography", biography.trim());
    f.set("quote", quote.trim());
    f.set("dateMet", dateMet);
    f.set("eventName", eventName.trim());
    f.set("location", location.trim());
    f.set("consentConfirmed", String(consent));
    f.set("isPublished", String(consent && published));
    f.set("confirmNew", String(confirmNew));
    f.set("removePortrait", String(removePortrait));
    f.set("removeVideo", String(removeVideo));
    if (portrait) f.set("portrait", portrait);
    if (video) f.set("video", video);
    return f;
  }

  async function save(confirmNew: boolean) {
    setBusy(true);
    try {
      if (person) {
        const updated = await admin.updateParticipant(person.id, buildForm(confirmNew));
        setPerson(updated);
        setPublished(updated.isPublished);
        setPortrait(null);
        setVideo(null);
        setRemovePortrait(false);
        setRemoveVideo(false);
        toast.success("Changes saved");
      } else {
        const created = await admin.createParticipant(buildForm(confirmNew));
        toast.success(`Saved as #${pad(created.number)}${created.isPublished ? " and published" : ""}`);
        router.push("/admin/participants");
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (validate()) save(false);
    else toast.error("Please fix the highlighted fields.");
  }

  async function markReturning(id: string) {
    setReturningBusy(true);
    try {
      const p = await admin.logReturning(id);
      toast.success(`Logged as meeting #${pad(p.number)} again. No new number used.`);
      router.push("/admin/participants");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setReturningBusy(false);
    }
  }

  const currentPortrait = !removePortrait && !portrait ? optimize(person?.portraitUrl, 400) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{editing ? "Edit participant" : "New participant"}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">
            {person ? `#${pad(person.number)} ${person.displayName}` : "Add a person"}
          </h1>
        </div>
        {person && (
          <Link href={`/admin/participants/${person.id}/preview`} className="btn-outline">Preview profile</Link>
        )}
      </div>
      {!editing && (
        <p className="mt-3 text-sm text-stone">The participant number is assigned automatically when you save.</p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Field label="Display name *" error={errors.displayName} className="sm:col-span-2">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className="field" placeholder="First name or approved display name" aria-invalid={Boolean(errors.displayName)} />
        </Field>
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

        <Field label="Portrait" error={errors.portrait}>
          {(portraitPreview || currentPortrait) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portraitPreview ?? currentPortrait!} alt="Portrait preview" className="mb-3 aspect-[4/5] w-40 rounded-md object-cover" />
          )}
          <input type="file" accept={IMAGE_TYPES.join(",")} onChange={(e) => pickFile("portrait", e.target.files?.[0] ?? null)} className="field !p-2 text-sm" />
          {person?.portraitUrl && !portrait && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={removePortrait} onChange={(e) => setRemovePortrait(e.target.checked)} /> Remove current portrait
            </label>
          )}
        </Field>
        <Field label="Video (optional)" error={errors.video}>
          {person?.videoUrl && !video && !removeVideo && (
            <video src={person.videoUrl} controls preload="metadata" className="mb-3 aspect-video w-full rounded-md bg-ink" />
          )}
          <input type="file" accept={VIDEO_TYPES.join(",")} onChange={(e) => pickFile("video", e.target.files?.[0] ?? null)} className="field !p-2 text-sm" />
          {person?.videoUrl && !video && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={removeVideo} onChange={(e) => setRemoveVideo(e.target.checked)} /> Remove current video
            </label>
          )}
        </Field>
      </div>

      <fieldset className="mt-10 space-y-4 rounded-xl border border-ink/15 p-5">
        <legend className="eyebrow px-2">Consent and publication</legend>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (!e.target.checked) setPublished(false);
            }}
            className="mt-1 size-4"
          />
          <span className="text-sm leading-relaxed">
            <strong>Consent confirmed.</strong> This person agreed to have their name, photo/video and the details above shared publicly.
          </span>
        </label>
        <label className={`flex items-start gap-3 ${consent ? "" : "opacity-50"}`}>
          <input type="checkbox" checked={published} disabled={!consent} onChange={(e) => setPublished(e.target.checked)} className="mt-1 size-4" />
          <span className="text-sm leading-relaxed">
            <strong>Publish on the website.</strong> Leave unticked to keep them as a private draft.
          </span>
        </label>
        {errors.publish && <p role="alert" className="text-sm text-red-700">{errors.publish}</p>}
      </fieldset>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={busy} className="btn-solid">
          {busy ? "Saving…" : editing ? "Save changes" : "Save participant"}
        </button>
        <Link href="/admin/participants" className="btn-outline">Cancel</Link>
      </div>

      <ConfirmDialog
        open={Boolean(dupes)}
        title="Is this someone new?"
        confirmLabel="Yes, a different person"
        busy={busy || returningBusy}
        onConfirm={() => save(true)}
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
