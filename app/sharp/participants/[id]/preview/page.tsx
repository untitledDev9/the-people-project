"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Portrait } from "@/components/Portrait";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { VideoSources } from "@/components/VideoSources";
import { Skeleton } from "@/components/ui/States";
import { getErrorMessage } from "@/lib/api";
import { formatDate, pad } from "@/lib/format";
import * as admin from "@/services/admin";
import type { AdminParticipant } from "@/types";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<AdminParticipant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin.getParticipant(id).then(setP).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <p role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">{error}</p>;
  if (!p) return <Skeleton className="h-96 max-w-4xl" />;

  const live = p.isPublished && p.consentConfirmed;
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand px-5 py-4 text-sm">
        <span className="flex items-center gap-3">
          <StatusBadge published={p.isPublished} />
          {live ? "This is exactly what visitors see." : "Preview only. Visitors cannot see this profile until it is published with consent."}
        </span>
        <span className="flex gap-4">
          <Link href={`/sharp/participants/${p.id}`} className="underline underline-offset-4">Back to editing</Link>
          {live && <Link href={`/people/${pad(p.number)}`} target="_blank" className="underline underline-offset-4">Open public page ↗</Link>}
        </span>
      </div>

      <article className="grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-14">
        <Portrait url={p.portraitUrl} videoUrl={p.videoUrl} number={p.number} alt={`Portrait of ${p.displayName}`} width={900} />
        <div>
          <p className="display text-[7rem] leading-none text-beige tabular-nums" aria-hidden>{pad(p.number)}</p>
          <p className="eyebrow -mt-2">Person #{pad(p.number)} of 5,000</p>
          <h1 className="display mt-3 text-5xl leading-tight sm:text-6xl">{p.displayName}</h1>
          <p className="mt-6 border-y border-ink/15 py-4 text-sm">
            {formatDate(p.dateMet)}
            {[p.location, p.eventName].filter(Boolean).length ? ` · ${[p.location, p.eventName].filter(Boolean).join(" · ")}` : ""}
          </p>
          {p.quote && <blockquote className="display mt-8 border-l-2 border-ink pl-5 text-2xl italic">“{p.quote}”</blockquote>}
          {p.biography && <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/80">{p.biography}</p>}
          {p.videoUrl && (
            <video controls playsInline preload="metadata" className="mt-8 w-full bg-ink">
              <VideoSources url={p.videoUrl} />
            </video>
          )}
        </div>
      </article>
    </div>
  );
}
