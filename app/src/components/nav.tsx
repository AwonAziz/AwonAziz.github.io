import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site.data";
import { cn } from "@/lib/cn";
import { gsap, ScrollTrigger } from "@/providers/smooth-scroll";
import { AppearanceMenu } from "./ui/appearance-menu";

/**
 * ---------------------------------------------------------------------------
 *  Navigation
 * ---------------------------------------------------------------------------
 *  Two behaviours that separate this from a static header:
 *
 *  1. **Hides on scroll down, returns on scroll up.** Driven by a scrubbed
 *     ScrollTrigger rather than a scroll listener, so it inherits the same
 *     smoothed value as everything else and cannot desync.
 *
 *  2. **Marks the current section.** One ScrollTrigger per section tracks the
 *     middle of the viewport rather than the top, so the marker changes when a
 *     section is genuinely the thing being looked at. All sections register in
 *     a single effect rather than per-link, because a hook cannot be called from
 *     inside a `.map()`.
 *
 *  Every link is a real `href` with no click handler: Lenis is configured with
 *  `anchors` and intercepts them, so the nav keeps native link semantics,
 *  middle-click and keyboard activation for free.
 *
 *  The link list collapses with a CSS breakpoint rather than a `matchMedia`
 *  listener. Below lg the five links plus the CTA genuinely do not fit at a
 *  legible size, and doing it in CSS means no resize flash, no state, and no
 *  chance of the header rendering mid-breakpoint on a cold load. The sections
 *  stay reachable as anchors — the minimap lists them, and every section is in
 *  the footer flow anyway.
 * ---------------------------------------------------------------------------
 */
export function Nav() {
  const barRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const ctx = gsap.context(() => {
      gsap.to(bar, {
        yPercent: -100,
        ease: "power3.out",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "+=280",
          scrub: true,
        },
      });

      for (const section of gsap.utils.toArray<HTMLElement>("[data-scroll-section]")) {
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) setActiveId(section.id);
          },
        });
      }
    }, bar);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={barRef}
      className="fixed inset-x-0 top-0 z-80 will-change-transform"
      data-nav=""
    >
      <div className="shell pt-4 md:pt-5">
        <div className="glass flex items-center justify-between gap-4 rounded-pill px-4 py-2.5 md:px-6">
          <a
            href="#top"
            className="font-mono text-small tracking-tight text-ink/90 transition-colors hover:text-accent"
          >
            {site.meta.name}
            <span className="text-accent">.</span>
          </a>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
              {site.nav.map((item) => {
                const isActive = activeId === item.href.replace("#", "");
                return (
                  <li key={item.href} className="hidden lg:block">
                    <a
                      href={item.href}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative block px-3 py-1.5 font-mono text-small transition-colors",
                        isActive ? "text-ink" : "text-ink-faint hover:text-ink",
                      )}
                    >
                      {item.label}
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-0.5 h-px bg-accent"
                        />
                      ) : null}
                    </a>
                  </li>
                );
              })}
              <li className="ml-1.5">
                <a
                  href="#contact"
                  data-cursor-label="Email"
                  className="block rounded-pill bg-accent px-3.5 py-1.5 font-mono text-small font-medium on-accent transition-transform hover:scale-105 lg:px-4"
                >
                  Email
                </a>
              </li>
            </ul>
          </nav>

          {/* Appearance sits outside the nav list: it is not a section link, and
              giving it its own separator keeps its focus ring from competing
              with the current-section marker. */}
          <div className="ml-2 border-l border-white/12 pl-2">
            <AppearanceMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
