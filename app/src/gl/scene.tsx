import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { addEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, NoToneMapping, SRGBColorSpace } from "three";
import { useQuality } from "@/hooks/use-quality";
import { useSceneColors } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";
import { onFrame } from "@/lib/frame-bus";
import { motionBlocked } from "@/lib/motion-prefs";
import { downgrade } from "@/lib/quality";
import { scrollState } from "@/lib/scroll-store";
import { DepthField } from "./depth/depth-field";
import { PostChain } from "./post/post-chain";
import { MatrixRain } from "./rain/matrix-rain";

/**
 * ---------------------------------------------------------------------------
 *  One clock
 * ---------------------------------------------------------------------------
 *  `addEffect` runs R3F's render loop *inside* GSAP's ticker. That is what
 *  makes the DOM and the GPU frame-locked: a scrubbed GSAP timeline, a Lenis
 *  scroll step and a WebGL draw all happen in the same tick, in the same order.
 *  Without it there is up to a frame of skew between the text and the scene
 *  behind it, which the eye reads as jank even at 120Hz.
 *
 *  `addEffect` returns an unsubscribe function, and it is deliberately not
 *  called on unmount: the ticker outlives any single scene, and tearing the
 *  bridge down mid-session would leave the canvas frozen until a reload.
 * ---------------------------------------------------------------------------
 */
function GsapClockBridge() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => addEffect(() => invalidate()), [invalidate]);
  return null;
}

/**
 * Background tint.
 *
 * Colour comes from the live CSS custom properties rather than a constant, so
 * a theme or palette change reaches the GPU as well as the DOM. Hardcoding it
 * was how the two halves would have drifted: a light theme with a black
 * WebGL background behind it is exactly the bug this avoids.
 *
 * Values are set in **linear-sRGB** — three.js has used that as its working
 * colour space since r155, so `setRGB(0.047)` renders as sRGB ~0.24 (#3D), not
 * #0C. Writing what looks like a hex value there produced a measured #202124
 * background, a medium grey, which is why the rain read as flat texture.
 */
function Atmosphere() {
  const { background } = useSceneColors();
  const colorRef = useRef<Color>(null);
  // `useSceneColors` returns a hex string so the theme store does not have to
  // import three. This is the boundary where that cost is paid back: exactly
  // once, inside the lazily-imported canvas layer, where three is already
  // loaded anyway.
  const target = useMemo(() => new Color(background), [background]);

  useFrame(() => {
    const color = colorRef.current;
    if (!color) return;
    const t = scrollState.progress;
    color.copy(target);
    // Deepens slightly on descent. A value shift, not a hue shift — a hue
    // change across 20,000px reads as an accident.
    color.multiplyScalar(1 - t * 0.22);
  });

  return <color ref={colorRef} attach="background" args={[target.getHex()]} />;
}

/**
 * Stops the render loop when the tab is hidden. On a machine with a shared GPU
 * (most laptops) a backgrounded canvas will happily eat the battery and, worse,
 * wake the CPU every frame.
 *
 * Seeded from `document.hidden` rather than `true` so a page loaded into a
 * background tab does not start a loop nobody asked for.
 */
function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/**
 * ---------------------------------------------------------------------------
 *  Can this device make a context at all?
 * ---------------------------------------------------------------------------
 *  Probed once, before `<Canvas>` is ever rendered.
 *
 *  This is not redundant with catching an error. React Three Fiber creates the
 *  context during its own render and throws when it cannot, and an exception
 *  thrown inside the reconciler unmounts the tree it is in — so a browser with
 *  WebGL disabled took the scene *and anything beside it* down rather than
 *  degrading. Probing first means the failure is a branch, not a crash.
 *
 *  `experimental-webgl` is checked because that is the identifier some older
 *  Safari builds still return, and a false negative here costs the whole scene.
 */
function useWebglSupport(): boolean {
  return useMemo(() => {
    if (typeof document === "undefined") return false;
    try {
      const probe = document.createElement("canvas");
      const context =
        probe.getContext("webgl2") ??
        probe.getContext("webgl") ??
        probe.getContext("experimental-webgl");
      if (!context) return false;
      // Release the probe context immediately rather than letting it be
      // collected: browsers cap concurrent contexts per document, and a leaked
      // one can cost the real canvas its slot.
      const lose = (context as WebGLRenderingContext).getExtension("WEBGL_lose_context");
      lose?.loseContext();
      return true;
    } catch {
      // A hardened browser, a locked-down enterprise policy, or a headless
      // renderer. All of them land here, and all of them get the fallback.
      return false;
    }
  }, []);
}

/**
 * Watches the live canvas for context loss.
 *
 * `webglcontextlost` fires far more often than "the GPU broke": a driver reset, a
 * laptop switching between integrated and discrete graphics, a Windows display
 * driver update, a mobile tab being evicted, or simply too many contexts held by
 * other tabs. Left unhandled, each one leaves a permanent black rectangle where
 * the scene was — which on this page would be the entire background behind the
 * hero.
 *
 * `preventDefault()` is mandatory. Without it the browser will not attempt a
 * restore at all, so `webglcontextrestored` never fires and the loss is
 * permanent for the life of the page.
 */
function ContextWatch({ onChange }: { onChange: (lost: boolean) => void }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (event: Event) => {
      event.preventDefault();
      onChange(true);
    };
    const handleRestored = () => onChange(false);

    canvas.addEventListener("webglcontextlost", handleLost, false);
    canvas.addEventListener("webglcontextrestored", handleRestored, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
    };
  }, [gl, onChange]);

  return null;
}

/**
 * ---------------------------------------------------------------------------
 *  Idle guard
 * ---------------------------------------------------------------------------
 *  Suspends the render loop after a stretch of no interaction.
 *
 *  The `visibilitychange` handler covers the tab being in the background, but
 *  that is not the same problem. The common case is a foreground tab sitting
 *  open and untouched: a reader has stopped scrolling, stopped moving the
 *  pointer, and is reading — or has simply tabbed away to do something else
 *  while leaving this open. The document visibility API says "visible", so the
 *  loop keeps running at full rate, redrawing an identical field sixty times a
 *  second and holding a GPU allocation the whole time. On a laptop that is a
 *  measurable slice of the battery, and it is invisible: nothing looks wrong,
 *  which is precisely why it goes unnoticed.
 *
 *  Ninety frames at 60Hz is about a second and a half — long enough that the
 *  guard never fires during ordinary reading, short enough that the first
 *  pointer move or scroll after it resumes immediately.
 *
 *  Two details that matter:
 *
 *    - **The counter runs on the shared GSAP ticker, not a new `rAF`.** That is
 *      what `frame-bus` exists for: the site documents a single frame loop, and
 *      a guard that quietly introduces a second one would be both a lie and a
 *      regression in the metric it was measuring.
 *    - **`wake` is a no-op once already active.** `pointermove` fires far more
 *      often than React can usefully re-render; calling `setState` on every one
 *      of them would trade a wasted GPU frame for a much worse main-thread one.
 *
 *  Not engaged when the reader has already asked for stillness — under reduced
 *  motion the rain is frozen anyway, and if they have pressed the pause control
 *  the loop is off by their choice, which is a stronger signal than idleness.
 * ---------------------------------------------------------------------------
 */

const IDLE_GUARD_FRAMES = 90;

const RESUME_EVENTS = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;

function useIdleGuard(enabled: boolean): boolean {
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    // Re-arm on the way out so re-enabling never resumes in a stale idle state.
    if (!enabled) {
      setSuspended(false);
      return;
    }

    let idle = 0;
    let active = true;
    let disposed = false;

    const wake = () => {
      idle = 0;
      if (!active || disposed) return;
      active = false;
      setSuspended(false);
    };

    // Capture phase, because `scroll` on a Lenis document is stopped from
    // bubbling by the wheel handler that smooths it.
    for (const type of RESUME_EVENTS) {
      window.addEventListener(type, wake, { passive: true, capture: true });
    }

    // Priority 20: after the pointer projection (0) and the cosmetic
    // subscribers (10), so the guard never reads a half-updated frame.
    const unsubscribe = onFrame(
      "scene-idle-guard",
      () => {
        if (disposed) return;
        idle += 1;
        if (idle === IDLE_GUARD_FRAMES) {
          active = true;
          setSuspended(true);
        }
      },
      20,
    );

    return () => {
      disposed = true;
      unsubscribe();
      for (const type of RESUME_EVENTS) {
        window.removeEventListener(type, wake, { capture: true });
      }
    };
  }, [enabled]);

  return suspended;
}

/**
 * ---------------------------------------------------------------------------
 *  The background scene
 * ---------------------------------------------------------------------------
 *  Three layers in one canvas, one shared clock, one render loop:
 *
 *    rain  (-100)  screen-space glyph field, the subject
 *    depth  (-50)  GPU particle parallax, so the rain falls *through* something
 *    post   (last)  bloom / aberration / noise / vignette
 *
 *  There is no camera rig. The previous version moved a perspective camera
 *  through shots keyed to global scroll progress, and it was the weakest part of
 *  the page: a second focal point competing with the text for a long scroll
 *  reads as drift rather than as parallax. The depth field gets the same sense
 *  of movement from a single rotational axis, which costs one transform instead
 *  of a camera solve, and cannot fight the typography.
 *
 *  Layering contract: the canvas is `position: fixed` at `-z-10` with the DOM
 *  scrolling above it. Never place `position: fixed` content inside the Lenis
 *  flow — that is the number-one cause of a WebGL layer drifting out of
 *  alignment with the layout.
 * ---------------------------------------------------------------------------
 */
export function Scene() {
  const quality = useQuality();
  const visible = useDocumentVisible();
  const supported = useWebglSupport();
  const [contextLost, setContextLost] = useState(false);

  // A looping full-viewport animation running alongside other content is a WCAG
  // 2.2.2 Level A exposure, so this is a real requirement rather than a nicety.
  // Pause-on-hover explicitly does not satisfy the criterion.
  const [paused, setPaused] = useState(false);

  const idled = useIdleGuard(!motionBlocked && !paused);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !paused) setPaused(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  /**
   * The canvas is unmounted entirely when it cannot run, and the CSS atmosphere
   * takes its place. Unmounting rather than hiding is deliberate: a dead context
   * left mounted keeps a GPU allocation alive, and every frame R3F attempts
   * against it is a frame of work for a picture that cannot be presented.
   */
  const showCanvas = supported && !contextLost;

  const status = !supported
    ? "no webgl"
    : contextLost
      ? "context lost"
      : motionBlocked
        ? "motion reduced"
        : paused
          ? "rain paused"
          : idled
            ? "rain idle"
            : "rain live";

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" data-scene="">
        {showCanvas ? (
          <Canvas
            // Capping DPR is the single biggest perf lever on a scroll-heavy page.
            dpr={quality.dpr}
            gl={{
              antialias: false,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
            }}
            camera={{ fov: 50, near: 0.1, far: 120, position: [0, 0, 9] }}
            // Three independent reasons to stop drawing, in the order they are
            // worth checking: the tab is hidden, the reader has gone idle, or
            // the context died. `never` rather than `demand` because nothing here
            // invalidates on its own — with no interaction there is no new state
            // to render.
            frameloop={visible && !idled ? "always" : "never"}
            performance={{ min: 0.4 }}
            onCreated={({ gl }) => {
              gl.toneMapping = NoToneMapping;
              gl.outputColorSpace = SRGBColorSpace;
            }}
          >
            <ContextWatch onChange={setContextLost} />
            <GsapClockBridge />
            <Atmosphere />
            <MatrixRain paused={paused} reduced={motionBlocked} />
            <DepthField />
            <PostChain />
            <AdaptiveDpr pixelated={false} />
            {/* If the device cannot hold the budget, drop a tier and re-render. */}
            <PerformanceMonitor onDecline={() => downgrade()} />
          </Canvas>
        ) : (
          // The atmosphere without the GPU. Sits at the same `-z-10` and paints
          // the same region, so the page is visually continuous either way and
          // nothing reflows when the context comes back.
          <div className="scene-fallback size-full" />
        )}
      </div>

      {/* The toggle lives outside the canvas so it stays real DOM: selectable,
          focusable, and reachable by assistive tech. The canvas itself is
          aria-hidden, so this is the only representation of the control.

          It is also hidden entirely when there is no scene to pause. A control
          for something that is not running is worse than no control — it reads
          as a dead button rather than as an absent feature. */}
      {showCanvas ? (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          data-cursor-label={paused ? "Run" : "Hold"}
          className="group fixed right-4 bottom-4 z-90 flex items-center gap-2.5 rounded-pill border border-white/12 bg-canvas-raised/85 px-4 py-2.5 font-mono text-micro tracking-widest text-ink-faint backdrop-blur-md transition-colors duration-300 hover:border-accent/50 hover:text-ink md:right-6 md:bottom-6"
        >
          <span
            aria-hidden="true"
            className={cn(
              "status-dot",
              // Idling is the system working, not a fault, so it reads as
              // healthy-but-quiet rather than as a warning. The pulse stops
              // because nothing is being drawn.
              idled
                ? "status-ok"
                : motionBlocked || paused
                  ? "status-warn"
                  : "status-ok animate-pulse-dot",
            )}
          />
          {status}
        </button>
      ) : null}
    </>
  );
}
