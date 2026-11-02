import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="text-[19px] font-bold tracking-tight">
          Prep<span className="highlight">Hub</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
