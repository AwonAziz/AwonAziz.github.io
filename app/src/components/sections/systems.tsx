import { site } from "@/config/site.data";
import { SectionEyebrow, useSectionNumber } from "../section";
import { Reveal } from "../ui/reveal";
import { SystemGrid } from "../ui/system-card";

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

        {/* The grid's own gap does the spacing now. The old wrapper used
            `clamp(3.5rem, 7vw, 7rem)` between full case studies, which was correct
            when each entry was ~2,500px and absurd at ~380px — a whole extra
            screen of whitespace between two cards. */}
        <SystemGrid />
      </div>
    </section>
  );
}
