import { useEffect } from "react";
import { site } from "@/config/site.data";

/**
 * ---------------------------------------------------------------------------
 *  SEO
 * ---------------------------------------------------------------------------
 *  Vite has no server, so metadata is injected at runtime. Crawlers that execute
 *  JS (Googlebot does) will see it; `index.html` carries a coherent default plus
 *  a `<noscript>` fallback for the ones that do not.
 *
 *  Everything is derived from the same validated config the page renders, so the
 *  structured data cannot drift from the visible content. `knowsAbout` comes from
 *  what the systems actually use rather than a self-declared skills list — which
 *  is the one claim on this page a reviewer will actually check.
 *
 *  If you migrate to a framework with server components, delete this file and
 *  use its `metadata` export instead.
 * ---------------------------------------------------------------------------
 */
function upsertMeta(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export function useSeo() {
  useEffect(() => {
    const { meta, systems, education } = site;
    const title = `${meta.name} — ${meta.role}`;
    const url = meta.url.replace(/\/$/, "");

    document.title = title;

    upsertMeta('meta[name="description"]', "name", "description", meta.description);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      meta.description,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", "profile");
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", meta.locale);
    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      meta.description,
    );

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = url;

    // A Person node with the same `sameAs` list as the social row, so search
    // engines can reconcile the two, and an `alumniOf` drawn from the real
    // education ledger rather than a hand-maintained string.
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: meta.name,
      jobTitle: meta.role,
      description: meta.description,
      url,
      email: `mailto:${meta.email}`,
      address: { "@type": "PostalAddress", addressLocality: meta.location },
      sameAs: site.socials.filter((social) => social.external).map((social) => social.href),
      alumniOf: { "@type": "EducationalOrganization", name: education[0]?.issuer ?? "" },
      knowsAbout: [...new Set(systems.flatMap((system) => system.stack))],
    };

    let script = document.head.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      document.head.append(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }, []);
}
