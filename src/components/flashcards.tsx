"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setQuestionStatus } from "@/app/actions/progress";
import { RichText } from "./rich-text";
import { STUDY_LABEL, type StudyStatus } from "@/lib/types";

export interface Card {
  id: number;
  code: string;
  topic: string;
  level: string;
  question: string;
  answer: string;
  tips: string | null;
  status: StudyStatus;
}

// Seeded shuffle (mulberry32) so the server render and the browser produce the same order.
function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Flashcards({ cards, seed }: { cards: Card[]; seed: number }) {
  // Build the deck once per visit so saving a result (which refreshes the page data) doesn't reshuffle mid-round.
  const [deck] = useState(() => {
    const open = cards.filter((c) => c.status !== "confident");
    return shuffle(open.length > 0 ? open : cards, seed);
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Record<number, StudyStatus>>({});
  const [pending, startTransition] = useTransition();
  const keys = useRef<(key: string) => void>(() => {});

  // Keyboard: Space reveals the answer, 1 / 2 / 3 rate it. Ignored while typing or when a control has focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, button, a, summary, [contenteditable]")) return;
      if (e.key === " ") e.preventDefault();
      keys.current(e.key);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  keys.current = () => {}; // replaced below while a card is showing

  if (deck.length === 0) return <p className="text-ink-soft">No questions in this section yet.</p>;

  const finished = index >= deck.length;
  if (finished) {
    const counts = Object.values(results).reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});
    return (
      <div className="rounded-lg border border-rule bg-sheet p-6">
        <h2 className="text-xl font-semibold">Round finished</h2>
        <p className="mt-2 text-ink-soft">
          You went through {deck.length} cards: {counts.confident ?? 0} confident, {counts.revising ?? 0} to revise,{" "}
          {counts.not_started ?? 0} still new.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => {
            setIndex(0);
            setRevealed(false);
            setResults({});
          }}
        >
          Go through again
        </button>
      </div>
    );
  }

  const card = deck[index];
  const answer = (status: StudyStatus) =>
    startTransition(async () => {
      await setQuestionStatus(card.id, status);
      setResults((r) => ({ ...r, [card.id]: status }));
      setRevealed(false);
      setIndex((i) => i + 1);
    });
  keys.current = (key) => {
    if (pending) return;
    if (!revealed && (key === " " || key === "Enter")) setRevealed(true);
    else if (revealed && key === "1") answer("not_started");
    else if (revealed && key === "2") answer("revising");
    else if (revealed && key === "3") answer("confident");
  };

  return (
    <div className="rounded-lg border border-rule bg-sheet">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3 text-[13px] text-muted">
        <span>
          Card {index + 1} of {deck.length}
        </span>
        <span className="flex gap-3">
          <span className="font-mono">{card.code}</span>
          <span>{card.level}</span>
        </span>
      </div>
      <div className="h-1 bg-rule" aria-hidden>
        <div className="h-full bg-petrol transition-[width]" style={{ width: `${(index / deck.length) * 100}%` }} />
      </div>
      <div className="px-5 py-6 sm:px-8">
        <p className="text-[13px] text-muted">{card.topic}</p>
        <h2 className="mt-1 max-w-[62ch] text-[20px] font-semibold leading-snug whitespace-pre-line">{card.question}</h2>

        {revealed ? (
          <div className="mt-6 border-t border-rule pt-5">
            <RichText text={card.answer} />
            {card.tips && <p className="mt-4 max-w-[74ch] text-[14px] text-ink-soft">{card.tips}</p>}
            <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:items-center" aria-busy={pending}>
              <span className="mr-1 text-[14px] font-semibold">How did you do?</span>
              <button type="button" className="btn btn-quiet justify-center py-2.5" disabled={pending} onClick={() => answer("not_started")}>
                Didn't know it <Key>1</Key>
              </button>
              <button type="button" className="btn btn-quiet justify-center py-2.5" disabled={pending} onClick={() => answer("revising")}>
                Partly, revise later <Key>2</Key>
              </button>
              <button type="button" className="btn btn-primary justify-center py-2.5" disabled={pending} onClick={() => answer("confident")}>
                Knew it <Key>3</Key>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <button type="button" className="btn btn-primary justify-center py-2.5" onClick={() => setRevealed(true)}>
              Show answer <Key>Space</Key>
            </button>
            <span className="text-[13px] text-muted">Say your answer out loud first. Current status: {STUDY_LABEL[card.status]}.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Keyboard hint shown on a button; hidden on touch-size screens where there is no keyboard. */
function Key({ children }: { children: string }) {
  return (
    <kbd className="hidden rounded border border-current/30 px-1.5 font-mono text-[11px] font-normal opacity-70 sm:inline">{children}</kbd>
  );
}
