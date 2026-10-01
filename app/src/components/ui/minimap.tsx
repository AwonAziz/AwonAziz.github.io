import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { onFrame } from "@/lib/frame-bus";
import { motionBlocked } from "@/lib/motion-prefs";
import { scrollState } from "@/lib/scroll-store";
import { scrollTo } from "@/providers/smooth-scroll";

/**
 * ---------------------------------------------------------------------------
 *  Minimap
 * ---------------------------------------------------------------------------
 *  A persistent document overview that doubles as the scrollbar.
 *
 *  The technique is Rauno Freiberg's, and Awwwards filed it as a *Navigation*
 *  element rather than a decorative one — which is the point. On a document this
 *  long a linear scrollbar communicates position but nothing about *structure*:
 *  a reader who lands at 60% has no idea whether they are three sections in or
 *  one section in the middle of something.
 *
 *  Why it earns its place here:
 *
 *  - It scales with length instead of degrading. A 2px progress bar tells a
 *    reader nothing about what comes next; a visible map of seven sections is a
 *    promise that the rest is worth it.
 *  - It occupies a rail the layout otherwise leaves empty, so it costs no
 *    attention budget from the content.
 *  - Per-frame cost is one `transform` write on one element. No observer, no
 *    layout read, no React state.
 *
 *  Driven from the Lenis-driven `scrollState`, not raw `scrollY`. Naive
 *  `scrollY / (scrollHeight - innerHeight)` breaks the moment a section is
 *  sticky or pinned, because the two disagree about where the viewport actually
 *  is. Reading the same store the rest of the page reads keeps the marker and
 *  the content in agreement by construction.
 *
 *  Hidden below md: on a phone it would be a 1px sliver competing with a thumb.
 * ---------------------------------------------------------------------------
 */

const SECTIONS = [
  { id: "systems", label: "Systems" },
  { id: "runtime", label: "Runtime" },
  { id: "capability", label: "Stack" },
  { id: "method", label: "Method" },
  { id: "archive", label: "Archive" },
  { id: "education", label: "Education" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
] as const;

export function Minimap() {
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string>("");
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    /**
     * Section tops are cached, not measured per frame.
     *
     * Reading `getBoundingClientRect()` for seven sections on every frame is
     * seven forced layouts per frame, and it showed up as the remaining gap in
     * p95 frame time (41.5ms against 18ms on an earlier, lighter build). The
     * document's height only changes on resize or when the scene lazy-loads, so
     * the offsets are re-measured on resize and on a slow interval, and the
     * per-frame work is a subtraction.
     */
    let tops: { id: string; top: number; height: number }[] = [];
    const remeasure = () => {
      tops = SECTIONS.map((section) => {
        const el = document.getElementById(section.id);
        if (!el) return { id: section.id, top: 0, height: 0 };
        const box = el.getBoundingClientRect();
        return {
          id: section.id,
          top: box.top + window.scrollY,
          height: box.height,
        };
      });
    };
    remeasure();

    const onResize = () => remeasure();
    window.addEventListener("resize", onResize, { passive: true });

    // Slow safety net for layout shifts the resize listener misses: fonts
    // resolving, the WebGL chunk landing, disclosures expanding. 4Hz is ample
    // for an indicator whose real work is comparing a cached number to scrollY.
    const sweep = window.setInterval(remeasure, 250);

    // Composed cleanup: the frame-bus subscription, the interval and the
    // resize listener are three separate resources, and returning only one of
    // them leaks the other two on every unmount.
    const stopFrames = onFrame("minimap", () => {
      const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, scrollState.y / limit));

      const railHeight = rail.clientHeight;
      // The thumb represents the viewport, so its height is the viewport's
      // fraction of the document. At 1/6th of the rail on a tall document that
      // reads as "you can see about a sixth of this at a time", which is true.
      const thumbHeight = Math.max(24, railHeight / 6);
      thumb.style.transform = `translate3d(0, ${ratio * (railHeight - thumbHeight)}px, 0)`;
      thumb.style.height = `${thumbHeight}px`;

      // Active marker from the cache. Only committed to React when it actually
      // changes — otherwise this is 60 renders a second.
      const anchor = window.scrollY + window.innerHeight * 0.5;
      let current = "";
      for (const entry of tops) {
        if (entry.height > 0 && anchor >= entry.top && anchor < entry.top + entry.height) {
          current = entry.id;
          break;
        }
      }
      if (current && current !== activeRef.current) {
        activeRef.current = current;
        setActiveId(current);
      }
    });

    return () => {
      stopFrames();
      window.removeEventListener("resize", onResize);
      window.clearInterval(sweep);
    };
  }, []);

  return (
    <nav
      aria-label="Document sections"
      className="group/minimap pointer-events-none fixed right-5 top-1/2 z-70 hidden -translate-y-1/2 md:block lg:right-7"
    >
      <div className="pointer-events-auto relative">
        {/* Rail. `relative` because the thumb is its child. */}
        <div ref={railRef} className="relative h-[min(40vh,19rem)] w-px bg-white/12">
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(`#${section.id}`)}
              aria-label={`Jump to ${section.label}`}
              aria-current={activeId === section.id ? "true" : undefined}
              // Hit target far larger than the tick. A 2px target is not a control.
              className="absolute left-1/2 flex h-5 w-7 -translate-x-1/2 items-center justify-center"
              style={{ top: `${(index / SECTIONS.length) * 100}%` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-px transition-all duration-500",
                  activeId === section.id ? "w-3.5 bg-accent" : "w-1.5 bg-white/30",
                )}
              />
            </button>
          ))}

          {/* Thumb: viewport position within the document. */}
          <div
            ref={thumbRef}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-0 left-0 w-px bg-accent/80",
              motionBlocked ? "transition-none" : "transition-transform duration-150",
            )}
            style={{ height: "3rem", willChange: "transform" }}
          />
        </div>

        {/* Labels sit outside the rail and fade in on hover. Seven permanent
            labels at this size would be a table of contents competing with the
            page it indexes. */}
        <ul className="pointer-events-none absolute top-0 right-4 flex h-[min(40vh,19rem)] flex-col justify-between text-right opacity-0 transition-opacity duration-500 group-hover/minimap:opacity-100">
          {SECTIONS.map((section) => (
            <li
              key={section.id}
              className={cn(
                "font-mono text-micro tracking-widest whitespace-nowrap transition-colors duration-300",
                activeId === section.id ? "text-accent" : "text-ink-faint",
              )}
            >
              {section.label}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/**
 * Document progress, as a single hairline at the top of the viewport.
 *
 * This does not replace the minimap and does not compete with it. A progress bar
 * is the cheapest possible signal that a page is scrollable at all; the minimap
 * is the one that says what is in it.
 */
export function ProgressRule() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      // scaleX so the compositor owns it: no layout, no paint, no React. Shares
      // the frame bus with everything else.
      onFrame("progress", () => {
        const bar = ref.current;
        if (bar) bar.style.transform = `scale3d(${scrollState.progress}, 1, 1)`;
      }),
    [],
  );

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-85 h-px bg-white/8">
      <div
        ref={ref}
        className="h-full origin-left bg-accent"
        style={{ transform: "scale3d(0, 1, 1)", willChange: "transform" }}
      />
    </div>
  );
}
