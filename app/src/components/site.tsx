import { site } from "@/config/site.data";
import { Nav } from "./nav";
import { Archive, Currently, Education } from "./sections/archive";
import { CapabilityIndex } from "./sections/capability-index";
import { Contact, Footer } from "./sections/contact";
import { Faq } from "./sections/faq";
import { FlowBand, Hero } from "./sections/hero";
import { Method } from "./sections/method";
import { Runtime } from "./sections/runtime";
import { Systems } from "./sections/systems";
import { Grain, PageRails, Scanlines } from "./ui/chrome";
import { CountUp } from "./ui/count-up";
import { Minimap, ProgressRule } from "./ui/minimap";
import { ReticleCursor } from "./ui/reticle-cursor";

/**
 * ---------------------------------------------------------------------------
 *  Page composition
 * ---------------------------------------------------------------------------
 *  Ordered against a review budget of roughly 55 seconds, because a portfolio is
 *  a pass/fail filter and a routing tool, not a persuasion document:
 *
 *    1. Hero        positioning above the fold — the only positioning asset
 *                   available to someone with no employment timeline
 *    2. Systems     projects inside the first two sections, not after a bio
 *    3. Runtime     the site reports on itself; answers "did you build it"
 *    4. Method      working claims with evidence, plus the no-go log
 *    5. Archive     foundation work, subordinate by construction
 *    6. Currently   dated, labelled intent — the one place WIP is allowed
 *    7. Education   qualifications, never presented as employment
 *    8. FAQ         the questions a technical reader arrives with
 *    9. Contact     boring, obvious, non-negotiable
 *
 *  Couplings to remember when editing:
 *
 *  - `Section`'s `split` prop alternates the header/body column ratio. That
 *    alternation is what keeps a 20,000px page from reading as a stack of
 *    identical boxes — change two sections to the same ratio and the rhythm
 *    breaks.
 *  - `Minimap` keeps its own section list. If you add or reorder a section, add
 *    it there too.
 *  - `Nav` and `Minimap` both derive state from `[data-scroll-section]`, so any
 *    section that should be reachable needs that attribute.
 * ---------------------------------------------------------------------------
 */
export function Site() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-pill focus:bg-accent focus:px-5 focus:py-3 focus:font-mono focus:text-small focus:on-accent"
      >
        Skip to content
      </a>

      <ProgressRule />
      <PageRails />
      <Grain />
      <Scanlines />
      <Nav />
      <ReticleCursor />
      <Minimap />

      <main id="main">
        <Hero />
        <StatsBand />
        <Systems />
        {/* Rhythm break between two dense sections. The strip accelerates with
            scroll velocity, so it also acts as a read-out of how fast the
            reader is moving. */}
        <FlowBand items={site.marquee} label="Stack, in use" />
        <Runtime />
        <CapabilityIndex />
        <Method />
        <Archive />
        <Currently />
        <Education />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

/**
 * Countable claims, immediately under the fold.
 *
 * Placed before the systems rather than after the hero text because these are
 * the numbers a reviewer scans for first, and having to scroll past an
 * introduction to reach them is the thing that makes portfolios feel like
 * marketing. Every value is a count that can be counted.
 *
 * These four use a **native CSS scroll-driven animation** rather than a GSAP
 * trigger. That is the deliberate division of labour: four elements fading in on
 * entry need no shared clock, no JS and no main-thread work, and handing them to
 * the compositor is free. GSAP is reserved for the reveals that need it — the
 * headline split, the section headers — where a shared clock and a callback are
 * genuinely required. Wrapping every small element in a ScrollTrigger instead
 * would be the uniform-animation pattern that reads as a template.
 */
function StatsBand() {
  return (
    <section aria-label="At a glance" className="relative border-y border-white/10">
      <div className="shell">
        <dl className="grid grid-cols-2 gap-px lg:grid-cols-4">
          {site.stats.map((stat, index) => (
            <div
              key={stat.label}
              className="scroll-fade-in border-white/10 py-8 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0"
              // Staggered by hand rather than with a shared timeline: four
              // elements, and `animation-delay` costs nothing where four
              // ScrollTrigger objects would.
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <dd className="value-mono text-[clamp(1.75rem,1rem+2.6vw,2.75rem)] leading-none">
                <CountUp value={stat.value} />
              </dd>
              <dt className="label-mono mt-3 leading-relaxed">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
