// YouTube helpers shared by the note page, its client component and the Server Actions.

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Pull the 11-character video id out of a YouTube link (watch, youtu.be, shorts, embed, live) or a bare id. */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (ID.test(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    id = first === "watch" ? url.searchParams.get("v") : ["shorts", "embed", "live", "v"].includes(first) ? second : null;
  }
  return id && ID.test(id) ? id : null;
}

export const embedUrl = (videoId: string) => `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/** A YouTube search for a study note, worded so results are tutorials on that topic. */
export function noteSearchUrl(trackSlug: string, groupName: string, topic: string): string {
  const subject = topic.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const terms =
    trackSlug === "ai"
      ? `${/\b(AI|LLMs?)\b/.test(subject) ? subject : `${subject} LLM`} explained`
      : `${groupName} ${subject} tutorial`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(terms)}`;
}
