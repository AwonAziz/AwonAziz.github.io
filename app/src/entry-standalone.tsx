import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StandaloneApp } from "./app-standalone";
// Lenis ships its own stylesheet. This page never constructs a Lenis instance —
// the import is here only for the base rules it applies, so the project routes
// do not re-declare them.
import "lenis/dist/lenis.css";
import "./styles/index.css";

/**
 * ---------------------------------------------------------------------------
 *  Entry for the canvas-free routes
 * ---------------------------------------------------------------------------
 *  The projects index and the seven case studies mount from here rather than
 *  from `main.tsx`, and the entire point is what this file does *not* import.
 *
 *  `main.tsx` references the WebGL scene for the overview's hero atmosphere.
 *  Because all nine documents shared one entry, that reference was enough to
 *  put the 1 MB three.js bundle into the initial HTML of every case study —
 *  269 kB gzipped, as a plain `<script>`, on pages whose entire job is to be
 *  readable text. The router check could not save it: the module graph is
 *  resolved per entry, not per route, so a `route === "home"` branch is invisible
 *  to the bundler.
 *
 *  Nothing below here reaches the GL layer, so Rolldown has no static path to
 *  three.js and emits no such chunk for these documents.
 *
 *  `SmoothScrollProvider` is deliberately absent. Its module-scope plugin
 *  registration still runs — `Reveal` imports `gsap` and `SplitText` from it, so
 *  the tree-shaken import pulls the registration with it — but no Lenis instance
 *  is ever constructed. A case study is a document, and a document's scroll
 *  should be the browser's own.
 * ---------------------------------------------------------------------------
 */

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>,
);
