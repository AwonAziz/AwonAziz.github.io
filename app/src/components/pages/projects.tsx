import { useEffect, useMemo, useState } from "react";
import { type System, site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { Reveal } from "../ui/reveal";
import { Spotlight } from "../ui/spotlight";

/**
 * ---------------------------------------------------------------------------
 *  Project index
 * ---------------------------------------------------------------------------
 *  A separate page rather than a section, deliberately.
 *
 *  Eye-tracking research on document reading (NN/g, 130,000 fixations) is
 *  unambiguous about where attention goes: 57% of viewing time above the fold,
 *  74% within the first two screenfuls. A portfolio is a pass/fail filter, so
 *  the work has to be reachable without scrolling — and "here are five projects,
 *  each with a page" is a shorter path than five long disclosures on one page.
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
            05
          </span>
          <span aria-hidden="true" className="h-px w-8 translate-y-[-0.25em] bg-white/15" />
          {site.systems.length} systems
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
          Five systems, each answering a question the last one could not.
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
          href="./index.html#archive"
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
        href={`./project.html?id=${system.slug}`}
        data-cursor-label="Open"
        className="group flex flex-col gap-5 bg-canvas-raised px-6 py-7 transition-colors duration-500 hover:bg-canvas-raised/60 md:flex-row md:items-start md:gap-10 md:px-8 md:py-9"
      >
        <span className="value-mono shrink-0 text-accent/70 md:w-10">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="min-w-0 flex-1">
          <span className="label-mono mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
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
 *  with their costs, the architecture, and the scope boundary. A separate URL,
 *  so it is linkable, shareable internally, and survives being pasted into a
 *  hiring thread.
 * ---------------------------------------------------------------------------
 */
export function ProjectDetail() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    setSlug(id);
    // A slug the reader arrived with is written back without the query, so
    // a reload is not a different page and the URL stays shareable.
    if (id) document.title = `${findSystem(id)?.title ?? "Project"} — Awon Aziz`;
  }, []);

  const system = useMemo(() => (slug ? findSystem(slug) : undefined), [slug]);

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
            href="./projects/"
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
      <nav aria-label="Breadcrumb" className="mb-10">
        <a
          href="./projects.html"
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
      </nav>

      <header className="mb-[clamp(2.5rem,5vw,4rem)]">
        <p className="eyebrow mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>{system.year}</span>
          <span aria-hidden="true" className="h-px w-6 bg-white/15" />
          <span className="normal-case tracking-normal text-ink-faint">{system.status}</span>
        </p>
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
        <h2 className="eyebrow mb-5">Elsewhere on this site</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {siblings.map((item) => (
            <li key={item.slug}>
              <a
                href={`./project.html?id=${item.slug}`}
                className="group flex items-baseline gap-3 text-body text-ink-muted transition-colors hover:text-accent"
              >
                <span className="value-mono text-accent/60">
                  {String(site.systems.indexOf(item) + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 truncate">{item.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className={cn("mt-8", motionBlocked ? "text-small" : "text-small")}>
          <a
            href="./index.html"
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
      </section>
    </article>
  );
}

function findSystem(slug: string): System | undefined {
  return site.systems.find((item) => item.slug === slug);
}
