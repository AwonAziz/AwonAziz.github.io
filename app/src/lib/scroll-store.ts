import { motionBlocked } from "./motion-prefs";

/**
 * ---------------------------------------------------------------------------
 *  Scroll store
 * ---------------------------------------------------------------------------
 *  A module-level mutable singleton, deliberately *not* React state.
 *
 *  Scroll position, progress, velocity and direction are written once per
 *  Lenis frame and read inside `useFrame` by the scene. Nothing here causes a
 *  render, which is the entire point: a page that re-renders on scroll cannot
 *  also run a smooth-scrolled WebGL layer at 60fps, because the two are
 *  competing for the same main thread.
 *
 *  The CSS custom properties exist for the same reason from the DOM side —
 *  the marquee skew and section rules react to momentum without a render. They
 *  are written straight to the document element, which is the one thing the
 *  main thread does not have to reconcile.
 * ---------------------------------------------------------------------------
 */

export interface ScrollState {
  /** Pixels from the top of the document. */
  y: number;
  /** 0..1 through the whole scrollable range. */
  progress: number;
  /** Signed pixels-per-frame; negative means scrolling up. */
  velocity: number;
  /** 0..1, smoothed. This is what makes motion feel damped. */
  speed: number;
  /** -1 | 0 | 1 */
  direction: -1 | 0 | 1;
}

export const scrollState: ScrollState = {
  y: 0,
  progress: 0,
  velocity: 0,
  speed: 0,
  direction: 0,
};

/** Unsubscribes are unnecessary by design: there is exactly one store. */
export function writeScroll(next: {
  y: number;
  progress: number;
  velocity: number;
  speed: number;
  direction: -1 | 0 | 1;
}): void {
  scrollState.y = next.y;
  scrollState.progress = next.progress;
  scrollState.velocity = next.velocity;
  scrollState.speed = next.speed;
  scrollState.direction = next.direction;

  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.setProperty("--scroll-y", next.y.toFixed(2));
  root.style.setProperty("--scroll-progress", next.progress.toFixed(5));
  root.style.setProperty("--scroll-velocity", next.velocity.toFixed(3));
  root.style.setProperty("--scroll-speed", next.speed.toFixed(4));
  root.style.setProperty("--scroll-direction", next.direction.toString());

  // Native scroll-driven animations read this, so sections can react to
  // position without a single line of JS. This is the cheapest possible
  // division of labour: the compositor owns layout-adjacent motion, the GPU
  // owns the WebGL layer, and the main thread only writes one variable.
  if (!motionBlocked) {
    root.style.setProperty("--scroll-progress", next.progress.toFixed(5));
  }
}
