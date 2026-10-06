import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Approach
 * ---------------------------------------------------------------------------
 *  Reacts to the pointer *approaching*, not to it arriving.
 *
 *  A magnetic element behaves like a magnet: nothing happens until the cursor is
 *  inside the bounds, then everything happens at once. That reads as a snap. This
 *  one ramps continuously with distance, so a button starts lifting while the
 *  cursor is still a hundred pixels away and arrives already resolved — which is
 *  the difference between an effect and a reaction to an effect.
 *
 *  **One custom property, everything else is CSS.** The pointer loop writes a
 *  single normalised `--a` (0 → 1) onto the node; scale, glow, border colour and
 *  label shift are all derived from it in the stylesheet. Writing one number
 *  instead of four style properties is what keeps this cheap enough to put on
 *  every interactive element on the page, and it means the visual language lives
 *  in one place — `.approach` in `index.css` — rather than being scattered across
 *  JS props that cannot be tuned without a rebuild.
 *
 *  Constraints, all of them deliberate:
 *
 *    - **Transform, scale and opacity only.** No `width`, `height`, `top` or
 *      `margin`, so nothing reflows and CLS stays at zero. The glow is a
 *      `box-shadow` ring, which composites and does not affect layout.
 *    - **Direct DOM writes, no React state.** `pointermove` fires far more often
 *      than the compositor paints; a state update per event would re-render the
 *      subtree sixty times a second for every button the cursor crosses.
 *    - **Frame-rate independent.** The damping is derived from elapsed
 *      milliseconds, so the feel is identical at 60Hz and 144Hz.
 *    - **Interruptible.** Leaving early cancels the in-flight animation and hands
 *      the settle to a compositor-driven CSS transition; nothing waits on an
 *      `animationend`.
 *    - **Coarse pointers and reduced motion are excluded.** An effect you cannot
 *      reach with a finger, or that moves when you asked it not to, is a bug.
 *    - **Keyboard parity.** `:focus-visible` reaches the same resting state in
 *      CSS, so a keyboard user gets the affordance the pointer effect gives.
 *      Otherwise this would be a flourish available only to mouse users.
 * ---------------------------------------------------------------------------
 */

export function Approach({
  children,
  className,
  radius = 132,
  style,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  /** Distance in px at which the element is fully "approached". */
  radius?: number;
  style?: CSSProperties;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "style" | "children">) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const enabled = !motionBlocked && getQuality().pointerFx;
    if (!enabled) {
      element.style.setProperty("--a", "0");
      return;
    }

    // Mark this element for the global approach handler
    element.dataset.approachRadius = String(radius);

    return () => {
      delete element.dataset.approachRadius;
    };
  }, [radius]);

  return (
    <span ref={ref} className={cn("approach", className)} style={style} {...rest}>
      {children}
    </span>
  );
}