import { type System, site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { projectHref } from "@/lib/paths";
import { Approach } from "../ui/approach";
import { Reveal } from "../ui/reveal";
import { Spotlight } from "../ui/spotlight";
import { projectHue, SystemMark } from "../ui/system-mark";

/**
 * ---------------------------------------------------------------------------
 *  System card
 * ---------------------------------------------------------------------------
 *  The overview's representation of a system, and the reason it is this short.
 *
 *  The home page was 24,714px tall — 27.5 screens on a 900px viewport — because
 *  every system rendered its full case study there: masthead, constraint,
 *  architecture diagram, and all forty-seven decision panels with their why and
 *  cost columns. Every word of that already had a page of its own at
 *  `/project/<slug>/`. So the overview was not a summary of seven case studies;
 *  it was seven case studies followed by six more sections.
 *
 *  A reader arriving from a link, a search result or a shared URL wants to know
 *  three things in about fifteen seconds: what this is, is it real, and how
 *  hard was it. This card answers exactly those three and then gets out of the
 *  way. Everything else is one click away and now has room to be read properly.
 *
 *  Deliberately kept:
 *    - the constraint, trimmed to its first sentence, because the constraint is
 *      the most informative line in the entry and the only one that cannot be
 *      inferred from the title;
 *    - three metrics, not six, because a row of six numbers reads as a wall and
 *      three read as evidence;
 *    - the mark, because it is what makes this card identifiable in a list.
 *
 *  Deliberately moved to the project's own page:
 *    - every decision, with its cost;
 *    - the architecture diagram;
 *    - the full constraint;
 *    - the complete scope boundary.
 *
 *  On the colour: each system gets a hue derived from its slug, applied *only* to
 *  the mark, the index number and a single hairline. Seven hues on seven cards
 *  would be a rainbow if they were fills or body text; as thin marks and rules
 *  they read as a set of individually identified objects sharing one system,
 *  which is the point.
 * ---------------------------------------------------------------------------
 */

const TRIM_TO_SENTENCE = /^(.+?[.!?])(\s|$)/;

function hook(constraint: string): string {
  const match = TRIM_TO_SENTENCE.exec(constraint.trim());
  return (match?.[1] ?? constraint).trim();
}

export function SystemCard({ system, index }: { system: System; index: number }) {
  const href = projectHref(system.slug);
  const hue = projectHue(system.slug);

  return (
    <article
      style={{ "--project-hue": hue } as React.CSSProperties}
      aria-labelledby={`card-${system.slug}`}
      className="group/card relative"
    >
      {/* The hairline. One 2px rule in the system's own hue, sitting exactly on
          the card's top edge, is what stops seven cards reading as one long
          undifferentiated list. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-px origin-left scale-x-[var(--card-scale,0.28)] bg-[oklch(74%_0.15_var(--project-hue))] transition-transform duration-500 ease-out group-hover/card:scale-x-100"
      />

      <Spotlight className="h-full">
        <Reveal
          from="lift"
          className="relative flex h-full flex-col gap-7 border border-white/10 bg-canvas-raised/40 p-6 transition-colors duration-500 group-hover/card:border-white/20 md:p-8"
        >
          <div className="flex items-start gap-5">
            <SystemMark
              slug={system.slug}
              className="shrink-0 text-[2.5rem] leading-none transition-transform duration-500 ease-out group-hover/card:scale-110 md:text-[3rem]"
            />

            <div className="min-w-0 flex-1">
              <p className="label-mono mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[oklch(74%_0.15_var(--project-hue))]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className="h-px w-5 bg-white/15" />
                <span>{system.year}</span>
                <span aria-hidden="true" className="h-px w-5 bg-white/15" />
                <span className="inline-flex items-center gap-2 normal-case tracking-normal text-ink-faint">
                  <span aria-hidden="true" className="status-dot status-ok" />
                  {system.status}
                </span>
              </p>

              <h3
                id={`card-${system.slug}`}
                className="max-w-[26ch] text-[clamp(1.25rem,1rem+0.85vw,1.75rem)] leading-[1.12] font-medium tracking-[-0.022em] text-balance"
              >
                <a
                  href={href}
                  className="transition-colors duration-300 before:absolute before:inset-0 before:content-[''] hover:text-[oklch(80%_0.15_var(--project-hue))] focus-visible:text-[oklch(80%_0.15_var(--project-hue))]"
                >
                  {system.title}
                </a>
              </h3>
            </div>
          </div>

          <p className="prose prose-measure">{hook(system.constraint)}</p>

          <dl className="grid grid-cols-3 gap-x-5 gap-y-4 border-t border-white/10 pt-5">
            {system.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label}>
                <dd className="value-mono text-[1.25rem] leading-none">{metric.value}</dd>
                <dt className="label-mono mt-2 leading-relaxed">{metric.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-5 pt-2">
            <ul className="flex max-w-[26rem] flex-wrap gap-1.5">
              {system.stack.slice(0, 5).map((tool) => (
                <li
                  key={tool}
                  className="rounded-pill border border-white/12 px-2.5 py-1 font-mono text-micro tracking-wider text-ink-faint"
                >
                  {tool}
                </li>
              ))}
              {system.stack.length > 5 ? (
                <li className="px-1 py-1 font-mono text-micro text-ink-faint">
                  +{system.stack.length - 5}
                </li>
              ) : null}
            </ul>

            {/* The card's only real call to action, and the one the approach
                effect is attached to. `relative z-10` lifts it above the title's
                stretched-link pseudo-element so it stays independently
                clickable rather than being swallowed by the overlay. */}
            <Approach className="relative z-10 shrink-0">
              <a
                href={href}
                data-cursor-label="Open"
                className="inline-flex items-center gap-2.5 rounded-pill border border-white/15 bg-white/[0.03] px-5 py-2.5 font-mono text-small tracking-wide text-ink transition-colors duration-300 hover:border-[oklch(74%_0.15_var(--project-hue))]/70 hover:text-[oklch(80%_0.15_var(--project-hue))]"
              >
                Read the case study
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </Approach>
          </div>
        </Reveal>
      </Spotlight>
    </article>
  );
}

/**
 * The grid, kept beside the card so the column count is one decision made once.
 *
 * `auto-fit` with a floor rather than fixed breakpoints: two columns on a laptop,
 * three on a wide desktop, one on a phone, with no media query and nothing to
 * forget to change at a new breakpoint.
 */
export function SystemGrid() {
  return (
    <div className="grid gap-[clamp(1rem,1.6vw,1.5rem)] [grid-template-columns:repeat(auto-fit,minmax(min(23rem,100%),1fr))]">
      {site.systems.map((system, index) => (
        <SystemCard key={system.slug} system={system} index={index} />
      ))}
    </div>
  );
}

export { cn };
