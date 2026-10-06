import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { site } from "./src/config/site.data";
import {
  allRoutes,
  buildPersonSchema,
  buildProjectSchema,
  buildProjectSummary,
  buildStaticSummary,
  projectPath,
} from "./src/lib/seo-static";
import { THEME_BOOT_SCRIPT, APPROACH_BOOT_SCRIPT } from "./src/lib/theme";

/**
 * ---------------------------------------------------------------------------
 *  One real document per system
 * ---------------------------------------------------------------------------
 *  `/project.html?id=llm-drift-monitor` and `/project/from-scratch-to-served/`
 *  look similar in a link and are not remotely similar in practice:
 *
 *    - A query parameter is one URL wearing seven hats. Every case study shares
 *      one canonical, one share card, one analytics bucket and one sitemap row,
 *      and a link to the second project looks to a crawler like a parameter on
 *      the first.
 *    - A path segment is seven documents. Each is independently linkable,
 *      indexable, cacheable and pasteable into a hiring thread, which is the
 *      entire reason to give a case study its own page.
 *    - The route also survives being read without JavaScript, because the
 *      content below is injected at build time from the same validated config
 *      the page renders. Nothing here depends on hydration.
 *
 *  So each system gets a generated `project/<slug>/index.html`, registered as
 *  its own Rollup input. The files are written from the config in the `config`
 *  hook — before input resolution — so adding a system to `site.data.ts` is the
 *  only step needed to give it a page.
 */
/**
 * ---------------------------------------------------------------------------
 *  Font preloads
 * ---------------------------------------------------------------------------
 *  Emits `<link rel="preload" as="font">` for the two above-the-fold families,
 *  in `generateBundle` rather than in a template.
 *
 *  Two reasons it cannot be a hand-written link tag:
 *
 *    - **The filename is hashed.** The real asset is
 *      `space-grotesk-latin-var-<hash>.woff2`, and a tag written by hand would
 *      404 the moment anything about the font changed.
 *    - **The path is document-relative.** The case studies sit two directories
 *      deep and the overview at zero, so one tag cannot be correct for all nine.
 *      The depth is computed per document from its own path in the bundle.
 *
 *  `crossorigin` is mandatory here. A font preload without it is treated as a
 *  different resource from the later `@font-face` fetch, so the browser
 *  downloads the file twice — once uselessly.
 *
 *  Exactly two of the three families are preloaded. Newsreader is prose, it is
 *  below the fold, and competing for bandwidth with the two faces actually in
 *  the first viewport would make all three slower.
 * ---------------------------------------------------------------------------
 */
const PRELOAD_FAMILIES = ["space-grotesk-latin-var", "geist-mono-latin-var"];

function fontPreloads(): Plugin {
  return {
    name: "devfolio:font-preloads",
    enforce: "post",
    generateBundle(_options, bundle) {
      const fonts = PRELOAD_FAMILIES.map((family) =>
        Object.keys(bundle).find((name) => name.includes(family)),
      ).filter((key): key is string => Boolean(key));
      if (fonts.length === 0) return;

      for (const [key, asset] of Object.entries(bundle)) {
        if (asset.type !== "asset" || !key.endsWith(".html")) continue;

        // Directory portion of `projects/index.html` -> `projects`.
        const dir = key.includes("/") ? key.slice(0, key.lastIndexOf("/")) : "";
        const depth = dir ? dir.split("/").length : 0;
        const prefix = depth === 0 ? "./" : `${"../".repeat(depth)}`;

        const tags = fonts
          .map(
            (fontKey) =>
              `\n    <link rel="preload" href="${prefix}${fontKey}" as="font" type="font/woff2" crossorigin />`,
          )
          .join("");

        // Injected before the stylesheet so the fetch starts as early as
        // possible; the hashed names are the CSS's own, so this cannot drift.
        const html = String(asset.source).replace(
          /<link rel="stylesheet"/,
          `${tags}\n    <link rel="stylesheet"`,
        );
        asset.source = html;
      }
    },
  };
}

/**
 * ---------------------------------------------------------------------------
 *  Sitemap + robots
 * ---------------------------------------------------------------------------
 *  Generated from `allRoutes()` rather than maintained by hand.
 *
 *  The hand-written version said "single-page site with anchor navigation, so
 *  there is exactly one URL" — which was true when it was written and has been
 *  false since the case studies became real routes. A sitemap that lists one URL
 *  on a nine-page site is worse than no sitemap: it is a positive claim that the
 *  other eight do not exist.
 *
 *  Deriving it from the same validated config that produces the routes means a
 *  system added to `site.data.ts` is in the sitemap by construction, and a
 *  sitemap entry cannot outlive the page it points at.
 * ---------------------------------------------------------------------------
 */
function sitemapAndRobots(): Plugin {
  return {
    name: "devfolio:sitemap",
    generateBundle() {
      const origin = site.meta.url.replace(/\/$/, "");
      const today = new Date().toISOString().slice(0, 10);

      const urls = allRoutes()
        .map((route) => {
          const isHome = route.path === "/";
          const priority = isHome ? "1.0" : route.path === "/projects/" ? "0.9" : "0.8";
          const changefreq = isHome ? "weekly" : "monthly";
          return `  <url>
    <loc>${origin}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
        })
        .join("\n");

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Generated at build time from the same Zod-validated config that produces the
  routes, so it cannot list a page that does not exist or omit one that does.
  Do not edit by hand: edit src/config/site.data.ts and rebuild.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
      });

      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`,
      });
    },
  };
}

function projectPages(): Plugin {
  const slugForPath = (path: string) => {
    const match = path.match(/\/project\/([a-z0-9-]+)\/?/);
    return match ? match[1] : null;
  };

  const writeEntries = (root: string) => {
    // Supplied here rather than in `build.rollupOptions` below, because a value
    // set in both places resolves in favour of the user config and the three
    // fixed documents would then be silently dropped from the build.
    const input: Record<string, string> = {
      main: resolve(root, "index.html"),
      projects: resolve(root, "projects/index.html"),
    };
    for (const system of site.systems) {
      const dir = resolve(root, "project", system.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        resolve(dir, "index.html"),
        projectEntryHtml(system.slug, system.title),
        "utf8",
      );
      input[`project-${system.slug}`] = resolve(dir, "index.html");
    }
    return input;
  };

  return {
    name: "devfolio:project-pages",

    config() {
      return {
        build: { rollupOptions: { input: writeEntries(import.meta.dirname) } },
      };
    },

    /**
     * Per-project head and injected content.
     *
     * `ctx.path` is the output path of the document being transformed, so each
     * page gets its own title, description, canonical, Open Graph card and
     * `TechArticle` node — derived from the slug in its own path rather than
     * from anything the client sends.
     */
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const slug = slugForPath(ctx.path);
        const system = slug ? site.systems.find((item) => item.slug === slug) : undefined;
        if (!slug || !system) return [];

        const origin = site.meta.url.replace(/\/$/, "");
        const url = `${origin}${projectPath(system.slug)}`;
        const summary = buildProjectSummary(system)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;");

        return [
          { tag: "title", children: `${system.title} — ${site.meta.name}`, injectTo: "head" },
          {
            tag: "meta",
            attrs: { name: "description", content: system.summary },
            injectTo: "head",
          },
          { tag: "link", attrs: { rel: "canonical", href: url }, injectTo: "head" },
          { tag: "meta", attrs: { property: "og:type", content: "article" }, injectTo: "head" },
          {
            tag: "meta",
            attrs: { property: "og:title", content: system.title },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { property: "og:description", content: system.summary },
            injectTo: "head",
          },
          { tag: "meta", attrs: { property: "og:url", content: url }, injectTo: "head" },
          {
            tag: "meta",
            attrs: { name: "twitter:card", content: "summary_large_image" },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "twitter:title", content: system.title },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "twitter:description", content: system.summary },
            injectTo: "head",
          },
          // The theme boot script, so this document applies a stored theme
          // before first paint exactly like the other two.
          {
            tag: "script",
            children: THEME_BOOT_SCRIPT,
            injectTo: "head-prepend",
          },
          {
            tag: "script",
            children: APPROACH_BOOT_SCRIPT,
            injectTo: "head-prepend",
          },
          {
            tag: "script",
            attrs: { type: "application/ld+json" },
            children: JSON.stringify([buildPersonSchema(), buildProjectSchema(system)]),
            injectTo: "head",
          },
          // The breadcrumb is what makes seven sibling pages legible to a
          // crawler as a set rather than as seven unrelated documents.
          {
            tag: "script",
            attrs: { type: "application/ld+json" },
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Overview",
                  item: `${origin}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Systems",
                  item: `${origin}/projects/`,
                },
                { "@type": "ListItem", position: 3, name: system.title, item: url },
              ],
            }),
            injectTo: "head",
          },
          {
            tag: "div",
            attrs: { "data-static-project": system.slug, hidden: "", "aria-hidden": "true" },
            children: `<pre style="display:none">${summary}</pre>`,
            injectTo: "body",
          },
        ];
      },
    },
  };
}

/**
 * The generated document for one system.
 *
 * Deliberately not a copy of `index.html`: this page has no hero, no WebGL and
 * no long scroll, so it carries only what it needs. There is no `<title>` here
 * because Vite's `transformIndexHtml` *adds* tags rather than replacing them —
 * a title in the template plus one from the plugin is a page with two titles,
 * and the browser picks whichever it likes.
 *
 * The `<body data-project>` attribute mirrors the slug in the path so the first
 * client render does not have to parse the URL before it can pick a component.
 * The path stays the source of truth; `App` only prefers this when they agree.
 */
function projectEntryHtml(slug: string, _title: string): string {
  return `<!doctype html>
<html lang="en" class="bg-canvas text-ink antialiased">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark light" />
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg" />
  </head>
  <body data-project="${slug}">
    <div id="root"></div>
    <script type="module" src="../../src/entry-standalone.tsx"></script>
  </body>
</html>
`;
}

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
    transformIndexHtml(_html, ctx) {
      // Project documents own their own head block. Returning empty here is what
      // stops the Person schema and the site-wide summary from being injected a
      // second time into every case study — which is how you end up with two
      // `Person` nodes on one page and a ~2 kB summary of the whole site in the
      // middle of a document about one system.
      if (/\/project\/[a-z0-9-]+\/?/.test(ctx.path)) return [];

      const jsonLd = JSON.stringify(buildPersonSchema());
      return [
        {
          // `head-prepend` so it runs before the stylesheet is even parsed, not
          // merely before the body renders. A theme applied a frame late is the
          // thing that reads as a cheap theme switcher, and the fix is position
          // rather than timing.
          tag: "script",
          attrs: {},
          children: THEME_BOOT_SCRIPT,
          injectTo: "head-prepend",
        },
        {
          tag: "script",
          attrs: {},
          children: APPROACH_BOOT_SCRIPT,
          injectTo: "head-prepend",
        },
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
    plugins: [
      react(),
      tailwindcss(),
      projectPages(),
      fontPreloads(),
      sitemapAndRobots(),
      staticInjection(),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      target: "es2022",
      cssMinify: "lightningcss",
      reportCompressedSize: true,
      rollupOptions: {
        /**
         * Multi-page.
         *
         * Real HTML documents rather than a client-side router. The reason is
         * the same as the JSON-LD work: a router means every route exists only
         * after JavaScript runs, and the crawlers and previewers that matter most
         * do not run it. A separate document per route is also a separate
         * payload, so opening a project does not re-download the homepage's
         * section components.
         *
         * `input` itself is contributed by the `projectPages` plugin above, which
         * writes `project/<slug>/index.html` from the validated config and
         * registers one entry per system. That is why the two fixed documents
         * are listed there and not here — a value set in both places resolves in
         * favour of this file, which would silently drop the generated pages.
         */
        output: {
          /**
           * No `manualChunks`.
           *
           * There was one, grouping three.js and React Three Fiber into their
           * own cacheable chunk, and it defeated the whole point of splitting
           * the entries. Because a manually named chunk is an entry-adjacent
           * declaration rather than something inferred from reachability,
           * Rolldown wired it as a **static** import of every chunk that shared
           * any of its modules — which was all of them, including `vendor`.
           * So `vendor` statically imported three, and the 1 MB WebGL bundle
           * (269 kB gzipped) rode along in the initial HTML of the seven
           * case-study documents, at high priority, ahead of the first scroll.
           *
           * The fix is not a better grouping. It is letting the bundler derive
           * chunks from the graph, which it already does correctly: with
           * `app-home` and `app-standalone` as separate entry points and only
           * the former referencing `@/gl/scene`, the WebGL code is reachable
           * from exactly one entry and stays in a chunk only that entry pulls.
           *
           * Cache behaviour is preserved where it matters — a module used by
           * one entry and never another lands in that entry's chunk, so it is
           * still cached across navigations to the same page.
           */
        },
      },
    },
    server: { port: 5173, open: false },
    preview: { port: 4173, open: false },
  };
});
