import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getNoteGroupStats, getPlanDays, getRevisingQuestions, getSectionStats, getStartDate, getTracks, summarisePlan } from "@/lib/data";
import { formatDate, todayISO } from "@/lib/dates";
import { TodayPanel } from "@/components/today-panel";
import { Meter, percent } from "@/components/meter";

export const metadata = { title: "Today" };

export default async function DashboardPage() {
  const user = await requireUser();
  const tracks = await getTracks();
  const data = await Promise.all(
    tracks.map(async (track) => {
      const [days, sections, groups, startDate] = await Promise.all([
        getPlanDays(track.id, user.id),
        getSectionStats(user.id, track.id),
        getNoteGroupStats(user.id, track.id),
        getStartDate(user.id, track),
      ]);
      return { track, days, sections, groups, startDate };
    }),
  );
  const revising = await getRevisingQuestions(user.id, 8);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <header>
        <p className="text-[14px] text-muted">{formatDate(todayISO(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="mt-1 text-[32px] leading-tight font-semibold tracking-tight">Good to see you, {firstName}.</h1>
      </header>

      <div className="flex flex-col gap-6">
        {data.map(({ track, days, startDate }) => (
          <TodayPanel key={track.slug} track={track} startDate={startDate} days={days} />
        ))}
      </div>

      <section aria-labelledby="progress-heading">
        <h2 id="progress-heading" className="text-[20px] font-semibold">
          Progress
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {data.map(({ track, days, sections, groups }) => {
            const q = sections.reduce((a, s) => ({ c: a.c + s.confident, r: a.r + s.revising, t: a.t + s.total }), { c: 0, r: 0, t: 0 });
            const n = groups.reduce((a, g) => ({ c: a.c + g.confident, r: a.r + g.revising, t: a.t + g.total }), { c: 0, r: 0, t: 0 });
            const p = summarisePlan(days);
            return (
              <article key={track.slug} className="rounded-lg border border-rule bg-sheet p-5">
                <h3 className="font-semibold">
                  <Link className="link" href={`/tracks/${track.slug}`}>
                    {track.title}
                  </Link>
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-[14px]">
                  <div>
                    <dt className="text-[13px] text-muted">Questions you know</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {q.c} of {q.t} <span className="text-muted">({percent(q.c, q.t)})</span>
                    </dd>
                    <dd className="mt-2">
                      <Meter confident={q.c} revising={q.r} total={q.t} label={`${track.title} questions`} size="sm" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Notes you know</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {n.c} of {n.t} <span className="text-muted">({percent(n.c, n.t)})</span>
                    </dd>
                    <dd className="mt-2">
                      <Meter confident={n.c} revising={n.r} total={n.t} label={`${track.title} notes`} size="sm" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Days done</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {p.done} of {p.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-muted">Hours logged</dt>
                    <dd className="mt-0.5 tabular-nums">
                      {p.actual.toFixed(1)} <span className="text-muted">of {p.planned.toFixed(0)}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted">Green is confident, amber is still being revised.</p>
      </section>

      <section aria-labelledby="revise-heading">
        <h2 id="revise-heading" className="text-[20px] font-semibold">
          Waiting for revision
        </h2>
        {revising.length === 0 ? (
          <p className="mt-2 max-w-[60ch] text-ink-soft">
            Questions you mark as “Revising” collect here, oldest first, so you can come back to them. Start with today’s questions above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-rule rounded-lg border border-rule bg-sheet">
            {revising.map((item) => (
              <li key={item.code} className="flex gap-3 px-4 py-3 sm:gap-4">
                <span className="w-12 shrink-0 font-mono text-[13px] text-muted sm:w-14">{item.code}</span>
                <Link
                  href={`/tracks/${item.track_slug}/questions/${item.section_slug}#${item.code}`}
                  className="link line-clamp-2 text-[15px] no-underline hover:underline"
                >
                  {item.question}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
