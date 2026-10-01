import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { addEffect, Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { type Color, NoToneMapping, SRGBColorSpace } from "three";
import { useQuality } from "@/hooks/use-quality";
import { useSceneColors } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";
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

  useFrame(() => {
    const color = colorRef.current;
    if (!color) return;
    const t = scrollState.progress;
    color.copy(background);
    // Deepens slightly on descent. A value shift, not a hue shift — a hue
    // change across 20,000px reads as an accident.
    color.multiplyScalar(1 - t * 0.22);
  });

  return <color ref={colorRef} attach="background" args={[background.getHex()]} />;
}

/**
 * Stops the render loop when the tab is hidden. On a machine with a shared GPU
 * (most laptops) a backgrounded canvas will happily eat the battery and, worse,
 * wake the CPU every frame.
 */
function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
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

  // A looping full-viewport animation running alongside other content is a WCAG
  // 2.2.2 Level A exposure, so this is a real requirement rather than a nicety.
  // Pause-on-hover explicitly does not satisfy the criterion.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !paused) setPaused(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" data-scene="">
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
          frameloop={visible ? "always" : "never"}
          performance={{ min: 0.4 }}
          onCreated={({ gl }) => {
            gl.toneMapping = NoToneMapping;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <GsapClockBridge />
          <Atmosphere />
          <MatrixRain paused={paused} reduced={motionBlocked} />
          <DepthField />
          <PostChain />
          <AdaptiveDpr pixelated={false} />
          {/* If the device cannot hold the budget, drop a tier and re-render. */}
          <PerformanceMonitor onDecline={() => downgrade()} />
        </Canvas>
      </div>

      {/* The toggle lives outside the canvas so it stays real DOM: selectable,
          focusable, and reachable by assistive tech. The canvas itself is
          aria-hidden, so this is the only representation of the control. */}
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
            motionBlocked || paused ? "status-warn" : "status-ok animate-pulse-dot",
          )}
        />
        {motionBlocked ? "motion reduced" : paused ? "rain paused" : "rain live"}
      </button>
    </>
  );
}
