import { useMemo, useState } from "react";
import { site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { SectionEyebrow, useSectionNumber } from "../section";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Capability index
 * ---------------------------------------------------------------------------
 *  The anti-"stack wall".
 *
 *  Every portfolio has a section listing tools. Research is consistent that a
 *  flat list claiming everything equally is the single most counterproductive
 *  thing on the page — it is senior in nothing, and it gives a reviewer nothing
 *  to check. So this section refuses to be that, and the refusal is the
 *  interesting part:
 *
 *  **Every tool is derived from the systems above, and each one shows which
 *  system it came from.** Hover or focus a tool and the systems that use it
 *  highlight. There is no claim here that cannot be traced back to a repository,
 *  and the count on each row is the number of systems that actually use it — so
 *  Python appearing once and Kubernetes appearing twice is a fact about the
 *  work, not a ranking.
 *
 *  It is also why this belongs on the page at all: the one signal an
 *  entry-level portfolio cannot fake is provenance, and this section is
 *  provenance with a visual.
 * ---------------------------------------------------------------------------
 */

interface ToolRow {
  name: string;
  /** Slugs of the systems that list this tool. Never empty. */
  systems: string[];
}

export function CapabilityIndex() {
  const [active, setActive] = useState<string | null>(null);

  // Derived, never declared. A tool that appears in no system is a bug, and
  // this way it cannot be added as an aspiration by editing a list.
  const rows = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const system of site.systems) {
      for (const tool of system.stack) {
        const key = tool.trim();
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(system.slug);
      }
    }
    return (
      Array.from(map.entries())
        .map(([name, systems]): ToolRow => ({ name, systems }))
        // Most-used first, then alphabetical, so the order is stable and derived
        // rather than a matter of taste.
        .sort((a, b) => b.systems.length - a.systems.length || a.name.localeCompare(b.name))
    );
  }, []);

  /**
   * Short identifier, not the system title.
   *
   * The titles are full sentences — "Model lifecycle: drift, retrain, and a
   * promotion that can be refused" — and dropping one into a three-column grid
   * pushed the tool's own name out of the row entirely, which is how this
   * section shipped broken on its first render. The slug is short, unambiguous,
   * machine-shaped and consistent with the register of the rest of the page; the
   * full titles live in the accessible name.
   */
  const usedBy = (systems: string[]) =>
    systems.length === 1 ? (systems[0] ?? "") : `${systems.length} systems`;

  const titleFor = (systems: string[]) =>
    systems
      .map((slug) => site.systems.find((s) => s.slug === slug)?.title ?? slug)
      .join("  ·  ");

  return (
    <section
      id="capability"
      data-scroll-section="capability"
      className="relative scroll-mt-24 border-t border-white/10"
    >
      <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />

      <div className="shell relative section-pad">
        <header className="mb-[clamp(2.5rem,5vw,4rem)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <SectionEyebrow sequence={useSectionNumber("capability")}>
              Provenance
            </SectionEyebrow>
            <Reveal from="lift" className="lede prose-measure block">
              Not a skills list. Every entry below is extracted from the systems on this page,
              and the count is how many of them actually use it.
            </Reveal>
          </div>
          <div>
            <Reveal as="h2" className="title max-w-[20ch]" from="mask">
              Every tool, traced to the work.
            </Reveal>
          </div>
        </header>

        <ul className="grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const isActive = active === row.name;
            const isDimmed = active !== null && !isActive;
            return (
              <li key={row.name}>
                <a
                  href={`#${row.systems[0]}`}
                  onMouseEnter={() => setActive(row.name)}
                  onFocus={() => setActive(row.name)}
                  onMouseLeave={() => setActive(null)}
                  onBlur={() => setActive(null)}
                  // The full system titles. Visible on hover as a native
                  // tooltip and, more importantly, the accessible name — the
                  // visible slug is an abbreviation.
                  title={titleFor(row.systems)}
                  className={cn(
                    "group flex h-full items-center justify-between gap-3 bg-canvas-raised px-5 py-4 transition-all duration-500",
                    isActive && "bg-ink/[0.06]",
                    isDimmed && "opacity-40",
                  )}
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    {/* The count is a monospace figure, so it aligns into a
                        column and the grid reads as an index rather than a
                        list. */}
                    <span className="value-mono w-3 shrink-0 text-right text-accent/70">
                      {row.systems.length}
                    </span>
                    <span className="truncate font-mono text-small text-ink">{row.name}</span>
                  </span>

                  {/* Short slug, always visible, rising to the accent on
                      hover. `min-w-0` on the parent is what lets this
                      truncate instead of pushing the tool name out. */}
                  <span className="hidden min-w-0 shrink truncate font-mono text-micro tracking-wider text-ink-faint transition-colors duration-500 group-hover:text-accent sm:block">
                    {usedBy(row.systems)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <p className="prose prose-measure mt-8">
          Hover any row to see which systems use it. If a tool is not in this table it is not in
          a repository on this page, which is the only kind of claim worth making here.
        </p>
      </div>
    </section>
  );
}
