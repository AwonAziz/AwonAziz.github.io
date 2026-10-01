import { site } from "@/config/site.data";
import { Section } from "../section";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Archive
 * ---------------------------------------------------------------------------
 *  The foundation work, deliberately subordinate to the systems above it. It
 *  stays because it is real and it is differentiating — most applicants have a
 *  CRUD app, very few have ninety-five committed lab exercises.
 *
 *  It is presented as an index rather than a gallery specifically so it cannot
 *  compete with the work making the argument. The push-and-pop ratio is inverted
 *  from the sections above it: the table is the dominant column and the header
 *  is the narrow one, which is the opposite of every other section.
 * ---------------------------------------------------------------------------
 */
export function Archive() {
  const labs = site.archive.filter((entry) => entry.kind === "lab");
  const experiments = site.archive.filter((entry) => entry.kind === "experiment");

  return (
    <Section
      id="archive"
      split="meta-left"
      eyebrow="Foundation"
      title="Ninety-five lab exercises, committed one at a time."
      lede="Before the systems there was a year of cloud and security labs, each one keeping the commands that were actually run and a note on what they did. That is where the reflexes come from — why a health endpoint gets shaped like a liveness probe without being asked, why a scheduled workflow gets a concurrency group, why a detector ships with something that deliberately makes it fire."
      className="border-t border-white/10"
    >
      <ArchiveTable title="Cloud, DevOps and security" rows={labs} />
      <ArchiveTable title="Also built for fun" rows={experiments} />
    </Section>
  );
}

function ArchiveTable({ title, rows }: { title: string; rows: typeof site.archive }) {
  if (rows.length === 0) return null;

  return (
    <div className="mb-12 last:mb-0">
      <p className="eyebrow mb-4">{title}</p>
      <div className="overflow-hidden rounded-card border border-white/10">
        {/* A real table: this is tabular data and a reviewer may well sort it
            in their head. Below md it becomes stacked rows, which is why each
            header cell is hidden rather than the whole row. */}
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{title}</caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-white/10">
              <th scope="col" className="label-mono px-5 py-3.5 font-normal">
                Repository
              </th>
              <th scope="col" className="label-mono px-5 py-3.5 font-normal">
                Contents
              </th>
              <th scope="col" className="label-mono px-5 py-3.5 text-right font-normal">
                Scale
              </th>
              <th scope="col" className="label-mono px-5 py-3.5 text-right font-normal">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr
                key={entry.name}
                className="border-b border-white/10 last:border-b-0 md:bg-canvas-raised"
              >
                <th
                  scope="row"
                  className="block px-5 pt-4 pb-1 text-left font-normal align-top md:table-cell md:py-4 md:pb-4"
                >
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-cursor-label="Open"
                    className="font-mono text-small text-ink transition-colors hover:text-accent"
                  >
                    {entry.name}
                  </a>
                </th>
                <td className="prose block px-5 pb-1 md:table-cell md:py-4 md:pb-4">
                  {entry.contents}
                </td>
                <td className="value-mono block px-5 pb-4 text-ink-faint md:table-cell md:py-4 md:pb-4 md:text-right">
                  {entry.scale}
                </td>
                <td className="value-mono block px-5 pb-4 text-ink-faint md:table-cell md:py-4 md:pb-4 md:text-right">
                  {entry.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Currently — the one place unfinished work is allowed.
 *
 * It earns that by being dated and explicitly labelled as intent rather than
 * evidence. Unfinished work in a featured slot is a minus; transparency about
 * state is a plus. Same content, opposite sign, decided entirely by framing.
 */
export function Currently() {
  return (
    <Section
      id="currently"
      split="wide-right"
      eyebrow="In progress"
      title="What is open on the other monitor."
      lede="Listed because they are true, not because they are finished. None of these have a repository to link yet, so take them as intent rather than evidence."
      className="border-t border-white/10"
    >
      <ul className="grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/8 lg:grid-cols-3">
        {site.currently.map((item) => (
          <li key={item.title} className="bg-canvas-raised p-6">
            <h3 className="flex items-start gap-3 text-[1.0625rem] leading-snug font-medium text-ink">
              <span aria-hidden="true" className="status-dot status-warn mt-1.5" />
              {item.title}
            </h3>
            <p className="prose mt-3">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Education.
 *
 * Never employment. A diploma is a filter, not a lever, so this is a compact
 * ledger rather than a wall of certificates. The lead row gets the detail; the
 * supporting certifications stay terse.
 */
export function Education() {
  return (
    <Section
      id="education"
      split="meta-right"
      eyebrow="Education"
      title="Diploma in AI Operations, RQF Level 6."
      lede="The word that matters in that title is Operations. It is not a course about model architectures; it is a course about what has to exist around a model for it to survive contact with real infrastructure — and that is the part I have ended up caring about."
      className="border-t border-white/10"
    >
      <ul className="border-t border-white/10">
        {site.education.map((credential, index) => (
          <li
            key={credential.name}
            className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10"
          >
            <div>
              <h3 className="text-[1.0625rem] font-medium text-ink">
                {index === 0 ? (
                  <span className="flex flex-wrap items-center gap-3">
                    {credential.name}
                    <span className="label-mono rounded-pill border border-accent/40 px-2 py-0.5 text-accent">
                      primary
                    </span>
                  </span>
                ) : (
                  credential.name
                )}
              </h3>
              <p className="mt-1 font-mono text-micro tracking-wider text-ink-faint">
                {credential.issuer}
              </p>
              {index === 0 ? (
                <Reveal from="fade" className="prose prose-measure mt-3 block">
                  {credential.detail}
                </Reveal>
              ) : null}
            </div>
            <p className="value-mono shrink-0 self-start text-ink-faint md:text-right">
              {credential.year}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
