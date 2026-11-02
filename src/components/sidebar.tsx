import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SectionStat, Track, User } from "@/lib/types";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

export interface SidebarTrack {
  track: Track;
  sections: SectionStat[];
}

function SidebarNav({ tracks }: { tracks: SidebarTrack[] }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <NavLink href="/dashboard" exact>
          Today
        </NavLink>
        <NavLink href="/search">Search</NavLink>
      </div>
      {tracks.map(({ track, sections }) => (
        <div key={track.slug} className="flex flex-col gap-0.5">
          <Link href={`/tracks/${track.slug}`} className="mb-1 px-2.5 text-[13px] font-semibold text-muted hover:text-ink">
            {track.title}
          </Link>
          <NavLink href={`/tracks/${track.slug}/plan`}>Day-by-day plan</NavLink>
          <NavLink href={`/tracks/${track.slug}/notes`}>Study notes</NavLink>
          {track.slug === "ai" && <NavLink href="/tracks/ai/skills">AI and your skills</NavLink>}
          {sections.map((s) => (
            <NavLink key={s.slug} href={`/tracks/${track.slug}/questions/${s.slug}`}>
              <span className="truncate">{s.title}</span>
              <span className="shrink-0 font-mono text-[12px] text-muted tabular-nums">
                {s.confident}/{s.total}
              </span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ user, tracks }: { user: User; tracks: SidebarTrack[] }) {
  const account = (
    <div className="flex items-center justify-between gap-2 border-t border-rule pt-4 text-[13px]">
      <span className="min-w-0">
        <span className="block truncate font-semibold">{user.name}</span>
        <span className="block truncate text-muted">{user.email}</span>
      </span>
      <form action={logout}>
        <button type="submit" className="link shrink-0 text-[13px]">
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <aside className="sticky top-0 z-20 border-b border-rule bg-paper md:h-dvh md:overflow-y-auto md:border-r md:border-b-0">
      <div className="relative flex items-center justify-between px-5 py-3 md:block md:py-4">
        <Link href="/dashboard" className="text-[19px] font-bold tracking-tight">
          Prep<span className="highlight">Hub</span>
        </Link>
        <MobileMenu>
          <SidebarNav tracks={tracks} />
          <div className="mt-6">{account}</div>
        </MobileMenu>
      </div>
      <div className="hidden px-3 pb-6 md:flex md:min-h-[calc(100dvh-64px)] md:flex-col md:justify-between md:gap-8">
        <SidebarNav tracks={tracks} />
        <div className="px-2">{account}</div>
      </div>
    </aside>
  );
}
