export function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
        published ? "bg-ink text-paper" : "border border-ink/30 text-stone"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
