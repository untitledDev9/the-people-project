import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PersonCard } from "@/components/PersonCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { formatDate, formatNumber, pad } from "@/lib/format";
import { VideoSources } from "@/components/VideoSources";
import { optimize, videoPoster } from "@/lib/media";
import { safe } from "@/lib/safe";
import { getLatest, getSettings, getStats } from "@/services/public";

export default async function HomePage() {
  const [settings, stats, latest] = await Promise.all([safe(getSettings()), safe(getStats()), safe(getLatest(8))]);

  if (!settings || !stats) {
    return (
      <div className="container-x">
        <ErrorState message="The project data could not be loaded." />
      </div>
    );
  }

  const heroImg = optimize(settings.heroImageUrl, 1400);
  const videos = (latest ?? []).filter((p) => p.videoUrl).slice(0, 3);
  const socials = [
    { label: "TikTok", href: settings.socialLinks.tiktok },
    { label: "Instagram", href: settings.socialLinks.instagram },
    { label: "YouTube", href: settings.socialLinks.youtube },
  ].filter((s) => s.href);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-paper">
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImg}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" aria-hidden />
        <div className="container-x relative flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-10 pt-24 sm:pb-16">
          <p className="eyebrow animate-rise text-paper/60">{settings.brandName}</p>
          <h1 className="display mt-5 animate-rise text-[2.6rem] leading-[0.98] [animation-delay:80ms] sm:text-7xl lg:text-8xl">
            {settings.projectName.toUpperCase()}
          </h1>
          <p className="display mt-5 max-w-2xl animate-rise text-xl italic text-paper/85 [animation-delay:160ms] sm:text-3xl">
            “{settings.tagline}”
          </p>
          <p className="mt-6 max-w-xl animate-rise text-base leading-relaxed text-paper/70 [animation-delay:240ms]">
            {settings.description}
          </p>

          <div className="mt-10 animate-rise [animation-delay:320ms]">
            <p className="display flex items-baseline gap-3 leading-none tabular-nums">
              <span className="text-[4.2rem] sm:text-[8rem] lg:text-[11rem]">{pad(stats.total)}</span>
              <span className="text-2xl text-paper/50 sm:text-5xl lg:text-6xl">/ {stats.target}</span>
            </p>
            <div className="mt-5 max-w-3xl">
              <ProgressBar percent={stats.percent} tone="light" label="Project progress" />
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-paper/60">
                {stats.total === 0
                  ? "The journey is about to begin"
                  : `${formatNumber(stats.total)} unique ${stats.total === 1 ? "person" : "people"} met · ${stats.percent}% complete`}
              </p>
            </div>
          </div>

          <div className="mt-10 flex animate-rise flex-col gap-3 [animation-delay:400ms] sm:flex-row">
            <Link href="/people" className="btn-light">
              Explore the People <ArrowRight className="size-4" />
            </Link>
            <Link href="/#follow" className="btn-outline-light">
              Follow the Journey
            </Link>
          </div>
        </div>
      </section>

      {/* THE JOURNEY */}
      <section className="container-x py-24 sm:py-36">
        <div className="grid gap-10 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-3">The journey</p>
          <div className="lg:col-span-9">
            <h2 className="display text-4xl leading-[1.08] sm:text-6xl">
              What happens when you step outside your comfort zone and start meeting people you&apos;ve never met before?
            </h2>
            <div className="mt-10 grid gap-6 text-lg leading-relaxed text-ink/75 sm:grid-cols-2 sm:gap-10">
              <p>
                I&apos;m setting out to meet 5,000 unique people. Different backgrounds, different personalities,
                different stories.
              </p>
              <p>
                Some introductions will last seconds. Some might turn into lifelong connections. I don&apos;t know
                what I&apos;ll discover along the way. That&apos;s the beauty of it.
              </p>
            </div>
            <Link href="/about" className="mt-10 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-8 hover:text-ember">
              Read the full story <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST PEOPLE */}
      <section className="bg-sand/60 py-20 sm:py-28">
        <div className="container-x">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Latest introductions</p>
              <h2 className="display mt-3 text-4xl sm:text-6xl">Meet the people</h2>
            </div>
            <Link href="/people" className="hidden items-center gap-2 text-sm font-medium underline underline-offset-8 hover:text-ember sm:inline-flex">
              View everyone <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-12">
            {latest === null ? (
              <ErrorState message="The latest people could not be loaded." />
            ) : latest.length === 0 ? (
              <EmptyState title="The first introduction is coming.">
                No one has been published yet. When the first person says yes, they&apos;ll appear here.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4">
                {latest.map((p, i) => (
                  <PersonCard key={p.number} person={p} index={i} />
                ))}
              </div>
            )}
          </div>
          <Link href="/people" className="btn-outline mt-12 sm:hidden">
            View everyone
          </Link>
        </div>
      </section>

      {/* PROGRESS */}
      <section className="container-x py-24 sm:py-32">
        <p className="eyebrow">Progress</p>
        <dl className="mt-10 grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          <Stat label="People met" value={formatNumber(stats.total)} />
          <Stat label="Remaining" value={formatNumber(stats.remaining)} />
          <Stat label="Completed" value={`${stats.percent}%`} />
          <Stat label="Latest milestone" value={stats.latestMilestone ? formatNumber(stats.latestMilestone) : "—"} />
        </dl>
        <dl className="mt-14 grid grid-cols-2 gap-y-6 border-t border-ink/15 pt-8 text-sm sm:grid-cols-4">
          <Meta label="Events attended" value={String(stats.events)} />
          <Meta label="Locations visited" value={String(stats.locations)} />
          <Meta label="Latest participant" value={stats.latestNumber ? `#${pad(stats.latestNumber)}` : "—"} />
          <Meta label="Started" value={stats.startDate ? formatDate(stats.startDate) : "—"} />
        </dl>
      </section>

      {/* MILESTONES */}
      <section id="milestones" className="scroll-mt-20 bg-ink py-24 text-paper sm:py-32">
        <div className="container-x">
          <p className="eyebrow text-paper/50">Milestones</p>
          <h2 className="display mt-3 text-4xl sm:text-6xl">The road to 5,000</h2>
          <ol className="mt-14 divide-y divide-paper/15 border-y border-paper/15">
            {stats.milestones.map((m) => {
              const done = stats.total >= m;
              const isNext = stats.nextMilestone === m;
              return (
                <li key={m} className="flex items-center justify-between gap-4 py-6 sm:py-8">
                  <span className={`display text-4xl tabular-nums sm:text-6xl ${done ? "" : "text-paper/35"}`}>
                    {pad(m)} <span className="text-paper/40">/ {formatNumber(stats.target)}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] ${
                      done ? "border-paper bg-paper text-ink" : isNext ? "border-paper/60 text-paper" : "border-paper/20 text-paper/40"
                    }`}
                  >
                    {done ? "Reached" : isNext ? `${formatNumber(m - stats.total)} to go` : "Upcoming"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* BEHIND THE JOURNEY */}
      <section className="container-x py-24 sm:py-32">
        <p className="eyebrow">Behind the journey</p>
        <h2 className="display mt-3 text-4xl sm:text-6xl">Moments from the road</h2>
        <div className="mt-12">
          {videos.length === 0 ? (
            <EmptyState title="Videos are on their way.">
              Short clips and memorable moments will appear here as people share them.
            </EmptyState>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {videos.map((p) => (
                <figure key={p.number}>
                  <video
                    controls
                    playsInline
                    preload="none"
                    poster={videoPoster(p.videoUrl, 640) ?? undefined}
                    className="aspect-[4/5] w-full bg-ink object-cover"
                    aria-label={`Video with ${p.displayName}`}
                  >
                    <VideoSources url={p.videoUrl} />
                  </video>
                  <figcaption className="mt-3 text-sm">
                    <Link href={`/people/${pad(p.number)}`} className="underline underline-offset-4 hover:text-ember">
                      #{pad(p.number)} {p.displayName}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section id="follow" className="scroll-mt-20 bg-sand py-24 sm:py-32">
        <div className="container-x text-center">
          <h2 className="display mx-auto max-w-3xl text-5xl leading-[1.05] sm:text-7xl">Could you be one of the 5,000?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
            Follow the journey as it happens, and if we cross paths in real life, come say hello. Nobody needs an
            introduction.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="btn-solid">
                {s.label} ↗
              </a>
            ))}
            <Link href="/contact" className="btn-outline">
              Get in touch
            </Link>
          </div>
          {socials.length === 0 && (
            <p className="mt-6 text-sm text-stone">Social links will be added here soon.</p>
          )}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="display mt-2 text-6xl tabular-nums sm:text-8xl">{value}</dd>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
