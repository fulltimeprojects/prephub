"use client";

import { useOptimistic, useTransition } from "react";
import { setNoteStatus, setQuestionStatus } from "@/app/actions/progress";
import { STUDY_LABEL, STUDY_STATUSES, type StudyStatus } from "@/lib/types";

const ACTIVE: Record<StudyStatus, string> = {
  not_started: "bg-white text-ink border-rule-strong",
  revising: "bg-revising-tint text-revising border-revising",
  confident: "bg-confident-tint text-confident border-confident",
};

export function StatusControl({
  kind,
  id,
  status,
  label,
}: {
  kind: "question" | "note";
  id: number;
  status: StudyStatus;
  label: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  function choose(next: StudyStatus) {
    if (next === optimistic) return;
    startTransition(async () => {
      setOptimistic(next);
      if (kind === "question") await setQuestionStatus(id, next);
      else await setNoteStatus(id, next);
    });
  }

  return (
    <div role="radiogroup" aria-label={`How well you know ${label}`} className="inline-flex flex-wrap gap-1.5" aria-busy={pending}>
      {STUDY_STATUSES.map((s) => {
        const on = optimistic === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => choose(s)}
            className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
              on ? ACTIVE[s] : "border-rule bg-transparent text-muted hover:border-rule-strong hover:text-ink"
            }`}
          >
            {STUDY_LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
