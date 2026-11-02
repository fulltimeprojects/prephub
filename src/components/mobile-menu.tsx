"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/** The small-screen menu. Closes after navigating, on Escape, and on a tap outside it. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function close(e: Event) {
      const menu = ref.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menu.contains(e.target as Node)) menu.open = false;
    }
    document.addEventListener("keydown", close);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("click", close);
    };
  }, []);

  return (
    <details ref={ref} className="md:hidden">
      <summary className="btn btn-quiet">Menu</summary>
      <div className="absolute inset-x-0 top-full z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-rule bg-paper px-5 pt-2 pb-6 shadow-lg">
        {children}
      </div>
    </details>
  );
}
