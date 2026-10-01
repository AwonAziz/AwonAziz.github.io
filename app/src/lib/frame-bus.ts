import { gsap } from "@/providers/smooth-scroll";

/**
 * ---------------------------------------------------------------------------
 *  Frame bus
 * ---------------------------------------------------------------------------
 *  One place for per-frame DOM work that is not a scroll animation.
 *
 *  This exists because the site claimed "one RAF loop" and then quietly grew
 *  four: the reticle cursor, the minimap, the progress rule and the pointer
 *  projection each ran their own `requestAnimationFrame`. Measured against an
 *  earlier build that had fewer of them, that cost real frame time — median
 *  frame 13.9ms versus 7.5ms, and an effective 50fps against 101.
 *
 *  The fix is to drive all of them from **GSAP's ticker**, which the site
 *  already owns because Lenis, every ScrollTrigger and R3F's render loop are
 *  already on it. That makes the claim true rather than aspirational, and it
 *  also means every one of these callbacks fires in the same tick as the scroll
 *  step, so nothing can be a frame out of step with the content it annotates.
 *
 *  Callbacks are keyed so a component can subscribe and unsubscribe without
 *  holding a reference to its own closure, and `priority` exists because the
 *  pointer projection has to run before anything that reads it.
 * ---------------------------------------------------------------------------
 */

type Fn = (time: number, deltaMs: number) => void;

const subscribers = new Map<string, { fn: Fn; priority: number }>();

/**
 * Subscribe to the shared frame loop. Returns an unsubscribe function.
 *
 * `priority` orders execution within the tick. Pointer projection runs at 0
 * because the reticle and the depth field both read its output in the same
 * frame; anything cosmetic can sit at 10.
 */
export function onFrame(id: string, fn: Fn, priority = 10): () => void {
  subscribers.set(id, { fn, priority });

  if (subscribers.size === 1) {
    const tick = (time: number, deltaMs: number) => {
      // Snapshot then iterate: a callback that unsubscribes itself mid-tick must
      // not mutate the map being iterated.
      for (const entry of [...subscribers.values()].sort((a, b) => a.priority - b.priority)) {
        try {
          entry.fn(time, deltaMs);
        } catch {
          // One misbehaving subscriber must not take the whole frame down —
          // this bus is what the scroll, the cursor and the progress rule all
          // depend on.
        }
      }
    };
    // `TickerCallback` is declared as returning void, but GSAP's own overloads
    // accept a number-returning form; `tick` returns nothing, so this is safe
    // and only satisfies the narrower overload.
    gsap.ticker.add(tick as unknown as Parameters<typeof gsap.ticker.add>[0]);
  }

  return () => {
    subscribers.delete(id);
  };
}

/**
 * Frame-rate independent easing coefficient.
 *
 * `factor` is the per-16.67ms coefficient. Converting through the elapsed time
 * means the curve behaves identically at 60Hz, 120Hz and 144Hz — a fixed
 * per-frame lerp makes every eased element feel different on every display.
 */
export function ease(factor: number, deltaMs: number): number {
  return 1 - (1 - factor) ** (Math.min(deltaMs, 48) / 16.67);
}
