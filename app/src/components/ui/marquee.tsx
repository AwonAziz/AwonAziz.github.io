import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { motionBlocked } from "@/lib/motion-prefs";
import { scrollState } from "@/lib/scroll-store";
import { gsap } from "@/providers/smooth-scroll";

/**
 * ---------------------------------------------------------------------------
 *  Velocity-reactive marquee
 * ---------------------------------------------------------------------------
 *  Distance travelled is proportional to scroll velocity rather than to a
 *  fixed duration, so the strip visibly accelerates and stalls *with* the page.
 *  The track holds two identical copies and is translated by exactly one copy
 *  width, which loops seamlessly in either direction.
 *
 *  This is the "smooth flow" element. It is worth being precise about why it
 *  does not break the one-ambient-loop rule the rest of the site follows: the
 *  strip is driven by scroll *input*, not by a timer. It is still when the user
 *  is still. A CSS keyframe marquee would be a second ambient loop competing
 *  with the rain; this is a response, like the rain's own velocity term.
 *
 *  Under reduced motion it freezes at the first copy and does not move at all,
 *  rather than scrolling slowly, because a moving strip is exactly the kind of
 *  unrequested motion the preference is asking to be rid of.
 *
 *  The work runs from GSAP's ticker, which this site already owns — a marquee
 *  costs one entry in a Set, not another requestAnimationFrame loop.
 * ---------------------------------------------------------------------------
 */

interface Track {
  node: HTMLDivElement;
  offset: number;
  gain: number;
  /** px/second of idle drift, so the strip is alive on an untouched page. */
  drift: number;
}

const tracks = new Set<Track>();
let detachTick: (() => void) | null = null;
let holders = 0;

/** Ref-counted, so N marquees still produce exactly one ticker entry. */
function acquireTicker(): () => void {
  holders += 1;
  if (!detachTick) {
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 48) / 1000;

      for (const track of tracks) {
        // px per frame from scroll velocity, plus a slow constant drift so the
        // strip reads as alive when nobody is scrolling.
        track.offset -= scrollState.velocity * track.gain * (dt * 60);
        track.offset -= track.drift * dt;

        const width = track.node.scrollWidth / 2;
        if (width <= 0) continue;

        // Wrap into [-width, 0) so the two copies always interleave.
        if (track.offset <= -width) track.offset += width;
        else if (track.offset > 0) track.offset -= width;

        track.node.style.transform = `translate3d(${track.offset.toFixed(2)}px, 0, 0)`;
      }
    };

    gsap.ticker.add(tick);
    detachTick = () => gsap.ticker.remove(tick);
  }
  return release;
}

function release(): void {
  holders = Math.max(0, holders - 1);
  if (holders > 0 || !detachTick) return;
  detachTick();
  detachTick = null;
}

export function VelocityMarquee({
  items,
  className,
  gain = 0.5,
  drift = 14,
  separator = "/",
}: {
  items: string[];
  className?: string;
  /** px of travel per px of scroll velocity. */
  gain?: number;
  /** px/second of idle drift. */
  drift?: number;
  separator?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = trackRef.current;
    // Frozen under reduced motion: one static copy, no ticker entry at all.
    if (!node || motionBlocked) return;

    const entry: Track = { node, offset: 0, gain, drift };
    tracks.add(entry);
    const releaseTicker = acquireTicker();

    return () => {
      tracks.delete(entry);
      releaseTicker();
    };
  }, [gain, drift]);

  const copy: ReactNode = (
    <div className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static content, duplicated on purpose so the loop is seamless
          key={`${item}-${index}`}
          className="flex shrink-0 items-center"
        >
          <span className="whitespace-nowrap">{item}</span>
          <span aria-hidden="true" className="mx-[0.6em] text-accent/40">
            {separator}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {copy}
        {/* Second copy is decorative: hidden from assistive tech. */}
        <div aria-hidden="true" className="flex shrink-0">
          {copy}
        </div>
      </div>
    </div>
  );
}
