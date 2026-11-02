"use client";

import { useState, useTransition } from "react";
import { addNoteVideo, removeNoteVideo } from "@/app/actions/progress";
import type { NoteVideo } from "@/lib/types";
import { embedUrl, parseYouTubeId, watchUrl } from "@/lib/youtube";

export function NoteVideos({
  noteId,
  topic,
  videos,
  searchUrl,
}: {
  noteId: number;
  topic: string;
  videos: NoteVideo[];
  searchUrl: string;
}) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!parseYouTubeId(link)) {
      setMessage("Paste a YouTube video link, e.g. https://www.youtube.com/watch?v=…");
      return;
    }
    startTransition(async () => {
      const result = await addNoteVideo(noteId, link, title);
      if (result.ok) {
        setLink("");
        setTitle("");
        setMessage("Video added");
      } else {
        setMessage(result.error ?? "Couldn't add the video. Try again.");
      }
    });
  }

  function remove(video: NoteVideo) {
    startTransition(async () => {
      const result = await removeNoteVideo(video.id);
      setMessage(result.ok ? "Video removed" : (result.error ?? "Couldn't remove the video."));
    });
  }

  return (
    <div>
      <p className="text-[14px] text-ink-soft">
        <a className="link" href={searchUrl} target="_blank" rel="noopener noreferrer">
          Find videos on “{topic}” on YouTube ↗
        </a>{" "}
        — then paste the ones you like below so they play right here.
      </p>

      {videos.length > 0 && (
        <ul className="mt-4 grid gap-5">
          {videos.map((video) => (
            <li key={video.id} className="overflow-hidden rounded-lg border border-rule bg-sheet">
              <div className="aspect-video bg-ink">
                <iframe
                  className="h-full w-full"
                  src={embedUrl(video.video_id)}
                  title={video.title ?? `Video about ${topic}`}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <a className="link text-[14px]" href={watchUrl(video.video_id)} target="_blank" rel="noopener noreferrer">
                  {video.title ?? "Open on YouTube"} ↗
                </a>
                <button
                  type="button"
                  className="text-[13px] text-muted hover:text-danger"
                  onClick={() => remove(video)}
                  disabled={pending}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <div>
          <label htmlFor={`video-link-${noteId}`} className="mb-1 block text-[13px] font-semibold text-ink-soft">
            YouTube link
          </label>
          <input
            id={`video-link-${noteId}`}
            className="field"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.youtube.com/watch?v=…"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setMessage("");
            }}
            required
          />
        </div>
        <div>
          <label htmlFor={`video-title-${noteId}`} className="mb-1 block text-[13px] font-semibold text-ink-soft">
            Title <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`video-title-${noteId}`}
            className="field"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary justify-center" disabled={pending}>
          {pending ? "Saving…" : "Add video"}
        </button>
      </form>
      <p className="mt-1 min-h-[1.25rem] text-[13px] text-muted" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
