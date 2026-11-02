"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="text-[28px] font-semibold tracking-tight">This page couldn’t load</h1>
      <p className="mt-2 text-ink-soft">
        The server hit an error, often because the database isn’t reachable. Check that MySQL is running and DATABASE_URL is set, then try
        again.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[13px] text-muted">Reference: {error.digest}</p>}
      <button type="button" className="btn btn-primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
