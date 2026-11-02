import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getNotes, getNoteVideos, getQuestionsForNote, getTrack } from "@/lib/data";
import { noteSearchUrl } from "@/lib/youtube";
import { CodeBlock, RichText } from "@/components/rich-text";
import { Flashcards } from "@/components/flashcards";
import { NextNoteButton } from "@/components/next-note-button";
import { NoteVideos } from "@/components/note-videos";
import { StatusControl } from "@/components/status-control";

type Props = { params: Promise<{ track: string; code: string }> };

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return { title: code };
}

export default async function NotePage({ params }: Props) {
  const user = await requireUser();
  const { track: trackSlug, code } = await params;
  const track = await getTrack(trackSlug);
  if (!track) notFound();

  const notes = await getNotes(track.id, user.id);
  const index = notes.findIndex((n) => n.code === code);
  if (index === -1) notFound();
  const note = notes[index];
  const prev = notes[index - 1];
  const next = notes[index + 1];
  const base = `/tracks/${track.slug}/notes`;
  const [videos, quiz] = await Promise.all([getNoteVideos(note.id, user.id), getQuestionsForNote(track.id, note.code, user.id)]);

  return (
    <article className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-[14px] text-muted">
        <Link className="link" href={base}>
          Study notes
        </Link>{" "}
        /{" "}
        <Link className="link" href={`${base}?group=${encodeURIComponent(note.group_name)}`}>
          {note.group_name}
        </Link>
      </nav>

      <header className="mt-4">
        <p className="font-mono text-[13px] text-muted">{note.code}</p>
        <h1 className="mt-1 text-[32px] leading-tight font-semibold tracking-tight">{note.topic}</h1>
      </header>

      <div className="mt-6">
        <RichText text={note.body} />
      </div>

      {note.example && (
        <section className="mt-8" aria-labelledby="example-heading">
          <h2 id="example-heading" className="mb-2 text-[16px] font-semibold">
            Example
          </h2>
          <CodeBlock text={note.example} />
        </section>
      )}

      {note.remember && (
        <section className="mt-8 border-l-4 border-mark bg-sheet px-5 py-4" aria-labelledby="remember-heading">
          <h2 id="remember-heading" className="text-[14px] font-semibold text-ink-soft">
            Say this in the interview
          </h2>
          <p className="prose-study mt-1">{note.remember}</p>
        </section>
      )}

      {quiz.length > 0 && (
        <section className="mt-10" aria-labelledby="quiz-heading">
          <h2 id="quiz-heading" className="text-[16px] font-semibold">
            Test yourself
          </h2>
          <p className="mt-1 mb-3 text-[14px] text-ink-soft">
            Interview questions on this topic. Answer out loud, reveal, then rate yourself — it updates your question progress.
          </p>
          <Flashcards key={note.id} cards={quiz} seed={note.id} />
        </section>
      )}

      <section className="mt-10" aria-labelledby="videos-heading">
        <h2 id="videos-heading" className="mb-2 text-[16px] font-semibold">
          Watch &amp; learn
        </h2>
        <NoteVideos
          key={note.id}
          noteId={note.id}
          topic={note.topic}
          videos={videos}
          searchUrl={noteSearchUrl(track.slug, note.group_name, note.topic)}
        />
      </section>

      <section className="mt-8 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Your progress">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[14px] font-semibold">How well do you know this?</span>
          <StatusControl kind="note" id={note.id} status={note.status} label={note.topic} />
        </div>
        <NextNoteButton noteId={note.id} status={note.status} nextHref={next ? `${base}/${next.code}` : base} last={!next} />
      </section>

      <nav aria-label="More notes" className="mt-10 grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`${base}/${prev.code}`} className="rounded-lg border border-rule bg-sheet px-4 py-3 hover:border-petrol">
            <span className="block text-[13px] text-muted">Previous note</span>
            <span className="block font-semibold">{prev.topic}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`${base}/${next.code}`} className="rounded-lg border border-rule bg-sheet px-4 py-3 text-right hover:border-petrol">
            <span className="block text-[13px] text-muted">Next note</span>
            <span className="block font-semibold">{next.topic}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
