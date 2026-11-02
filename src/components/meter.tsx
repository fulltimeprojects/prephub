/** Stacked progress bar: confident (green) + revising (amber) out of total. */
export function Meter({
  confident,
  revising = 0,
  total,
  label,
  size = "md",
}: {
  confident: number;
  revising?: number;
  total: number;
  label: string;
  size?: "sm" | "md";
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={confident}
      aria-valuetext={`${confident} of ${total} confident${revising ? `, ${revising} revising` : ""}`}
      className={`flex ${height} w-full overflow-hidden rounded-full bg-rule`}
    >
      <span className="h-full bg-confident" style={{ width: `${pct(confident)}%` }} />
      <span className="h-full bg-revising/70" style={{ width: `${pct(revising)}%` }} />
    </div>
  );
}

export function percent(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "0%";
}
