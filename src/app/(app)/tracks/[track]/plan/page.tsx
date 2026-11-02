import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPlanDays, getStartDate, getTrack, summarisePlan } from "@/lib/data";
import { addDays, formatDate, planPosition } from "@/lib/dates";
import { DAY_LABEL, type PlanDayRow } from "@/lib/types";
import { DayControls } from "@/components/day-controls";
import { OpenOnHash } from "@/components/open-on-hash";
import { Refs } from "@/components/refs";
import { StartDateForm } from "@/components/start-date-form";

type Props = { params: Promise<{ track: string }> };

export async function generateMetadata({ params }: Props) {
  const track = await getTrack((await params).track);
  return { title: track ? `${track.title} plan` : "Plan" };
}

const DAY_EDGE: Record<PlanDayRow["status"], string> = {
  pending: "border-l-rule-strong",
  in_progress: "border-l-revising",
  done: "border-l-confident",
  skipped: "border-l-idle",
};

export default async function PlanPage({ params }: Props) {
  const user = await requireUser();
  const track = await getTrack((await params).track);
  if (!track) notFound();

  const [days, startDate] = await Promise.all([getPlanDays(track.id, user.id), getStartDate(user.id, track)]);
  const pos = planPosition(startDate, days.length);
  const today = pos.kind === "during" ? pos.day : null;
  const summary = summarisePlan(days);

  const weeks = new Map<number, PlanDayRow[]>();
  for (const d of days) weeks.set(d.week, [...(weeks.get(d.week) ?? []), d]);
  // Weeks fold so the page stays short on a phone: open the current week, or the first one with days left.
  const openWeek =
    (today !== null ? days[today - 1]?.week : undefined) ?? days.find((d) => d.status === "pending" || d.status === "in_progress")?.week;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-4">
        <div className="max-w-[68ch]">
          <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{track.title}: day by day</h1>
          <p className="mt-2 text-ink-soft">
            {days.length} days, about {summary.planned.toFixed(0)} hours. Weekdays are shorter sessions; weekends are for building and mock
            interviews. {summary.done} days done so far.
          </p>
        </div>
        <StartDateForm key={startDate} trackSlug={track.slug} startDate={startDate} />
      </header>

      {/* Week strip: one square per day */}
      <nav aria-label="Jump to a day" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
        {[...weeks.entries()].map(([week, list]) => (
          <div key={week}>
            <p className="mb-1 text-[12px] text-muted">Week {week}</p>
            <div className="flex gap-1">
              {list.map((d) => (
                <a
                  key={d.id}
                  href={`#day-${d.day_number}`}
                  title={`Day ${d.day_number}: ${d.focus} (${DAY_LABEL[d.status]})`}
                  className={`grid size-7 place-items-center rounded text-[11px] font-semibold tabular-nums ${
                    d.day_number === today
                      ? "bg-mark text-ink ring-2 ring-ink"
                      : d.status === "done"
                        ? "bg-confident text-white"
                        : d.status === "in_progress"
                          ? "bg-revising-tint text-revising"
                          : d.status === "skipped"
                            ? "bg-rule text-muted line-through"
                            : "bg-sheet text-ink-soft ring-1 ring-rule"
                  }`}
                >
                  {d.day_number}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <OpenOnHash />
      <div className="mt-10 flex flex-col gap-4">
        {[...weeks.entries()].map(([week, list]) => {
          const done = list.filter((d) => d.status === "done").length;
          return (
            // The browser itself opens a folded week when the URL points at one of its days, so `open` may differ at hydration.
            <details key={week} open={week === openWeek} suppressHydrationWarning className="group/week rounded-lg border border-rule bg-sheet/50 open:bg-transparent">
              <summary className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-sheet">
                <span aria-hidden className="text-muted transition-transform group-open/week:rotate-90">▶</span>
                <h2 id={`week-${week}`} className="min-w-0 flex-1 text-[18px] leading-snug font-semibold sm:text-[20px]">
                  Week {week}: {list[0].week_theme}
                </h2>
                <span className={`shrink-0 text-[13px] tabular-nums ${done === list.length ? "font-semibold text-confident" : "text-muted"}`}>
                  {done}/{list.length} done
                </span>
              </summary>
              <ol className="flex flex-col border-t border-rule-strong px-1 sm:px-2">
                {list.map((d) => {
                  const date = addDays(startDate, d.day_number - 1);
                  const isToday = d.day_number === today;
                  return (
                    <li
                      key={d.id}
                      id={`day-${d.day_number}`}
                      className={`scroll-mt-20 md:scroll-mt-6 border-b border-l-4 border-rule py-5 pr-2 pl-4 sm:pl-5 ${DAY_EDGE[d.status]} ${
                        isToday ? "bg-mark-soft" : ""
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[150px_1fr]">
                        <div className="text-[14px]">
                          <p className="font-semibold">
                            Day {d.day_number}
                            {isToday && <span className="highlight ml-2">today</span>}
                          </p>
                          <p className="text-muted">{formatDate(date, { weekday: "short", day: "numeric", month: "short" })}</p>
                          <p className="text-muted">{d.planned_hours} h planned</p>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[18px] leading-snug font-semibold">{d.focus}</h3>
                          <dl className="mt-3 grid gap-x-5 gap-y-2 text-[14.5px] sm:grid-cols-[110px_1fr]">
                            <dt className="font-semibold text-ink-soft">Read</dt>
                            <dd>
                              <Refs text={d.notes_refs} />
                            </dd>
                            <dt className="font-semibold text-ink-soft">Answer aloud</dt>
                            <dd>
                              <Refs text={d.qa_refs} />
                            </dd>
                            <dt className="font-semibold text-ink-soft">Do</dt>
                            <dd className="max-w-[70ch]">{d.practice}</dd>
                          </dl>
                          <details className="mt-4 group" open={isToday}>
                            <summary className="text-[14px] font-semibold text-petrol">
                              {d.status === "pending" ? "Log this day" : `${DAY_LABEL[d.status]}${d.actual_hours !== null ? `, ${d.actual_hours} h` : ""} — edit`}
                            </summary>
                            <div className="mt-3">
                              <DayControls
                                dayId={d.id}
                                dayNumber={d.day_number}
                                status={d.status}
                                actualHours={d.actual_hours}
                                remarks={d.remarks}
                                plannedHours={d.planned_hours}
                              />
                            </div>
                          </details>
                          {d.remarks && <p className="mt-3 max-w-[70ch] text-[14px] text-ink-soft">Your remarks: {d.remarks}</p>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
    </div>
  );
}
