import { lazy, Suspense, useEffect, useState } from "react";
import { ProjectDetail, ProjectsIndex } from "@/components/pages/projects";
import { Site } from "@/components/site";
import { AppearanceMenu } from "@/components/ui/appearance-menu";
import { useSeo } from "@/hooks/use-seo";

const LazyScene = lazy(() =>
  import("@/gl/scene").then((module) => ({ default: module.Scene })),
);

/**
 * ---------------------------------------------------------------------------
 *  Routes
 * ---------------------------------------------------------------------------
 *  Three real documents, resolved from the path rather than a router:
 *
 *    /            the overview
 *    /projects/   the system index
 *    /project/    one system, deep dive
 *
 *  A router would mean every route exists only after JavaScript executes, which
 *  is the same problem the static JSON-LD injection was solving. A `basename`-aware
 *  matcher is a few lines and the routes are known and fixed, so a router would
 *  be dependency for its own sake.
 * ---------------------------------------------------------------------------
 */
type Route = "home" | "projects" | "project";

function routeFor(pathname: string): Route {
  /**
   * Matched on path *segments*, not on a prefix strip.
   *
   * The obvious implementation — remove `import.meta.env.BASE_URL` and compare
   * the remainder — breaks here, because `base` is `"./"` for sub-path
   * compatibility, so `BASE_URL` is `"./"`, slicing by its length turns
   * `/projects/` into `projects/` and every `startsWith("/projects")` is false.
   * Every route silently rendered the home page. Matching segments is immune to
   * whatever the base is.
   */
  const segments = pathname.split("/").filter(Boolean);
  if (segments.includes("projects")) return "projects";
  if (segments.includes("project")) return "project";
  return "home";
}

export function App() {
  useSeo();
  const [route] = useState<Route>(() =>
    routeFor(typeof window === "undefined" ? "/" : window.location.pathname),
  );
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

  // Lenis smooths the page scroll; on a document that is a page rather than a
  // continuous scroll it only gets in the way of the browser's own behaviour,
  // and its `anchors` handling would fight the breadcrumb links.
  const smooth = route === "home";

  return (
    <>
      {sceneReady ? (
        <Suspense fallback={null}>
          <LazyScene />
        </Suspense>
      ) : null}
      {smooth ? <Site /> : <StandaloneShell route={route} />}
    </>
  );
}

/**
 * Shared chrome for the two project routes. Deliberately not the full `Site`:
 * those pages have no 20,000px of content to smooth-scroll through, and
 * mounting the whole overview to show one project would defeat the code
 * splitting that made these separate documents worth having.
 */
function StandaloneShell({ route }: { route: Route }) {
  return (
    <div className="relative min-h-svh">
      <div aria-hidden="true" className="scrim-block pointer-events-none fixed inset-0" />
      <div className="shell relative">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 py-5">
          <a
            href="./index.html"
            className="font-mono text-small tracking-tight text-ink/90 transition-colors hover:text-accent"
          >
            Awon Aziz<span className="text-accent">.</span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-4">
            <a
              href="./index.html#systems"
              className="font-mono text-small text-ink-faint transition-colors hover:text-ink"
            >
              Overview
            </a>
            <a
              href="./projects/"
              className="font-mono text-small text-ink-faint transition-colors hover:text-ink"
            >
              Systems
            </a>
            {/* Appearance on every page, not just the overview. A theme control
                that only exists on one route is a control that appears to be
                missing when a reader lands on a shared link. */}
            <AppearanceMenu />
            <a
              href="./index.html#contact"
              className="rounded-pill bg-accent px-3.5 py-1.5 font-mono text-small font-medium on-accent transition-transform hover:scale-105"
            >
              Email
            </a>
          </nav>
        </header>

        <main id="main" className="pb-24">
          {route === "projects" ? <ProjectsIndex /> : <ProjectDetail />}
        </main>
      </div>
    </div>
  );
}
