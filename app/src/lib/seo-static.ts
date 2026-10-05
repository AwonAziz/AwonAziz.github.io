/**
 * Relative, not `@/`. This module is imported by `vite.config.ts`, and Vite
 * bundles the config with its own resolver — the app's `@/*` alias is not in
 * scope there, so an aliased import fails with ERR_MODULE_NOT_FOUND at build
 * time rather than doing anything subtle.
 */

import type { System } from "../config/site.data";
import { site } from "../config/site.data";

/**
 * ---------------------------------------------------------------------------
 *  Static structured data
 * ---------------------------------------------------------------------------
 *  This is the same payload `useSeo` injects at runtime, factored out so the
 *  build can put it in the served HTML.
 *
 *  Why it matters, and this is Google's own wording rather than folklore:
 *  their JavaScript SEO guidance says pre-rendering "is still a great idea
 *  because it makes your website faster for users and crawlers, **and not all
 *  bots can run JavaScript.**" Social previewers — Slackbot, LinkedInBot,
 *  facebookexternalhit — definitively do not. A JSON-LD block that only exists
 *  after hydration is a JSON-LD block most of the audience never sees.
 *
 *  On `knowsAbout`: this is the field specific to this site, because it is the
 *  machine-readable declaration of what he actually works with. The guidance is
 *  to keep it honest and short — a list that outruns the published work reads
 *  as keyword stuffing in entity form, which is worse than omitting it.
 */
export interface PersonSchema {
  "@context": "https://schema.org";
  "@type": "Person";
  "@id": string;
  name: string;
  alternateName?: string;
  jobTitle: string;
  description: string;
  url: string;
  email: string;
  image?: string;
  address: {
    "@type": "PostalAddress";
    addressLocality: string;
    addressCountry: string;
  };
  knowsAbout: string[];
  alumniOf: {
    "@type": "EducationalOrganization";
    name: string;
  }[];
  sameAs: string[];
}

export function buildPersonSchema(): PersonSchema {
  const { meta, systems, education } = site;
  const url = meta.url.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    // A stable identity so per-project `TechArticle` nodes can point at this
    // exact person with an `@id` reference instead of restating the author.
    "@id": `${url}/#person`,
    name: meta.name,
    jobTitle: meta.role,
    description: meta.description,
    url,
    email: `mailto:${meta.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.meta.location.split(",")[0]?.trim() ?? site.meta.location,
      addressCountry: "PK",
    },
    // Honest and short: the tools the systems actually use, deduplicated
    // and capped. This is a verification signal, not a keyword list.
    knowsAbout: [...new Set(systems.flatMap((system) => system.stack))].slice(0, 24),
    alumniOf: education.map((credential) => ({
      "@type": "EducationalOrganization",
      name: credential.issuer,
    })),
    // The disambiguation layer. Two people with the same name is the failure
    // mode this field exists to solve.
    sameAs: site.socials.filter((social) => social.external).map((social) => social.href),
  };
}

/**
 * A crawlable plain-text summary of the work.
 *
 * Injected into the served HTML rather than generated at runtime, because the
 * only crawlers guaranteed to read it are the ones that do not execute
 * JavaScript. It is deliberately terse — this exists to be indexed, not read.
 */
export function buildStaticSummary(): string {
  const { meta, systems } = site;
  const lines = [
    `${meta.name} — ${meta.role}. ${meta.location}.`,
    meta.description,
    "",
    "Systems:",
    ...systems.map(
      (system) =>
        `- ${system.title} (${system.year}, ${system.status}). Stack: ${system.stack.join(", ")}. ${system.summary}`,
    ),
    "",
    "Repositories:",
    ...systems.flatMap((system) => system.links.map((link) => `- ${link.href}`)),
    "",
    `Contact: ${meta.email}`,
  ];
  return lines.join("\n");
}

/**
 * ---------------------------------------------------------------------------
 *  Per-project structured data
 * ---------------------------------------------------------------------------
 *  Every system gets its own URL, so every system gets its own document. A
 *  `TechArticle` is the honest type here: these are written arguments about
 *  engineering decisions, with a stated scope boundary, and that is closer to
 *  a technical article than to a `CreativeWork` or a product listing.
 *
 *  `about` points at the Person rather than restating the author, and
 *  `keywords` is the project's own stack list — the same strings the page
 *  renders, so it cannot drift into keyword stuffing the way a hand-written
 *  block does.
 */
export interface ProjectSchema {
  "@context": "https://schema.org";
  "@type": "TechArticle";
  headline: string;
  description: string;
  articleSection: string;
  datePublished: string;
  inLanguage: string;
  url: string;
  mainEntityOfPage: { "@type": "WebPage"; "@id": string };
  author: { "@id": string };
  about: { "@id": string };
  keywords: string;
  wordCount: number;
}

export function projectPath(slug: string): string {
  return `/project/${slug}/`;
}

export function buildProjectSchema(system: System): ProjectSchema {
  const { meta } = site;
  const origin = meta.url.replace(/\/$/, "");
  const url = `${origin}${projectPath(system.slug)}`;

  // Counted rather than guessed, so the number cannot drift from the page.
  const words = [
    system.summary,
    system.constraint,
    ...system.decisions.flatMap((item) => [item.decision, item.why, item.cost]),
    ...system.notBuilt,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: system.title,
    description: system.summary,
    articleSection: "Engineering case study",
    // No fabricated publication date. The year is a claim the config already
    // makes and the repository history backs; a full date would be invented.
    datePublished: `${system.year}-01-01`,
    inLanguage: meta.locale,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": `${origin}/#person` },
    about: { "@id": `${origin}/#person` },
    keywords: system.stack.join(", "),
    wordCount: words,
  };
}

/**
 * The full case study as crawlable text.
 *
 * This is what a crawler that does not execute JavaScript actually receives in
 * place of the rendered article, and it is deliberately complete rather than
 * abbreviated — the constraint, every decision with its cost, the whole scope
 * boundary, the stack and the repository links. Abbreviating it would defeat
 * the only reason this page exists as a separate URL.
 */
export function buildProjectSummary(system: System): string {
  const { meta } = site;
  const lines = [
    `${system.title}`,
    `${meta.name} — ${meta.role}. ${system.year}. ${system.status}`,
    "",
    system.summary,
    "",
    "THE HARD PART",
    system.constraint,
    "",
    "DECISIONS, AND WHAT EACH COST",
    ...system.decisions.flatMap((item, index) => [
      `${index + 1}. ${item.decision}`,
      `   Why: ${item.why}`,
      `   Cost: ${item.cost}`,
    ]),
    "",
    "DELIBERATELY NOT BUILT",
    ...system.notBuilt.map((item) => `- ${item}`),
    "",
    `STACK: ${system.stack.join(", ")}`,
    "",
    "METRICS",
    ...system.metrics.map((metric) => `- ${metric.label}: ${metric.value}`),
    "",
    "SOURCE",
    ...system.links.map((link) => `- ${link.href}`),
    "",
    `Full case study: ${meta.url.replace(/\/$/, "")}${projectPath(system.slug)}`,
    `Contact: ${meta.email}`,
  ];
  return lines.join("\n");
}

/** Every internal route, for the sitemap generator and the crawler summary. */
export function allRoutes(): { path: string; title: string }[] {
  return [
    { path: "/", title: `${site.meta.name} — ${site.meta.role}` },
    { path: "/projects/", title: "Systems" },
    ...site.systems.map((system) => ({
      path: projectPath(system.slug),
      title: system.title,
    })),
  ];
}
