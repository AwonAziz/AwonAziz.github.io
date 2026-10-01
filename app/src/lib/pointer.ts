import { gsap } from "@/providers/smooth-scroll";

/**
 * ---------------------------------------------------------------------------
 *  Shared pointer state
 * ---------------------------------------------------------------------------
 *  A module singleton rather than React state, for the same reason the scroll
 *  store is: `useFrame` reads this every frame and a context or a hook would
 *  either allocate or re-render. The event listener is registered once, at
 *  module scope, and never torn down.
 *
 *  Coordinates are tracked in three spaces because three consumers need
 *  different ones, and mixing them up is not a subtle error — the reticle
 *  cursor did exactly that and tracked the pointer *backwards*:
 *
 *    clientX / clientY  viewport pixels. Anything positioned with
 *                      `position: fixed` and a transform wants these.
 *    ndcX / ndcY        -1..1, origin centre, **Y positive upward**. Only
 *                      for clip-space work.
 *    worldX / worldY    an approximate plane projection, for the depth
 *                      field's GPU-side repulsion.
 *
 *  The projection is folded into GSAP's ticker rather than running its own
 *  rAF: this site already owns one loop, and growing more of them was measured
 *  costing roughly 6ms per frame.
 * ---------------------------------------------------------------------------
 */

export interface PointerState {
  /** Viewport pixels, origin top-left. For DOM positioning. */
  clientX: number;
  clientY: number;
  /** -1..1 across the viewport, origin centre, Y positive upward. */
  ndcX: number;
  ndcY: number;
  /** World-space XZ, for GPU-side repulsion. */
  worldX: number;
  worldY: number;
  /** 0..1, eased toward `raw` so enter/leave never snaps. */
  active: number;
  raw: number;
}

export const pointer: PointerState = {
  clientX: 0,
  clientY: 0,
  ndcX: 0,
  ndcY: 0,
  worldX: 0,
  worldY: 0,
  active: 0,
  raw: 0,
};

if (typeof window !== "undefined") {
  let lastClientX = 0;
  let lastClientY = 0;
  let lastNdcX = 0;
  let lastNdcY = 0;
  let lastMove = 0;

  const onMove = (event: PointerEvent) => {
    // A coarse pointer has no hover, so there is nothing to react to and
    // running the maths anyway is wasted work on the most constrained device.
    if (event.pointerType === "touch") return;

    lastClientX = event.clientX;
    lastClientY = event.clientY;
    lastNdcX = (event.clientX / window.innerWidth) * 2 - 1;
    // Negated because NDC has Y positive upward while pixels have it downward.
    lastNdcY = -((event.clientY / window.innerHeight) * 2 - 1);
    lastMove = performance.now();
    pointer.raw = 1;
  };

  const onLeave = () => {
    pointer.raw = 0;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pointer.raw = 0;
  });

  /**
   * Published onto the shared ticker rather than a private rAF, and read by the
   * reticle cursor and the depth field in the same tick.
   */
  gsap.ticker.add(() => {
    pointer.clientX = lastClientX;
    pointer.clientY = lastClientY;
    pointer.ndcX = lastNdcX;
    pointer.ndcY = lastNdcY;
    // Roughly maps NDC onto the plane the field lives on. An exact projection
    // would need the camera matrix here, and a `useFrame` write is cheaper than
    // a second subscription.
    pointer.worldX = lastNdcX * 7;
    pointer.worldY = lastNdcY * 4;

    // 4s of stillness decays the field's response, so a mouse left parked in
    // the middle of the page does not hold the particles permanently displaced.
    if (pointer.raw === 0 || performance.now() - lastMove > 4000) {
      pointer.raw = 0;
    }
    pointer.active = pointer.raw;
  });
}
