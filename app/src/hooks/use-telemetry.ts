import { useEffect, useState } from "react";
import { site } from "@/config/site.data";
import { getQuality } from "@/lib/quality";

/**
 * ---------------------------------------------------------------------------
 *  Live instrumentation
 * ---------------------------------------------------------------------------
 *  The single most useful thing a portfolio can carry when its credibility
 *  problem is "prove you built it": report on itself, with numbers it read at
 *  runtime, and name the source of every one.
 *
 *  Three sources, all real, none mocked:
 *
 *    1. **This page.** Navigation Timing and Resource Timing are measured by the
 *       browser about the page you are looking at. Nothing to configure,
 *       nothing to lie about.
 *
 *    2. **The job funnel.** `cleanjobfunnel` commits a `status.json` on every
 *       scheduled scan. This reads the actual file the workflow writes — the
 *       same URL its own dashboard renders.
 *
 *    3. **GitHub.** The public REST API is CORS-open, so a real request.
 *
 *  Every field carries a `source` and the UI prints it. A field that cannot be
 *  read renders an explicit unavailable state rather than a placeholder number,
 *  because the moment a reviewer catches one fabricated metric they distrust all
 *  of them. That is the whole design rule.
 * ---------------------------------------------------------------------------
 */

export interface Reading<T> {
  value: T | null;
  source: string;
  pending: boolean;
  error: string | null;
}

const pending = <T>(source: string): Reading<T> => ({
  value: null,
  source,
  pending: true,
  error: null,
});
const failed = <T>(source: string, error: string): Reading<T> => ({
  value: null,
  source,
  pending: false,
  error,
});
const read = <T>(source: string, value: T): Reading<T> => ({
  value,
  source,
  pending: false,
  error: null,
});

/** Every fetch here is bounded. An instrumentation panel must never hold the page open. */
const FETCH_TIMEOUT_MS = 8000;

/* -------------------------------------------------------------------------- */
/*  1. this page                                                              */
/* -------------------------------------------------------------------------- */

export interface PageReading {
  /** Time to first byte of the document. */
  ttfb: number;
  /** DOMContentLoaded -> load event. */
  loaded: number;
  /** Number of resource requests the browser made. */
  requests: number;
  /** Total transferred, in kB. */
  transfer: number;
  /** The quality tier this device was actually given. */
  tier: string;
  /** Particle budget actually allocated to the GPU. */
  particles: number;
  /** Whether native CSS scroll-driven animations are available. */
  scrollDriven: boolean;
}

export function usePageTelemetry(): Reading<PageReading> {
  const [state, setState] = useState<Reading<PageReading>>(
    pending<PageReading>("Navigation Timing API"),
  );

  useEffect(() => {
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const resources = performance.getEntriesByType("resource");

    if (!nav) {
      setState(failed("Navigation Timing API", "unsupported by this browser"));
      return;
    }

    // Resource Timing can be emptied by the browser to protect the page origin,
    // so an empty set is reported as 0 rather than hidden. `transferSize` lives
    // on PerformanceResourceTiming, not the base PerformanceEntry, so the
    // narrowing has to happen here rather than at the call site.
    const transfer = resources.reduce(
      (sum, entry) => sum + ((entry as PerformanceResourceTiming).transferSize || 0),
      0,
    );

    // Read from the same budget the renderer used, so the tier shown in the
    // panel is the tier actually allocated rather than a re-detection that
    // could disagree after a PerformanceMonitor downgrade.
    const quality = getQuality();

    // Native scroll-driven animations own the secondary motion, and that only
    // holds if the browser implements `view()`. Reported rather than assumed,
    // because ~13% of traffic does not and silently falls back to no animation
    // at all otherwise.
    const scrollDriven =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");

    setState(
      read("Navigation Timing API", {
        ttfb: Math.round(nav.responseStart),
        loaded: Math.round(nav.loadEventEnd - nav.domContentLoadedEventEnd),
        requests: resources.length,
        transfer: Math.round(transfer / 1024),
        tier: quality.tier,
        particles: quality.particles,
        scrollDriven,
      }),
    );
  }, []);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  2. the job funnel — his own system, read live                             */
/* -------------------------------------------------------------------------- */

export interface FunnelReading {
  /** Epoch ms of the scan that produced this file. */
  scannedAt: number;
  sources: number;
  ok: number;
  failed: number;
  /** Open roles read across every source in this scan. */
  roles: number;
  /** Per-source health, in feed order. */
  detail: { source: string; ok: boolean; count: number }[];
}

interface FunnelPayload {
  generated_at?: string;
  sources?: { source?: string; ok?: boolean; count?: number }[];
}

export function useFunnelTelemetry(): Reading<FunnelReading> {
  const source = site.runtime.funnelFeed;
  const [state, setState] = useState<Reading<FunnelReading>>(pending<FunnelReading>(source));

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(source, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<FunnelPayload>;
      })
      .then((payload) => {
        window.clearTimeout(timer);
        const detail = (payload.sources ?? [])
          .filter((entry): entry is { source: string; ok: boolean; count: number } =>
            Boolean(entry.source),
          )
          .map((entry) => ({
            source: entry.source,
            ok: Boolean(entry.ok),
            count: entry.count ?? 0,
          }));

        if (detail.length === 0) throw new Error("feed contained no sources");

        setState(
          read(source, {
            scannedAt: Date.parse(payload.generated_at ?? "") || 0,
            sources: detail.length,
            ok: detail.filter((entry) => entry.ok).length,
            failed: detail.filter((entry) => !entry.ok).length,
            roles: detail.reduce((sum, entry) => sum + entry.count, 0),
            detail,
          }),
        );
      })
      .catch(() => {
        window.clearTimeout(timer);
        // A cross-origin-blocked or slow feed is a normal outcome, not a bug.
        setState(failed(source, site.runtime.unavailable));
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [source]);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  3. GitHub                                                                 */
/* -------------------------------------------------------------------------- */

export interface GithubReading {
  login: string;
  publicRepos: number;
  /** Year the account was created, from the API's own created_at. */
  since: number;
}

export function useGithubTelemetry(): Reading<GithubReading> {
  const user = site.runtime.githubUser;
  const source = `api.github.com/users/${user}`;
  const [state, setState] = useState<Reading<GithubReading>>(pending<GithubReading>(source));

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch(`https://api.github.com/users/${user}`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{
          login: string;
          public_repos: number;
          created_at: string;
        }>;
      })
      .then((profile) => {
        window.clearTimeout(timer);
        setState(
          read(source, {
            login: profile.login,
            publicRepos: profile.public_repos,
            since: new Date(profile.created_at).getFullYear(),
          }),
        );
      })
      .catch(() => {
        window.clearTimeout(timer);
        // Unauthenticated requests are rate-limited per IP. Saying so beats
        // showing a cached number with no timestamp.
        setState(failed(source, "rate limited"));
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [user, source]);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  formatting                                                                */
/* -------------------------------------------------------------------------- */

export function formatMs(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value}ms`;
}

/** "3 min ago" / "6 days ago". Falls back to an em dash rather than a guess. */
export function formatAgo(epoch: number): string {
  if (!epoch) return "-";
  const seconds = Math.max(0, Math.round((Date.now() - epoch) / 1000));
  if (seconds < 90) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
