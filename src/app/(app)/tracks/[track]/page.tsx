import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getNoteGroupStats, getPlanDays, getSectionStats, getStartDate, getTrack, summarisePlan } from "@/lib/data";
import { TodayPanel } from "@/components/today-panel";
import { Meter, percent } from "@/components/meter";

type Props = { params: Promise<{ track: string }> };

export async function generateMetadata({ params }: Props) {
  const track = await getTrack((await params).track);
  return { title: track?.title ?? "Plan" };
}

export default async function TrackPage({ params }: Props) {
  const user = await requireUser();
  const track = await getTrack((await params).track);
  if (!track) notFound();

  const [days, sections, groups, startDate] = await Promise.all([
    getPlanDays(track.id, user.id),
    getSectionStats(user.id, track.id),
    getNoteGroupStats(user.id, track.id),
    getStartDate(user.id, track),
  ]);
  const plan = summarisePlan(days);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header className="max-w-[68ch]">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{track.title}</h1>
        <p className="mt-2 text-[17px] text-ink-soft">{track.summary}</p>
        <p className="mt-3 text-[14px] text-muted">
          {plan.done} of {plan.total} days done, {plan.actual.toFixed(1)} of {plan.planned.toFixed(0)} planned hours logged.{" "}
          <Link className="link" href={`/tracks/${track.slug}/plan`}>
            Open the day-by-day plan
          </Link>
        </p>
      </header>

      <TodayPanel track={track} startDate={startDate} days={days} />

      {track.highlights && (
        <section aria-labelledby="why-heading" className="max-w-[72ch]">
          <h2 id="why-heading" className="text-[20px] font-semibold">
            Why this matters with 10 years of experience
          </h2>
          <ul className="prose-study mt-3">
            {track.highlights.split("\n").map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Link href="/tracks/ai/skills" className="link mt-3 inline-block">
            See how AI strengthens each of your skills
          </Link>
        </section>
      )}

      <section aria-labelledby="questions-heading">
        <h2 id="questions-heading" className="text-[20px] font-semibold">
          Interview questions
        </h2>
        <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-sheet">
          {sections.map((s) => (
            <li key={s.slug} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_200px] sm:items-center sm:gap-6">
              <div>
                <Link href={`/tracks/${track.slug}/questions/${s.slug}`} className="text-[16px] font-semibold hover:underline">
                  {s.title}
                </Link>
                <p className="mt-0.5 text-[14px] text-ink-soft">{s.description}</p>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px] tabular-nums text-muted">
                  <span>
                    {s.confident} of {s.total} confident
                  </span>
                  <span>{percent(s.confident, s.total)}</span>
                </div>
                <Meter confident={s.confident} revising={s.revising} total={s.total} label={`${s.title} questions`} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="notes-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="notes-heading" className="text-[20px] font-semibold">
            Study notes
          </h2>
          <Link className="link text-[14px]" href={`/tracks/${track.slug}/notes`}>
            Read all notes
          </Link>
        </div>
        <ul className="mt-3 grid gap-x-8 gap-y-4 rounded-lg border border-rule bg-sheet p-4 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.group_name}>
              <div className="mb-1.5 flex justify-between gap-3 text-[14px]">
                <Link className="font-semibold hover:underline" href={`/tracks/${track.slug}/notes?group=${encodeURIComponent(g.group_name)}`}>
                  {g.group_name}
                </Link>
                <span className="text-[13px] text-muted tabular-nums">
                  {g.confident}/{g.total}
                </span>
              </div>
              <Meter confident={g.confident} revising={g.revising} total={g.total} label={`${g.group_name} notes`} size="sm" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
