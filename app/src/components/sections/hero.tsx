import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { gsap, SplitText } from "@/providers/smooth-scroll";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Hero
 * ---------------------------------------------------------------------------
 *  With no employment history this is the only positioning asset the page has,
 *  so the fold states level, domain, place and availability rather than a
 *  persona adjective. "Creative engineer" exists on four million sites and
 *  communicates nothing; "entry-level AI/MLOps engineer, open to remote" can be
 *  matched against a job description in six seconds.
 *
 *  Composition notes, from the research:
 *
 *  - The headline spans the full shell width while the supporting paragraph caps
 *    at prose measure and stays left-aligned. That decoupling is what makes a
 *    long page read as one left edge with a ragged right instead of a column of
 *    boxes. The headline is *allowed* to run wide precisely because the
 *    paragraph below it does not.
 *  - Density contrast: the hero is enormous and nearly empty, and the Systems
 *    section below it is the densest thing on the page. Every real design system
 *    surveyed does this, and it is why the fold reads as confident rather than
 *    as a loading state.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [role, setRole] = useState(site.hero.rotating[0] ?? "");

  // Fires immediately on mount. The previous version gated this behind the
  // preloader clearing; with no preloader, the headline is the first thing on
  // the page and it animates in on the first frame, which is the whole point.
  useGSAP(
    () => {
      const el = headlineRef.current;
      if (!el || motionBlocked) return;

      const split = SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true });

      gsap.from(split.lines, {
        yPercent: 112,
        duration: 0.9,
        stagger: 0.07,
        ease: "power3.out",
      });

      gsap.from("[data-hero-fade]", {
        opacity: 0,
        y: 16,
        duration: 0.55,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.28,
      });

      return () => split.revert();
    },
    { scope: rootRef, dependencies: [] },
  );

  // Rotating capability line, revealed per character.
  //
  // Not a scramble. A scramble stands in for content the author did not have;
  // what actually reads as *typing* is glyphs resolving left to right, which is
  // the technique IBM uses for its own developer brand. The difference is
  // obvious on screen: one is an effect, the other is a cursor.
  useEffect(() => {
    const words = site.hero.rotating;
    if (motionBlocked || words.length < 2) {
      setRole(words[0] ?? "");
      return;
    }

    let index = 0;
    let resolved = 0;
    let hold = 0;
    let timer = 0;
    const PER_CHAR_MS = 34;
    const BLANK_FRAMES = 80;

    const step = () => {
      const current = words[index % words.length] ?? "";

      if (hold > 0) {
        // Blank the line between words rather than cross-fading, which is what a
        // terminal actually does when a command finishes.
        hold -= 1;
        if (hold === 0) {
          index += 1;
          resolved = 0;
        }
      } else if (resolved >= current.length) {
        hold = BLANK_FRAMES;
      } else {
        resolved += 1;
        setRole(current.slice(0, resolved));
      }

      timer = window.setTimeout(step, resolved >= current.length ? 40 : PER_CHAR_MS);
    };

    timer = window.setTimeout(step, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      data-scroll-section="top"
      className="relative flex min-h-[92svh] flex-col justify-end pb-[clamp(2.5rem,6vw,4.5rem)] pt-32"
    >
      {/* Legibility scrim. The rain is additive light running behind the
          headline, so this guarantees the contrast ratio holds on every frame
          rather than only when no glyph is passing behind a word. */}
      <div aria-hidden="true" className="scrim-left pointer-events-none absolute inset-0" />

      <div className="shell relative flex flex-1 flex-col justify-end">
        {/* Positioning line. Level, domain and availability, all above the fold. */}
        <p
          data-hero-fade
          className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-micro tracking-widest"
        >
          <span className="inline-flex items-center gap-2.5 text-ink-muted">
            <span aria-hidden="true" className="status-dot status-ok animate-pulse-dot" />
            {site.headline.availability}
          </span>
          <span aria-hidden="true" className="hidden h-px w-8 bg-white/15 sm:block" />
          <span className="text-ink-faint">{site.meta.location}</span>
        </p>

        <h1
          ref={headlineRef}
          className="display max-w-[16ch] text-balance"
          aria-label={site.headline.claim}
        >
          {site.headline.claim}
        </h1>

        {/* Two widths, deliberately. The headline runs the shell; everything
            below caps at prose measure and stays left-aligned. */}
        <div className="mt-[clamp(1.75rem,4vw,3rem)] grid gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Reveal from="lift" delay={0.1} className="lede prose-measure block">
            {site.headline.sub}
          </Reveal>

          <div data-hero-fade className="flex flex-wrap items-center gap-3">
            <a
              href="#systems"
              data-cursor-label="Read"
              className="group inline-flex items-center gap-3 rounded-pill bg-accent px-6 py-3.5 font-mono text-small font-medium text-canvas transition-transform hover:scale-[1.03]"
            >
              {site.headline.ctaPrimary}
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
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

            <a
              href="#runtime"
              data-cursor-label="Live"
              className="inline-flex items-center gap-2.5 rounded-pill border border-white/12 px-6 py-3.5 font-mono text-small text-ink-muted transition-colors duration-300 hover:border-accent/50 hover:text-ink"
            >
              <span aria-hidden="true" className="status-dot status-ok animate-pulse-dot" />
              {site.headline.ctaSecondary}
            </a>
          </div>
        </div>

        {/* Live capability readout. Hidden from AT: the headline and the
            availability line above already carry everything this says. */}
        <p
          aria-hidden="true"
          className="mt-10 flex items-center gap-2 font-mono text-micro tracking-widest text-ink-faint"
        >
          <span className="text-accent">$</span>
          <span className="min-w-[16rem]">{role}</span>
          <span className="animate-caret">_</span>
        </p>
      </div>
    </section>
  );
}

/**
 * Full-bleed strip of the actual toolchain.
 *
 * Deliberately not a "stack" section. A list claiming everything equally is
 * senior in nothing; the toolchain appears here as a texture and per-project
 * where it can be read in context, never as its own claim.
 */
export function SkillTicker() {
  return (
    <div aria-hidden="true" className="relative border-y border-white/10 py-5">
      <Reveal from="fade" immediate className="block">
        <div className="flex overflow-hidden">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="animate-drift flex shrink-0 items-center gap-10 pr-10"
              style={{ ["--duration" as string]: "48s" }}
            >
              {site.marquee.map((item) => (
                <span
                  key={item}
                  className="font-display text-[clamp(0.9375rem,1.6vw,1.25rem)] whitespace-nowrap tracking-tight text-ink/20"
                >
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

/** The scroll affordance. Sits with the hero rather than floating over content. */
export function ScrollHint({ label }: { label: string }) {
  return (
    <p
      aria-hidden="true"
      className={cn(
        "label-mono pointer-events-none absolute right-5 bottom-6 hidden lg:block",
        "rotate-90 origin-bottom-right",
      )}
    >
      {label}
    </p>
  );
}
