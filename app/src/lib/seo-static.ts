/**
 * Relative, not `@/`. This module is imported by `vite.config.ts`, and Vite
 * bundles the config with its own resolver — the app's `@/*` alias is not in
 * scope there, so an aliased import fails with ERR_MODULE_NOT_FOUND at build
 * time rather than doing anything subtle.
 */
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
    name: meta.name,
    jobTitle: meta.role,
    description: meta.description,
    url,
    email: `mailto:${meta.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Rawalpindi",
      addressCountry: "PK",
    },
    // Honest and short: the tools the five systems actually use, deduplicated
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
