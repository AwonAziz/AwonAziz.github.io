import { lazy, Suspense } from "react";
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

  return (
    <>
      <Suspense fallback={null}>
        <LazyScene />
      </Suspense>
      <Site />
    </>
  );
}
