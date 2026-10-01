import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Film grain
 * ---------------------------------------------------------------------------
 *  A single inline SVG turbulence layer over the whole document.
 *
 *  Its real job is not texture. A full-viewport dark green gradient bands badly
 *  in 8-bit, and grain is the cheapest way to break the banding — the same
 *  reason the rain shader dithers. It also stops the near-black background from
 *  reading as flat empty space on an OLED panel.
 *
 *  `pointer-events: none` and a very low opacity, because a grain layer that
 *  responds to the mouse is a grain layer that is distracting.
 *
 *  There is deliberately **no custom cursor** in this version. The previous one
 *  used `mix-blend-mode: difference`, which inverts to magenta over a
 *  phosphor-green field and looks like a rendering fault rather than an effect.
 *  Pointer feedback now comes from the depth field, which reacts without
 *  obstructing the text it is sitting on top of.
 * ---------------------------------------------------------------------------
 */
export function Grain() {
  // Only worth rendering where the scene is actually drawing something behind it.
  if (!getQuality().postFx) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-1 opacity-[0.035] mix-blend-overlay",
        // Hidden from assistive tech and from the tab order entirely.
        "[contain:strict]",
      )}
    >
      <svg className="h-full w-full" role="presentation">
        {/* `aria-hidden` on the wrapper does not always suppress SVG accname
            computation, and an unlabelled `<svg>` is a lint error in its own
            right. `role="presentation"` plus a title settles both. */}
        <title>Grain overlay</title>
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
}

/**
 * ---------------------------------------------------------------------------
 *  Scanlines
 * ---------------------------------------------------------------------------
 *  A repeating horizontal line texture, fixed over the whole document.
 *
 *  This is the layer that finishes the reference rather than decorating it.
 *  The Matrix rain supplies the moving content, the depth field supplies depth,
 *  and this supplies the *surface* the whole thing is being displayed on — which
 *  is what makes it read as a terminal rather than as green text.
 *
 *  Three deliberate restraints, because this is the easiest thing on the page
 *  to overdo — and the version before this shipped at 2.2% opacity, which was
 *  measured and found to be invisible. Restraint that cannot be seen is not
 *  restraint, it is a no-op, so this sits at 7%: low enough not to grey out the
 *  dark surfaces, high enough to read as a phosphor tube rather than as a flat
 *  fill.
 *
 *  - **Static.** A drifting scanline is a second ambient loop competing with
 *    the rain, and the rule on this site is one ambient loop. Static texture
 *    still reads as CRT without adding motion.
 *  - **Disabled under reduced motion** along with the rain, since a full-screen
 *    repeating pattern is exactly the kind of thing that triggers vestibular
 *    symptoms.
 * ---------------------------------------------------------------------------
 */
export function Scanlines() {
  if (motionBlocked) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-1 opacity-[0.07] [contain:strict]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, currentColor 0px, currentColor 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}

/**
 * Corner-bracket frame for a focused region.
 *
 * The targeting-overlay motif the reticle cursor established, applied to the
 * page furniture rather than the pointer. Four L-shaped corners and nothing in
 * the middle, so it marks an area without putting anything on top of it.
 */
export function CornerFrame({ className }: { className?: string }) {
  const corner = "absolute h-5 w-5 border-accent/25";
  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <span className={cn(corner, "top-0 left-0 border-t border-l")} />
      <span className={cn(corner, "top-0 right-0 border-t border-r")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "right-0 bottom-0 border-r border-b")} />
    </div>
  );
}

/**
 * 1px rails down both edges of the document.
 *
 * Two pixels of layout for a structural signal: they hold the grid together
 * across 20,000px and make every section read as one continuous surface rather
 * than as a pile of boxes. `fixed` and `pointer-events-none`, so they cost
 * nothing and never interfere with a full-bleed element.
 */
export function PageRails() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 left-0 right-0 z-1">
      <div className="shell mx-auto h-full">
        <div className="grid h-full grid-cols-[1fr_auto_1fr]">
          <div className="border-white/8 border-l" />
          <div className="w-px" />
          <div className="border-white/8 border-r" />
        </div>
      </div>
    </div>
  );
}
