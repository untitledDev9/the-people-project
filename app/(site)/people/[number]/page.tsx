import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AxiosError } from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Portrait } from "@/components/Portrait";
import { ErrorState } from "@/components/ui/States";
import { formatDate, pad } from "@/lib/format";
import { optimize, videoPoster } from "@/lib/media";
import { SITE_URL } from "@/lib/site";
import { getParticipant } from "@/services/public";
import type { ParticipantDetail } from "@/types";

type Props = { params: Promise<{ number: string }> };

async function load(raw: string): Promise<{ person: ParticipantDetail | null; failed: boolean }> {
  const n = Number(raw);
  if (!/^\d{1,6}$/.test(raw) || n < 1) return { person: null, failed: false };
  try {
    return { person: await getParticipant(n), failed: false };
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) return { person: null, failed: false };
    console.error("Failed to load participant", err);
    return { person: null, failed: true };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number } = await params;
  const { person } = await load(number);
  if (!person) return { title: "Person not found", robots: { index: false } };

  const title = `#${pad(person.number)} ${person.displayName}`;
  const description =
    person.quote ||
    person.biography.slice(0, 160) ||
    `Person #${pad(person.number)} of 5,000 in The 5,000 People Project.`;
  const image = optimize(person.portraitUrl, 1200);
  const url = `${SITE_URL}/people/${pad(person.number)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", url, title, description, images: image ? [{ url: image, alt: person.displayName }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function PersonPage({ params }: Props) {
  const { number } = await params;
  const { person, failed } = await load(number);
  if (failed) return <div className="container-x"><ErrorState message="This profile could not be loaded." /></div>;
  if (!person) notFound();

  const where = [person.location, person.eventName].filter(Boolean);

  return (
    <article className="container-x py-10 sm:py-16">
      <Link href="/people" className="inline-flex items-center gap-2 text-sm text-stone hover:text-ink">
        <ArrowLeft className="size-4" /> All people
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Portrait url={person.portraitUrl} number={person.number} alt={`Portrait of ${person.displayName}`} width={1200} priority />
        </div>

        <div className="flex flex-col lg:col-span-6 lg:pt-6">
          <p className="display text-[7rem] leading-none text-beige tabular-nums sm:text-[10rem]" aria-hidden>
            {pad(person.number)}
          </p>
          <p className="eyebrow -mt-2">Person #{pad(person.number)} of 5,000</p>
          <h1 className="display mt-3 text-5xl leading-tight sm:text-7xl">{person.displayName}</h1>

          <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-ink/15 py-6 text-sm">
            <div>
              <dt className="text-stone">Met on</dt>
              <dd className="mt-1 font-medium">{formatDate(person.dateMet)}</dd>
            </div>
            {where.length > 0 && (
              <div>
                <dt className="text-stone">{person.location && person.eventName ? "Where" : person.location ? "Location" : "Event"}</dt>
                <dd className="mt-1 font-medium">{where.join(" · ")}</dd>
              </div>
            )}
          </dl>

          {person.quote && (
            <blockquote className="display mt-10 border-l-2 border-ink pl-5 text-2xl italic leading-snug sm:text-3xl">
              “{person.quote}”
            </blockquote>
          )}
          {person.biography && (
            <div className="mt-8 space-y-4 text-lg leading-relaxed text-ink/80">
              {person.biography.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {person.videoUrl && (
        <section className="mx-auto mt-16 max-w-3xl" aria-label={`Video with ${person.displayName}`}>
          <video
            controls
            playsInline
            preload="metadata"
            poster={videoPoster(person.videoUrl, 1200) ?? undefined}
            className="w-full bg-ink"
          >
            <source src={person.videoUrl} />
          </video>
        </section>
      )}

      <nav aria-label="Previous and next person" className="mt-20 grid grid-cols-2 gap-4 border-t border-ink/15 pt-8">
        {person.prev ? (
          <Link href={`/people/${pad(person.prev.number)}`} className="group">
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone">
              <ArrowLeft className="size-3.5" /> Previous
            </span>
            <span className="display mt-2 block text-2xl group-hover:underline sm:text-3xl">
              #{pad(person.prev.number)} {person.prev.displayName}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {person.next ? (
          <Link href={`/people/${pad(person.next.number)}`} className="group text-right">
            <span className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.22em] text-stone">
              Next <ArrowRight className="size-3.5" />
            </span>
            <span className="display mt-2 block text-2xl group-hover:underline sm:text-3xl">
              #{pad(person.next.number)} {person.next.displayName}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
