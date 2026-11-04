import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getContentCounts } from "@/lib/data";

export default async function HomePage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const counts = await getContentCounts();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-[19px] font-bold tracking-tight">
          Prep<span className="highlight">Hub</span>
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn btn-quiet">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Create account
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 pt-10 pb-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pt-20">
        <div>
          <h1 className="max-w-[16ch] text-[44px] leading-[1.05] font-semibold tracking-tight sm:text-[56px]">
            Study for senior interviews, one day at a time.
          </h1>
          <p className="mt-6 max-w-[54ch] text-[18px] leading-relaxed text-ink-soft">
            Three day-by-day plans — full-stack (Laravel, Node.js, React, Next.js, JavaScript, system design), AI engineering and senior
            design (Adobe, Figma, print, branding, UI/UX) — with{" "}
            {counts.questions} interview questions, {counts.notes} study notes and model answers. Mark what you know, revise what you
            don’t, and see your progress every morning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary px-5 py-3 text-[15px]">
              Create your account
            </Link>
            <Link href="/login" className="btn btn-quiet px-5 py-3 text-[15px]">
              I already have one
            </Link>
          </div>
        </div>

        {/* A real page from the plan: the thing you'll open every day. */}
        <figure aria-label="Example: day 3 of the full-stack plan" className="rounded-xl border border-rule-strong bg-sheet">
          <div className="flex justify-between border-b border-rule px-5 py-3 text-[13px] text-muted">
            <span className="font-semibold text-ink">Full-stack interview prep</span>
            <span>Day 3 of 56</span>
          </div>
          <div className="px-5 py-5">
            <p className="text-[13px] text-muted">Week 1: JavaScript &amp; TypeScript</p>
            <p className="mt-1 text-[24px] leading-tight font-semibold tracking-tight">
              <span className="highlight">Event loop, promises, async/await</span>
            </p>
            <dl className="mt-5 grid grid-cols-[96px_1fr] gap-x-4 gap-y-2 text-[14.5px]">
              <dt className="font-semibold text-ink-soft">Read</dt>
              <dd className="font-mono text-[13px] text-petrol">JS-N05, JS-N06</dd>
              <dt className="font-semibold text-ink-soft">Answer aloud</dt>
              <dd className="font-mono text-[13px] text-petrol">JS-01, JS-07, JS-08, JS-21</dd>
              <dt className="font-semibold text-ink-soft">Do</dt>
              <dd>Solve 10 event-loop output puzzles; implement Promise.allSettled</dd>
            </dl>
            <div className="mt-5 border-t border-rule pt-4">
              <p className="prose-study text-[15px]">
                <span className="font-sans text-[13px] font-semibold text-muted">JS-21</span> Predict the output: A, C, G, D, E, F, B — the
                async function runs synchronously until its first await…
              </p>
              <div className="mt-3 flex gap-1.5 text-[13px]">
                <span className="rounded-full border border-rule px-3 py-1 text-muted">Not started</span>
                <span className="rounded-full border border-revising bg-revising-tint px-3 py-1 font-medium text-revising">Revising</span>
                <span className="rounded-full border border-rule px-3 py-1 text-muted">Confident</span>
              </div>
            </div>
          </div>
        </figure>
      </main>
    </div>
  );
}
