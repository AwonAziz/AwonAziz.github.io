import { site } from "@/config/site.data";
import {
  formatAgo,
  formatMs,
  type GithubReading,
  useFunnelTelemetry,
  useGithubTelemetry,
  usePageTelemetry,
} from "@/hooks/use-telemetry";
import { cn } from "@/lib/cn";
import { Reveal } from "../ui/reveal";

/**
 * ---------------------------------------------------------------------------
 *  Runtime
 * ---------------------------------------------------------------------------
 *  The site reports on itself, with numbers it read at runtime, and prints the
 *  source of every one next to the number.
 *
 *  This is the answer to the only question an entry-level portfolio cannot
 *  otherwise answer, which is "did you actually build this, or did you write
 *  about it". It is also the reason the telemetry is typographic rather than a
 *  widget: it reuses the same mono, hairline and status dot as the rest of the
 *  page, so it reads as part of the site instead of an embedded dashboard.
 *
 *  The design rule that matters: a reading that cannot be fetched shows an
 *  explicit unavailable state. The one thing that would destroy this section —
 *  and with it every other number on the page — is a plausible placeholder where
 *  a measurement should be.
 * ---------------------------------------------------------------------------
 */
export function Runtime() {
  const page = usePageTelemetry();
  const funnel = useFunnelTelemetry();
  const github = useGithubTelemetry();

  return (
    <section
      id="runtime"
      data-scroll-section="runtime"
      className="relative scroll-mt-24 border-t border-white/10"
    >
      <div aria-hidden="true" className="scrim-block pointer-events-none absolute inset-0" />

      <div className="shell relative section-pad">
        {/* push-and-pop: meta on the left, content dominant on the right. The
            ratio flips from the Systems section, which is the entire trick. */}
        <header className="mb-[clamp(3rem,6vw,5rem)] grid items-end gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <p className="eyebrow mb-5">Instrumentation</p>
            <Reveal from="lift" className="lede prose-measure block">
              <span className="block">
                Most portfolios ask you to take their word for it. This one reports on itself.
              </span>
              <span className="mt-4 block text-ink-muted">
                The timings are measured by your browser about the page you are reading, and the
                job-funnel panel is the same{" "}
                <code className="font-mono text-ink">status.json</code> his own scheduled
                workflow writes every twenty minutes.
              </span>
            </Reveal>
          </div>
          <div>
            <Reveal as="h2" className="title max-w-[18ch]" from="mask">
              This page is the artifact.
            </Reveal>
          </div>
        </header>

        {/* Three panels, hairline-separated. `bg-white/8` behind `gap-px` gives
            clean 1px dividers with no per-panel border maths. */}
        <div className="grid gap-px overflow-hidden rounded-card border border-white/10 bg-white/8 lg:grid-cols-3">
          <Panel
            title="This page"
            source={page.source}
            state={page.pending ? "pending" : page.error ? "unavailable" : "ok"}
          >
            {page.value ? (
              <>
                <Metric label="TTFB" value={formatMs(page.value.ttfb)} />
                <Metric label="Load → DCL" value={formatMs(page.value.loaded)} />
                <Metric label="Requests" value={String(page.value.requests)} />
                <Metric label="Transferred" value={`${page.value.transfer} kB`} />
                <Metric label="Quality tier" value={page.value.tier} />
                <Metric label="Particles" value={page.value.particles.toLocaleString()} />
                <Metric
                  label="CSS scroll-driven"
                  value={page.value.scrollDriven ? "native" : "gsap only"}
                  tone={page.value.scrollDriven ? "ok" : "warn"}
                />
              </>
            ) : null}
          </Panel>

          <Panel
            title={site.runtime.funnelLabel}
            source={funnel.source}
            state={funnel.pending ? "pending" : funnel.error ? "unavailable" : "ok"}
          >
            {funnel.value ? (
              <>
                <Metric
                  label="Sources responding"
                  value={`${funnel.value.ok} / ${funnel.value.sources}`}
                  tone={funnel.value.ok === funnel.value.sources ? "ok" : "warn"}
                />
                <Metric label="Open roles read" value={funnel.value.roles.toLocaleString()} />
                <Metric label="Last scan" value={formatAgo(funnel.value.scannedAt)} />
                <Metric
                  label="Failing sources"
                  value={String(funnel.value.failed)}
                  tone={funnel.value.failed > 0 ? "fail" : "ok"}
                />
              </>
            ) : null}
            <p className="mt-5 text-small leading-relaxed text-ink-faint">
              The failing sources are real and permanent. Eight of eighteen boards return 404
              for their token, and a wrong token fails quietly — so it is shown rather than
              hidden.
            </p>
          </Panel>

          <Panel
            title="GitHub"
            source={github.source}
            state={github.pending ? "pending" : github.error ? "unavailable" : "ok"}
          >
            {github.value ? (
              <>
                <Metric label="Public repositories" value={String(github.value.publicRepos)} />
                <Metric label="Account created" value={String(github.value.since)} />
                <Metric label="Handle" value={github.value.login} />
                <Metric label="Auth" value="unauthenticated" tone="warn" />
              </>
            ) : null}
            <p className="mt-5 text-small leading-relaxed text-ink-faint">
              Read live from the public REST API. Unauthenticated requests are limited per IP,
              so a cold cache can legitimately return nothing — which is why this cell can read{" "}
              {site.runtime.unavailable} and that would still be true.
            </p>
          </Panel>
        </div>

        {funnel.value ? <SourceTable reading={funnel.value.detail} /> : null}
      </div>
    </section>
  );
}

function Panel({
  title,
  source,
  state,
  children,
}: {
  title: string;
  source: string;
  state: "pending" | "ok" | "unavailable";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-canvas-raised p-6 lg:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h3 className="font-mono text-small tracking-tight text-ink">{title}</h3>
        <span
          className={cn(
            "status-dot mt-1.5",
            state === "ok" && "status-ok",
            state === "pending" && "status-warn animate-pulse-dot",
            state === "unavailable" && "status-fail",
          )}
          aria-hidden="true"
        />
      </div>

      {/* `aria-live` because this resolves asynchronously: a screen reader user
          needs to hear that the numbers arrived, not only see them appear. */}
      <div aria-live="polite" className="flex flex-1 flex-col gap-3">
        {state === "pending" ? <Pending /> : null}
        {state === "unavailable" ? (
          <p className="font-mono text-small text-fail">unavailable</p>
        ) : null}
        {children}
      </div>

      <p className="mt-6 truncate border-t border-white/10 pt-4 font-mono text-micro tracking-wider text-ink-faint">
        src · {source}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "fail";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="label-mono">{label}</dt>
      <dd
        className={cn(
          "value-mono",
          tone === "ok" && "text-accent",
          tone === "warn" && "text-warn",
          tone === "fail" && "text-fail",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Pending() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <li key={row} className="flex items-center justify-between gap-4">
          <span className="label-mono opacity-40">reading</span>
          <span className="value-mono opacity-30">—</span>
        </li>
      ))}
    </ul>
  );
}

/** Per-source health, in the feed's own order. The one honest row of failures. */
function SourceTable({
  reading,
}: {
  reading: { source: string; ok: boolean; count: number }[];
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-card border border-white/10">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <p className="label-mono">Source health · {site.runtime.funnelLabel}</p>
        <p className="label-mono">
          {reading.filter((entry) => entry.ok).length} ok ·{" "}
          {reading.filter((entry) => !entry.ok).length} failing
        </p>
      </div>

      <ul className="grid gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
        {reading.map((entry) => (
          <li
            key={entry.source}
            className="flex items-center justify-between gap-4 bg-canvas-raised px-5 py-3.5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={cn("status-dot", entry.ok ? "status-ok" : "status-fail")}
              />
              <span className="truncate font-mono text-micro tracking-wider text-ink-muted">
                {entry.source}
              </span>
            </span>
            <span
              className={cn(
                "value-mono shrink-0",
                !entry.ok && "text-fail line-through decoration-fail/40",
              )}
            >
              {entry.ok ? entry.count.toLocaleString() : "404"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { GithubReading };
