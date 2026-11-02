import Link from "next/link";
import { getRefTitles } from "@/lib/data";
import { parseRefs } from "@/lib/refs";

/** Renders "JS-N01, JS-N02" style references as chips: each code with its topic, linked to its note or question. */
export async function Refs({ text }: { text: string }) {
  if (!text || text === "—") return <span className="text-muted">—</span>;
  const titles = await getRefTitles();
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {parseRefs(text).map((part, i) => {
        if (!part.href) {
          const words = part.text.replace(/^[\s,]+|[\s,]+$/g, "");
          return words ? (
            <span key={i} className="text-[13.5px] text-muted">
              {words}
            </span>
          ) : null;
        }
        const title = titles.get(part.text);
        return (
          <Link
            key={i}
            href={part.href}
            className="inline-flex max-w-full items-baseline gap-1.5 rounded-md border border-rule bg-sheet px-2 py-1 text-[13.5px] leading-snug hover:border-petrol hover:text-petrol"
          >
            <span className="shrink-0 font-mono text-[12px] text-muted">{part.text}</span>
            {title && <span className="min-w-0">{title}</span>}
          </Link>
        );
      })}
    </span>
  );
}
