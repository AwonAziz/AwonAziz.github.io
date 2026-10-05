import { lazy, Suspense, useEffect, useState } from "react";
import { Site } from "@/components/site";
import { useSeo } from "@/hooks/use-seo";
import { setDepth } from "@/lib/paths";

/**
 * ---------------------------------------------------------------------------
 *  The overview
 * ---------------------------------------------------------------------------
 *  The only module in the project whose graph reaches the GL layer.
 *
 *  `entry-standalone.tsx` exists because of that sentence. Splitting the *entries*
 *  was not sufficient on its own: a module reachable from both entries is
 *  hoisted into a shared chunk, and the scene reference rides along with it,
 *  which put the WebGL bundle back into the case-study documents. So the route
 *  split had to happen here as well — this file for the canvas, `app-standalone`
 *  for everything that is text.
 */
const LazyScene = lazy(() =>
  import("@/gl/scene").then((module) => ({ default: module.Scene })),
);

export function App() {
  useSeo();
  const [sceneReady, setSceneReady] = useState(false);

  /**
   * Wait for `load` before mounting the canvas at all.
   *
   * Lazy *loading* the chunk is only half the story: creating the WebGL context
   * and compiling the shaders is still main-thread work, and compilation
   * routinely costs hundreds of milliseconds. Doing that during startup queues
   * every click and scroll arriving in the meantime, which is what INP measures.
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

  // The overview sits at the site root, so every internal href it renders is
  // depth-0. Called during render because children resolve links as they render.
  setDepth(0);

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
