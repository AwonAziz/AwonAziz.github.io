/**
 * ---------------------------------------------------------------------------
 *  Shared pointer state
 * ---------------------------------------------------------------------------
 *  A module singleton rather than React state, for the same reason the scroll
 *  store is: `useFrame` reads this every frame and a context or a hook would
 *  either allocate or re-render. The event listener is registered once, at
 *  module scope, and never torn down.
 *
 *  Coordinates are tracked twice because they are needed in two different
 *  spaces: normalised device coordinates for anything in clip space, and world
 *  XZ for the depth field's repulsion.
 * ---------------------------------------------------------------------------
 */

export interface PointerState {
  /** -1..1 across the viewport, origin centre. */
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
  ndcX: 0,
  ndcY: 0,
  worldX: 0,
  worldY: 0,
  active: 0,
  raw: 0,
};

if (typeof window !== "undefined") {
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;

  const onMove = (event: PointerEvent) => {
    // A coarse pointer has no hover, so there is nothing to react to and
    // running the maths anyway is wasted work on the most constrained device.
    if (event.pointerType === "touch") return;

    lastX = (event.clientX / window.innerWidth) * 2 - 1;
    lastY = -((event.clientY / window.innerHeight) * 2 - 1);
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

  /** World projection runs from a rAF rather than on every move event. */
  const project = () => {
    pointer.ndcX = lastX;
    pointer.ndcY = lastY;
    // Roughly maps NDC onto the plane the field lives on. An exact projection
    // would need the camera matrix here, and a `useFrame` write is cheaper than
    // a second subscription.
    pointer.worldX = lastX * 7;
    pointer.worldY = lastY * 4;

    // 4s of stillness decays the field's response, so a mouse left parked in
    // the middle of the page does not hold the particles permanently displaced.
    if (pointer.raw === 0 || performance.now() - lastMove > 4000) {
      pointer.raw = 0;
    }
    pointer.active = pointer.raw;

    requestAnimationFrame(project);
  };
  requestAnimationFrame(project);
}
