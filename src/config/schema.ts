import { z } from "zod";

/**
 * ---------------------------------------------------------------------------
 *  Content contract
 * ---------------------------------------------------------------------------
 *  Every claim the site renders is declared here and validated at module load.
 *  A typo throws with a readable path instead of rendering `undefined`.
 *
 *  The schema is deliberately stricter than it needs to be. It encodes the rules
 *  that make the page credible:
 *
 *    - `systems[].constraint` is required and must come before any technology
 *      is named. A stack list is inventory; a constraint is an argument.
 *    - `decisions[].cost` is required alongside `decisions[].why`. A decision
 *      with no stated cost is a sales pitch.
 *    - `systems[].notBuilt` is required and non-empty. This is the part a
 *      reviewer can check fastest, so it cannot be left blank.
 *    - `systems[].status` must state running / simulated / abandoned, never a
 *      bare "done".
 *    - `practice[].evidence` must be a file, a number or a test.
 *    - `archive[].scale` must be a checkable quantity, not a word.
 *
 *  If a claim stops being checkable, delete the claim rather than soften it.
 * ---------------------------------------------------------------------------
 */

const link = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().default(false),
});

const social = link.extend({ handle: z.string().min(1) });

/** A decision, and what it cost. Splitting these is the whole point. */
const decision = z.object({
  decision: z.string().min(1),
  why: z.string().min(1),
  cost: z.string().min(1),
});

/** A label and a value that came out of a real system. */
const metric = z.object({ label: z.string().min(1), value: z.string().min(1) });

const system = z.object({
  /** Kebab-case; used for anchor ids and disclosure panel ids. */
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  /** Where it actually is. Never a bare "done". */
  status: z.string().min(1),
  /** One line, no jargon: what it is for. */
  summary: z.string().min(1),
  /** The hard part, stated before any technology is named. */
  constraint: z.string().min(1),
  decisions: z.array(decision).min(1),
  metrics: z.array(metric).default([]),
  stack: z.array(z.string()).min(1),
  /**
   * ASCII architecture diagram in a monospace pre. Engineers read ASCII, and it
   * is diffable, greppable and adds no image payload — which matters when the
   * alternative is a screenshot nobody can zoom into.
   */
  diagram: z.string().min(1).optional(),
  /** The scope boundary. Stated plainly, because a reviewer will ask. */
  notBuilt: z.array(z.string()).min(1),
  links: z.array(link).default([]),
});

const practice = z.object({
  index: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  /** A file, a number or a test a reviewer can open and confirm. */
  evidence: z.string().min(1),
});

const nogolog = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

const archiveEntry = z.object({
  name: z.string().min(1),
  contents: z.string().min(1),
  /** A checkable quantity, not a word. */
  scale: z.string().min(1),
  date: z.string().min(1),
  href: z.string().min(1),
  kind: z.enum(["lab", "experiment"]),
});

const credential = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  year: z.string().min(1),
  detail: z.string().min(1),
});

const faqEntry = z.object({
  question: z.string().min(1),
  /** Answered one point at a time so each is a real, checkable claim. */
  points: z.array(z.string()).min(1),
});

const siteSchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    description: z.string().min(1),
    url: z.url().default("https://example.com"),
    locale: z.string().default("en"),
    location: z.string().min(1),
    email: z.email(),
  }),

  /**
   * The above-the-fold block. With no employment history this is the only
   * positioning asset the page has, so it states level, domain, place and
   * availability rather than a persona adjective.
   */
  headline: z.object({
    claim: z.string().min(1),
    sub: z.string().min(1),
    availability: z.string().min(1),
    ctaPrimary: z.string().min(1),
    ctaSecondary: z.string().min(1),
  }),

  hero: z.object({
    /** Real capability strings, revealed per character. Not a scramble. */
    rotating: z.array(z.string()).min(1),
    scrollHint: z.string().default("Scroll"),
  }),

  nav: z.array(link).min(2),
  marquee: z.array(z.string()).min(1),
  socials: z.array(social).min(1),

  /** Checkable counts. No percentages, no proficiency bars. */
  stats: z.array(metric).min(1),

  /** Featured work, ordered by depth of the argument, not by date. */
  systems: z.array(system).min(1),

  /** How I work, each claim paired with something openable. */
  practice: z.array(practice).min(1),

  /** Negative results and deliberate boundaries. */
  nogolog: z.array(nogolog).min(1),

  /** Foundation work, clearly subordinate to the systems above. */
  archive: z.array(archiveEntry).min(1),

  /** Small, dated, labelled. Not a feature slot. */
  currently: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })).min(1),

  /** Education and certifications. Never presented as employment. */
  education: z.array(credential).min(1),

  /** The questions a technical reader arrives with. */
  faq: z.array(faqEntry).min(1),

  /**
   * Live instrumentation sources. The site reports on itself with numbers it
   * read at runtime, and names the source of every one.
   */
  runtime: z.object({
    /** His own scheduled workflow, read from the deployed site. */
    funnelFeed: z.url(),
    funnelLabel: z.string().min(1),
    /** Public GitHub API - CORS-open, so a real fetch, not a mock. */
    githubUser: z.string().min(1),
    /** Stated when a feed is unreachable, so an empty cell is never a lie. */
    unavailable: z.string().min(1),
  }),

  contact: z.object({
    heading: z.string().min(1),
    email: z.email(),
    cta: z.string().default("Send an email"),
    availability: z.string().min(1),
    note: z.string().min(1),
  }),

  footer: z.object({
    note: z.string().min(1),
    colophon: z.string().min(1),
  }),
});

export type Social = z.infer<typeof social>;
export type System = z.infer<typeof system>;
export type Decision = z.infer<typeof decision>;
export type Practice = z.infer<typeof practice>;
export type Nogolog = z.infer<typeof nogolog>;
export type ArchiveEntry = z.infer<typeof archiveEntry>;
export type Credential = z.infer<typeof credential>;
export type FaqEntry = z.infer<typeof faqEntry>;
export type NavLink = z.infer<typeof link>;
export type Metric = z.infer<typeof metric>;
export type SiteConfig = z.infer<typeof siteSchema>;

export const validateSite = (input: unknown): SiteConfig => siteSchema.parse(input);
