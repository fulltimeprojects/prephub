import Link from "next/link";
import { addDays, formatDate, planPosition } from "@/lib/dates";
import type { PlanDayRow, Track } from "@/lib/types";
import { DayControls } from "./day-controls";
import { Refs } from "./refs";

export function TodayPanel({ track, startDate, days }: { track: Track; startDate: string; days: PlanDayRow[] }) {
  const pos = planPosition(startDate, days.length);
  const planHref = `/tracks/${track.slug}/plan`;

  if (pos.kind === "before") {
    const first = days[0];
    return (
      <section className="rounded-lg border border-rule bg-sheet p-5 sm:p-6" aria-labelledby={`today-${track.slug}`}>
        <h2 id={`today-${track.slug}`} className="text-[15px] font-semibold text-muted">
          {track.title}
        </h2>
        <p className="mt-2 text-[17px]">
          Starts {formatDate(startDate, { weekday: "long", day: "numeric", month: "long" })} — in {pos.startsIn}{" "}
          {pos.startsIn === 1 ? "day" : "days"}. Day 1 is “{first?.focus}”.
        </p>
        <Link href={planHref} className="link mt-3 inline-block text-[14px]">
          Change the start date or preview the plan
        </Link>
      </section>
    );
  }

  if (pos.kind === "after") {
    const done = days.filter((d) => d.status === "done").length;
    return (
      <section className="rounded-lg border border-rule bg-sheet p-5 sm:p-6" aria-labelledby={`today-${track.slug}`}>
        <h2 id={`today-${track.slug}`} className="text-[15px] font-semibold text-muted">
          {track.title}
        </h2>
        <p className="mt-2 text-[17px]">
          The plan ended {pos.endedDaysAgo} {pos.endedDaysAgo === 1 ? "day" : "days"} ago. You completed {done} of {days.length} days.
        </p>
        <Link href={planHref} className="link mt-3 inline-block text-[14px]">
          Review the plan or restart it with a new date
        </Link>
      </section>
    );
  }

  const day = days[pos.day - 1];
  const behind = days.filter((d) => d.day_number < pos.day && d.status !== "done" && d.status !== "skipped");
  const date = addDays(startDate, pos.day - 1);

  return (
    <section className="rounded-xl border border-rule-strong bg-sheet" aria-labelledby={`today-${track.slug}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-5 py-3 sm:px-6">
        <h2 id={`today-${track.slug}`} className="text-[15px] font-semibold">
          {track.title}
        </h2>
        <p className="text-[13px] text-muted">
          Day {day.day_number} of {days.length}, {formatDate(date, { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <p className="text-[13px] text-muted">
          Week {day.week}: {day.week_theme}
        </p>
        <h3 className="mt-1 text-[24px] leading-tight font-semibold tracking-tight">
          <span className="highlight">{day.focus}</span>
        </h3>
        <dl className="mt-5 grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-[110px_1fr]">
          <dt className="font-semibold text-ink-soft">Read</dt>
          <dd>
            <Refs text={day.notes_refs} />
          </dd>
          <dt className="font-semibold text-ink-soft">Answer aloud</dt>
          <dd>
            <Refs text={day.qa_refs} />
          </dd>
          <dt className="font-semibold text-ink-soft">Do</dt>
          <dd className="max-w-[68ch]">{day.practice}</dd>
          <dt className="font-semibold text-ink-soft">Time</dt>
          <dd>About {day.planned_hours} hours</dd>
        </dl>
        <div className="mt-5 border-t border-rule pt-4">
          <DayControls
            key={`${day.id}-${day.status}`}
            dayId={day.id}
            dayNumber={day.day_number}
            status={day.status}
            actualHours={day.actual_hours}
            remarks={day.remarks}
            plannedHours={day.planned_hours}
            compact
          />
        </div>
        {behind.length > 0 && (
          <p className="mt-4 text-[14px] text-ink-soft">
            {behind.length} earlier {behind.length === 1 ? "day isn't" : "days aren't"} marked done yet:{" "}
            {behind.slice(0, 6).map((d, i) => (
              <span key={d.id}>
                {i > 0 && ", "}
                <Link className="link" href={`${planHref}#day-${d.day_number}`}>
                  day {d.day_number}
                </Link>
              </span>
            ))}
            {behind.length > 6 && " and more"}.
          </p>
        )}
      </div>
    </section>
  );
}
