import { lazy, Suspense, useEffect, useState } from "react";
import { Site } from "@/components/site";
import { useSeo } from "@/hooks/use-seo";

const LazyScene = lazy(() =>
  import("@/gl/scene").then((module) => ({ default: module.Scene })),
);

/**
 * ---------------------------------------------------------------------------
 *  App shell
 * ---------------------------------------------------------------------------
 *  There is no preloader here, and that is the most consequential decision in
 *  this file.
 *
 *  The previous version gated the first paint behind a measured counter. It was
 *  technically impressive and it was wrong: full-screen entrance animations are
 *  named as a disqualifier in portfolio screening for the obvious reason that a
 *  one-second loader is a one-second delay, and the hero headline is the only
 *  positioning asset an engineer without an employment history has. It was also
 *  a WCAG 2.2.2 exposure bought for nothing.
 *
 *  Instead the WebGL layer lazy-loads behind a gradient that matches the canvas,
 *  so the atmosphere arrives *after* the content rather than in front of it.
 * ---------------------------------------------------------------------------
 */
export function App() {
  useSeo();
  const [sceneReady, setSceneReady] = useState(false);

  /**
   * Wait for `load` before mounting the canvas at all.
   *
   * Lazy *loading* the chunk is only half the story: creating the WebGL context
   * and compiling the shaders is still main-thread work, and compilation in
   * particular routinely costs hundreds of milliseconds. Doing that during
   * startup queues every click and scroll arriving in the meantime, and that
   * queued delay is precisely what INP measures. This is the step most WebGL
   * sites skip.
   *
   * `load` rather than a timeout, so a slow font or image still wins. The
   * listener is removed once it fires so it does not outlive the page.
   */
  useEffect(() => {
    if (document.readyState === "complete") {
      setSceneReady(true);
      return;
    }
    const onLoad = () => setSceneReady(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return (
    <>
      {sceneReady ? (
        <Suspense fallback={null}>
          <LazyScene />
        </Suspense>
      ) : null}
      <Site />
    </>
  );
}
