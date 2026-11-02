import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Create account" };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function RegisterPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const next = typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 mb-6 text-ink-soft">Your progress, notes and plan dates are saved to your account.</p>
      <AuthForm mode="register" next={next} />
    </>
  );
}
