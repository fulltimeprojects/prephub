import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-[28px] font-semibold tracking-tight">This page doesn’t exist</h1>
      <p className="mt-2 text-ink-soft">The link may be mistyped, or the note or question was renamed.</p>
      <Link href="/dashboard" className="btn btn-primary mt-6">
        Go to today’s plan
      </Link>
    </main>
  );
}
