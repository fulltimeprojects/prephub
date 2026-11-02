import { STUDY_LABEL, type StudyStatus } from "@/lib/types";

/** Small read-only status dot used in lists (server-safe). */
export function StatusDot({ status }: { status: StudyStatus }) {
  const color = status === "confident" ? "bg-confident" : status === "revising" ? "bg-revising" : "bg-rule-strong";
  return <span className={`inline-block size-2.5 shrink-0 rounded-full ${color}`} role="img" aria-label={STUDY_LABEL[status]} />;
}

export const STATUS_EDGE: Record<StudyStatus, string> = {
  not_started: "border-l-rule-strong",
  revising: "border-l-revising",
  confident: "border-l-confident",
};
