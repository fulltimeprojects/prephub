const TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";

/** Today's date as YYYY-MM-DD in the app's time zone. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

const toUTC = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: "UTC" }).format(new Date(toUTC(iso)));
}

export function weekday(iso: string): string {
  return formatDate(iso, { weekday: "short" });
}

export type PlanPosition =
  | { kind: "before"; startsIn: number }
  | { kind: "during"; day: number }
  | { kind: "after"; endedDaysAgo: number };

/** Where today falls in a plan of `totalDays` that starts on `start`. */
export function planPosition(start: string, totalDays: number, today = todayISO()): PlanPosition {
  const offset = daysBetween(start, today);
  if (offset < 0) return { kind: "before", startsIn: -offset };
  if (offset >= totalDays) return { kind: "after", endedDaysAgo: offset - totalDays + 1 };
  return { kind: "during", day: offset + 1 };
}
