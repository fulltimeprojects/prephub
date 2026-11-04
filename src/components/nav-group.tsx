"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";

/** A collapsible sidebar group for one study plan. Opens itself when you navigate into that plan. */
export function NavGroup({
  base,
  title,
  confident,
  total,
  children,
}: {
  base: string;
  title: string;
  confident: number;
  total: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const inside = pathname === base || pathname.startsWith(`${base}/`);
  const [open, setOpen] = useState(inside);
  const id = useId();

  useEffect(() => {
    if (inside) setOpen(true);
  }, [inside]);

  const pct = total > 0 ? Math.round((confident / total) * 100) : 0;
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-sheet/60 ${
          inside ? "text-ink" : "text-ink-soft hover:text-ink"
        }`}
      >
        <span aria-hidden className={`mt-[3px] text-[10px] text-muted transition-transform ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] leading-snug font-semibold">{title}</span>
          <span className="mt-1.5 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-rule">
              <span className="block h-full rounded-full bg-confident" style={{ width: `${pct}%` }} />
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              {pct}%<span className="sr-only"> of questions known</span>
            </span>
          </span>
        </span>
      </button>
      <div id={id} hidden={!open} className="mt-1 mb-2 ml-[15px] border-l border-rule pl-2">
        {children}
      </div>
    </div>
  );
}
