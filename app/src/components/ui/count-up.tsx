import { useEffect, useRef, useState } from "react";
import { motionBlocked } from "@/lib/motion-prefs";

/**
 * ---------------------------------------------------------------------------
 *  CountUp
 * ---------------------------------------------------------------------------
 *  Animates a figure to its target on first view.
 *
 *  The details that make this read as instrumentation rather than as a
 *  counter widget:
 *
 *  - **`tabular-nums` is not optional.** Without it the glyph width changes as
 *    the digits change, and the whole row shifts sideways while it counts. The
 *    site already reserves mono + tabular figures for measured values, so this
 *    is the same rule applied.
 *  - **Commas are baked into the format**, matching how the values are written
 *    in the content model. `486` must land as `486`, not `486.0`.
 *  - **Reduced motion lands on the final value immediately**, and the first
 *    paint is already the final value, so there is no flash of zero.
 *  - **It counts once.** Re-running on every scroll entry would make the page
 *    feel like it is playing a cutscene every time you scroll back.
 * ---------------------------------------------------------------------------
 */
export interface CountUpProps {
  value: string;
  /** Milliseconds for the full count. */
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 1100, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || motionBlocked || doneRef.current) return;

    // Only numeric-looking values animate. "05" is a deliberate label and must
    // stay exactly as written.
    const target = Number(value.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(target)) return;

    const prefix = value.startsWith("+") ? "+" : "";
    const hasComma = value.includes(",");
    const decimals = (value.split(".")[1] ?? "").replace(/[^0-9]/g, "").length;
    const suffix = value.replace(/^[\d.,+]/, "");

    const format = (n: number) => {
      const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
      return `${prefix}${hasComma ? Number(Math.round(n)).toLocaleString("en-US") : fixed}${suffix}`;
    };

    doneRef.current = true;

    // Ease-out cubic: fast start, long settle. A linear count looks like a
    // progress bar pretending to be a number.
    const ease = (t: number) => 1 - (1 - t) ** 3;
    const started = performance.now();
    let raf = 0;

    const tick = () => {
      const t = Math.min(1, (performance.now() - started) / duration);
      setDisplay(format(target * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
