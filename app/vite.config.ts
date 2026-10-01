import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { buildPersonSchema, buildStaticSummary } from "./src/lib/seo-static";

/**
 * ---------------------------------------------------------------------------
 *  Static injection
 * ---------------------------------------------------------------------------
 *  Puts the Person JSON-LD and a crawlable text summary into the *served* HTML,
 *  from the same Zod-validated config the page renders.
 *
 *  The reason is not "SEO score", it is that the crawlers guaranteed to read it
 *  are the ones that do not run JavaScript. Google's own guidance: pre-rendering
 *  "makes your website faster for users and crawlers, and not all bots can run
 *  JavaScript." Slackbot, LinkedInBot and facebookexternalhit definitively do
 *  not — so structured data that only appears after hydration is structured data
 *  that never reaches the surfaces where it would matter.
 *
 *  Generated at build time rather than duplicated by hand, so it cannot drift
 *  from the visible content the way a hand-maintained JSON-LD block does.
 */
function staticInjection(): Plugin {
  return {
    name: "devfolio:static-seo",
    transformIndexHtml() {
      const jsonLd = JSON.stringify(buildPersonSchema());
      return [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: jsonLd,
          injectTo: "head",
        },
        {
          tag: "div",
          attrs: { "data-static-summary": "", hidden: "", "aria-hidden": "true" },
          // `white-space: pre-wrap` preserves the newlines without CSS that
          // would itself need to be inlined. Hidden from AT *and* from the
          // visual layout, so it costs a screen reader nothing.
          children: `<pre style="display:none">${buildStaticSummary()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</pre>`,
          injectTo: "body",
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /**
   * Relative asset URLs by default.
   *
   * This is the only setting that works unchanged on a root domain
   * (`example.com`), a GitHub Pages *user* site, and a GitHub Pages *project*
   * site (`user.github.io/repo/`). Absolute `/assets/...` paths 404 on a
   * sub-path, which is the most common way this deploy breaks.
   */
  const base = env.VITE_BASE_PATH || "./";

  return {
    base,
    plugins: [react(), tailwindcss(), staticInjection()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      target: "es2022",
      cssMinify: "lightningcss",
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          // three + r3f is ~270kB gzipped and 100% client-side. Splitting it
          // keeps it out of the initial HTML payload and lets it cache
          // independently of app code. Rolldown (Vite 8) only accepts the
          // *function* form of manualChunks.
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("node_modules/three")) return "three";
            if (
              id.includes("node_modules/@react-three") ||
              id.includes("node_modules/postprocessing") ||
              id.includes("node_modules/maath")
            ) {
              return "r3f";
            }
            if (id.includes("node_modules/gsap") || id.includes("node_modules/lenis")) {
              return "motion";
            }
            return "vendor";
          },
        },
      },
    },
    server: { port: 5173, open: false },
    preview: { port: 4173, open: false },
  };
});
