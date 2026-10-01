import { useGSAP } from "@gsap/react";
import { type ElementType, type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { gsap, SplitText } from "@/providers/smooth-scroll";

export interface RevealProps {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger between split units, in seconds. Total stagger stays under 0.5s. */
  stagger?: number;
  /** Delay before the first unit animates. */
  delay?: number;
  start?: string;
  /** Reveal on mount instead of waiting for a scroll trigger. */
  immediate?: boolean;
  /**
   * How the units arrive.
   *
   * `mask` is the default for display type and `lift` is only for short body
   * strings. The reason is specific: a uniform `opacity + y` fade-up on
   * everything is the single most over-used scroll animation there is — it is
   * the AOS/ScrollReveal heritage, and once a page uses it on every element it
   * reads as a template rather than as design. A mask reveal is quieter and
   * costs the same.
   */
  from?: "mask" | "lift" | "fade";
  /** Shorten the duration for content already in view at load. */
  duration?: number;
}

/**
 * ---------------------------------------------------------------------------
 *  Reveal
 * ---------------------------------------------------------------------------
 *  Uses GSAP's rewritten SplitText: it is ~50% smaller than the old one, ships
 *  its own TypeScript types, handles `autoSplit` on resize, and applies the
 *  accessibility attributes itself — split text is otherwise a screen-reader
 *  regression that most templates ignore.
 *
 *  `mask: "lines"` wraps each line in an overflow-hidden element, so the
 *  "rise out of nothing" reveal needs zero extra markup and survives a resize
 *  without leaving orphaned spans.
 *
 *  Timing follows what the real design systems ship: ~0.6s entrances on
 *  `power3.out`, with per-line stagger in the 0.04-0.08s range. Character-level
 *  stagger is deliberately not offered — on a long headline it is the effect
 *  that most reliably reads as cheap.
 * ---------------------------------------------------------------------------
 */
export function Reveal({
  children,
  as = "div",
  className,
  stagger = 0.055,
  delay = 0,
  start = "top 88%",
  immediate = false,
  from = "mask",
  duration = 0.62,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (motionBlocked) {
        gsap.set(el, { opacity: 1, y: 0, yPercent: 0, clipPath: "none", filter: "none" });
        return;
      }

      // Splitting a single short line buys nothing and costs a DOM pass, so
      // `fade` and `lift` skip SplitText entirely.
      if (from === "fade") {
        gsap.fromTo(
          el,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: "power3.out",
            scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
          },
        );
        return;
      }

      if (from === "lift") {
        gsap.fromTo(
          el,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: "power3.out",
            scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
          },
        );
        return;
      }

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
      });

      const lines = split.lines ?? [];
      if (lines.length === 0) {
        gsap.set(el, { opacity: 1 });
        return;
      }

      gsap.fromTo(
        lines,
        { yPercent: 112 },
        {
          yPercent: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
        },
      );

      return () => split.revert();
    },
    { scope: ref, dependencies: [immediate, from, stagger, delay, start, duration] },
  );

  // `as` is intentionally loose: this is a presentational wrapper, and a full
  // polymorphic-component type costs more here than it returns. The tag resolves
  // at render time so TypeScript never has to infer props for an arbitrary
  // intrinsic element.
  // biome-ignore lint/suspicious/noExplicitAny: intentional dynamic element
  const Tag = as as any;

  return (
    <Tag ref={ref} className={cn("relative", className)}>
      {children}
    </Tag>
  );
}
