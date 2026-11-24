"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/ui/States";
import { getErrorMessage } from "@/lib/api";
import { formatDate, formatNumber, pad } from "@/lib/format";
import * as admin from "@/services/admin";
import type { AdminOverview } from "@/types";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin.getOverview().then(setData).catch((e) => setError(getErrorMessage(e)));
  }, []);

  if (error) return <p role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">{error}</p>;
  if (!data) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-10 w-56" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">The journey so far</h1>
        </div>
        <Link href="/sharp/participants/new" className="btn-solid">+ Add participant</Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Published" value={formatNumber(data.published)} />
        <Tile label="Drafts" value={formatNumber(data.drafts)} />
        <Tile label="Remaining target" value={formatNumber(data.remaining)} />
        <Tile label="Progress" value={`${data.percent}%`} />
      </div>

      <div className="mt-8 border-y border-ink/15 py-6">
        <ProgressBar percent={data.percent} label="Progress to 5,000" />
        <p className="mt-3 text-sm text-stone">
          {data.published} of {formatNumber(data.target)} ·{" "}
          {data.nextMilestone
            ? `next milestone ${formatNumber(data.nextMilestone)} (${formatNumber(data.nextMilestone - data.published)} to go)`
            : "all milestones reached"}
          {data.latestMilestone ? ` · last reached ${formatNumber(data.latestMilestone)}` : ""}
        </p>
      </div>

      <h2 className="display mt-12 text-2xl">Recent additions</h2>
      {data.recent.length === 0 ? (
        <p className="mt-4 text-stone">
          Nobody added yet. <Link href="/sharp/participants/new" className="underline underline-offset-4">Add the first participant</Link>.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {data.recent.map((p) => (
            <li key={p.id}>
              <Link href={`/sharp/participants/${p.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-sand/50">
                <span className="min-w-0">
                  <span className="text-sm text-stone">#{pad(p.number)}</span>{" "}
                  <span className="font-medium">{p.displayName}</span>
                  <span className="block text-sm text-stone">{formatDate(p.dateMet, "short")}</span>
                </span>
                <StatusBadge published={p.isPublished} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/50 p-5">
      <p className="eyebrow">{label}</p>
      <p className="display mt-2 text-4xl tabular-nums sm:text-5xl">{value}</p>
    </div>
  );
}
