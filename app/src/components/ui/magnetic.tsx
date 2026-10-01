import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Magnetic wrapper
 * ---------------------------------------------------------------------------
 *  Pulls its child toward the pointer inside a padded radius, and eases home on
 *  leave. Ported from the first version of this site, which had it and then lost
 *  it in a rewrite.
 *
 *  Two things carried over deliberately and one improved:
 *
 *    - **No React state.** The transform is written straight to the DOM node.
 *      A state update per pointermove would re-render the tree 60+ times a
 *      second on every button the cursor crosses.
 *    - **rAF-batched.** `pointermove` fires far more often than the compositor
 *      paints, so the work is coalesced into one write per frame.
 *    - **Frame-rate independent damping**, so the pull feels the same at 60Hz
 *      and 144Hz. This is the improvement over the original, which used a fixed
 *      per-frame coefficient.
 *
 *  Disabled for coarse pointers and reduced motion: a magnet you cannot reach is
 *  a bug, not a flourish.
 * ---------------------------------------------------------------------------
 */
export function Magnetic({
  children,
  className,
  strength = 0.3,
  padding = 80,
}: {
  children: ReactNode;
  className?: string;
  /** Fraction of the pointer's offset the element travels. */
  strength?: number;
  /** Extra hit area around the element, in px. */
  padding?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(() => !motionBlocked && getQuality().pointerFx);

  useEffect(() => {
    setEnabled(!motionBlocked && getQuality().pointerFx);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let last = performance.now();
    let inside = false;

    const bounds = { left: 0, top: 0, width: 0, height: 0 };
    const measure = () => {
      const rect = node.getBoundingClientRect();
      bounds.left = rect.left;
      bounds.top = rect.top;
      bounds.width = rect.width;
      bounds.height = rect.height;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      measure();

      const centreX = bounds.left + bounds.width / 2;
      const centreY = bounds.top + bounds.height / 2;
      const dx = event.clientX - centreX;
      const dy = event.clientY - centreY;

      // Outside the padded box: stop doing work entirely rather than easing a
      // value that is already zero.
      if (
        Math.abs(dx) > bounds.width / 2 + padding ||
        Math.abs(dy) > bounds.height / 2 + padding
      ) {
        if (!inside) return;
        inside = false;
        targetX = 0;
        targetY = 0;
      } else {
        if (!inside) {
          inside = true;
          node.style.transition = "";
        }
        targetX = dx * strength;
        targetY = dy * strength;
      }

      if (frame) return;
      frame = requestAnimationFrame(tick);
    };

    const tick = () => {
      frame = 0;
      const now = performance.now();
      const ms = Math.min(now - last, 48);
      last = now;

      const ease = 1 - (1 - 0.18) ** (ms / 16.67);
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;

      // Only settle once the pull has effectively resolved, then stop writing.
      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX;
        currentY = targetY;
        node.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        return;
      }

      node.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const onEnter = () => {
      measure();
      last = performance.now();
    };

    const onLeave = () => {
      inside = false;
      targetX = 0;
      targetY = 0;
      // Hand back to a CSS transition for the settle, so the return home is
      // eased by the compositor rather than by a JS loop still running.
      node.style.transition = "transform 0.55s cubic-bezier(0.16,1,0.3,1)";
      node.style.transform = "translate3d(0,0,0)";
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    measure();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      node.style.transition = "";
      node.style.transform = "";
    };
  }, [enabled, strength, padding]);

  return (
    <span ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </span>
  );
}
