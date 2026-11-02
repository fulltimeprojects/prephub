"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import { DAY_STATUSES, STUDY_STATUSES, type DayStatus, type StudyStatus } from "@/lib/types";
import { parseYouTubeId } from "@/lib/youtube";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const refresh = () => revalidatePath("/", "layout");
const isId = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0;

export async function setQuestionStatus(questionId: number, status: StudyStatus): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(questionId) || !STUDY_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };
  await execute(
    `INSERT INTO question_progress (user_id, question_id, status) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [user.id, questionId, status],
  );
  refresh();
  return { ok: true };
}

export async function saveQuestionNotes(questionId: number, notes: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(questionId)) return { ok: false, error: "Invalid question." };
  const text = notes.slice(0, 10_000);
  await execute(
    `INSERT INTO question_progress (user_id, question_id, my_notes) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE my_notes = VALUES(my_notes)`,
    [user.id, questionId, text || null],
  );
  return { ok: true };
}

export async function setNoteStatus(noteId: number, status: StudyStatus): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(noteId) || !STUDY_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };
  await execute(
    `INSERT INTO note_progress (user_id, note_id, status) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [user.id, noteId, status],
  );
  refresh();
  return { ok: true };
}

export async function addNoteVideo(noteId: number, link: string, title: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(noteId)) return { ok: false, error: "Invalid note." };
  const videoId = parseYouTubeId(link);
  if (!videoId) return { ok: false, error: "That doesn't look like a YouTube video link." };
  const notes = await query<{ id: number }>("SELECT id FROM notes WHERE id = ? LIMIT 1", [noteId]);
  if (!notes[0]) return { ok: false, error: "Invalid note." };
  await execute(
    `INSERT INTO note_videos (user_id, note_id, video_id, title) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = COALESCE(VALUES(title), title)`,
    [user.id, noteId, videoId, title.trim().slice(0, 200) || null],
  );
  refresh();
  return { ok: true };
}

export async function removeNoteVideo(videoRowId: number): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(videoRowId)) return { ok: false, error: "Invalid video." };
  await execute("DELETE FROM note_videos WHERE id = ? AND user_id = ?", [videoRowId, user.id]);
  refresh();
  return { ok: true };
}

export interface DayInput {
  status: DayStatus;
  actualHours: number | null;
  remarks: string;
}

export async function saveDayProgress(dayId: number, input: DayInput): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(dayId) || !DAY_STATUSES.includes(input.status)) return { ok: false, error: "Invalid day." };
  const hours = input.actualHours;
  if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 24)) {
    return { ok: false, error: "Hours must be between 0 and 24." };
  }
  await execute(
    `INSERT INTO day_progress (user_id, plan_day_id, status, actual_hours, remarks) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), actual_hours = VALUES(actual_hours), remarks = VALUES(remarks)`,
    [user.id, dayId, input.status, hours === null ? null : Math.round(hours * 10) / 10, input.remarks.slice(0, 5_000) || null],
  );
  refresh();
  return { ok: true };
}

export async function setStartDate(trackSlug: string, date: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { ok: false, error: "Pick a valid date." };
  }
  const tracks = await query<{ id: number }>("SELECT id FROM tracks WHERE slug = ? LIMIT 1", [trackSlug]);
  if (!tracks[0]) return { ok: false, error: "Unknown plan." };
  await execute(
    `INSERT INTO user_tracks (user_id, track_id, start_date) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE start_date = VALUES(start_date)`,
    [user.id, tracks[0].id, date],
  );
  refresh();
  return { ok: true };
}

export async function saveSkillAction(skillId: number, text: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!isId(skillId)) return { ok: false, error: "Invalid skill." };
  await execute(
    `INSERT INTO skill_actions (user_id, skill_id, action_text) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE action_text = VALUES(action_text)`,
    [user.id, skillId, text.slice(0, 5_000) || null],
  );
  return { ok: true };
}
