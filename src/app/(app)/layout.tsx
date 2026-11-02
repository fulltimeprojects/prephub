import { requireUser } from "@/lib/auth";
import { getSectionStats, getTracks } from "@/lib/data";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const tracks = await getTracks();
  const withSections = await Promise.all(
    tracks.map(async (track) => ({ track, sections: await getSectionStats(user.id, track.id) })),
  );

  return (
    <div className="md:grid md:min-h-dvh md:grid-cols-[264px_1fr]">
      <Sidebar user={user} tracks={withSections} />
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12">{children}</main>
    </div>
  );
}
