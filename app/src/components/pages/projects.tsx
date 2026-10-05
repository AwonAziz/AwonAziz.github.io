import { useEffect, useMemo, useState } from "react";
import { type System, site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { link, projectHref, ROUTES } from "@/lib/paths";
import { Reveal } from "../ui/reveal";
import { Spotlight } from "../ui/spotlight";
import { SystemMark } from "../ui/system-mark";

/**
 * ---------------------------------------------------------------------------
 *  Project index
 * ---------------------------------------------------------------------------
 *  A separate page rather than a section, deliberately.
 *
 *  Eye-tracking research on document reading (NN/g, 130,000 fixations) is
 *  unambiguous about where attention goes: 57% of viewing time above the fold,
 *  74% within the first two screenfuls. A portfolio is a pass/fail filter, so
 *  the work has to be reachable without scrolling — and "here are every project,
 *  each with a page of its own" is a shorter path than seven long disclosures
 *  on one page.
 *
 *  Each entry states the constraint and links to the deep dive, because the
 *  constraint is the part worth reading in a list and the reasoning is the part
 *  worth a page.
 * ---------------------------------------------------------------------------
 */
export function ProjectsIndex() {
  return (
    <div className="pt-28">
      <header className="mb-[clamp(2.5rem,5vw,4rem)] max-w-[46rem]">
        <p className="eyebrow mb-5 flex items-baseline gap-4">
          <span aria-hidden="true" className="text-accent">
            {String(site.systems.length).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="h-px w-8 translate-y-[-0.25em] bg-white/15" />
          systems
        </p>
        {/* One step below the home hero's display scale. At the hero's size this
            runs to five lines on a 1600px viewport and eats the entire first
            screen, which is exactly the mistake the hero itself is allowed to
            make because it has nothing above it. */}
        <Reveal
          as="h1"
          className="max-w-[24ch] text-[clamp(2rem,1rem+3.6vw,4.25rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance"
          from="mask"
        >
          Seven systems, each answering a question the last one could not.
        </Reveal>
        <Reveal from="lift" delay={0.1} className="lede prose-measure mt-7 block">
          All public and runnable. Each opens on the hard part rather than the stack, and every
          one lists what it deliberately does not do.
        </Reveal>
      </header>

      <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
        {site.systems.map((system, index) => (
          <li key={system.slug}>
            <ProjectRow system={system} index={index} />
          </li>
        ))}
      </ul>

      <Reveal from="fade" className="prose prose-measure mt-10 block">
        The foundations behind these — ninety-five committed lab exercises — are indexed in the{" "}
        <a
          className="text-ink underline decoration-accent/50 underline-offset-4 hover:decoration-accent"
          href={link("/index.html#archive")}
        >
          archive section
        </a>
        .
      </Reveal>
    </div>
  );
}

function ProjectRow({ system, index }: { system: System; index: number }) {
  return (
    <Spotlight className="h-full">
      <a
        href={projectHref(system.slug)}
        data-cursor-label="Open"
        className="group flex flex-col gap-5 bg-canvas-raised px-6 py-7 transition-colors duration-500 hover:bg-canvas-raised/60 md:flex-row md:items-start md:gap-10 md:px-8 md:py-9"
      >
        <span className="value-mono shrink-0 text-accent/70 md:w-10">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="label-mono mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <SystemMark slug={system.slug} className="text-[0.9rem] text-accent/70" />
            <span>{system.year}</span>
            <span aria-hidden="true" className="h-px w-5 bg-white/15" />
            <span className="normal-case tracking-normal text-ink-faint">{system.status}</span>
          </span>

          <span className="block max-w-[30ch] text-[clamp(1.125rem,0.9rem+0.8vw,1.5rem)] leading-snug font-medium text-ink transition-colors duration-300 group-hover:text-accent">
            {system.title}
          </span>

          <span className="prose prose-measure mt-3 block">{system.summary}</span>

          <span className="mt-4 flex flex-wrap gap-1.5">
            {system.stack.slice(0, 6).map((tool) => (
              <span
                key={tool}
                className="rounded-pill border border-white/12 px-2.5 py-1 font-mono text-micro tracking-wider text-ink-faint"
              >
                {tool}
              </span>
            ))}
            {system.stack.length > 6 ? (
              <span className="px-1 py-1 font-mono text-micro text-ink-faint">
                +{system.stack.length - 6}
              </span>
            ) : null}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-4 md:flex-col md:items-end md:gap-3">
          <span className="flex gap-6 md:flex-col">
            {system.metrics.slice(0, 2).map((metric) => (
              <span key={metric.label} className="text-right">
                <span className="value-mono block text-[1.125rem] leading-none">
                  {metric.value}
                </span>
                <span className="label-mono mt-1.5 block max-w-[16ch] leading-relaxed">
                  {metric.label}
                </span>
              </span>
            ))}
          </span>

          <span className="label-mono flex items-center gap-2 text-accent">
            Read
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      </a>
    </Spotlight>
  );
}

/**
 * ---------------------------------------------------------------------------
 *  Project detail
 * ---------------------------------------------------------------------------
 *  The deep dive an interviewer actually wants: the constraint, the decisions
 *  with their costs, the architecture, and the scope boundary.
 *
 *  Each system is a separate generated document at `/project/<slug>/`, so the
 *  page is linkable, indexable on its own, cacheable on its own, and survives
 *  being pasted into a hiring thread. `initialSlug` comes from the URL — the
 *  `?id=` query is still accepted so an older bookmark resolves.
 * ---------------------------------------------------------------------------
 */
export function ProjectDetail({ initialSlug }: { initialSlug: string | null }) {
  const [slug, setSlug] = useState<string | null>(initialSlug);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setSlug(id);
  }, []);

  const system = useMemo(() => (slug ? findSystem(slug) : undefined), [slug]);
  const index = system ? site.systems.indexOf(system) : -1;
  const previous = index > 0 ? site.systems[index - 1] : undefined;
  const next =
    index >= 0 && index < site.systems.length - 1 ? site.systems[index + 1] : undefined;

  if (!system) {
    return (
      <div className="pt-32">
        <p className="eyebrow mb-5">404</p>
        <h1 className="max-w-[24ch] text-[clamp(2rem,1rem+3.6vw,4.25rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance">
          No system by that name.
        </h1>
        <p className="prose prose-measure">
          The link may be from an older version of the site. The{" "}
          <a
            className="text-ink underline decoration-accent/50 underline-offset-4"
            href={link(ROUTES.projects)}
          >
            systems index
          </a>{" "}
          has all of them.
        </p>
      </div>
    );
  }

  const siblings = site.systems.filter((item) => item.slug !== system.slug);

  return (
    <article className="pt-28">
      {/* Sibling navigation. Seven sibling pages with no cross-link is the
          failure mode the research names as the reason a case study gets read
          once and never again: a reader who finishes one has to go back to an
          index to choose the next. The current position is stated rather than
          implied, because "03 / 07" is the whole orientation. */}
      <nav aria-label="Systems" className="mb-10">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          {site.systems.map((item, itemIndex) => {
            const current = item.slug === system.slug;
            return (
              <li key={item.slug}>
                <a
                  href={projectHref(item.slug)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "label-mono flex h-8 w-8 items-center justify-center rounded-pill border transition-all duration-300",
                    current
                      ? "border-accent bg-accent font-medium text-on-accent"
                      : "border-white/12 text-ink-faint hover:border-accent/60 hover:text-accent",
                  )}
                >
                  {String(itemIndex + 1).padStart(2, "0")}
                  {/* The accessible name is the project title. Without it the
                      switcher is seven identical two-digit numbers to anyone
                      navigating by screen reader or by voice. */}
                  <span className="sr-only">{item.title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <header className="mb-[clamp(2.5rem,5vw,4rem)]">
        <div className="mb-7 flex items-center gap-5">
          {/* The mark sits above the eyebrow rather than beside the title: at
              this size it reads as a stamp opening the document, and beside a
              3.5rem headline it would compete with it. */}
          <SystemMark
            slug={system.slug}
            className="shrink-0 text-[2.25rem] text-accent/85 md:text-[2.75rem]"
          />
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2">
            <a
              href={link(ROUTES.projects)}
              className="label-mono inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
              All systems
            </a>
            <span aria-hidden="true" className="h-px w-6 bg-white/15" />
            <span>
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(site.systems.length).padStart(2, "0")}
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-white/15" />
            <span>{system.year}</span>
            <span aria-hidden="true" className="h-px w-6 bg-white/15" />
            <span className="normal-case tracking-normal text-ink-faint">{system.status}</span>
          </p>
        </div>
        <Reveal
          as="h1"
          className="max-w-[26ch] text-[clamp(1.875rem,1rem+2.8vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.028em] text-balance"
          from="mask"
        >
          {system.title}
        </Reveal>
        <Reveal from="lift" delay={0.08} className="lede prose-measure mt-7 block">
          {system.summary}
        </Reveal>
      </header>

      <dl className="mb-[clamp(2.5rem,5vw,4rem)] grid grid-cols-2 gap-x-6 gap-y-6 border-y border-white/10 py-8 sm:grid-cols-3 lg:grid-cols-6">
        {system.metrics.map((metric) => (
          <div key={metric.label}>
            <dd className="value-mono text-[1.375rem] leading-none">{metric.value}</dd>
            <dt className="label-mono mt-2.5 leading-relaxed">{metric.label}</dt>
          </div>
        ))}
      </dl>

      <section className="mb-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="eyebrow mb-4">The hard part</h2>
        <p className="max-w-[54ch] text-[clamp(1.0625rem,0.95rem+0.45vw,1.3125rem)] leading-[1.55] text-ink">
          {system.constraint}
        </p>
      </section>

      {system.diagram ? (
        <section className="mb-[clamp(2.5rem,5vw,4rem)]">
          <h2 className="eyebrow mb-3">Architecture</h2>
          <pre className="card overflow-x-auto p-5 font-mono text-[0.6875rem] leading-[1.55] text-ink-muted">
            <code>{system.diagram}</code>
          </pre>
        </section>
      ) : null}

      <section className="mb-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="eyebrow mb-2">Decisions</h2>
        <p className="prose prose-measure mb-7">
          Each decision is printed with what it cost. A project where every choice was free is
          not describing itself honestly.
        </p>
        <ol className="border-t border-white/10">
          {system.decisions.map((item, index) => (
            <li
              key={item.decision}
              className="grid gap-4 border-b border-white/10 py-7 md:grid-cols-[3rem_1fr] md:gap-8"
            >
              <span className="value-mono text-accent/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="max-w-[40ch] text-[1.125rem] leading-snug font-medium text-ink">
                  {item.decision}
                </h3>
                <dl className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="label-mono mb-2">Why</dt>
                    <dd className="prose">{item.why}</dd>
                  </div>
                  <div>
                    <dt className="label-mono mb-2 text-warn">Cost</dt>
                    <dd className="prose">{item.cost}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="eyebrow mb-4 text-warn">Deliberately not built</h2>
        <ul className="flex flex-col gap-3">
          {system.notBuilt.map((item) => (
            <li key={item} className="prose flex max-w-[58ch] gap-3">
              <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-warn" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-[clamp(2.5rem,5vw,4rem)] flex flex-wrap items-center gap-x-8 gap-y-4">
        <div>
          <h2 className="eyebrow mb-3">Stack</h2>
          <ul className="flex flex-wrap gap-1.5">
            {system.stack.map((tool) => (
              <li
                key={tool}
                className="rounded-pill border border-white/12 px-2.5 py-1 font-mono text-micro tracking-wider text-ink-faint"
              >
                {tool}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow mb-3">Source</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {system.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer noopener" : undefined}
                  className="group inline-flex items-center gap-2 font-mono text-small text-ink-muted transition-colors hover:text-accent"
                >
                  {link.label}
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
      </section>

      <section className="border-t border-white/10 pt-10">
        <h2 className="eyebrow mb-5">Every other system</h2>
        <ul className="grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/10 sm:grid-cols-2">
          {siblings.map((item) => (
            <li key={item.slug}>
              <a
                href={projectHref(item.slug)}
                className="group flex h-full items-baseline gap-3 bg-canvas-raised px-5 py-4 transition-colors duration-300 hover:bg-canvas-raised/60"
              >
                <span className="value-mono text-accent/60">
                  {String(site.systems.indexOf(item) + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-body text-ink-muted transition-colors group-hover:text-accent">
                  {item.title}
                </span>
                <span className="label-mono shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Sequential navigation. A reader who lands on one system from a search
          result or a shared link should be able to reach the next one without
          going back to the index, and the pair states which is which rather than
          leaving the reader to guess from the direction of an arrow. */}
      <nav
        aria-label="Adjacent systems"
        className="mt-10 grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/10 sm:grid-cols-2"
      >
        {previous ? (
          <a
            href={projectHref(previous.slug)}
            className="group flex flex-col gap-2 bg-canvas-raised px-6 py-6 transition-colors duration-300 hover:bg-canvas-raised/60"
          >
            <span className="label-mono flex items-center gap-2 text-ink-faint">
              <span aria-hidden="true">←</span> Previous
            </span>
            <span className="text-body leading-snug text-ink transition-colors group-hover:text-accent">
              {previous.title}
            </span>
          </a>
        ) : (
          <span className="hidden bg-canvas-raised/40 px-6 py-6 sm:block" />
        )}
        {next ? (
          <a
            href={projectHref(next.slug)}
            className="group flex flex-col items-end gap-2 bg-canvas-raised px-6 py-6 text-right transition-colors duration-300 hover:bg-canvas-raised/60"
          >
            <span className="label-mono flex items-center gap-2 text-ink-faint">
              Next <span aria-hidden="true">→</span>
            </span>
            <span className="text-body leading-snug text-ink transition-colors group-hover:text-accent">
              {next.title}
            </span>
          </a>
        ) : (
          <span className="hidden bg-canvas-raised/40 px-6 py-6 sm:block" />
        )}
      </nav>

      <p className="mt-8 text-small">
        <a
          href={link(ROUTES.home)}
          className="label-mono inline-flex items-center gap-2 transition-colors hover:text-accent"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to the overview
        </a>
      </p>
    </article>
  );
}

function findSystem(slug: string): System | undefined {
  return site.systems.find((item) => item.slug === slug);
}
