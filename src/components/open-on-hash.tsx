"use client";

import { useEffect } from "react";

/** When the URL points at an element inside a closed <details> (e.g. #day-12 in a folded week), open it and scroll there. */
export function OpenOnHash() {
  useEffect(() => {
    function reveal(hash: string) {
      const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      const details = target?.closest("details");
      if (!target || !details || details.open) return;
      details.open = true;
      target.scrollIntoView({ block: "start" });
    }
    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (link) reveal(link.hash);
    }
    reveal(window.location.hash);
    const onHashChange = () => reveal(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
