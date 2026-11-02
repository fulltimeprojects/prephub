import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSkills, getTrack } from "@/lib/data";
import { AutosaveText } from "@/components/autosave-text";
import { Refs } from "@/components/refs";

type Props = { params: Promise<{ track: string }> };

export const metadata = { title: "AI and your skills" };

export default async function SkillsPage({ params }: Props) {
  const user = await requireUser();
  const track = await getTrack((await params).track);
  if (!track) notFound();
  const skills = await getSkills(track.id, user.id);
  if (skills.length === 0) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="max-w-[66ch]">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">How AI strengthens the skills you already have</h1>
        <p className="mt-2 text-ink-soft">
          For each skill: what changes, how to use AI to learn faster, a project worth building, what to say in interviews, and what to
          watch out for. Write your own next step at the end of each one.
        </p>
      </header>

      {track.highlights && (
        <ul className="prose-study mt-6">
          {track.highlights.split("\n").map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <nav aria-label="Skills" className="mt-8 flex flex-wrap gap-2">
        {skills.map((s) => (
          <a key={s.id} href={`#skill-${s.id}`} className="rounded-full border border-rule-strong bg-sheet px-3 py-1 text-[13px] hover:border-petrol">
            {s.skill}
          </a>
        ))}
      </nav>

      <div className="mt-8 flex flex-col">
        {skills.map((s) => (
          <section key={s.id} id={`skill-${s.id}`} aria-labelledby={`skill-h-${s.id}`} className="scroll-mt-20 md:scroll-mt-6 border-t border-rule-strong py-8">
            <h2 id={`skill-h-${s.id}`} className="text-[24px] font-semibold tracking-tight">
              {s.skill}
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ["How AI changes it", s.how_ai_changes],
                ["Use AI to learn faster", s.use_ai],
                ["Build this", s.build_this],
                ["Say this in the interview", s.talking_point],
                ["Watch out for", s.watch_out],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[14px] font-semibold text-ink-soft">{label}</dt>
                  <dd className="prose-study mt-1 text-[15.5px]">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-[14px] font-semibold text-ink-soft">Related notes</dt>
                <dd className="mt-1">
                  <Refs text={s.related_notes} />
                </dd>
              </div>
            </dl>
            <div className="mt-6 max-w-[74ch]">
              <AutosaveText
                target={{ kind: "skill-action", id: s.id }}
                initial={s.action_text ?? ""}
                label="My next step"
                placeholder="e.g. Build the ticket-triage agent in our Laravel app by Friday"
                rows={2}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
