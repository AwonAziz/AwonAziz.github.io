import { useState } from "react";
import { type System, site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { SectionEyebrow, useSectionNumber } from "../section";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Systems
 * ---------------------------------------------------------------------------
 *  The load-bearing section. Ordered by the depth of the argument each project
 *  makes, not by date — recency is a weak signal and depth is not.
 *
 *  Each entry leads with the hard constraint and only then names a technology,
 *  because a stack list is inventory and a constraint is what makes a decision
 *  interesting. Every decision is printed next to what it cost, and the "not
 *  built" list is not a disclaimer: it is the most load-bearing part of the
 *  page, because it is the part a reviewer can check fastest.
 *
 *  Each entry is a disclosure rather than a card grid. A grid of five thumbnails
 *  communicates nothing a reviewer can act on, and it hides the reasoning that
 *  is the actual evidence.
 * ---------------------------------------------------------------------------
 */
export function Systems() {
  return (
    <section
      id="systems"
      data-scroll-section="systems"
      className="relative scroll-mt-24 border-t border-white/10"
    >
      <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />

      <div className="shell relative section-pad">
        <header className="mb-[clamp(3rem,6vw,5rem)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <SectionEyebrow sequence={useSectionNumber("systems")}>
              {site.systems.length === 1 ? "One system" : `${site.systems.length} systems`}
            </SectionEyebrow>
            <Reveal as="h2" className="title max-w-[22ch]" from="mask">
              Each one was built to answer something the last one could not.
            </Reveal>
          </div>
          <Reveal from="lift" delay={0.08} className="lede prose-measure block">
            All {site.systems.length} are public and runnable. Three ship generated data by
            default and label every row with where it came from; one has been running unattended
            since August. Every claim is either a number from the running system or a file you
            can open — and every one lists what it deliberately does not do.
          </Reveal>
        </header>

        <div className="flex flex-col gap-[clamp(3.5rem,7vw,7rem)]">
          {site.systems.map((system, index) => (
            <SystemEntry key={system.slug} system={system} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SystemEntry({ system, index }: { system: System; index: number }) {
  const [open, setOpen] = useState<number | null>(0);
  const panelId = `decision-${system.slug}`;

  return (
    <article
      className="border-t border-white/10 pt-[clamp(2rem,4vw,3rem)]"
      aria-labelledby={`title-${system.slug}`}
    >
      {/* -- masthead: index, title, summary, then metrics in their own column.
             The 8/4 split is the push-and-pop the whole layout is built on. -- */}
      <div className="grid gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div>
          <p className="eyebrow mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true" className="h-px w-6 bg-white/15" />
            <span>{system.year}</span>
            {/* Status, not a badge of pride. A reviewer needs to know whether
                this is running, simulated, or abandoned. */}
            <span className="inline-flex items-center gap-2 normal-case">
              <span aria-hidden="true" className="status-dot status-ok" />
              {system.status}
            </span>
          </p>

          <Reveal
            as="h3"
            className="text-[clamp(1.375rem,0.9rem+1.5vw,2.25rem)] leading-[1.1] font-medium tracking-[-0.02em]"
            from="mask"
          >
            <span id={`title-${system.slug}`}>{system.title}</span>
          </Reveal>

          <Reveal from="lift" delay={0.05} className="prose prose-measure mt-6 block">
            {system.summary}
          </Reveal>
        </div>

        {/* Metrics in the operational register: mono, tabular, label above
            value. Kept out of the prose column so the numbers read as data
            rather than as adjectives. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start border-t border-white/10 pt-6 lg:border-t-0 lg:pt-0">
          {system.metrics.map((metric) => (
            <div key={metric.label} className="border-l border-white/12 pl-4">
              <dd className="value-mono text-[1.375rem] leading-none">{metric.value}</dd>
              <dt className="label-mono mt-2 leading-relaxed">{metric.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* -- the constraint, before any technology is named -- */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-[clamp(1rem,2vw,2rem)] lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <p className="eyebrow lg:pt-1.5">The hard part</p>
        <Reveal from="lift" className="block">
          <p className="max-w-[54ch] text-[clamp(1.0625rem,0.95rem+0.45vw,1.3125rem)] leading-[1.55] text-ink">
            {system.constraint}
          </p>
        </Reveal>
      </div>

      {/* -- architecture, where a system has one -- */}
      {system.diagram ? (
        <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)]">
          <p className="eyebrow mb-3">Architecture</p>
          {/* Horizontal scroll rather than a reflowed diagram. Collapsing this
              would need a second layout that never fits a phone, and a broken
              arrow is worse than a scrollbar. */}
          <pre className="card overflow-x-auto p-5 font-mono text-[0.6875rem] leading-[1.55] text-ink-muted">
            <code>{system.diagram}</code>
          </pre>
        </div>
      ) : null}

      {/* -- decisions and what each one cost -- */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-[clamp(1rem,2vw,2rem)] lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <p className="eyebrow lg:pt-1.5">Decisions</p>
        <div>
          <p className="prose prose-measure mb-6">
            Each decision is printed with what it cost. A portfolio where every choice was free
            is not describing itself honestly.
          </p>

          {/* Native disclosure. Keyboard, screen reader and no-JS all work
              without a line of script, and the first decision is open server-side
              so the pattern is visible immediately. */}
          <ul className="border-t border-white/10">
            {system.decisions.map((item, decisionIndex) => {
              const isOpen = open === decisionIndex;
              const buttonId = `${panelId}-btn-${decisionIndex}`;
              return (
                <li key={item.decision} className="border-b border-white/10">
                  <h4>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`${panelId}-panel-${decisionIndex}`}
                      onClick={() => setOpen(isOpen ? null : decisionIndex)}
                      className="group flex w-full items-start gap-5 py-5 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-1 shrink-0 font-mono text-micro transition-transform duration-500",
                          isOpen ? "rotate-45 text-accent" : "text-ink-faint",
                        )}
                      >
                        +
                      </span>
                      <span className="flex-1 text-[1.0625rem] leading-snug font-medium text-ink transition-colors group-hover:text-accent">
                        {item.decision}
                      </span>
                    </button>
                  </h4>

                  {/* A disclosure panel is a labelled region. <section> with an
                      accessible name is the landmark the ARIA spec points at. */}
                  <section
                    id={`${panelId}-panel-${decisionIndex}`}
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="grid gap-5 pb-6 pl-9 sm:grid-cols-2"
                  >
                    <div>
                      <p className="label-mono mb-2">Why</p>
                      <p className="prose">{item.why}</p>
                    </div>
                    <div>
                      <p className="label-mono mb-2 text-warn">Cost</p>
                      <p className="prose">{item.cost}</p>
                    </div>
                  </section>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* -- what was deliberately not built, then stack and links -- */}
      <div className="mt-[clamp(1.75rem,3.5vw,2.75rem)] grid gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <p className="eyebrow mb-4 text-warn">Deliberately not built</p>
          <ul className="flex flex-col gap-3">
            {system.notBuilt.map((item) => (
              <li key={item} className="prose flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-warn" />
                <span className="prose-measure">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-4">Stack</p>
          <ul className="flex flex-wrap gap-1.5">
            {system.stack.map((item) => (
              <li
                key={item}
                className="rounded-pill border border-white/12 px-2.5 py-1 font-mono text-micro tracking-wider text-ink-faint"
              >
                {item}
              </li>
            ))}
          </ul>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {system.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer noopener" : undefined}
                  data-cursor-label="Open"
                  className="group inline-flex items-center gap-2 font-mono text-small text-ink-muted transition-colors hover:text-accent"
                >
                  {link.label}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
