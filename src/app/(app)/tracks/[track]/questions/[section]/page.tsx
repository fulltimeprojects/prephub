import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getQuestions, getSection, getTrack } from "@/lib/data";
import { STUDY_LABEL, STUDY_STATUSES, type Level, type StudyStatus } from "@/lib/types";
import { RichText } from "@/components/rich-text";
import { StatusControl } from "@/components/status-control";
import { STATUS_EDGE } from "@/components/status-dot";
import { AutosaveText } from "@/components/autosave-text";
import { Flashcards } from "@/components/flashcards";
import { Meter } from "@/components/meter";

type Search = { mode?: string; status?: string; level?: string };
type Props = {
  params: Promise<{ track: string; section: string }>;
  searchParams: Promise<Search>;
};

const LEVELS: Level[] = ["Medium", "Hard", "Expert"];
const LEVEL_STYLE: Record<Level, string> = {
  Medium: "bg-petrol-tint text-petrol",
  Hard: "bg-revising-tint text-revising",
  Expert: "bg-[#f6e0dc] text-[#9a3412]",
};

export async function generateMetadata({ params }: Props) {
  const { track: t, section: s } = await params;
  const track = await getTrack(t);
  const section = track ? await getSection(track.id, s) : null;
  return { title: section?.title ?? "Questions" };
}

export default async function QuestionsPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { track: trackSlug, section: sectionSlug } = await params;
  const sp = await searchParams;
  const track = await getTrack(trackSlug);
  if (!track) notFound();
  const section = await getSection(track.id, sectionSlug);
  if (!section) notFound();

  const all = await getQuestions(section.id, user.id);
  const mode = sp.mode === "cards" ? "cards" : "list";
  const statusFilter = STUDY_STATUSES.includes(sp.status as StudyStatus) ? (sp.status as StudyStatus) : null;
  const levelFilter = LEVELS.includes(sp.level as Level) ? (sp.level as Level) : null;
  const questions = all.filter((q) => (!statusFilter || q.status === statusFilter) && (!levelFilter || q.level === levelFilter));

  const confident = all.filter((q) => q.status === "confident").length;
  const revising = all.filter((q) => q.status === "revising").length;
  const base = `/tracks/${track.slug}/questions/${section.slug}`;
  const withParams = (next: Partial<Search>) => {
    const merged = { mode: sp.mode, status: sp.status, level: sp.level, ...next };
    const qs = new URLSearchParams(Object.entries(merged).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[13px] ${active ? "border-ink bg-ink text-white" : "border-rule-strong bg-sheet hover:border-petrol"}`;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-col gap-4">
        <div className="max-w-[66ch]">
          <p className="text-[14px] text-muted">{track.title}</p>
          <h1 className="mt-1 text-[32px] leading-tight font-semibold tracking-tight">{section.title}</h1>
          <p className="mt-2 text-ink-soft">{section.description}</p>
        </div>
        <div className="max-w-md">
          <div className="mb-1.5 flex justify-between text-[13px] text-muted tabular-nums">
            <span>
              {confident} of {all.length} confident, {revising} revising
            </span>
          </div>
          <Meter confident={confident} revising={revising} total={all.length} label={`${section.title} progress`} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="View">
          <Link href={withParams({ mode: "" })} className={`btn ${mode === "list" ? "btn-primary" : "btn-quiet"}`} aria-current={mode === "list" ? "page" : undefined}>
            Read and review
          </Link>
          <Link href={withParams({ mode: "cards", status: "", level: "" })} className={`btn ${mode === "cards" ? "btn-primary" : "btn-quiet"}`} aria-current={mode === "cards" ? "page" : undefined}>
            Practise with flashcards
          </Link>
        </div>
      </header>

      {mode === "cards" ? (
        <div className="mt-8">
          <p className="mb-4 max-w-[66ch] text-[14px] text-ink-soft">
            Cards you haven’t marked confident come up in random order. Answer out loud, reveal, then rate yourself — your rating is saved.
          </p>
          <Flashcards
            seed={Math.floor(Math.random() * 2 ** 31)}
            cards={all.map((q) => ({ id: q.id, code: q.code, topic: q.topic, level: q.level, question: q.question, answer: q.answer, tips: q.tips, status: q.status }))}
          />
        </div>
      ) : (
        <>
          <nav aria-label="Filter questions" className="mt-8 flex flex-col gap-2 border-y border-rule py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-[13px] text-muted">Status</span>
              <Link className={chip(!statusFilter)} href={withParams({ status: "" })}>
                All
              </Link>
              {STUDY_STATUSES.map((s) => (
                <Link key={s} className={chip(statusFilter === s)} href={withParams({ status: s })}>
                  {STUDY_LABEL[s]} ({all.filter((q) => q.status === s).length})
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 text-[13px] text-muted">Level</span>
              <Link className={chip(!levelFilter)} href={withParams({ level: "" })}>
                All
              </Link>
              {LEVELS.map((l) => (
                <Link key={l} className={chip(levelFilter === l)} href={withParams({ level: l })}>
                  {l}
                </Link>
              ))}
            </div>
          </nav>

          {questions.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              No questions match these filters.{" "}
              <Link className="link" href={base}>
                Show all questions
              </Link>
            </p>
          ) : (
            <ol className="mt-2 flex flex-col">
              {questions.map((q) => (
                <li key={q.id} id={q.code} className={`scroll-mt-20 md:scroll-mt-6 border-b border-l-4 border-rule py-6 pr-1 pl-4 sm:pl-6 ${STATUS_EDGE[q.status]}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    <span className="font-mono text-muted">{q.code}</span>
                    <span className="text-ink-soft">{q.topic}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${LEVEL_STYLE[q.level]}`}>{q.level}</span>
                  </div>
                  <h2 className="mt-2 max-w-[66ch] text-[18px] leading-snug font-semibold whitespace-pre-line">{q.question}</h2>

                  <details className="group mt-4">
                    <summary className="inline-flex items-center gap-2 text-[14px] font-semibold text-petrol">
                      <span className="group-open:hidden">Show answer</span>
                      <span className="hidden group-open:inline">Hide answer</span>
                    </summary>
                    <div className="mt-4">
                      <RichText text={q.answer} />
                      {q.tips && (
                        <p className="mt-4 max-w-[74ch] border-l-4 border-mark bg-sheet px-4 py-2 text-[14.5px] text-ink-soft">{q.tips}</p>
                      )}
                      <div className="mt-5 max-w-[74ch]">
                        <AutosaveText
                          target={{ kind: "question-notes", id: q.id }}
                          initial={q.my_notes ?? ""}
                          label="Your notes and project example"
                          placeholder="e.g. At my company we hit this when…"
                        />
                      </div>
                    </div>
                  </details>

                  <div className="mt-4">
                    <StatusControl kind="question" id={q.id} status={q.status} label={q.code} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
