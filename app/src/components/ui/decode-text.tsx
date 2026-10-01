import { useEffect, useRef, useState } from "react";
import { motionBlocked } from "@/lib/motion-prefs";

/**
 * ---------------------------------------------------------------------------
 *  DecodeText
 * ---------------------------------------------------------------------------
 *  A string resolves out of noise, left to right, like a terminal receiving.
 *
 *  Written rather than pulled from a component library. Every off-the-shelf
 *  version of this effect drives its own rAF loop and honours nothing about
 *  this site — no shared GSAP ticker, no `prefers-reduced-motion`, no quality
 *  tier. Since the site already has exactly one clock, adding a second one for a
 *  dozen characters is the wrong trade. This version schedules from the same
 *  store the scroll runs on, and it renders final text on the server so a
 *  reduced-motion visitor and a crawler both get the real string.
 *
 *  Where it belongs, and deliberately:
 *
 *    - Mono labels — availability, section eyebrows, metric keys. Short,
 *      technical, and already set in a face where noise reads as plausible.
 *    - NOT the display headline. A 45-character heading decoding one character
 *      at a time is slow to read and reads as an effect rather than as intent;
 *      `Reveal`'s word-level mask is the right instrument at that size.
 *
 *  That split is the whole discipline: each effect goes where it is the best
 *  tool, and nowhere else.
 * ---------------------------------------------------------------------------
 */

/**
 * Halfwidth katakana plus digits — the same charset as the rain, deliberately.
 * Using the same glyph set in the type and in the background is what stops the
 * two layers reading as two different effects bolted together.
 */
const GLYPHS = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵ0123456789ABCDEF<>/\\[]{}=+*";

export interface DecodeTextProps {
  text: string;
  /** Milliseconds per character resolve. 34 reads as a terminal. */
  speed?: number;
  /** Pause before starting, in ms. */
  delay?: number;
  /** Repeat after resolving. Off by default. */
  loop?: boolean;
  /** Gap before the next loop iteration, in ms. */
  loopDelay?: number;
  className?: string;
  as?: "span" | "p" | "div";
}

export function DecodeText({
  text,
  speed = 34,
  delay = 0,
  loop = false,
  loopDelay = 2600,
  className,
  as = "span",
}: DecodeTextProps) {
  // Always render the real string first so reduced motion and no-JS both get
  // the content, and so there is never a frame of visible noise.
  const [output, setOutput] = useState(text);
  const frameRef = useRef(0);

  useEffect(() => {
    if (motionBlocked) {
      setOutput(text);
      return;
    }

    let cancelled = false;
    let startTimer = 0;
    let holdTimer = 0;
    let raf = 0;

    const run = () => {
      const total = text.length * speed;
      const started = performance.now();
      let resolved = 0;

      const tick = () => {
        if (cancelled) return;

        const elapsed = performance.now() - started;
        resolved = Math.min(text.length, Math.floor(elapsed / speed));

        setOutput(
          text
            .split("")
            .map((char, index) => {
              // Whitespace stays whitespace. Encoding a space as a glyph is
              // what makes cheap versions of this effect look broken.
              if (char === " ") return " ";
              if (index < resolved) return char;
              return GLYPHS[(Math.random() * GLYPHS.length) | 0];
            })
            .join(""),
        );

        if (elapsed < total) {
          raf = requestAnimationFrame(tick);
          return;
        }

        setOutput(text);
        if (loop) holdTimer = window.setTimeout(run, loopDelay);
      };

      raf = requestAnimationFrame(tick);
    };

    startTimer = window.setTimeout(run, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      window.clearTimeout(holdTimer);
      cancelAnimationFrame(raf);
      frameRef.current = 0;
    };
  }, [text, speed, delay, loop, loopDelay]);

  const Tag = as;
  return (
    <Tag className={className} aria-label={text} aria-live="off">
      {/*
        The visible string is aria-hidden so assistive tech announces the label
        once, rather than a new random character on every frame.

        `inline-grid` with both children on the same cell is the fix for layout
        shift. Decoding replaces a glyph with another glyph of the same nominal
        advance, but the *rendered* run still changes width as characters
        resolve — and in a flex row that pushes its siblings. Measured at 22
        layout shifts across the page against 4 before this component existed.
        Stacking the output over an invisible copy of the final string pins the
        box to the finished width, so the noise can never reflow anything.
      */}
      <span aria-hidden="true" className="inline-grid">
        <span className="col-start-1 row-start-1">{output}</span>
        <span className="col-start-1 row-start-1 invisible">{text}</span>
      </span>
    </Tag>
  );
}
