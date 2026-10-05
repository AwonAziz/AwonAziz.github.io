/**
 * ---------------------------------------------------------------------------
 *  Internal links
 * ---------------------------------------------------------------------------
 *  One resolver for every internal href, because relative URLs from inside a
 *  nested document are a reliable source of silently broken navigation.
 *
 *  The documents sit at three depths:
 *
 *      /                      depth 0
 *      /projects/             depth 1
 *      /project/<slug>/       depth 2
 *
 *  so from a case study, the projects index is `../../projects/` and from the
 *  projects index `./projects.html` resolves to *itself*. Both of those were
 *  reachable from a single hand-written href, and neither was caught by
 *  typecheck because a wrong relative URL is still a valid string.
 *
 *  `base: "./"` in the Vite config is what makes this necessary rather than
 *  optional: absolute `/projects/` works at a domain root and 404s on a
 *  sub-path, which is the most common way this kind of deploy breaks. So
 *  internal links stay relative and the prefix is computed from the route
 *  depth instead of written by hand.
 *
 *  A module-level store rather than React context, matching the scroll, pointer
 *  and theme stores: `App` sets it once during the first render, and every
 *  component — including the ones that are not descendants of `App` — can read
 *  it without prop drilling.
 */

/** Path segments between the site root and the current document. */
export type Depth = 0 | 1 | 2;

let depth: Depth = 0;

/**
 * Called once by `App`. Kept as a setter rather than derived from
 * `window.location` at module scope so that the value is the *route's* depth,
 * not the depth of whatever URL the module happened to load under.
 */
export function setDepth(next: Depth): void {
  depth = next;
}

export function currentDepth(): Depth {
  return depth;
}

/**
 * Resolve a site-absolute path to a document-relative href.
 *
 *    link("/projects/")            from depth 0 -> ./projects/
 *    link("/projects/")            from depth 2 -> ../../projects/
 *    link("https://github.com/…")  returned untouched
 *    link("mailto:…")              returned untouched
 */
export function link(path: string): string {
  if (!path.startsWith("/")) return path;
  const prefix = depth === 0 ? "./" : "../".repeat(depth);
  return `${prefix}${path.slice(1)}`;
}

/** The route path for one system. Single source of truth for the URL shape. */
export function projectHref(slug: string): string {
  return link(`/project/${slug}/`);
}

export const ROUTES = {
  home: "/",
  projects: "/projects/",
} as const;
