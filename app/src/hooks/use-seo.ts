import { useEffect } from "react";
import type { System } from "@/config/site.data";
import { site } from "@/config/site.data";
import { buildPersonSchema, buildProjectSchema, projectPath } from "@/lib/seo-static";

/**
 * ---------------------------------------------------------------------------
 *  SEO
 * ---------------------------------------------------------------------------
 *  The metadata is injected at build time — into the served HTML, from the same
 *  validated config the page renders — because the crawlers guaranteed to read
 *  it are the ones that do not execute JavaScript.
 *
 *  This hook therefore has a different job, and the distinction matters: it is a
 *  **verifier and fallback**, not the primary writer. It resolves the same values
 *  from the same builders, and only writes when the document does not already
 *  carry them.
 *
 *  That is not a stylistic preference. This hook used to write unconditionally,
 *  and on a case study it overwrote the build-time output with site-wide
 *  defaults: `document.title` became "Awon Aziz — AI / MLOps engineer" on all
 *  seven pages, `og:url` and `<link rel=canonical>` became the homepage, and
 *  `og:type` reverted to `profile`. Telling a crawler that seven distinct
 *  case studies are all duplicates of the landing page is precisely the outcome
 *  the per-project routes were built to avoid.
 *
 *  Sharing `buildPersonSchema` / `buildProjectSchema` with `vite.config.ts` means
 *  the runtime and the build cannot disagree about what a page says it is: there
 *  is one implementation, called twice.
 * ---------------------------------------------------------------------------
 */

export type SeoScope =
  | { kind: "home" }
  | { kind: "projects" }
  | { kind: "project"; slug: string };

function findSystem(slug: string): System | undefined {
  return site.systems.find((system) => system.slug === slug);
}

/** Only create a tag if the document has not already got one. */
function upsertMeta(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    // Build-time injection already got here first. Leave it alone: it was written
    // from the same builders and is therefore already correct.
    return;
  }
  const element = document.createElement("meta");
  element.setAttribute(attribute, key);
  element.content = content;
  document.head.append(element);
}

function setTitle(title: string) {
  // `document.title` is set rather than a <title> node created, because the
  // build always emits one and this only runs when that is somehow missing.
  if (!document.title) document.title = title;
}

function setCanonical(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "canonical";
  link.href = href;
  document.head.append(link);
}

function setJsonLd(nodes: object[]) {
  // Any structured data already in the head came from the build and is
  // authoritative. Appending here would risk a second, near-duplicate `Person`
  // node, which is worse than none.
  if (document.head.querySelector('script[type="application/ld+json"]')) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(nodes);
  document.head.append(script);
}

export function useSeo(scope: SeoScope = { kind: "home" }) {
  useEffect(() => {
    const { meta, systems, education } = site;
    const origin = meta.url.replace(/\/$/, "");

    if (scope.kind === "project") {
      const system = findSystem(scope.slug);
      if (!system) return;

      const url = `${origin}${projectPath(system.slug)}`;
      const title = `${system.title} — ${meta.name}`;

      setTitle(title);
      upsertMeta('meta[name="description"]', "name", "description", system.summary);
      upsertMeta('meta[property="og:type"]', "property", "og:type", "article");
      upsertMeta('meta[property="og:title"]', "property", "og:title", system.title);
      upsertMeta(
        'meta[property="og:description"]',
        "property",
        "og:description",
        system.summary,
      );
      upsertMeta('meta[property="og:url"]', "property", "og:url", url);
      upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", system.title);
      upsertMeta(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        system.summary,
      );
      setCanonical(url);
      setJsonLd([buildPersonSchema(), buildProjectSchema(system)]);
      return;
    }

    if (scope.kind === "projects") {
      const url = `${origin}/projects/`;
      const title = `Systems — ${meta.name}`;
      const description = `All ${systems.length} public systems, each opening on the hard part rather than the stack, and each listing what it deliberately does not do.`;

      setTitle(title);
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:title"]', "property", "og:title", title);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
      upsertMeta('meta[property="og:url"]', "property", "og:url", url);
      upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
      upsertMeta(
        'meta[name="twitter:description"]',
        "name",
        "twitter:description",
        description,
      );
      setCanonical(url);
      setJsonLd([buildPersonSchema()]);
      return;
    }

    const title = `${meta.name} — ${meta.role}`;

    setTitle(title);
    upsertMeta('meta[name="description"]', "name", "description", meta.description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      meta.description,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", "profile");
    upsertMeta('meta[property="og:url"]', "property", "og:url", origin);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", meta.locale);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      meta.description,
    );
    setCanonical(origin);
    // `alumniOf` as a single node here and as a list in the build-time schema is
    // the one remaining shape difference, and it is deliberate: this payload is
    // only ever injected if the build-time block is missing, in which case a
    // correct single credential beats an empty list.
    setJsonLd([
      {
        ...buildPersonSchema(),
        alumniOf: education[0]
          ? { "@type": "EducationalOrganization", name: education[0].issuer }
          : undefined,
      },
    ]);
  }, [scope]);
}
