import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { pointer } from "@/lib/pointer";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Reticle cursor
 * ---------------------------------------------------------------------------
 *  A phosphor crosshair that tracks the pointer with a short lag.
 *
 *  The obvious thing to reach for here is the `mix-blend-mode: difference`
 *  cursor every portfolio uses. That was on the previous version and it was
 *  removed for a concrete reason: inverted over a phosphor-green field it
 *  resolves to magenta, which reads as a rendering fault rather than as a
 *  cursor. So this is built from the page's own accent instead, and it is a
 *  *reticle* rather than a dot — two hairlines and four corner ticks, which is
 *  the shape of a targeting overlay and suits a page about measurement.
 *
 *  Restraint that is not negotiable here:
 *
 *  - **Fine pointers only.** A touch device has no hover, so a cursor is
 *    furniture over the thing the thumb is trying to hit.
 *  - **Never covers text.** The reticle is a hollow cross, not a filled disc, and
 *    it sits at low opacity. A solid blob following the pointer across body copy
 *    is the single most common way this effect makes a page harder to read.
 *  - **Coarse-pointer and low-tier devices never mount it**, and reduced motion
 *    drops the lag so it tracks exactly rather than easing.
 *  - **`pointer-events: none`** on every layer, so it can never intercept a click.
 * ---------------------------------------------------------------------------
 */
export function ReticleCursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine && !motionBlocked && getQuality().pointerFx);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Two speeds: the dot tracks almost exactly so clicking feels accurate, and
    // the reticle lags behind it so the page has weight.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const lead = { ...target };
    const trail = { ...target };
    let frame = 0;

    const tick = () => {
      lead.x += (pointer.ndcX * (window.innerWidth / 2) - lead.x) * 0.5;
      lead.y += (-pointer.ndcY * (window.innerHeight / 2) - lead.y) * 0.5;
      trail.x += (target.x - lead.x) * 0.14;
      trail.y += (target.y - lead.y) * 0.14;
      target.x = lead.x;
      target.y = lead.y;

      dot.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
      ring.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) scale(${
        active ? 1.35 : 1
      })`;

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, active]);

  useEffect(() => {
    if (!enabled) return;
    const onOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const hit = target?.closest("[data-cursor-label], a, button, summary");
      if (!hit) {
        setLabel(null);
        setActive(false);
        return;
      }
      setLabel(hit.getAttribute("data-cursor-label") ?? null);
      setActive(true);
    };
    const onOut = (event: Event) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-cursor-label], a, button, summary",
      );
      if (target) {
        setLabel(null);
        setActive(false);
      }
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-100 will-change-transform"
      >
        {/* Hollow cross plus four corner ticks. Hollow is the point — a filled
            disc dragged across body copy is what makes this effect hostile. */}
        <div
          className={cn(
            "relative -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300",
            active ? "opacity-100" : "opacity-60",
          )}
        >
          <span className="absolute top-1/2 left-0 h-px w-5 -translate-y-1/2 bg-accent" />
          <span className="absolute top-1/2 right-0 h-px w-5 -translate-y-1/2 bg-accent" />
          <span className="absolute top-0 left-1/2 h-5 w-px -translate-x-1/2 bg-accent" />
          <span className="absolute bottom-0 left-1/2 h-5 w-px -translate-x-1/2 bg-accent" />
          <span className="absolute -top-1 -left-1 h-1 w-1 bg-accent" />
          <span className="absolute -top-1 -right-1 h-1 w-1 bg-accent" />
          <span className="absolute -bottom-1 -left-1 h-1 w-1 bg-accent" />
          <span className="absolute -right-1 -bottom-1 h-1 w-1 bg-accent" />
        </div>
      </div>

      {/* The centre dot, with an optional label. Renders to the right of the
          cross so it never sits under the text the reader is looking at. */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-100 will-change-transform"
      >
        <span className="absolute top-0 left-0 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        {label ? (
          <span className="absolute top-0 left-4 ml-2 font-mono text-micro tracking-widest whitespace-nowrap text-accent/90">
            {label}
          </span>
        ) : null}
      </div>
    </>
  );
}
