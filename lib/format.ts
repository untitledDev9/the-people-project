export const pad = (n: number) => String(n).padStart(4, "0");

export function formatDate(iso: string | null | undefined, style: "long" | "short" = "long") {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** yyyy-mm-dd for date inputs */
export function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export const formatNumber = (n: number) => n.toLocaleString("en-US");
