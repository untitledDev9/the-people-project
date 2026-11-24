export function ProgressBar({
  percent,
  tone = "dark",
  label,
}: {
  percent: number;
  tone?: "dark" | "light";
  label: string;
}) {
  // Always show at least a sliver once anyone has been met so progress is visible.
  const width = percent > 0 ? Math.max(percent, 0.6) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`h-[3px] w-full ${tone === "dark" ? "bg-ink/15" : "bg-paper/20"}`}
    >
      <div
        className={`h-full transition-[width] duration-1000 ease-out ${tone === "dark" ? "bg-ink" : "bg-paper"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
