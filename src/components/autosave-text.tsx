"use client";

import { useState, useTransition } from "react";
import { saveQuestionNotes, saveSkillAction } from "@/app/actions/progress";

type Target = { kind: "question-notes"; id: number } | { kind: "skill-action"; id: number };

export function AutosaveText({
  target,
  initial,
  label,
  placeholder,
  rows = 3,
}: {
  target: Target;
  initial: string;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (value === saved) return;
    startTransition(async () => {
      const result =
        target.kind === "question-notes" ? await saveQuestionNotes(target.id, value) : await saveSkillAction(target.id, value);
      if (result.ok) {
        setSaved(value);
        setMessage("Saved");
      } else {
        setMessage(result.error ?? "Couldn't save. Try again.");
      }
    });
  }

  const fieldId = `${target.kind}-${target.id}`;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className="text-[13px] font-semibold text-ink-soft">
          {label}
        </label>
        <span className="text-[12px] text-muted" aria-live="polite">
          {pending ? "Saving…" : value !== saved ? "Unsaved — click outside to save" : message}
        </span>
      </div>
      <textarea
        id={fieldId}
        className="field resize-y font-sans"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          setMessage("");
        }}
        onBlur={save}
      />
    </div>
  );
}
