import { useState } from "react";
import { ProjectDetail, ProjectsIndex } from "@/components/pages/projects";
import { AppearanceMenu } from "@/components/ui/appearance-menu";
import { useSeo } from "@/hooks/use-seo";
import { link, ROUTES, setDepth } from "@/lib/paths";

/**
 * ---------------------------------------------------------------------------
 *  The canvas-free routes
 * ---------------------------------------------------------------------------
 *  A separate entry module rather than a branch inside the homepage's `App`, and
 *  that separation is the entire reason this file exists.
 *
 *  All nine documents once mounted from one `main.tsx`, which references
 *  `@/gl/scene` for the overview's hero canvas. Every document that shares an
 *  entry shares its static module graph, so the seven case studies and the
 *  projects index were each downloading the 1 MB three.js bundle — 269 kB
 *  gzipped — to render text on pages that have no canvas. Not deferred, not
 *  fetched on demand: a plain `<script>` tag in the initial HTML, at high
 *  priority, ahead of the reader's first scroll.
 *
 *  A `route === "home"` check cannot prevent this. The graph is resolved per
 *  *entry*, not per route, so the branch is invisible to the bundler. Nor can
 *  the two routes live in the same module with only the *entries* split: a
 *  module reachable from both entries is hoisted into a shared chunk, and the
 *  scene reference rides along with it. Both the entry and the module had to be
 *  separated — which is why `App` lives in `app-home.tsx` and nothing in this
 *  file's graph, directly or transitively, mentions the GL layer.
 *
 *  `SmoothScrollProvider` is absent too. Its module-scope GSAP registration
 *  still runs — `Reveal` imports `gsap` and `SplitText` from it, so the import
 *  carries the registration with it — but no Lenis instance is ever built. A
 *  case study is a document, and a document's scroll should be the browser's.
 */

type Route = "projects" | "project";

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
  return pathname.split("/").includes("projects") ? "projects" : "project";
}

/**
 * The slug for a project route, read from the URL.
 *
 * The path is the source of truth. Each system is its own generated document at
 * `/project/<slug>/`, so the slug is a path segment rather than a query
 * parameter — which means the URL can be pasted into a hiring thread, cached on
 * its own, and indexed on its own.
 *
 * The `<body data-project>` attribute is a mirror of the same value, kept only
 * so the very first client render does not have to parse the path before it can
 * pick a component. The path wins when the two disagree.
 */
function slugFor(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const index = segments.lastIndexOf("project");
  if (index === -1) return null;
  const next = segments[index + 1];
  // A legacy `project.html?id=…` bookmark, so an older link still resolves.
  if (!next || next.includes("?")) return null;
  return /^[a-z0-9-]+$/.test(next) ? next : null;
}

export function StandaloneApp() {
  const [route] = useState<Route>(() =>
    routeFor(typeof window === "undefined" ? "/" : window.location.pathname),
  );
  const [slug] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return (
      document.body.dataset.project ??
      slugFor(window.location.pathname) ??
      new URLSearchParams(window.location.search).get("id")
    );
  });

  // The SEO scope is the route, so a case study reports *itself* — its own
  // title, description, canonical and `TechArticle` node — rather than the
  // site-wide defaults the overview uses.
  useSeo(route === "projects" ? { kind: "projects" } : { kind: "project", slug: slug ?? "" });

  // Set during render rather than in an effect: children resolve internal hrefs
  // while rendering, and an effect would let the first paint emit depth-0 links
  // from a depth-2 document.
  setDepth(route === "projects" ? 1 : 2);

  return (
    <div className="relative min-h-svh">
      <div aria-hidden="true" className="scrim-block pointer-events-none fixed inset-0" />
      <div className="shell relative">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 py-5">
          <a
            href={link(ROUTES.home)}
            className="font-mono text-small tracking-tight text-ink/90 transition-colors hover:text-accent"
          >
            Awon Aziz<span className="text-accent">.</span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-4">
            <a
              href={link("/index.html#systems")}
              className="font-mono text-small text-ink-faint transition-colors hover:text-ink"
            >
              Overview
            </a>
            <a
              href={link(ROUTES.projects)}
              className="font-mono text-small text-ink-faint transition-colors hover:text-ink"
            >
              Systems
            </a>
            {/* Appearance on every page, not just the overview. A theme control
                that only exists on one route is a control that appears to be
                missing when a reader lands on a shared link. */}
            <AppearanceMenu />
            <a
              href={link("/index.html#contact")}
              className="rounded-pill bg-accent px-3.5 py-1.5 font-mono text-small font-medium on-accent transition-transform hover:scale-105"
            >
              Email
            </a>
          </nav>
        </header>

        <main id="main" className="pb-24">
          {route === "projects" ? <ProjectsIndex /> : <ProjectDetail initialSlug={slug} />}
        </main>
      </div>
    </div>
  );
}
