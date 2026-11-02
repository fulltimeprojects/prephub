"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import { clearAttempts, clientIp, isRateLimited, recordAttempt } from "@/lib/rate-limit";

export interface AuthState {
  error?: string;
  fields?: { name?: string; email?: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { name, email };

  if (name.length < 2 || name.length > 100) return { error: "Enter your name (2–100 characters).", fields };
  if (!EMAIL_RE.test(email) || email.length > 190) return { error: "Enter a valid email address.", fields };
  if (password.length < 8) return { error: "Use a password of at least 8 characters.", fields };

  const ip = await clientIp();
  if (await isRateLimited("register", ip)) return { error: "Too many new accounts from this network. Try again in an hour.", fields };

  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
  if (existing.length > 0) return { error: "An account with this email already exists. Sign in instead.", fields };

  const { insertId } = await execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [
    name,
    email,
    await hashPassword(password),
  ]);
  await recordAttempt("register", ip);
  await createSession(insertId);
  redirect(safeNext(formData.get("next")));
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { email };

  if (!email || !password) return { error: "Enter your email and password.", fields };

  const ip = await clientIp();
  if (await isRateLimited("login", ip, email)) {
    return { error: "Too many failed sign-in attempts. Wait 15 minutes and try again.", fields };
  }

  const rows = await query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const user = rows[0];
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    await recordAttempt("login", ip, email);
    return { error: "That email and password don't match an account.", fields };
  }

  await clearAttempts("login", email);
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
