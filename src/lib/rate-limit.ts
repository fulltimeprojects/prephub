import "server-only";
import { headers } from "next/headers";
import { execute, query } from "./db";

type Action = "login" | "register";

// Sign-in: 10 failures per email or 30 per IP in 15 minutes. Sign-up: 5 accounts per IP per hour.
const LIMITS: Record<Action, { minutes: number; perIp: number; perEmail?: number }> = {
  login: { minutes: 15, perIp: 30, perEmail: 10 },
  register: { minutes: 60, perIp: 5 },
};

/** The visitor's IP. Vercel and most proxies put the client first in x-forwarded-for. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip") || "unknown").slice(0, 45);
}

/** True when this IP (or email) has hit the limit for the action. */
export async function isRateLimited(action: Action, ip: string, email?: string): Promise<boolean> {
  const limit = LIMITS[action];
  const [row] = await query<{ by_ip: number; by_email: number }>(
    `SELECT COALESCE(SUM(ip = ?), 0) AS by_ip, COALESCE(SUM(email = ?), 0) AS by_email
       FROM auth_attempts
      WHERE action = ? AND created_at > NOW() - INTERVAL ? MINUTE AND (ip = ? OR email = ?)`,
    [ip, email ?? null, action, limit.minutes, ip, email ?? null],
  );
  return Number(row?.by_ip) >= limit.perIp || (limit.perEmail !== undefined && Number(row?.by_email) >= limit.perEmail);
}

/** Count one attempt (a failed sign-in, or a sign-up) and prune rows older than a day. */
export async function recordAttempt(action: Action, ip: string, email?: string): Promise<void> {
  await execute("INSERT INTO auth_attempts (action, ip, email) VALUES (?, ?, ?)", [action, ip, email?.slice(0, 190) ?? null]);
  await execute("DELETE FROM auth_attempts WHERE created_at < NOW() - INTERVAL 1 DAY LIMIT 500");
}

/** After a successful sign-in, forget that email's earlier failures. */
export async function clearAttempts(action: Action, email: string): Promise<void> {
  await execute("DELETE FROM auth_attempts WHERE action = ? AND email = ?", [action, email]);
}
