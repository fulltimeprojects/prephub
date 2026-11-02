export type StudyStatus = "not_started" | "revising" | "confident";
export type DayStatus = "pending" | "in_progress" | "done" | "skipped";
export type Level = "Medium" | "Hard" | "Expert";

export const STUDY_STATUSES: StudyStatus[] = ["not_started", "revising", "confident"];
export const DAY_STATUSES: DayStatus[] = ["pending", "in_progress", "done", "skipped"];

export const STUDY_LABEL: Record<StudyStatus, string> = {
  not_started: "Not started",
  revising: "Revising",
  confident: "Confident",
};

export const DAY_LABEL: Record<DayStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
  skipped: "Skipped",
};

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Track {
  id: number;
  slug: string;
  title: string;
  summary: string;
  weeks: number;
  default_start: string;
  highlights: string | null;
}

export interface SectionStat {
  id: number;
  slug: string;
  title: string;
  code_prefix: string;
  description: string;
  total: number;
  confident: number;
  revising: number;
}

export interface QuestionRow {
  id: number;
  code: string;
  topic: string;
  level: Level;
  question: string;
  answer: string;
  tips: string | null;
  status: StudyStatus;
  my_notes: string | null;
}

export interface NoteRow {
  id: number;
  code: string;
  group_name: string;
  topic: string;
  body: string;
  example: string | null;
  remember: string | null;
  status: StudyStatus;
}

export interface NoteVideo {
  id: number;
  video_id: string;
  title: string | null;
}

export interface PlanDayRow {
  id: number;
  day_number: number;
  week: number;
  week_theme: string;
  focus: string;
  notes_refs: string;
  qa_refs: string;
  practice: string;
  planned_hours: number;
  status: DayStatus;
  actual_hours: number | null;
  remarks: string | null;
}

export interface SkillRow {
  id: number;
  skill: string;
  how_ai_changes: string;
  use_ai: string;
  build_this: string;
  talking_point: string;
  watch_out: string;
  related_notes: string;
  action_text: string | null;
}
