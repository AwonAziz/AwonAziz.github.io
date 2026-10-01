import { cn } from "@/lib/cn";
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
