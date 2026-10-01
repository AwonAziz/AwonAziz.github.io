import { site } from "@/config/site.data";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  FAQ
 * ---------------------------------------------------------------------------
 *  Adapted from a pattern common on agency portfolio sites, where the FAQ block
 *  doubles as SEO surface. Here it earns its place for a different reason: these
 *  are the four questions a technical reader actually arrives with, and every
 *  answer points at a specific command, threshold or test rather than
 *  reassuring.
 *
 *  It sits directly before Contact so the objections are resolved at the moment
 *  someone is deciding whether to write, not buried in the middle.
 *
 *  Native `<details>`/`<summary>`: no JS, keyboard and screen-reader support for
 *  free, and the answer is in the DOM for search engines whether or not it is
 *  expanded. A disclosure that janks is worse than one that snaps, and animating
 *  `<details>` height requires measuring it.
 * ---------------------------------------------------------------------------
 */
export function Faq() {
  return (
    <section
      id="faq"
      data-scroll-section="faq"
      className="relative scroll-mt-24 border-t border-white/10"
    >
      <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />

      <div className="shell relative section-pad">
        <header className="mb-[clamp(3rem,6vw,5rem)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div>
            <p className="eyebrow mb-5">Before you write</p>
            <Reveal from="lift" className="lede prose-measure block">
              Answered with commands and thresholds rather than reassurance, because those are
              the only two things a technical reader can check.
            </Reveal>
          </div>
          <div>
            <Reveal as="h2" className="title max-w-[18ch]" from="mask">
              The {site.faq.length} questions worth asking first.
            </Reveal>
          </div>
        </header>

        <ul className="border-t border-white/10">
          {site.faq.map((entry, index) => (
            <li key={entry.question} className="border-b border-white/10">
              <details className="group" name="faq" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start gap-5 py-6 [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 font-mono text-micro text-accent"
                  >
                    Q{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[clamp(1.0625rem,0.95rem+0.45vw,1.4375rem)] leading-snug font-medium text-ink transition-colors group-open:text-accent">
                    {entry.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1 shrink-0 font-mono text-micro text-ink-faint transition-transform duration-500 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>

                <div className="grid gap-4 pb-7 pl-9 sm:grid-cols-2">
                  {entry.points.map((point) => (
                    <p key={point} className="prose flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-3 h-px w-3 shrink-0 bg-accent/60"
                      />
                      <span className="prose-measure">{point}</span>
                    </p>
                  ))}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
