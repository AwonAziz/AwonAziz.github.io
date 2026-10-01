import { useEffect, useState } from "react";
import { Color } from "three";
import {
  DEFAULT_PALETTE,
  DEFAULT_THEME,
  PALETTE_STORAGE_KEY,
  PALETTES,
  type PaletteId,
  paletteFor,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

/**
 * ---------------------------------------------------------------------------
 *  Theme store
 * ---------------------------------------------------------------------------
 *  A `useSyncExternalStore`-shaped external store rather than React context, for
 *  the same reason the scroll and pointer stores are modules: the WebGL layer
 *  needs the *current* values inside `useFrame`, and a hook cannot be called
 *  from a `useFrame` callback without re-subscribing every render.
 *
 *  It also listens to the window `storage` event, which gives cross-tab sync for
 *  free. The `storage` event never fires in the tab that made the change, so the
 *  local listener set is notified explicitly.
 * ---------------------------------------------------------------------------
 */

const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

function read<T extends string>(key: string, allowed: readonly string[], fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  const value = localStorage.getItem(key);
  return value && allowed.includes(value) ? (value as T) : fallback;
}

let theme: Theme = DEFAULT_THEME;
let palette: PaletteId = DEFAULT_PALETTE;
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  theme = read<Theme>(THEME_STORAGE_KEY, ["light", "dark"], DEFAULT_THEME);
  palette = read<PaletteId>(
    PALETTE_STORAGE_KEY,
    PALETTES.map((p) => p.id),
    DEFAULT_PALETTE,
  );
}

function writeDocument() {
  const root = document.documentElement;
  // The default is the ABSENCE of the attribute, so the values in `:root` are
  // the single definition and a second block cannot drift from them.
  if (theme === DEFAULT_THEME) root.removeAttribute("data-theme");
  else root.dataset.theme = theme;

  if (palette === DEFAULT_PALETTE) root.removeAttribute("data-palette");
  else root.dataset.palette = palette;
}

function persist() {
  try {
    if (theme === DEFAULT_THEME) localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (palette === DEFAULT_PALETTE) localStorage.removeItem(PALETTE_STORAGE_KEY);
    else localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    // Private browsing, disabled storage, quota. The theme still applies for
    // this session; it just will not survive a reload.
  }
}

if (typeof window !== "undefined") {
  hydrate();
  // The boot script has already written the attributes; re-reading from storage
  // here means React state and the DOM can never disagree about what is active.
  const sync = () => {
    hydrate();
    theme = read<Theme>(THEME_STORAGE_KEY, ["light", "dark"], DEFAULT_THEME);
    palette = read<PaletteId>(
      PALETTE_STORAGE_KEY,
      PALETTES.map((p) => p.id),
      DEFAULT_PALETTE,
    );
    writeDocument();
    emit();
  };
  window.addEventListener("storage", sync);
}

export function getTheme(): Theme {
  return theme;
}
export function getPalette(): PaletteId {
  return palette;
}

export function setTheme(next: Theme) {
  theme = next;
  writeDocument();
  persist();
  emit();
}

export function setPalette(next: PaletteId) {
  palette = next;
  writeDocument();
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React binding for the two controls. */
export function useTheme() {
  const [t, setT] = useState(theme);
  const [p, setP] = useState(palette);
  useEffect(
    () =>
      subscribe(() => {
        setT(theme);
        setP(palette);
      }),
    [],
  );
  return { theme: t, palette: p, setTheme, setPalette };
}

/**
 * Reads a resolved colour out of the CSS custom properties.
 *
 * This is what makes the theme reach the WebGL layer. The rain's trail colour
 * and the scene background are additive light on the base surface, so a theme
 * that changed only the DOM would leave a black page behind a green rain in
 * light mode — the exact bug where the scene and the stylesheet disagree.
 *
 * Values are read from the live computed style, so one definition in CSS drives
 * both. Re-reads on every theme change, and on a frame counter in case a
 * transition is still settling.
 */
export function useSceneColors(): { background: Color; trail: Color; head: Color } {
  const [colors, setColors] = useState(() => resolveSceneColors());

  useEffect(
    () =>
      subscribe(() => {
        setColors(resolveSceneColors());
      }),
    [],
  );

  return colors;
}

function resolveSceneColors() {
  if (typeof window === "undefined") {
    return {
      background: new Color("#020403"),
      trail: new Color("#10b981"),
      head: new Color("#d6fff0"),
    };
  }

  const style = getComputedStyle(document.documentElement);
  const readVar = (name: string, fallback: string) => {
    const value = style.getPropertyValue(name).trim();
    return value || fallback;
  };

  // The ramps are authored as hex, which three.js parses directly. Reading
  // them rather than hardcoding keeps one source of truth for the accent.
  const ramp = paletteFor(palette).ramp;
  const isLight = theme === "light";

  return {
    background: new Color(readVar("--surface-0", "#020403")),
    // In light mode the "bright" stop is the pale neon that is invisible on
    // white, so the trail falls back to the mid stop, which holds contrast.
    trail: new Color(isLight ? ramp[0] : ramp[1]),
    head: new Color(isLight ? ramp[1] : ramp[2]),
  };
}
