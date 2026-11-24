"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Search, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api";
import { formatDate, pad } from "@/lib/format";
import { optimize } from "@/lib/media";
import * as admin from "@/services/admin";
import type { AdminParticipant, Paginated } from "@/types";

export default function AdminParticipantsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminParticipant> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminParticipant | null>(null);
  const [busy, setBusy] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await admin.listParticipants({ q: query, status, sort, page, limit: 15 }));
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [query, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish(p: AdminParticipant) {
    try {
      await admin.setPublished(p.id, !p.isPublished);
      toast.success(p.isPublished ? `#${pad(p.number)} unpublished` : `#${pad(p.number)} published`);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await admin.deleteParticipant(toDelete.id);
      toast.success(`#${pad(toDelete.number)} deleted`);
      setToDelete(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Participants</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Everyone met</h1>
        </div>
        <Link href="/admin/participants/new" className="btn-solid">+ Add participant</Link>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone" />
          <input
            aria-label="Search participants"
            placeholder="Search by name or number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field !pl-10"
          />
        </div>
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="field">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="mt-6">
        {error ? (
          <div role="alert" className="rounded-lg bg-red-100 p-4 text-red-800">
            {error} <button onClick={load} className="ml-2 underline">Retry</button>
          </div>
        ) : !data ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : data.items.length === 0 ? (
          query || status !== "all" ? (
            <EmptyState title="No matches.">Try a different search or filter.</EmptyState>
          ) : (
            <EmptyState title="No participants yet." action={{ href: "/admin/participants/new", label: "Add the first one" }}>
              Everyone you add will show up here.
            </EmptyState>
          )
        ) : (
          <>
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {data.items.map((p) => {
                const thumb = optimize(p.portraitUrl, 160);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {thumb ? <img src={thumb} alt="" className="size-14 shrink-0 rounded-md object-cover" /> : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-sand text-xs text-stone">{pad(p.number)}</div>
                    )}
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate font-medium">
                        <span className="text-stone">#{pad(p.number)}</span> {p.displayName}
                      </p>
                      <p className="truncate text-sm text-stone">
                        {formatDate(p.dateMet, "short")}
                        {p.location ? ` · ${p.location}` : ""}
                        {p.returnCount ? ` · met again ×${p.returnCount}` : ""}
                        {!p.consentConfirmed ? " · no consent yet" : ""}
                      </p>
                    </div>
                    <StatusBadge published={p.isPublished} />
                    <div className="flex items-center gap-1">
                      <IconBtn label={p.isPublished ? "Unpublish" : "Publish"} onClick={() => togglePublish(p)}>
                        {p.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </IconBtn>
                      <Link href={`/admin/participants/${p.id}`} aria-label={`Edit ${p.displayName}`} title="Edit" className="flex size-10 items-center justify-center rounded-lg hover:bg-sand">
                        <Pencil className="size-4" />
                      </Link>
                      <IconBtn label="Delete" onClick={() => setToDelete(p)}>
                        <Trash2 className="size-4 text-red-700" />
                      </IconBtn>
                    </div>
                  </li>
                );
              })}
            </ul>

            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
                <span className="text-sm text-stone">Page {data.page} of {data.totalPages} · {data.total} total</span>
                <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this participant?"
        confirmLabel="Delete permanently"
        destructive
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            <strong>#{pad(toDelete.number)} {toDelete.displayName}</strong> and their uploaded photo and video will be
            permanently removed. The number <strong>#{pad(toDelete.number)}</strong> will never be reused. To just hide
            them from the site, unpublish instead.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex size-10 items-center justify-center rounded-lg hover:bg-sand">
      {children}
    </button>
  );
}
