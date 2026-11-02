import "server-only";
import { cache } from "react";
import { query } from "./db";
import { refCodes } from "./refs";
import type { NoteRow, NoteVideo, PlanDayRow, QuestionRow, SectionStat, SkillRow, StudyStatus, Track } from "./types";

// ------------------------------------------------------------------ tracks
export async function getTracks(): Promise<Track[]> {
  return query<Track>(
    "SELECT id, slug, title, summary, weeks, default_start, highlights FROM tracks ORDER BY sort_order",
  );
}

export async function getTrack(slug: string): Promise<Track | null> {
  const rows = await query<Track>(
    "SELECT id, slug, title, summary, weeks, default_start, highlights FROM tracks WHERE slug = ? LIMIT 1",
    [slug],
  );
  return rows[0] ?? null;
}

export async function getStartDate(userId: number, track: Track): Promise<string> {
  const rows = await query<{ start_date: string }>(
    "SELECT start_date FROM user_tracks WHERE user_id = ? AND track_id = ? LIMIT 1",
    [userId, track.id],
  );
  return (rows[0]?.start_date ?? track.default_start).slice(0, 10);
}

// ------------------------------------------------------------------ questions
export async function getSectionStats(userId: number, trackId: number): Promise<SectionStat[]> {
  const rows = await query<SectionStat>(
    `SELECT s.id, s.slug, s.title, s.code_prefix, s.description,
            COUNT(q.id) AS total,
            COALESCE(SUM(qp.status = 'confident'), 0) AS confident,
            COALESCE(SUM(qp.status = 'revising'), 0)  AS revising
       FROM sections s
       JOIN questions q ON q.section_id = s.id
       LEFT JOIN question_progress qp ON qp.question_id = q.id AND qp.user_id = ?
      WHERE s.track_id = ?
      GROUP BY s.id, s.slug, s.title, s.code_prefix, s.description, s.sort_order
      ORDER BY s.sort_order`,
    [userId, trackId],
  );
  return rows.map((r) => ({ ...r, total: Number(r.total), confident: Number(r.confident), revising: Number(r.revising) }));
}

export async function getSection(trackId: number, slug: string) {
  const rows = await query<{ id: number; slug: string; title: string; code_prefix: string; description: string }>(
    "SELECT id, slug, title, code_prefix, description FROM sections WHERE track_id = ? AND slug = ? LIMIT 1",
    [trackId, slug],
  );
  return rows[0] ?? null;
}

export async function getQuestions(sectionId: number, userId: number): Promise<QuestionRow[]> {
  return query<QuestionRow>(
    `SELECT q.id, q.code, q.topic, q.level, q.question, q.answer, q.tips,
            COALESCE(CAST(qp.status AS CHAR), 'not_started') AS status, qp.my_notes
       FROM questions q
       LEFT JOIN question_progress qp ON qp.question_id = q.id AND qp.user_id = ?
      WHERE q.section_id = ?
      ORDER BY q.sort_order`,
    [userId, sectionId],
  );
}

/** Questions the plan pairs with a note: the "Answer aloud" list of every day that reads it. */
export async function getQuestionsForNote(trackId: number, noteCode: string, userId: number): Promise<QuestionRow[]> {
  const days = await query<{ qa_refs: string }>(
    "SELECT qa_refs FROM plan_days WHERE track_id = ? AND FIND_IN_SET(?, REPLACE(notes_refs, ' ', '')) ORDER BY day_number",
    [trackId, noteCode],
  );
  const codes = refCodes(days.map((d) => d.qa_refs).join(", ")).filter((c) => !c.includes("-N"));
  if (codes.length === 0) return [];
  return query<QuestionRow>(
    `SELECT q.id, q.code, q.topic, q.level, q.question, q.answer, q.tips,
            COALESCE(CAST(qp.status AS CHAR), 'not_started') AS status, qp.my_notes
       FROM questions q
       LEFT JOIN question_progress qp ON qp.question_id = q.id AND qp.user_id = ?
      WHERE q.code IN (?)
      ORDER BY FIELD(q.code, ?)`,
    [userId, codes, codes],
  );
}

/** Topic of every note and question by code, so references like "JS-N01" can show a readable title. */
export const getRefTitles = cache(async (): Promise<Map<string, string>> => {
  const rows = await query<{ code: string; topic: string }>(
    "SELECT code, topic FROM notes UNION ALL SELECT code, topic FROM questions",
  );
  return new Map(rows.map((r) => [r.code, r.topic]));
});

export interface RevisingItem {
  code: string;
  question: string;
  track_slug: string;
  section_slug: string;
  updated_at: string;
}

export async function getRevisingQuestions(userId: number, limit = 6): Promise<RevisingItem[]> {
  return query<RevisingItem>(
    `SELECT q.code, q.question, t.slug AS track_slug, s.slug AS section_slug, qp.updated_at
       FROM question_progress qp
       JOIN questions q ON q.id = qp.question_id
       JOIN sections s  ON s.id = q.section_id
       JOIN tracks t    ON t.id = s.track_id
      WHERE qp.user_id = ? AND qp.status = 'revising'
      ORDER BY qp.updated_at ASC
      LIMIT ?`,
    [userId, limit],
  );
}

// ------------------------------------------------------------------ notes
export async function getNotes(trackId: number, userId: number): Promise<NoteRow[]> {
  return query<NoteRow>(
    `SELECT n.id, n.code, n.group_name, n.topic, n.body, n.example, n.remember,
            COALESCE(CAST(np.status AS CHAR), 'not_started') AS status
       FROM notes n
       LEFT JOIN note_progress np ON np.note_id = n.id AND np.user_id = ?
      WHERE n.track_id = ?
      ORDER BY n.sort_order`,
    [userId, trackId],
  );
}

export async function getNoteVideos(noteId: number, userId: number): Promise<NoteVideo[]> {
  return query<NoteVideo>(
    "SELECT id, video_id, title FROM note_videos WHERE note_id = ? AND user_id = ? ORDER BY created_at, id",
    [noteId, userId],
  );
}

export interface GroupStat {
  group_name: string;
  total: number;
  confident: number;
  revising: number;
}

export async function getNoteGroupStats(userId: number, trackId: number): Promise<GroupStat[]> {
  const rows = await query<GroupStat & { first_sort: number }>(
    `SELECT n.group_name,
            COUNT(n.id) AS total,
            COALESCE(SUM(np.status = 'confident'), 0) AS confident,
            COALESCE(SUM(np.status = 'revising'), 0)  AS revising,
            MIN(n.sort_order) AS first_sort
       FROM notes n
       LEFT JOIN note_progress np ON np.note_id = n.id AND np.user_id = ?
      WHERE n.track_id = ?
      GROUP BY n.group_name
      ORDER BY first_sort`,
    [userId, trackId],
  );
  return rows.map((r) => ({ group_name: r.group_name, total: Number(r.total), confident: Number(r.confident), revising: Number(r.revising) }));
}

// ------------------------------------------------------------------ plan
export async function getPlanDays(trackId: number, userId: number): Promise<PlanDayRow[]> {
  const rows = await query<PlanDayRow>(
    `SELECT d.id, d.day_number, d.week, d.week_theme, d.focus, d.notes_refs, d.qa_refs, d.practice, d.planned_hours,
            COALESCE(CAST(dp.status AS CHAR), 'pending') AS status, dp.actual_hours, dp.remarks
       FROM plan_days d
       LEFT JOIN day_progress dp ON dp.plan_day_id = d.id AND dp.user_id = ?
      WHERE d.track_id = ?
      ORDER BY d.day_number`,
    [userId, trackId],
  );
  return rows.map((r) => ({
    ...r,
    planned_hours: Number(r.planned_hours),
    actual_hours: r.actual_hours === null ? null : Number(r.actual_hours),
  }));
}

export function summarisePlan(days: PlanDayRow[]) {
  return {
    total: days.length,
    done: days.filter((d) => d.status === "done").length,
    planned: days.reduce((sum, d) => sum + d.planned_hours, 0),
    actual: days.reduce((sum, d) => sum + (d.actual_hours ?? 0), 0),
  };
}

// ------------------------------------------------------------------ skills (AI track)
export async function getSkills(trackId: number, userId: number): Promise<SkillRow[]> {
  return query<SkillRow>(
    `SELECT k.id, k.skill, k.how_ai_changes, k.use_ai, k.build_this, k.talking_point, k.watch_out, k.related_notes,
            sa.action_text
       FROM skills k
       LEFT JOIN skill_actions sa ON sa.skill_id = k.id AND sa.user_id = ?
      WHERE k.track_id = ?
      ORDER BY k.sort_order`,
    [userId, trackId],
  );
}

// ------------------------------------------------------------------ search
export interface SearchHit {
  kind: "question" | "note";
  code: string;
  title: string;
  context: string;
  track_slug: string;
  section_slug: string | null;
  status: StudyStatus;
}

const likeTerm = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export async function search(userId: number, term: string): Promise<SearchHit[]> {
  const like = likeTerm(term);
  const questions = await query<SearchHit>(
    `SELECT 'question' AS kind, q.code, q.question AS title, q.topic AS context,
            t.slug AS track_slug, s.slug AS section_slug, COALESCE(CAST(qp.status AS CHAR), 'not_started') AS status
       FROM questions q
       JOIN sections s ON s.id = q.section_id
       JOIN tracks t   ON t.id = s.track_id
       LEFT JOIN question_progress qp ON qp.question_id = q.id AND qp.user_id = ?
      WHERE q.question LIKE ? OR q.topic LIKE ? OR q.answer LIKE ?
      ORDER BY (q.question LIKE ?) DESC, t.sort_order, s.sort_order, q.sort_order
      LIMIT 40`,
    [userId, like, like, like, like],
  );
  const notes = await query<SearchHit>(
    `SELECT 'note' AS kind, n.code, n.topic AS title, n.group_name AS context,
            t.slug AS track_slug, NULL AS section_slug, COALESCE(CAST(np.status AS CHAR), 'not_started') AS status
       FROM notes n
       JOIN tracks t ON t.id = n.track_id
       LEFT JOIN note_progress np ON np.note_id = n.id AND np.user_id = ?
      WHERE n.topic LIKE ? OR n.body LIKE ? OR n.example LIKE ?
      ORDER BY (n.topic LIKE ?) DESC, t.sort_order, n.sort_order
      LIMIT 30`,
    [userId, like, like, like, like],
  );
  return [...notes, ...questions];
}

// ------------------------------------------------------------------ landing page
export async function getContentCounts() {
  const rows = await query<{ questions: number; notes: number; days: number }>(
    "SELECT (SELECT COUNT(*) FROM questions) AS questions, (SELECT COUNT(*) FROM notes) AS notes, (SELECT COUNT(*) FROM plan_days) AS days",
  );
  const r = rows[0];
  return { questions: Number(r?.questions ?? 0), notes: Number(r?.notes ?? 0), days: Number(r?.days ?? 0) };
}
