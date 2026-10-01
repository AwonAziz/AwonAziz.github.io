import { site } from "@/config/site.data";
import { Section } from "../section";
import { Reveal } from "../ui/reveal";

/**
 * Contact.
 *
 * The email is a `mailto:`, so the page has no backend and no third-party form
 * script. The note underneath is the close: it tells a reader exactly how to
 * evaluate the fit, which is a stronger ask than a generic "get in touch".
 *
 * The social row is a real link list rather than icons, because the handle is
 * information — a reviewer copying a GitHub URL should not have to hover.
 */
export function Contact() {
  return (
    <Section
      id="contact"
      split="wide-right"
      eyebrow="Contact"
      title={site.contact.heading}
      className="border-t border-white/10"
    >
      <div className="grid gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="flex flex-wrap items-center gap-3 font-mono text-micro tracking-widest text-ink-faint">
            <span aria-hidden="true" className="status-dot status-ok animate-pulse-dot" />
            {site.contact.availability}
          </p>

          <Reveal from="mask" className="mt-8 block">
            <a
              href={`mailto:${site.contact.email}`}
              data-cursor-label="Email"
              className="group inline-block font-mono text-[clamp(1rem,0.7rem+2.2vw,2.25rem)] break-all"
            >
              <span className="bg-linear-to-r from-accent to-accent bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:bg-[length:100%_2px]">
                {site.contact.email}
              </span>
            </a>
          </Reveal>

          <Reveal from="lift" delay={0.06} className="prose prose-measure mt-8 block">
            {site.contact.note}
          </Reveal>

          <a
            href={`mailto:${site.contact.email}?subject=${encodeURIComponent("AI / MLOps role")}`}
            className="group mt-10 inline-flex items-center gap-3 rounded-pill bg-accent px-7 py-4 font-mono text-small font-medium text-canvas transition-transform hover:scale-[1.02]"
          >
            {site.contact.cta}
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
        </div>

        <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-white/10 bg-white/10">
          {site.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target={social.external ? "_blank" : undefined}
                rel={social.external ? "noreferrer noopener" : undefined}
                data-cursor-label="Open"
                className="group flex items-center justify-between gap-8 bg-canvas-raised px-5 py-4 transition-colors duration-300 hover:bg-ink hover:text-canvas"
              >
                <span className="font-mono text-small">{social.label}</span>
                <span className="flex items-center gap-3 font-mono text-micro tracking-wider text-ink-faint transition-colors duration-300 group-hover:text-canvas/60">
                  {social.handle}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10">
      {/* Density contrast: the footer is denser than the body, which is how every
          real system surveyed keeps a spacious page from feeling unfinished. */}
      <div className="shell py-12">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <p className="max-w-[18ch] text-[clamp(1.5rem,1rem+2.4vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink">
            Open to AI engineering and AIOps.
          </p>
          <a
            href="#top"
            className="group flex items-center gap-2 font-mono text-micro tracking-widest text-ink-faint transition-colors hover:text-accent"
          >
            Back to top
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </a>
        </div>

        <div className="mt-10 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-10">
          <p className="font-mono text-micro tracking-wider text-ink-faint">
            © {year} {site.meta.name} · {site.meta.location}
          </p>
          <p className="font-mono text-micro leading-relaxed tracking-wider text-ink-faint">
            {site.footer.note}
            <br />
            {site.footer.colophon}
          </p>
        </div>
      </div>
    </footer>
  );
}
