import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getNotes, getTrack } from "@/lib/data";
import type { NoteRow } from "@/lib/types";
import { StatusDot } from "@/components/status-dot";

type Props = {
  params: Promise<{ track: string }>;
  searchParams: Promise<{ group?: string | string[] }>;
};

export async function generateMetadata({ params }: Props) {
  const track = await getTrack((await params).track);
  return { title: track ? `${track.title} notes` : "Study notes" };
}

export default async function NotesPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const track = await getTrack((await params).track);
  if (!track) notFound();
  const groupParam = (await searchParams).group;
  const activeGroup = typeof groupParam === "string" ? groupParam : null;

  const notes = await getNotes(track.id, user.id);
  const groups = new Map<string, NoteRow[]>();
  for (const n of notes) groups.set(n.group_name, [...(groups.get(n.group_name) ?? []), n]);
  const shown: [string, NoteRow[]][] =
    activeGroup && groups.has(activeGroup) ? [[activeGroup, groups.get(activeGroup)!]] : [...groups.entries()];

  const base = `/tracks/${track.slug}/notes`;
  return (
    <div className="mx-auto max-w-4xl">
      <header className="max-w-[66ch]">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{track.title}: study notes</h1>
        <p className="mt-2 text-ink-soft">
          The concepts behind the interview questions. Open a note, read it, then mark how well you know it.
        </p>
      </header>

      <nav aria-label="Filter notes" className="mt-6 flex flex-wrap gap-2">
        <Link
          href={base}
          aria-current={!activeGroup ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-[13px] ${!activeGroup ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet hover:border-petrol"}`}
        >
          All ({notes.length})
        </Link>
        {[...groups.entries()].map(([name, list]) => (
          <Link
            key={name}
            href={`${base}?group=${encodeURIComponent(name)}`}
            aria-current={activeGroup === name ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-[13px] ${
              activeGroup === name ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet hover:border-petrol"
            }`}
          >
            {name} ({list.length})
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-10">
        {shown.map(([name, list]) => (
          <section key={name} aria-labelledby={`g-${name}`}>
            <h2 id={`g-${name}`} className="border-b border-rule-strong pb-2 text-[20px] font-semibold">
              {name}
            </h2>
            <ul className="divide-y divide-rule">
              {list.map((n) => (
                <li key={n.code}>
                  <Link href={`${base}/${n.code}`} className="group flex items-start gap-4 py-3.5">
                    <span className="mt-1.5">
                      <StatusDot status={n.status} />
                    </span>
                    <span className="w-16 shrink-0 pt-0.5 font-mono text-[13px] text-muted">{n.code}</span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold group-hover:underline">{n.topic}</span>
                      {n.remember && <span className="mt-0.5 block text-[14px] text-ink-soft">{n.remember}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
