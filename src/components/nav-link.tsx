"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[14px] transition-colors ${
        active ? "bg-sheet font-semibold text-ink shadow-[inset_3px_0_0_var(--color-petrol)]" : "text-ink-soft hover:bg-sheet/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
