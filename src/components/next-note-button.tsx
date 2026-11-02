"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setNoteStatus } from "@/app/actions/progress";
import type { StudyStatus } from "@/lib/types";

/** One tap to mark a note confident and move on to the next one. */
export function NextNoteButton({ noteId, status, nextHref, last }: { noteId: number; status: StudyStatus; nextHref: string; last: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-primary justify-center py-2.5"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (status !== "confident") await setNoteStatus(noteId, "confident");
          router.push(nextHref);
        })
      }
    >
      {pending ? "Saving…" : last ? "Got it — back to all notes" : "Got it — next note →"}
    </button>
  );
}
