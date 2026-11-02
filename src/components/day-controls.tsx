"use client";

import { useRef, useState, useTransition } from "react";
import { saveDayProgress } from "@/app/actions/progress";
import { DAY_LABEL, DAY_STATUSES, type DayStatus } from "@/lib/types";

type FormState = { status: DayStatus; hours: string; remarks: string };

export function DayControls({
  dayId,
  dayNumber,
  status,
  actualHours,
  remarks,
  plannedHours,
  compact = false,
}: {
  dayId: number;
  dayNumber: number;
  status: DayStatus;
  actualHours: number | null;
  remarks: string | null;
  plannedHours: number;
  compact?: boolean;
}) {
  const initial: FormState = { status, hours: actualHours === null ? "" : String(actualHours), remarks: remarks ?? "" };
  const [form, setForm] = useState<FormState>(initial);
  const saved = useRef<FormState>(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function save(next: FormState) {
    setForm(next);
    const prev = saved.current;
    if (prev.status === next.status && prev.hours === next.hours && prev.remarks === next.remarks) return;
    const hours = next.hours.trim() === "" ? null : Number(next.hours);
    startTransition(async () => {
      const result = await saveDayProgress(dayId, { status: next.status, actualHours: hours, remarks: next.remarks });
      if (result.ok) {
        saved.current = next;
        setMessage("Saved");
      } else {
        setMessage(result.error ?? "Couldn't save. Try again.");
      }
    });
  }

  const markDone = () => save({ ...form, status: "done", hours: form.hours || String(plannedHours) });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-soft">
          Status
          <select
            className="field w-auto py-1.5"
            value={form.status}
            onChange={(e) => save({ ...form, status: e.target.value as DayStatus })}
          >
            {DAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DAY_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-soft">
          Hours spent
          <input
            className="field w-24 py-1.5"
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            placeholder={String(plannedHours)}
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            onBlur={() => save(form)}
          />
        </label>
        {form.status !== "done" && (
          <button type="button" className="btn btn-primary" onClick={markDone} disabled={pending}>
            Mark day {dayNumber} done
          </button>
        )}
        <span className="pb-2 text-[12px] text-muted" aria-live="polite">
          {pending ? "Saving…" : message}
        </span>
      </div>
      {!compact && (
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-soft">
          Remarks
          <textarea
            className="field resize-y font-normal"
            rows={2}
            placeholder="What clicked, what to revisit tomorrow"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            onBlur={() => save(form)}
          />
        </label>
      )}
    </div>
  );
}
