import { site } from "@/config/site.data";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Method
 * ---------------------------------------------------------------------------
 *  Two halves that belong together.
 *
 *  **How I work** substitutes for the employment timeline this portfolio does
 *  not have. Each claim is paired with something openable — a file, a number, a
 *  test — because an unevidenced principle is a slogan.
 *
 *  **The no-go log** is the credibility multiplier. It only works because the
 *  rest of the page is verifiable: a project that has never failed is a project
 *  nobody has run. The framing is the load-bearing part, and the entries are
 *  dated so a reader can see them accumulate.
 *
 *  The 50/50 split here is deliberate: after two dense sections the page needs
 *  a change of rhythm, and two narrow columns side by side read differently
 *  from anything else on the site without a single line of motion.
 * ---------------------------------------------------------------------------
 */
export function Method() {
  return (
    <section
      id="method"
      data-scroll-section="method"
      className="relative scroll-mt-24 border-t border-white/10"
    >
      <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />

      <div className="shell relative section-pad">
        <header className="mb-[clamp(3rem,6vw,5rem)] max-w-[34rem]">
          <p className="eyebrow mb-5">Method</p>
          <Reveal as="h2" className="title max-w-[20ch]" from="mask">
            Negative results are deliverables.
          </Reveal>
          <Reveal from="lift" delay={0.08} className="lede prose-measure mt-7 block">
            There is no employment timeline on this page, so the working claims have to stand on
            their own. Each is paired with a file you can open. And underneath them is the log
            of what did not work — which is only worth printing because everything above it is
            checkable.
          </Reveal>
        </header>

        <div className="grid gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-2 lg:gap-12">
          <Practice />
          <NoGoLog />
        </div>
      </div>
    </section>
  );
}

function Practice() {
  return (
    <div>
      <p className="eyebrow mb-6">How I work</p>
      <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-white/10 bg-white/8">
        {site.practice.map((item) => (
          <li key={item.index} className="bg-canvas-raised p-6">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-micro tracking-widest text-accent">
                {item.index}
              </span>
              <h3 className="text-[1.0625rem] leading-snug font-medium text-ink">
                {item.title}
              </h3>
            </div>
            <p className="prose mt-3">{item.body}</p>
            {/* The evidence line is the whole point of this list. A principle
                with nothing openable beside it is a slogan. */}
            <p className="mt-4 flex items-center gap-2.5 font-mono text-micro tracking-wider text-ink-faint">
              <span aria-hidden="true" className="status-dot status-ok" />
              {item.evidence}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoGoLog() {
  return (
    <div>
      <p className="eyebrow mb-2">No-go log</p>
      <p className="prose prose-measure mb-6">
        Dated, and not curated to look tidy. The one failure mode here would be fabrication — a
        model will write you a plausible failure narrative in one pass.
      </p>

      <ol className="flex flex-col">
        {site.nogolog.map((item, index) => (
          <li
            key={item.title}
            className="relative border-l border-white/12 pb-8 pl-7 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[0.3125rem] h-2.5 w-2.5 rounded-full border border-warn/50 bg-canvas"
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-micro tracking-widest text-warn">
                {item.date}
              </span>
              <span className="font-mono text-micro tracking-widest text-ink-faint/60">
                #{String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-2 text-[1.0625rem] leading-snug font-medium text-ink">
              {item.title}
            </h3>
            <p className="prose mt-2.5">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
