"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});
  const isRegister = mode === "register";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {isRegister && (
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
          Your name
          <input className="field font-normal" name="name" autoComplete="name" required minLength={2} defaultValue={state.fields?.name} />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Email
        <input className="field font-normal" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Password
        <input
          className="field font-normal"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : undefined}
        />
        {isRegister && <span className="text-[12px] font-normal text-muted">At least 8 characters.</span>}
      </label>

      {state.error && (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-[14px] text-danger">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary justify-center py-2.5" disabled={pending}>
        {pending ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="text-[14px] text-ink-soft">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link className="link" href={`${isRegister ? "/login" : "/register"}${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}>
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
