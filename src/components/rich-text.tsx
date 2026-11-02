import type { ReactNode } from "react";

// Renders the study content format: "• " bullets, "  – " sub-bullets, "1) " steps,
// code lines (grouped into blocks) and plain paragraphs. Works in server and client components.

type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: { text: string; variant: "dot" | "sub" | "step" }[] }
  | { kind: "code"; lines: string[] };

const CODE_START =
  /^(const |let |var |function |async |await |return |class |import |export |type |interface |if \(|for \(|try |catch|\}|\{|\)|\]|\/\/|#\[|<\/?[a-zA-Z]|'use |"use |\$|php |composer |claude |npm |npx |node |SELECT |FROM |WHERE |ORDER BY|LIMIT |-- |[A-Z][A-Za-z]+::|[a-z][\w.]*\(|[a-z]\w*\.[a-z]\w*\(|new [A-Z])/;

function isCodeLine(line: string): boolean {
  if (!line.trim()) return false;
  if (/^ {2,}\S/.test(line) && !/^\s+[–-]\s/.test(line)) return true;
  const t = line.trim();
  if (/[;{]$/.test(t) || /^\}\)?;?$/.test(t) || /\);$/.test(t)) return true;
  return CODE_START.test(t);
}

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const pushItem = (item: { text: string; variant: "dot" | "sub" | "step" }) => {
    const last = blocks[blocks.length - 1];
    if (last?.kind === "list") last.items.push(item);
    else blocks.push({ kind: "list", items: [item] });
  };
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const t = line.trim();
    if (t.startsWith("• ")) pushItem({ text: t.slice(2), variant: "dot" });
    else if (/^[–-] /.test(t) && /^\s/.test(line)) pushItem({ text: t.slice(2), variant: "sub" });
    else if (/^\d+\)\s/.test(t)) pushItem({ text: t, variant: "step" });
    else if (isCodeLine(line)) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "code") last.lines.push(line);
      else blocks.push({ kind: "code", lines: [line] });
    } else blocks.push({ kind: "p", text: t });
  }
  return blocks;
}

/** Inline `code` spans. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={i} className="rounded bg-petrol-tint px-1 text-[0.86em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`prose-study ${className}`}>
      {parseBlocks(text).map((block, i) => {
        if (block.kind === "p") return <p key={i}>{inline(block.text)}</p>;
        if (block.kind === "code")
          return (
            <pre key={i} className="code-block my-2">
              {block.lines.join("\n")}
            </pre>
          );
        return (
          <ul key={i}>
            {block.items.map((item, j) => (
              <li key={j} className={item.variant === "dot" ? undefined : item.variant}>
                {inline(item.text)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

export function CodeBlock({ text }: { text: string }) {
  return <pre className="code-block">{text}</pre>;
}
