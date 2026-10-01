import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./ui/reveal";

export interface SectionProps {
  id: string;
  /** Small mono label above the title. */
  eyebrow?: string;
  title?: ReactNode;
  /** Intro paragraph, rendered at prose measure. */
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Grid variant. This is the cheapest high-impact move in the whole layout and
   * it costs zero JavaScript: alternate the column split between sections so
   * the eye reads rhythm instead of repetition, and a page of stacked boxes
   * becomes a page with a cadence.
   *
   *   wide-left   8 + 4     content dominant
   *   wide-right  4 + 8     meta and body swap sides
   *   meta-right  9 + 3     thin meta column
   *   meta-left   3 + 9     meta leads
   */
  split?: "wide-left" | "wide-right" | "meta-right" | "meta-left";
  /** Skip the legibility scrim. Only for sections that are entirely solid. */
  scrim?: boolean;
}

const SPLIT_CLASSES: Record<NonNullable<SectionProps["split"]>, string> = {
  "wide-left": "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16",
  "wide-right": "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16",
  "meta-right": "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)] lg:gap-16",
  "meta-left": "lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-16",
};

/**
 * ---------------------------------------------------------------------------
 *  Section
 * ---------------------------------------------------------------------------
 *  The header and the body live in a two-column grid whose ratio alternates per
 *  section. That alternation — "push and pop" — is the single cheapest fix for
 *  the stacked-boxed-sections look that makes developer portfolios feel cheap,
 *  and it is pure layout: no JS, no motion, no extra markup.
 *
 *  Note what is *not* happening here: the section is full shell width, while
 *  prose inside it caps at 68ch and stays left-aligned. Decoupling section
 *  width from prose measure is what makes a 20,000px page read as one left edge
 *  with a ragged right, rather than as a column of boxes floating in a wide
 *  viewport. Centring prose inside a wide box is the single most common thing
 *  that makes a technical page feel unconsidered.
 * ---------------------------------------------------------------------------
 */
export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className,
  split = "wide-left",
  scrim = true,
}: SectionProps) {
  return (
    <section
      id={id}
      // `data-scroll-section` is the contract the ScrollTriggers, the nav and
      // the minimap all key off. Add it to any new section.
      data-scroll-section={id}
      className={cn("relative scroll-mt-24", className)}
    >
      {scrim ? (
        <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />
      ) : null}

      <div className="shell relative section-pad">
        {eyebrow || title || lede ? (
          <header
            className={cn(
              "mb-[clamp(2.5rem,5vw,4rem)] grid items-end gap-x-16 gap-y-6",
              SPLIT_CLASSES[split],
            )}
          >
            <div className={split === "meta-left" ? "lg:col-start-2" : undefined}>
              {eyebrow ? <p className="eyebrow mb-5">{eyebrow}</p> : null}
              {title ? (
                <Reveal as="h2" className="title max-w-[20ch]" from="mask" start="top 90%">
                  {title}
                </Reveal>
              ) : null}
              {lede ? (
                <Reveal from="lift" delay={0.08} className="lede prose-measure mt-7 block">
                  {lede}
                </Reveal>
              ) : null}
            </div>
          </header>
        ) : null}

        {children}
      </div>
    </section>
  );
}

/**
 * An edge-to-edge band that escapes the padded content column.
 *
 * Carries one number, one rule, or one line. Implemented with a three-column
 * grid bust-out rather than a negative margin, so it does not fight the sticky
 * header and does not create a horizontal scrollbar. The highest ratio of
 * perceived effort to code in the layout kit.
 */
export function BleedBand({ children }: { children: ReactNode }) {
  return (
    <div className="shell relative">
      <div className="lg:grid lg:grid-cols-[1fr_min(0,100%)_1fr]">
        <div className="lg:col-span-3">
          <div className="border-y border-white/10 py-6 md:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A hairline rule with a mono label. Used between dense blocks. */
export function Rule({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-white/10 pt-4">
      {label ? <span className="eyebrow">{label}</span> : null}
      <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
    </div>
  );
}
