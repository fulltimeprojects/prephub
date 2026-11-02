"use client";

import { useState, useTransition } from "react";
import { setStartDate } from "@/app/actions/progress";

export function StartDateForm({ trackSlug, startDate }: { trackSlug: string; startDate: string }) {
  const [value, setValue] = useState(startDate);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setStartDate(trackSlug, value);
          setMessage(result.ok ? "Start date saved — dates updated" : (result.error ?? "Couldn't save the date."));
        });
      }}
    >
      <label className="flex flex-col gap-1 text-[13px] font-semibold text-ink-soft">
        Plan starts on
        <input className="field w-auto py-1.5" type="date" value={value} onChange={(e) => setValue(e.target.value)} required />
      </label>
      <button type="submit" className="btn btn-quiet" disabled={pending || value === startDate}>
        Change start date
      </button>
      <span className="pb-2 text-[12px] text-muted" aria-live="polite">
        {pending ? "Saving…" : message}
      </span>
    </form>
  );
}
