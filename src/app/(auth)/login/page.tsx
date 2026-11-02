import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-ink-soft">Pick up where you left off.</p>
      <AuthForm mode="login" next={next} />
    </>
  );
}
