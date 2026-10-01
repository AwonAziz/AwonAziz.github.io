import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";
import { PALETTES, type PaletteId, type Theme } from "@/lib/theme";

/**
 * ---------------------------------------------------------------------------
 *  Appearance
 * ---------------------------------------------------------------------------
 *  Two independent controls — surface mode and accent ramp — because they are
 *  two independent decisions. A single cycling button hides both and forces the
 *  user to click past wrong options to reach the right one; a popover shows
 *  everything at once.
 *
 *  Ported from a pattern worth copying (nixrajput.com's appearance menu) with
 *  two changes:
 *
 *    - **No popover library.** A disclosure panel with a click-outside and
 *      Escape handler is ~30 lines, and this is the only popover on the site.
 *    - **The swatch is the ramp.** Each palette is represented by its own three
 *      stops in a small circle, so the control *is* the palette rather than a
 *      label describing it.
 *
 *  Accessibility: a real `<fieldset>`/radio group per axis, so arrow keys work
 *  natively; `aria-pressed` on the toggles; Escape closes and returns focus to
 * the trigger.
 * ---------------------------------------------------------------------------
 */
export function AppearanceMenu() {
  const { theme, palette, setTheme, setPalette } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Appearance: theme and colour"
        data-cursor-label="Theme"
        className={cn(
          "flex size-8 items-center justify-center rounded-pill border transition-colors duration-300",
          open
            ? "border-accent/60 bg-accent/10 text-accent"
            : "border-white/12 text-ink-faint hover:border-accent/40 hover:text-ink",
        )}
      >
        <Glyph theme={theme} />
      </button>

      {open ? (
        <div
          className="absolute right-0 z-90 mt-2 w-60 origin-top-right rounded-card border border-white/12 bg-canvas-raised/97 p-4 shadow-2xl backdrop-blur-xl"
          role="dialog"
          aria-label="Appearance"
        >
          <fieldset className="mb-4">
            <legend className="label-mono mb-2">Theme</legend>
            <div className="grid grid-cols-3 gap-1 rounded-card border border-white/10 p-1">
              {(["light", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  aria-pressed={theme === mode}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[0.4rem] px-2 py-2 font-mono text-micro tracking-wider transition-colors",
                    theme === mode
                      ? "bg-accent/15 text-accent"
                      : "text-ink-faint hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <Glyph theme={mode} />
                  {mode}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label-mono mb-2">Accent</legend>
            <ul className="flex flex-col gap-0.5">
              {PALETTES.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setPalette(item.id as PaletteId)}
                    aria-pressed={palette === item.id}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[0.4rem] px-2 py-2 text-left transition-colors",
                      palette === item.id
                        ? "bg-accent/12 text-ink"
                        : "text-ink-muted hover:bg-ink/5 hover:text-ink",
                    )}
                  >
                    {/* The swatch IS the ramp: three stops in one small circle,
                        so the control previews the palette rather than
                        naming it. */}
                    <span
                      aria-hidden="true"
                      className="flex size-5 shrink-0 overflow-hidden rounded-full border border-white/20"
                    >
                      {item.ramp.map((hex) => (
                        <span key={hex} className="h-full flex-1" style={{ background: hex }} />
                      ))}
                    </span>
                    <span className="flex-1 font-mono text-small">{item.label}</span>
                    {palette === item.id ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="size-3.5 shrink-0 text-accent"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}

function Glyph({ theme }: { theme: Theme }) {
  return theme === "dark" ? (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Crescent: dark mode reads as "the lit one". */}
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
