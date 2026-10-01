import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

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
    plugins: [react(), tailwindcss()],
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
