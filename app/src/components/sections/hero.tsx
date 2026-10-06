import { useGSAP } from "@gsap/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { gsap, SplitText } from "@/providers/smooth-scroll";
import { Approach } from "../ui/approach";
import { DecodeText } from "../ui/decode-text";
import { VelocityMarquee } from "../ui/marquee";
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
  //
  // Split is **words**, not lines or characters. A 45-character claim decoded or
  // revealed per character is slow enough that a reader waits for it; per word
  // it reads as a sentence arriving. Per character is reserved for the short
  // mono lines below, where it is genuinely the right instrument.
  useGSAP(
    () => {
      const el = headlineRef.current;
      if (!el || motionBlocked) return;

      const split = SplitText.create(el, { type: "words", mask: "words", autoSplit: true });

      gsap.from(split.words, {
        yPercent: 118,
        duration: 0.85,
        stagger: 0.045,
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
      // Opts out of the sequence numbering: the hero is the top of the document,
      // so calling it "section 01" is a lie about where it is.
      data-scroll-index="off"
      // `overflow-clip` as a backstop for the local scrim below, which is
      // wider than the prose it sits behind.
      className="relative flex min-h-[92svh] flex-col justify-end overflow-clip pb-[clamp(2.5rem,6vw,4.5rem)] pt-32"
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
            <DecodeText text={site.headline.availability} speed={22} delay={520} />
          </span>
          <span aria-hidden="true" className="hidden h-px w-8 bg-white/15 sm:block" />
          <span className="text-ink-faint">
            <DecodeText text={site.meta.location} speed={22} delay={880} />
          </span>
        </p>

        <h1
          ref={headlineRef}
          // `relative z-10` so the local scrim below cannot paint over the
          // headline. An absolutely-positioned sibling with `z-index: 0` is
          // painted after in-flow content, so it was dimming the headline's
          // lower lines even though every word's computed colour was identical.
          className="display relative z-10 max-w-[16ch] text-balance"
          aria-label={site.headline.claim}
        >
          {site.headline.claim}
        </h1>

        {/* Two widths, deliberately. The headline runs the shell; everything
            below caps at prose measure and stays left-aligned. */}
        <div className="mt-[clamp(1.75rem,4vw,3rem)] grid gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          {/* Local scrim behind the hero paragraph specifically.
              Dimming the rain field further to clear 4.5:1 on the worst frame
              was measured at costing the effect everywhere on the page for a
              0.25 contrast gain. This is the better lever: a soft elliptical
              fade in the canvas colour, sized to the paragraph and invisible
              against an already-near-black base, which removes the rain from
              behind this block of text only.

              `z-0` rather than a negative z-index. The WebGL canvas is
              `fixed` at `-z-10`, so a negative value here competes with it and
              the scrim renders behind the scene — which is exactly what the
              first attempt did, and why it changed the measurement by 0.06.

              Width is capped at 80%: the paragraph occupies about 72% of the
              grid row, and a wider scrim pushed past the shell and added
              448px of horizontal overflow at 1280px. The section clips as a
              backstop regardless. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-0 z-0 h-[220%] w-[80%] -translate-y-1/2"
            style={{
              background:
                "radial-gradient(58% 50% at 42% 50%, var(--color-canvas) 0%, color-mix(in oklab, var(--color-canvas) 90%, transparent) 42%, transparent 70%)",
            }}
          />
          <Reveal from="lift" delay={0.1} className="lede prose-measure relative z-10 block">
            {site.headline.sub}
          </Reveal>

          <div data-hero-fade className="flex flex-wrap items-center gap-3">
            {/*
              `Approach` rather than `Magnetic`. The magnet pulls once the cursor is
              already inside the bounds, which reads as a snap; this ramps from
              ~130px out, so the button is already lifting while the pointer is
              still approaching it. That is the difference between an effect and a
              reaction to one.

              Two elements in this view carry the effect, which is the budget — the
              rest of the hero already has the headline decode and the marquee.
            */}
            <Approach radius={140}>
              <a
                href="#systems"
                data-cursor-label="Read"
                className="group relative inline-flex items-center gap-3 rounded-pill bg-accent px-6 py-3.5 font-mono text-small font-medium on-accent transition-shadow duration-300"
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
            </Approach>

            <Approach radius={140}>
              <a
                href="#runtime"
                data-cursor-label="Live"
                className="inline-flex items-center gap-2.5 rounded-pill border border-white/12 px-6 py-3.5 font-mono text-small text-ink-muted transition-colors duration-300 hover:border-accent/50 hover:text-ink"
              >
                <span aria-hidden="true" className="status-dot status-ok animate-pulse-dot" />
                {site.headline.ctaSecondary}
              </a>
            </Approach>
          </div>
        </div>

        {/* Live capability readout. Hidden from AT: the headline and the
            availability line above already carry everything this says. */}
        <p
          aria-hidden="true"
          className="mt-10 flex items-center gap-2 font-mono text-micro tracking-widest text-ink-faint"
        >
          <span className="text-accent">$</span>
          {/* Per-character reveal, not a scramble: glyphs resolving left to
              right is what reads as typing. A scramble stands in for content
              the author did not have. */}
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
    <div aria-hidden="true" className="relative border-y border-white/10">
      <Reveal from="fade" immediate className="block">
        <VelocityMarquee
          items={site.marquee}
          // px/second of idle drift, and px of extra travel per px of scroll
          // velocity. The second number is the point: the strip visibly
          // accelerates and stalls with the page rather than running on a timer.
          drift={16}
          gain={0.45}
          separator=""
          className="py-6"
        />
        {/* Hairlines top and bottom, since the drift sits between them. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </Reveal>
    </div>
  );
}

/** Larger, mono-set marquee used between dense sections for rhythm. */
export function FlowBand({ items, label }: { items: string[]; label?: string }) {
  return (
    <div className="relative border-y border-white/10 bg-canvas-sunken/40">
      <VelocityMarquee
        items={items}
        drift={26}
        gain={0.7}
        separator="◆"
        className="py-4 font-mono text-small tracking-tight text-ink/25"
      />
      {label ? (
        <p className="label-mono pointer-events-none absolute top-1/2 left-6 -translate-y-1/2 bg-canvas-sunken/90 px-2">
          {label}
        </p>
      ) : null}
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
