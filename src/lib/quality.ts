/**
 * ---------------------------------------------------------------------------
 *  Quality tiers
 * ---------------------------------------------------------------------------
 *  A real-time portfolio that stutters is a broken portfolio. The device is
 *  classified once and every expensive thing asks for a budget before it runs.
 *
 *  Tier comes from signals that actually predict GPU headroom — core count,
 *  device memory, pointer type — not from a user-agent string. A UA string
 *  guesses; `hardwareConcurrency` is at least evidence.
 *
 *  There is a URL override because every serious visual decision on this site
 *  was made by looking at all three tiers side by side:
 *
 *      ?tier=low    what a throttled machine gets
 *      ?tier=mid    the default
 *      ?tier=high   what the reference screenshots show
 * ---------------------------------------------------------------------------
 */

export type Tier = "low" | "mid" | "high";

export interface QualityBudget {
  tier: Tier;
  /** Upper bound for renderer pixel ratio. */
  dpr: [number, number];
  /** Particle budget for the GPU depth field. */
  particles: number;
  /** Post-processing stack enabled. */
  postFx: boolean;
  /** Bloom intensity. 0 disables the pass but keeps the stack assembled. */
  bloom: number;
  /** Rain glyph cell height in CSS pixels; smaller = denser + more fill. */
  rainCell: number;
  /** Rain peak trail opacity. */
  rainOpacity: number;
  /** Custom cursor / magnetic interactions. */
  pointerFx: boolean;
  /** Float animation for ambient elements. */
  ambient: boolean;
}

const PRESETS: Record<Tier, QualityBudget> = {
  low: {
    tier: "low",
    dpr: [1, 1],
    particles: 6_000,
    postFx: false,
    bloom: 0,
    rainCell: 34,
    rainOpacity: 0.14,
    pointerFx: false,
    ambient: false,
  },
  mid: {
    tier: "mid",
    dpr: [1, 1.5],
    particles: 20_000,
    postFx: true,
    bloom: 0.7,
    rainCell: 27,
    rainOpacity: 0.16,
    pointerFx: true,
    ambient: true,
  },
  high: {
    tier: "high",
    dpr: [1, 2],
    particles: 44_000,
    postFx: true,
    bloom: 1,
    rainCell: 24,
    rainOpacity: 0.17,
    pointerFx: true,
    ambient: true,
  },
};

function detect(): Tier {
  if (typeof window === "undefined") return "mid";

  const override = new URLSearchParams(window.location.search).get("tier");
  if (override === "low" || override === "mid" || override === "high") return override;

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
  score += coarse ? -1 : 1;

  const tier: Tier = score >= 4 ? "high" : score >= 2 ? "mid" : "low";

  // Reduced motion means the user asked for less, so never hand them the
  // highest budget even on a machine that could take it.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && tier === "high") {
    return "mid";
  }
  return tier;
}

let cached: QualityBudget | null = null;
const listeners = new Set<() => void>();

export function getQuality(): QualityBudget {
  cached ??= PRESETS[detect()];
  return cached;
}

export function subscribeQuality(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nudge the tier down one step. Called by R3F's PerformanceMonitor. */
export function downgrade(): QualityBudget | null {
  const current = getQuality();
  if (current.tier === "low") return null;
  const next = current.tier === "high" ? PRESETS.mid : PRESETS.low;
  cached = next;
  for (const listener of listeners) listener();
  return next;
}
