import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { search } from "@/lib/data";
import { StatusDot } from "@/components/status-dot";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: Props) {
  const user = await requireUser();
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 100);
  const hits = q.length >= 2 ? await search(user.id, q) : [];
  const notes = hits.filter((h) => h.kind === "note");
  const questions = hits.filter((h) => h.kind === "question");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Search</h1>
      <form action="/search" role="search" className="mt-4 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search questions and notes
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. event loop, N+1, prompt injection" className="field" autoFocus />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {q.length >= 2 && hits.length === 0 && (
        <p className="mt-8 text-ink-soft">Nothing matches “{q}”. Try a shorter word, or a technology name like “Redis” or “Eloquent”.</p>
      )}
      {q.length > 0 && q.length < 2 && <p className="mt-8 text-ink-soft">Type at least two characters.</p>}

      {notes.length > 0 && (
        <section className="mt-8" aria-labelledby="notes-results">
          <h2 id="notes-results" className="border-b border-rule-strong pb-2 text-[18px] font-semibold">
            Study notes ({notes.length})
          </h2>
          <ul className="divide-y divide-rule">
            {notes.map((h) => (
              <li key={h.code}>
                <Link href={`/tracks/${h.track_slug}/notes/${h.code}`} className="group flex items-start gap-3 py-3">
                  <span className="mt-1.5">
                    <StatusDot status={h.status} />
                  </span>
                  <span className="w-16 shrink-0 pt-0.5 font-mono text-[13px] text-muted">{h.code}</span>
                  <span>
                    <span className="block font-semibold group-hover:underline">{h.title}</span>
                    <span className="text-[13px] text-muted">{h.context}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {questions.length > 0 && (
        <section className="mt-8" aria-labelledby="question-results">
          <h2 id="question-results" className="border-b border-rule-strong pb-2 text-[18px] font-semibold">
            Interview questions ({questions.length})
          </h2>
          <ul className="divide-y divide-rule">
            {questions.map((h) => (
              <li key={h.code}>
                <Link href={`/tracks/${h.track_slug}/questions/${h.section_slug}#${h.code}`} className="group flex items-start gap-3 py-3">
                  <span className="mt-1.5">
                    <StatusDot status={h.status} />
                  </span>
                  <span className="w-16 shrink-0 pt-0.5 font-mono text-[13px] text-muted">{h.code}</span>
                  <span>
                    <span className="line-clamp-2 block font-semibold group-hover:underline">{h.title}</span>
                    <span className="text-[13px] text-muted">{h.context}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
