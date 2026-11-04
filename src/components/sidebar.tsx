import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SectionStat, Track, User } from "@/lib/types";
import { MobileMenu } from "./mobile-menu";
import { NavGroup } from "./nav-group";
import { NavLink } from "./nav-link";

export interface SidebarTrack {
  track: Track;
  sections: SectionStat[];
}

const LABEL = "px-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase";

function SidebarNav({ tracks }: { tracks: SidebarTrack[] }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <NavLink href="/dashboard" exact>
          Today
        </NavLink>
        <NavLink href="/search">Search</NavLink>
      </div>
      <div className="flex flex-col gap-1">
        <p className={LABEL}>Study plans</p>
        {tracks.map(({ track, sections }) => {
          const base = `/tracks/${track.slug}`;
          return (
            <NavGroup
              key={track.slug}
              base={base}
              title={track.title}
              confident={sections.reduce((n, s) => n + s.confident, 0)}
              total={sections.reduce((n, s) => n + s.total, 0)}
            >
              <div className="flex flex-col gap-0.5">
                <NavLink href={base} exact>
                  Overview
                </NavLink>
                <NavLink href={`${base}/plan`}>Day-by-day plan</NavLink>
                <NavLink href={`${base}/notes`}>Study notes</NavLink>
                {track.slug === "ai" && <NavLink href="/tracks/ai/skills">AI and your skills</NavLink>}
              </div>
              <p className={`${LABEL} mt-3 mb-1`}>Interview questions</p>
              <div className="flex flex-col gap-0.5">
                {sections.map((s) => {
                  const done = s.total > 0 && s.confident === s.total;
                  return (
                    <NavLink key={s.slug} href={`${base}/questions/${s.slug}`}>
                      <span className="min-w-0 leading-snug">{s.title}</span>
                      <span
                        className={`shrink-0 font-mono text-[12px] tabular-nums ${done ? "font-semibold text-confident" : "text-muted"}`}
                        title={`${s.confident} of ${s.total} confident`}
                      >
                        {done ? "✓" : `${s.confident}/${s.total}`}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </NavGroup>
          );
        })}
      </div>
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
