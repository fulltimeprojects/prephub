// Turns plan references like "JS-N01, JS-N02" or "SR-05 to SR-11, SR-32" into links.

const QUESTION_PREFIX: Record<string, { track: string; section: string }> = {
  JS: { track: "fullstack", section: "javascript" },
  ND: { track: "fullstack", section: "nodejs" },
  RE: { track: "fullstack", section: "react" },
  NX: { track: "fullstack", section: "nextjs" },
  LV: { track: "fullstack", section: "laravel" },
  SD: { track: "fullstack", section: "system-design" },
  SR: { track: "fullstack", section: "senior" },
  AI: { track: "ai", section: "questions" },
};

export type RefPart = { text: string; href?: string };

export function hrefForCode(code: string): string | undefined {
  const note = /^([A-Z]{2})-N\d{2}$/.exec(code);
  if (note) {
    const meta = QUESTION_PREFIX[note[1]];
    return meta ? `/tracks/${meta.track}/notes/${code}` : undefined;
  }
  const q = /^([A-Z]{2})-\d{2}$/.exec(code);
  if (q) {
    const meta = QUESTION_PREFIX[q[1]];
    return meta ? `/tracks/${meta.track}/questions/${meta.section}#${code}` : undefined;
  }
  return undefined;
}

/** Split a reference string into plain text and linkable codes. */
export function parseRefs(input: string): RefPart[] {
  const parts: RefPart[] = [];
  const re = /\b([A-Z]{2}-N?\d{2})\b/g;
  let last = 0;
  for (const match of input.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: input.slice(last, index) });
    parts.push({ text: match[1], href: hrefForCode(match[1]) });
    last = index + match[0].length;
  }
  if (last < input.length) parts.push({ text: input.slice(last) });
  return parts;
}

/** Every code in a reference string, with ranges like "SR-05 to SR-11" expanded. */
export function refCodes(input: string): string[] {
  const codes: string[] = [];
  const re = /\b([A-Z]{2})-(N?)(\d{2})\b(?:\s+to\s+\1-\2(\d{2})\b)?/g;
  for (const [, prefix, n, from, to] of input.matchAll(re)) {
    const end = to ? Number(to) : Number(from);
    for (let i = Number(from); i <= end; i++) codes.push(`${prefix}-${n}${String(i).padStart(2, "0")}`);
  }
  return [...new Set(codes)];
}

export function sectionHref(trackSlug: string, sectionSlug: string): string {
  return `/tracks/${trackSlug}/questions/${sectionSlug}`;
}
