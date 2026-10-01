/**
 * ---------------------------------------------------------------------------
 *  Theme + palette
 * ---------------------------------------------------------------------------
 *  Two independent axes, which is the part that is easy to get wrong:
 *
 *    `data-theme`   light | dark          — surface and ink
 *    `data-palette` phosphor | glacier…   — the accent ramp
 *
 *  They compose: 2 surfaces x 6 palettes = 12 combinations, and every one of
 *  them has to stay legible. Rather than hand-writing twelve blocks, the
 *  palette only supplies an accent ramp and the surface stays derived, so a new
 *  palette is three hex values rather than a page of CSS.
 *
 *  The mechanics are adapted from a pattern worth stealing (nixrajput.com):
 *
 *    - **The default is the *absence* of an attribute.** `phosphor` has no
 *      `[data-palette="phosphor"]` block at all, so it is defined exactly once
 *      in `:root`. A second definition would be a second thing to drift.
 *    - **A blocking script in `<head>` applies the stored choice before paint.**
 *      Applied in an effect, the page shows the default for a frame and then
 *      snaps — which is the thing that makes theme switchers feel cheap.
 *    - **A `theme-ready` class suppresses transitions for one frame.** Without
 *      it, the very first theme application animates every element's own
 *      `transition-*` and reads as a flicker.
 *    - **The allowlist is machine-checked against this array** by
 *      `THEME_PALETTE_IDS` below, which the head script imports. It cannot
 *      silently drift the way a hardcoded list in a `<script>` tag can.
 * ---------------------------------------------------------------------------
 */

export type Theme = "light" | "dark";
export type PaletteId = "phosphor" | "glacier" | "ember" | "magenta" | "violet" | "lime";

export interface Palette {
  id: PaletteId;
  label: string;
  /**
   * Three stops: deep (structure, shadows), mid (the working accent), bright
   * (the highlight — rain heads, focus rings, hover states).
   */
  ramp: [string, string, string];
}

/**
 * Six ramps. `phosphor` is the default and therefore defines `:root` itself.
 * The swatch UI renders `ramp` as three slices, so a ramp is also the identity
 * of the palette at a glance.
 *
 * Chosen on one criterion: every `bright` must clear text contrast against the
 * darkest surface in the theme, and every `mid` must clear 4.5:1 for a label.
 * A palette that only looks good as a glow does not qualify.
 */
export const PALETTES: readonly Palette[] = [
  { id: "phosphor", label: "Phosphor", ramp: ["#04352a", "#10b981", "#34d399"] },
  { id: "glacier", label: "Glacier", ramp: ["#083344", "#0891b2", "#22d3ee"] },
  { id: "ember", label: "Ember", ramp: ["#431407", "#c2410c", "#fb923c"] },
  { id: "magenta", label: "Magenta", ramp: ["#500724", "#be185d", "#f472b6"] },
  { id: "violet", label: "Violet", ramp: ["#2e1065", "#7c3aed", "#a78bfa"] },
  { id: "lime", label: "Lime", ramp: ["#1a2e05", "#4d7c0f", "#a3e635"] },
] as const;

export const DEFAULT_PALETTE: PaletteId = "phosphor";
export const DEFAULT_THEME: Theme = "dark";

/** Lookup, or the default if the stored value is not one we ship. */
export function paletteFor(id: string | null | undefined): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

const PALETTE_IDS = PALETTES.map((p) => p.id);

export const THEME_STORAGE_KEY = "devfolio-theme";
export const PALETTE_STORAGE_KEY = "devfolio-palette";

/**
 * The source of the blocking `<head>` script, injected by the Vite transform so
 * the allowlist below is the *same* list the picker renders. A copy-pasted list
 * in a script tag is how these rot.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    var p = localStorage.getItem('${PALETTE_STORAGE_KEY}');
    var root = document.documentElement;
    if (t === 'light' || t === 'dark') root.dataset.theme = t;
    if (p && ${JSON.stringify(PALETTE_IDS)}.indexOf(p) > -1 && p !== '${DEFAULT_PALETTE}') {
      root.dataset.palette = p;
    }
    // Suppress every transition for one frame, then allow them. Without this the
    // first application animates each element's own transition-* and the page
    // appears to flash.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { root.classList.add('theme-ready'); });
    });
  } catch (e) {
    document.documentElement.classList.add('theme-ready');
  }
})();
`.trim();
