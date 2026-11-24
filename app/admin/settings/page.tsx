"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api";
import { optimize } from "@/lib/media";
import * as admin from "@/services/admin";
import type { AdminSettings } from "@/types";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [s, setS] = useState<AdminSettings | null>(null);
  const [featured, setFeatured] = useState("");
  const [hero, setHero] = useState<File | null>(null);
  const [removeHero, setRemoveHero] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    admin
      .getSettings()
      .then((d) => {
        setS(d);
        setFeatured(d.featuredNumbers.join(", "));
      })
      .catch((e) => setLoadError(getErrorMessage(e)));
  }, []);

  if (loadError) return <p role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">{loadError}</p>;
  if (!s) return <div aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="mt-8 h-96 max-w-3xl" /></div>;

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setS({ ...s, [k]: v });
  const setSocial = (k: "tiktok" | "instagram" | "youtube", v: string) => setS({ ...s, socialLinks: { ...s.socialLinks, [k]: v } });

  function validate() {
    const e: Record<string, string> = {};
    if (!s!.projectName.trim()) e.projectName = "Required";
    if (!s!.tagline.trim()) e.tagline = "Required";
    if (!s!.description.trim()) e.description = "Required";
    if (!s!.aboutText.trim()) e.aboutText = "Required";
    if (s!.contactEmail && !/^\S+@\S+\.\S+$/.test(s!.contactEmail)) e.contactEmail = "Enter a valid email";
    for (const k of ["tiktok", "instagram", "youtube"] as const) {
      const v = s!.socialLinks[k];
      if (v && !/^https?:\/\//i.test(v)) e[k] = "Must start with http:// or https://";
    }
    if (featured.trim() && !/^\s*\d+(\s*,\s*\d+)*\s*$/.test(featured)) e.featured = "Use numbers separated by commas, e.g. 1, 5, 12";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return toast.error("Please fix the highlighted fields.");
    const f = new FormData();
    f.set("projectName", s!.projectName.trim());
    f.set("brandName", s!.brandName.trim() || "No Introduction Needed");
    f.set("tagline", s!.tagline.trim());
    f.set("description", s!.description.trim());
    f.set("aboutText", s!.aboutText.trim());
    f.set("contactEmail", s!.contactEmail.trim());
    f.set("tiktok", s!.socialLinks.tiktok.trim());
    f.set("instagram", s!.socialLinks.instagram.trim());
    f.set("youtube", s!.socialLinks.youtube.trim());
    f.set("featuredParticipants", featured.trim());
    f.set("removeHeroImage", String(removeHero));
    if (hero) f.set("heroImage", hero);
    setBusy(true);
    try {
      const saved = await admin.updateSettings(f);
      setS(saved);
      setHero(null);
      setRemoveHero(false);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl">
      <p className="eyebrow">Settings</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Site content</h1>

      <div className="mt-10 space-y-6">
        <Row label="Project name" error={errors.projectName}><input className="field" value={s.projectName} onChange={(e) => set("projectName", e.target.value)} maxLength={120} /></Row>
        <Row label="Brand name"><input className="field" value={s.brandName} onChange={(e) => set("brandName", e.target.value)} maxLength={120} /></Row>
        <Row label="Homepage tagline" error={errors.tagline}><input className="field" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={200} /></Row>
        <Row label="Homepage description" error={errors.description}><textarea className="field" rows={4} value={s.description} onChange={(e) => set("description", e.target.value)} maxLength={3000} /></Row>
        <Row label="About page text" error={errors.aboutText} hint="Leave a blank line between paragraphs."><textarea className="field" rows={10} value={s.aboutText} onChange={(e) => set("aboutText", e.target.value)} maxLength={10000} /></Row>
        <Row label="Contact email" error={errors.contactEmail}><input type="email" className="field" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Row>

        <fieldset className="space-y-6 rounded-xl border border-ink/15 p-5">
          <legend className="eyebrow px-2">Social links</legend>
          {(["tiktok", "instagram", "youtube"] as const).map((k) => (
            <Row key={k} label={k === "tiktok" ? "TikTok" : k === "youtube" ? "YouTube" : "Instagram"} error={errors[k]}>
              <input className="field" type="url" placeholder="https://" value={s.socialLinks[k]} onChange={(e) => setSocial(k, e.target.value)} />
            </Row>
          ))}
        </fieldset>

        <Row label="Featured participants" error={errors.featured} hint="Participant numbers separated by commas. Only published people are shown.">
          <input className="field" value={featured} placeholder="1, 5, 12" onChange={(e) => setFeatured(e.target.value)} />
        </Row>

        <Row label="Hero image" hint="Used as the backdrop of the homepage hero.">
          {s.heroImageUrl && !removeHero && !hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={optimize(s.heroImageUrl, 600)!} alt="Current hero" className="mb-3 h-32 rounded-md object-cover" />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="field !p-2 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > 10 * 1024 * 1024) { toast.error("Images must be 10 MB or smaller"); e.target.value = ""; return; }
              setHero(f); if (f) setRemoveHero(false);
            }} />
          {s.heroImageUrl && !hero && (
            <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={removeHero} onChange={(e) => setRemoveHero(e.target.checked)} /> Remove hero image</label>
          )}
        </Row>
      </div>

      <button type="submit" disabled={busy} className="btn-solid mt-10">{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}

function Row({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-stone">{hint}</p>}
      {error && <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
