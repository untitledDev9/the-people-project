import type { Metadata } from "next";
import Link from "next/link";
import { PersonCard } from "@/components/PersonCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { safe } from "@/lib/safe";
import { getFilters, getParticipants } from "@/services/public";

export const metadata: Metadata = {
  title: "The People",
  description: "Everyone who has said yes to The 5,000 People Project, one introduction at a time.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function PeoplePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 80);
  const sort = one(sp.sort) === "oldest" ? "oldest" : "newest";
  const location = one(sp.location);
  const event = one(sp.event);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [data, filters] = await Promise.all([
    safe(getParticipants({ q, sort, location, event, page, limit: 12 })),
    safe(getFilters()),
  ]);

  const hasFilters = Boolean(q || location || event || sort === "oldest");
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (event) params.set("event", event);
    if (sort !== "newest") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/people?${qs}` : "/people";
  };

  return (
    <div className="container-x py-14 sm:py-20">
      <p className="eyebrow">The directory</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">The People</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/70">
        Every person here said yes to being shared. Each keeps the same number forever.
      </p>

      {/* Plain GET form: works without JavaScript and produces shareable URLs. */}
      <form action="/people" method="get" role="search" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="q" className="label">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name or number, e.g. 0007" className="field" />
        </div>
        <div>
          <label htmlFor="location" className="label">Location</label>
          <select id="location" name="location" defaultValue={location} className="field">
            <option value="">All locations</option>
            {filters?.locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event" className="label">Event</label>
          <select id="event" name="event" defaultValue={event} className="field">
            <option value="">All events</option>
            {filters?.events.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="label">Order</label>
          <select id="sort" name="sort" defaultValue={sort} className="field">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-solid w-full lg:w-auto">Apply</button>
        </div>
      </form>
      {hasFilters && (
        <Link href="/people" className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-ember">
          Clear filters
        </Link>
      )}

      <div className="mt-14">
        {!data ? (
          <ErrorState message="The directory could not be loaded." />
        ) : data.items.length === 0 ? (
          hasFilters ? (
            <EmptyState title="No one matches that." action={{ href: "/people", label: "Clear filters" }}>
              Try a different name, number or filter.
            </EmptyState>
          ) : (
            <EmptyState title="No one here yet.">
              The first introductions are still to come. Check back soon.
            </EmptyState>
          )
        ) : (
          <>
            <p className="mb-8 text-sm text-stone" aria-live="polite">
              {data.total} {data.total === 1 ? "person" : "people"}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {data.items.map((p, i) => (
                <PersonCard key={p.number} person={p} index={i} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex items-center justify-between border-t border-ink/15 pt-6">
                {data.page > 1 ? (
                  <Link href={href(data.page - 1)} className="btn-outline">← Previous</Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-stone">
                  Page {data.page} of {data.totalPages}
                </span>
                {data.page < data.totalPages ? (
                  <Link href={href(data.page + 1)} className="btn-outline">Next →</Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
