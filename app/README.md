# Awon Aziz — portfolio

> **Repository layout.** The repo root is the GitHub Pages deploy target —
> `index.html`, `assets/` and friends at the root are build output and are
> committed. The Vite project lives in **`app/`**.
>
> ```bash
> cd app
> npm install
> npm run dev        # http://localhost:5173
> ```
>
> The GitHub Actions workflow builds `app/`, checks lint and typecheck, then
> copies the result to the root and commits it back. See
> [Deploying](#deploying) for why that indirection exists.

An AI/MLOps engineer's portfolio. One RAF loop for the whole site, a hand-written
GLSL Matrix rain and depth field inside a single WebGL canvas, five case studies
where every decision is printed next to what it cost, and an instrumentation
band that reports on the page with numbers it read at runtime.

```
Lenis ─┐
GSAP  ─┼─ GSAP ticker (single rAF) ─┬─ Lenis.raf()
R3F   ─┘                            └─ addEffect(invalidate)
```

## Why the page is shaped this way

Ordered against a review budget of roughly 55 seconds, because a portfolio is a
pass/fail filter and a routing tool, not a persuasion document.

| # | Section | What it is doing |
|---|---------|-----------------|
| 1 | **Hero** | Level, domain, place and availability above the fold. With no employment timeline this is the only positioning asset the page has. |
| 2 | **Stats** | Four checkable counts immediately under the fold. A reviewer scans for numbers first, and making them scroll past an introduction is what makes portfolios feel like marketing. |
| 3 | **Systems** | Projects inside the first two sections, not after a bio. Each leads with the hard constraint and only then names a technology. |
| 4 | **Runtime** | The site reports on itself. Answers "did you build this, or write about it". |
| 5 | **Provenance** | Every tool traced to the system that uses it. The anti-stack-wall. |
| 6 | **Method** | Working claims each paired with something openable, plus the no-go log. |
| 7 | **Archive** | 95 lab exercises, subordinate by construction. |
| 8 | **Currently** | Dated, labelled intent. The one place unfinished work is allowed. |
| 9 | **Education** | Qualifications. Never presented as employment. |
| 10 | **FAQ** | The four questions a technical reader arrives with. |
| 11 | **Contact** | Boring, obvious, non-negotiable. |

Five things the page deliberately does **not** do, because they are the most
common credibility mistakes in developer portfolios:

- **No preloader.** The previous version gated the first paint behind a measured
  counter. Full-screen entrance animations are named as a disqualifier in
  portfolio screening, for the obvious reason that a one-second loader is a
  one-second delay — and the hero headline is the only positioning asset
  available to someone without an employment history. It was also a WCAG 2.2.2
  exposure bought for nothing. The WebGL layer lazy-loads behind a gradient
  instead, so the atmosphere arrives *after* the content.
- **No skill percentages or proficiency bars.** "Python 80%" is compared to
  nothing and reads as an admission of not knowing how to communicate.
- **No stack wall.** A list claiming everything equally is senior in nothing. The
  **Provenance** section is the deliberate replacement: every tool is extracted
  from the systems above it and shows how many of them use it, so Python
  appearing five times and Kubernetes once is a fact about the work rather than
  a ranking.
- **No testimonials.** No clients, no managers, nothing to show.
- **No uniform fade-up.** Every element rising by the same distance on the same
  stagger is the default ScrollReveal heritage and reads as a template. Each
  effect here goes where it is the best tool: word-level masks on display type,
  character decode on short mono labels, count-up on figures, and native
  scroll-driven animation where no shared clock is needed.

## Motion

One ambient loop (the rain), and everything else earns its place.

| Effect | Where | Why there |
|--------|-------|-----------|
| Word-level mask reveal | Hero claim, section titles | A 45-character heading revealed per character is slow enough that a reader waits for it. Per word it reads as a sentence arriving. |
| Character decode | Hero availability line, section eyebrows | Short, technical strings, already set in a face where noise reads as plausible. Written from scratch in `components/ui/decode-text.tsx` so it uses the site's single clock and honours `prefers-reduced-motion`. |
| Count-up | Stats band | With `tabular-nums`, so the row does not shift sideways while it counts. Counts once — re-running on every scroll entry makes the page feel like a cutscene. |
| Native scroll-driven | Stats band | Four elements fading on entry need no shared clock and no main-thread work. |
| Static scanlines | Whole page | Completes the terminal surface. Static, because a drifting scanline would be a second ambient loop competing with the rain. |

Section numbers are **derived from DOM order**, not hard-coded, so adding,
removing or reordering a section keeps them correct. The hero and contact opt out
with `data-scroll-index="off"`.

## Type

Three families, three jobs. This is the Siena Film Foundation shape — grotesque
display, quiet body, mono metadata — and each choice is load-bearing:

- **Space Grotesk** (display + UI). A proportional cut of Space Mono, tuned for
  non-display sizes, so it keeps the technical letterforms without being the
  Space Mono costume that every "developer aesthetic" reaches for.
- **Newsreader** (prose). The reason is not aesthetic. A long-form serif reads as
  a *hiring document*, which is what this page is. Most developer portfolios are
  set entirely in a grotesque and end up reading as a landing page.
- **Geist Mono** (values only). Counts, timestamps, versions, paths, metric keys
  — never a sentence. That rule is what keeps the engineering register from
  becoming a costume, and it is the pattern every real design system that uses
  mono actually follows. `tabular-nums` is not decorative here: these strings
  change in place as the feed refreshes, and proportional figures make the whole
  column twitch.

## Composition

The layout decisions are the ones that separate a page that reads as designed
from one that reads as styled. All of them are layout, not motion:

- **Push and pop.** `Section`'s `split` prop alternates the header/body column
  ratio between sections — 8/4, 4/8, 9/3, 3/9. Zero JavaScript, and it is what
  stops a 20,000px page reading as a stack of identical boxes. Change two
  sections to the same ratio and the rhythm breaks.
- **Section width decoupled from prose measure.** Headings align to the shell;
  running text caps at 68ch and stays **left-aligned**. Centring prose inside a
  wide box is the single most common thing that makes a technical page feel
  unconsidered. Left-aligning it under a full-width heading makes the page read
  as one left edge with a ragged right.
- **Density contrast.** The hero is enormous and nearly empty; the footer is
  denser than the body; Systems is the densest section on the page.
- **1px page rails** down both edges, holding the grid together across the whole
  document.
- **Scroll edge fades** via `mask-image`, which dissolve a hard section boundary
  — the opposite of a border — and hint that more exists without drawing a
  control.
- **No camera rig.** The previous version moved a perspective camera through
  shots keyed to global scroll progress. It was the weakest part of that page: a
  second focal point competing with the text for a long scroll reads as drift
  rather than as parallax. The depth field gets the same sense of movement from
  one rotational axis, which costs one transform instead of a camera solve and
  cannot fight the typography.

## The Matrix rain

There is no npm package for this. Everything published under that name is a CLI,
a canvas-2D React component from the React 16 era, unmaintained, or a WebGPU demo
that opens its own device. None run inside an existing R3F `<Canvas>`, and a
second WebGL context for a background would be a bad trade. So it is hand-written.

**The trail is not a framebuffer.** Brightness is a closed-form function of
`(time, cell)` evaluated per fragment, and the bright head is derived as a
gradient of that function rather than stored:

```glsl
float t = wobble(columnTime - cell.y / uTrailLength);
return 1.0 - fract(t);
```

Two things fall out for free. It looks identical at 12fps and 144fps, because
nothing accumulates. And `wobble()` warping the sawtooth's *period* gives
multiple non-overlapping drops per column with different speeds.

The row coefficient is `1/uTrailLength`, not a tuned constant. Brightness has to
complete exactly one cycle over `uTrailLength` rows or the trail is not
`uTrailLength` cells long. Decouple them and every column becomes a uniform
scatter of glyphs with no head and no trail — which is exactly what the first
build did.

**One quad, one context.** The vertex stage ignores every matrix and writes clip
coordinates directly, so the rain is a single `frustumCulled={false}` quad at
`renderOrder: -100` inside the existing camera. No second render pass, and the
per-frame CPU cost is a handful of uniform writes — GPU fill does not block
input, so this stays off the INP path entirely.

**Real characters.** `src/gl/rain/glyph-atlas.ts` rasterises halfwidth katakana
into an offscreen canvas once and wraps it as a texture. Not Latin
alphanumerics — the eye reads Latin as "text I should be trying to read", which
fights the actual content. The atlas probes for notdef-width tofu and falls back
to a digit/letter set rather than rendering a screen of empty boxes.

### Readability, which is the hard part

Three separate criteria are in play, and dimming the effect is not the answer to
any of them:

- **The glyphs are exempt from 1.4.3.** W3C's own understanding doc says
  decorative text that could be "rearranged or substituted without changing
  meaning" is excluded. The rain qualifies; the body copy does not.
- **A looping background over other content is a WCAG 2.2.2 Level A exposure**,
  and pause-on-hover does *not* satisfy it. Hence the real toggle at bottom
  right (`Esc` also pauses), and a `prefers-reduced-motion` path that **freezes
  one frame** rather than blanking the canvas — a static rain field still reads
  as intentional, an empty black canvas reads as broken.
- **Contrast must hold unconditionally, not usually.** 1.4.3 measures against
  "the background behind the text", which here is moving. Every section carries a
  `scrim-block` between canvas and content.

There is also a practical version of that last point that is not a spec
requirement: the first pass looked legible but read as *busy*. The eye parses a
dense moving field as information and stops reading the prose. Rain density,
depth-field opacity and scrim strength were all tuned down together until the
text won.

Chromatic aberration is nearly zero. Green rain across a full viewport plus CA
produces muddy fringes rather than a lens effect; bloom does the glow work.

### A bug worth documenting

The whole scene rendered as an empty black canvas for two builds. The cause was a
**trailing comma in a GLSL function argument list** — illegal in GLSL ES 1.00,
which is three.js `ShaderMaterial`'s default. three.js logs a shader-compile
error to `console.error`, fails the material, and draws nothing. No exception is
thrown, nothing appears in the React tree, and `Page.captureScreenshot` returns a
perfectly valid image of an empty page.

Worth knowing because it is invisible to every check except reading the browser
console. A CDP harness that only listens for `Runtime.exceptionThrown` and
`Log.entryAdded` will report a clean run.

## The instrumentation band

The single most useful thing a portfolio can carry when its credibility problem
is "prove you built it". Three sources, all real, none mocked:

| Panel | Source | What it reads |
|-------|--------|---------------|
| **This page** | `Navigation Timing API` | TTFB, load time, request count, bytes transferred, the quality tier actually allocated, particle budget, and whether native scroll-driven animations are supported. |
| **cleanjobfunnel** | `.../cleanjobfunnel/data/status.json` | The file the scheduled workflow writes every 20 minutes. Source health, open roles read, last scan. |
| **GitHub** | `api.github.com/users/AwonAziz` | Public repo count and account age, via a CORS-open public endpoint. |

Every cell prints its source underneath it, and a cell that could not be read
renders an explicit unavailable state rather than a plausible placeholder. That
is the whole design rule: the moment a reviewer catches one fabricated metric,
they distrust all of them. So the eight failing job-board sources are shown in
red and the GitHub panel is labelled `unauthenticated` — because a cold IP cache
genuinely can be rate-limited, and saying so is true.

Both fetches are bounded by an 8-second `AbortController`. An instrumentation
panel must never hold the page open.

## Navigation

Two persistent orientation devices, and they are not competing:

- **Minimap** (right rail, md+). Rauno Freiberg's technique, which Awwwards files
  as a *Navigation* element. A linear scrollbar communicates position but nothing
  about structure: a reader landing at 60% cannot tell whether they are three
  sections in or one section in the middle of something. A visible map of seven
  sections is a promise that the rest is worth it. Driven from the same
  `scrollState` the rest of the page reads — naive `scrollY / (scrollHeight -
  innerHeight)` breaks the moment a section is sticky, because the two disagree
  about where the viewport is.
- **ProgressRule** (top hairline). The cheapest signal that a page is scrollable
  at all. It does not replace the minimap.

## Architecture

### One RAF loop

`src/providers/smooth-scroll.tsx` registers GSAP plugins at **module scope** —
never inside an effect, because React 19 StrictMode double-invokes and
re-registering ScrollTrigger leaks trigger instances that keep firing against dead
elements. GSAP's ticker is the single clock: Lenis steps inside it, every
ScrollTrigger evaluates inside it, and R3F's render loop is added to it from
`gl/scene.tsx`.

`autoRaf: false` is mandatory. Lenis starts its own rAF by default, which gives
two loops and double-speed scroll.

GSAP plugins are separate entry points in GSAP's ESM build, not named exports of
the root:

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";           // default export
```

### Two motion systems with a hard boundary

**GSAP** owns anything needing a shared clock: text splitting, pinning,
orchestration, anything with a callback.

**Native CSS scroll-driven animations** own everything else. They run on the
compositor with deterministic frame timing and no main-thread cost, and are
gated behind `@supports (animation-timeline: view())`.

This depends on Lenis driving **real** scroll rather than a transform wrapper,
which is its default but is a load-bearing assumption. It is verified at runtime:
after `window.scrollTo`, `scrollY` reaches the target and the `--scroll-progress`
custom property updates. The Runtime panel also reports whether the browser
supports `view()` at all, because roughly 13% of traffic does not and would
otherwise fall back to no animation silently.

### Scroll never re-renders

`src/lib/scroll-store.ts` is a module-level mutable singleton, deliberately not
React state. Scroll position, progress, velocity and direction are written once
per Lenis frame and read inside `useFrame` by the scene. CSS custom properties
are patched straight onto the document element, which is the one thing the main
thread does not have to reconcile.

### Quality tiers

`src/lib/quality.ts` classifies the device once from `hardwareConcurrency`,
`deviceMemory` and pointer type — evidence, not a user-agent string — then every
expensive thing asks for a budget before it runs.

| Tier | DPR | Particles | Post FX | Rain cell | Rain opacity |
|------|-----|-----------|---------|-----------|--------------|
| `low` | 1 | 6,000 | off | 34px | 0.14 |
| `mid` | 1 – 1.5 | 20,000 | on | 27px | 0.16 |
| `high` | 1 – 2 | 44,000 | on | 24px | 0.17 |

`PerformanceMonitor` calls `downgrade()` when the device cannot hold the budget,
and `AdaptiveDpr` keeps the pixel ratio honest. The instrumentation panel reads
the *same* budget object, so the tier shown is the tier actually allocated.

Override from the URL:

```
http://localhost:5173/?tier=low
```

### Chunking

`vite.config.ts` splits `three`, `@react-three/*` + `postprocessing`, and
`gsap` + `lenis` into separate chunks so the ~270 kB gzipped 3D layer is not in
the initial HTML payload. `app.tsx` lazy-loads `Scene` behind `Suspense`.

## Accessibility

- Skip link, semantic `<main>`, one `<h1>`
- Decision disclosures are real `<button aria-expanded>` inside `<section>`
  landmarks; FAQ entries are native `<details>`
- The Matrix rain has a visible pause control (bottom right, or `Esc`).
  Reduced motion **freezes** the field to one frame instead of blanking it, and
  disables Lenis smoothing entirely rather than shortening it
- `prefers-reduced-motion` also trims the scene and gates every scroll animation
- Coarse-pointer users get no hover-only affordances
- The render loop stops on `visibilitychange`
- WebGL absence degrades to a CSS gradient, not a blank screen
- The `<noscript>` block lists all five repositories and the contact address, so a
  non-JS reader is not told to go away
- Nav and minimap both derive state from `[data-scroll-section]`

## Commands

Run from `app/`:

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + vite build -> app/dist
npm run preview      # serve app/dist
npm run lint         # biome check
npm run lint:fix
npm run typecheck
```

Requires Node `>=20.19`.

To publish a change without waiting for CI:

```bash
cd app
npm run build
cd ..
rm -rf assets && cp -r app/dist/assets assets
cp app/dist/index.html app/dist/favicon.svg app/dist/robots.txt app/dist/sitemap.xml .
git commit -am "chore: publish build" && git push
```

## Deploying

### GitHub Pages (current setup)

`.github/workflows/deploy.yml` runs `lint` and `typecheck` **before** building, so
a broken push cannot ship. It then copies `app/dist` to the repository root and
commits it back with a `[skip ci]` marker so it does not re-trigger itself.

The copy-back exists because Pages here is configured as **"Deploy from a
branch"** (`main/root`) with Jekyll. That setting needs repo admin to change, and
a Jekyll branch build serves whatever is at the root — so the root has to *be*
the built site. The workflow also removed `_config.yml` and added `.nojekyll` so
Pages stops Jekyll entirely.

**Optional, and worth doing:** switch **Settings → Pages → Source → GitHub
Actions**. Once that is set, delete the `Publish to repository root` step and the
`actions/deploy-pages` artifact path can be used directly, which means the root
no longer needs committed build output at all.

### Cloudflare Pages

Build command `npm run build`, output directory `app/dist`, Node `22` (from
`app/.nvmrc`), environment variable `VITE_SITE_URL`. By hand:

```bash
cd app && npm run build
npx wrangler pages deploy dist --project-name devfolio
```

`app/public/_headers` sets a strict CSP naming only the origins the page needs,
plus HSTS, `nosniff`, `X-Frame-Options: DENY`, immutable caching on fingerprinted
`/assets/*`, and `max-age=0` on `index.html` so a deploy is never invisible.

**Do not enable Cloudflare Web Analytics or Bot Fight Mode.** Both inject scripts
that the strict CSP blocks, which produces console errors rather than a clean
failure. The page has its own instrumentation and does not need either.

## Customising

Edit **`src/config/site.data.ts`**. Everything the site renders comes from there,
and it is validated at module load by `src/config/schema.ts`, so a typo throws
with a readable path instead of rendering `undefined`.

The schema is deliberately stricter than it needs to be:

- `systems[].constraint` is required, and `decisions[].cost` is required alongside
  `decisions[].why`. A decision with no stated cost is a sales pitch.
- `systems[].notBuilt` is required and non-empty — it is the part a reviewer can
  check fastest, so it cannot be left blank.
- `systems[].status` must state running / simulated / abandoned, not "done".
- `practice[].evidence` must be a file, a number or a test.
- `archive[].scale` must be a checkable quantity, not a word.

If a claim stops being checkable, delete the claim rather than soften it.

## Adding a section

1. Create `src/components/sections/<name>.tsx` and add `data-scroll-section="<name>"` to the wrapper — that is how the nav and the minimap pick it up.
2. Register it in `src/components/site.tsx`.
3. Give it a `split` value that differs from its neighbours, or the push-and-pop rhythm breaks.
4. Add it to the `SECTIONS` list in `src/components/ui/minimap.tsx`, and to `site.nav` if it belongs in the header.

## A note on borrowing

`DavidHDev/react-bits` (48k stars) and `magicuidesign/portfolio` were both
studied as references. react-bits has **no LICENSE file** — GitHub reports
`NOASSERTION` — so none of its code is reused here. The techniques it
demonstrates (decode reveals, count-up, scanline treatments) are reimplemented
from scratch in `components/ui/`, integrated with this site's single GSAP
clock, `prefers-reduced-motion` handling and quality tiers, which the
off-the-shelf versions do not respect.

Two bugs found only by rendering and looking, not by testing:

- Section numbering initially counted only `Section`-based sections, so the
  hand-rolled ones were unnumbered and the rest started at 01 out of order. It
  is now derived from `[data-scroll-section]` with an explicit opt-out.
- The provenance column in the index originally rendered full system *titles* —
  full sentences like "Model lifecycle: drift, retrain, and a promotion that can
  be refused" — which pushed the tool's own name out of every row in the
  three-column grid. It uses the slug now, with the titles in the accessible
  name.