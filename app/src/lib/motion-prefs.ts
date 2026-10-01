/**
 * ---------------------------------------------------------------------------
 *  Motion preference
 * ---------------------------------------------------------------------------
 *  A single source of truth, read once at module init.
 *
 *  Every animated subsystem asks this rather than calling
 *  `matchMedia` itself. Two reasons that matters:
 *
 *    - The value is snapshotted deliberately. A user who turns reduced motion on
 *      *during* a session should not have the WebGL scene tear itself down
 *      mid-frame, and a live `matchMedia` listener in three separate components
 *      is three chances to get that wrong.
 *    - It is non-reactive on purpose. Reading it during render is the same cost
 *      as reading any other module constant.
 *
 *  The real query is `prefers-reduced-motion` with no preference, so a browser
 *  that does not understand it falls back to the accessible state rather than
 *  to "animate everything".
 * ---------------------------------------------------------------------------
 */

const query =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: no-preference)")
    : null;

/** False when the user asked for reduced motion, or the browser is ancient. */
export const motionAllowed = query ? query.matches : false;

export const motionBlocked = !motionAllowed;
