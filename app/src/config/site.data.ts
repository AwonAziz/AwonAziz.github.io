import { type SiteConfig, validateSite } from "./schema";

/**
 * Reads a build-time env var, treating an *empty* value as absent.
 *
 * This is not defensive pedantry — it is a bug this project actually shipped.
 * GitHub Actions passes an unset repository variable through as `""`, not as
 * undefined, so `import.meta.env.VITE_SITE_URL ?? fallback` let the empty string
 * straight through to `z.url()`, which rejected it. The whole page died on a
 * ZodError in production while passing every local check.
 *
 * `||` rather than `??` is the whole fix.
 *
 * The `import.meta.env` guard is for the other direction: this module is also
 * imported by `vite.config.ts` to generate static JSON-LD at build time, and Vite
 * bundles its config in a context where `import.meta.env` does not exist.
 * Throwing there would fail the whole build.
 */
function env(name: string, fallback: string): string {
  const source = import.meta.env as Record<string, string | undefined> | undefined;
  const value = source?.[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

export type {
  ArchiveEntry,
  Credential,
  Decision,
  NavLink,
  Nogolog,
  Practice,
  Social,
  System,
} from "./schema";

/**
 * ---------------------------------------------------------------------------
 *  EDIT THIS FILE. Everything the site renders comes from here.
 * ---------------------------------------------------------------------------
 *  Every number below is chosen because a reviewer can open a file and confirm
 *  it. If a claim stops being checkable, delete the claim rather than soften it.
 */
export const site = validateSite({
  meta: {
    name: "Awon Aziz",
    role: "AI / MLOps engineer",
    description:
      "Entry-level AI and MLOps engineer. Data-drift detection, champion/challenger promotion, agentic incident root-cause analysis with an evaluation harness, and scheduled automation that keeps working unattended.",
    url: env("VITE_SITE_URL", "https://awonaziz.github.io"),
    location: "Rawalpindi, Pakistan",
    email: "awonaziz786@gmail.com",
  },

  headline: {
    claim: "I build the half of machine learning nobody demos.",
    sub: "Entry-level AI/MLOps engineer. Drift detection and model promotion, retrieval that knows when to distrust itself, and a job funnel that has polled eighteen job boards every twenty minutes since August — unattended, public, and writing down what breaks.",
    availability: "Open to remote, or relocation to UAE / Saudi Arabia / Qatar",
    ctaPrimary: "Read the systems",
    ctaSecondary: "Check the evidence",
  },

  hero: {
    rotating: ["Drift detection", "LLM-as-judge", "Model promotion", "Retrieval evals"],
    scrollHint: "Scroll to inspect",
  },

  nav: [
    { label: "Systems", href: "#systems" },
    { label: "Runtime", href: "#runtime" },
    { label: "Stack", href: "#capability" },
    { label: "Method", href: "#method" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ],

  marquee: [
    "Python",
    "FastAPI",
    "Kubernetes",
    "MLflow",
    "Chroma",
    "Evidently",
    "Docker",
    "GitHub Actions",
    "Terraform",
    "Ansible",
    "Prometheus",
    "Argo CD",
  ],

  socials: [
    {
      label: "GitHub",
      handle: "github.com/AwonAziz",
      href: "https://github.com/AwonAziz",
      external: true,
    },
    {
      label: "LinkedIn",
      handle: "in/awonaziz",
      href: "https://www.linkedin.com/in/awonaziz",
      external: true,
    },
    {
      label: "LeetCode",
      handle: "leetcode.com/AwonAziz",
      href: "https://leetcode.com/AwonAziz",
      external: true,
    },
    {
      label: "Email",
      handle: "awonaziz786@gmail.com",
      href: "mailto:awonaziz786@gmail.com",
      external: true,
    },
  ],

  stats: [
    { label: "Systems, all public", value: "05" },
    { label: "Tests across four systems", value: "282" },
    { label: "Automated commits, unattended since 16 Aug", value: "486" },
    { label: "Held-out anomalies the retrieval pipeline is scored against", value: "08" },
  ],

  systems: [
    {
      slug: "llm-drift-monitor",
      title: "LLM drift monitor: a production shift, replayed, with the alerts it should raise",
      year: 2026,
      status: "Shipped — 184 tests, 4 CI jobs, runs offline in ~50s",
      summary:
        "Most monitoring demos compare two histograms. This watches a real LLM application — a banking support assistant — across a scripted production shift and answers the question a platform team actually has: did the system get worse, and what should we do about it?",
      constraint:
        "Every drift detector was lying in a way that looked like a working detector. A logistic regression on raw 384-dim embeddings separates two samples of the same distribution at AUC 0.63 by exploiting sampling noise, so every window read as drift. The MMD permutation null was built on 400 points against a 1,400-point observation, so every window was significant. Accuracy was literally computed from itself and always returned 1.0. The hard part was not detecting drift — it was making each detector able to report no.",
      diagram: `                 ┌──────────────────────────────────────────────┐
   customer ───► │  intent classifier  ──► intent playbook      │
   message      │  (TF-IDF + calibrated LogReg, T=0.65)  ──► LLM│
                 └──────────────────────────────────────────────┘
                                        │
                 ┌──────────────────────┴───────────────────────┐
                 ▼                                              ▼
        EMBEDDING DRIFT                                 OUTPUT QUALITY
        MMD ─► sliced Wasserstein                        accuracy · macro-F1
        domain-classifier AUC                             ECE · Brier · abstention
        normalised Fréchet                                in-scope vs out-of-scope
        k-NN novelty rate                                 label-free proxies
                 │                                              │
                 └──────────────┬───────────────────────────────┘
                                ▼
                     LLM-AS-JUDGE  (qwen3:8b, local)
                     5-dimension anchored rubric · veto cap
                     pairwise win-rate · golden regression suite
                                │
                                ▼
                     DRIFT ORCHESTRATOR
                     health · severity · confidence · action
                     noop │ investigate │ retrain │ rollback`,
      decisions: [
        {
          decision: "Five embedding-drift detectors, not one",
          why: "MMD catches shape change the marginals miss, sliced Wasserstein gives a threshold you can argue about, domain-classifier AUC answers the most decision-relevant question — could a model tell reference from today's traffic? — and k-NN novelty converts an abstract distance into a number a product manager can act on. They fail differently, and the disagreement is the signal.",
          cost: "Four thresholds to tune plus a voting rule, and a fifth detector firing does not mean a fifth problem.",
        },
        {
          decision: "A permutation test confirms; it never escalates",
          why: "Severity comes from effect size. Significance only gates whether the window is allowed to raise drift at all. A p-value that drives a pager produces a pager that gets muted within a week.",
          cost: "A genuinely large effect in a small window can be missed, and the user has to wait for the next window.",
        },
        {
          decision:
            "ECE and Brier alert on delta from the frozen baseline, never on absolute thresholds",
          why: "A model with a known calibration gap is not a new incident every window. Temperature scaling moved ECE from 0.149 to 0.043; without delta-based alerting that improvement would have generated a page on day one and every day after.",
          cost: "If the baseline itself is wrong, every comparison is wrong in the same direction and nothing looks wrong.",
        },
        {
          decision: "The judge baseline is stamped with its model and rubric version",
          why: "Bumping qwen3:8b to qwen3:14b moves every score. Reading that as an application regression is how dashboards get ignored, so a change in either field invalidates cross-run comparison rather than silently re-baselining.",
          cost: "Model upgrades now require re-establishing the baseline, which is a deliberate step and an extra thing to forget.",
        },
        {
          decision: "Stratified sampling always includes the out-of-scope slice",
          why: "Uniform sampling quietly evaluates only traffic the model can plausibly handle — and the regression you most need to catch is the one hiding in the slice you never judged.",
          cost: "A smaller effective sample per stratum, so the per-stratum confidence intervals are wider.",
        },
        {
          decision:
            "Input drift and quality regression get different actions, encoded explicitly",
          why: "In the demo, windows 4–6 shift the input distribution while accuracy stays at 94%. The right move is to widen coverage and check the judge — explicitly not to retrain, because retraining cannot help while the new traffic is unlabelled.",
          cost: "The orchestrator has to reason about which signal dominates, which is the most opinionated part of the system.",
        },
      ],
      metrics: [
        { label: "Tests, all offline", value: "184" },
        { label: "Drift detectors", value: "5" },
        { label: "API endpoints", value: "17" },
        { label: "CI jobs", value: "4" },
        { label: "Bugs pinned by regression tests", value: "12" },
        { label: "Real query intents", value: "27" },
      ],
      stack: [
        "Python",
        "FastAPI",
        "Ollama",
        "qwen3:8b",
        "sentence-transformers",
        "SQLite",
        "Streamlit",
        "Prometheus",
        "Docker",
      ],
      notBuilt: [
        "The judge is a local 8B model. It is real, not mocked, but a frontier judge would be more reliable. The backend interface is already pluggable.",
        "The production shift, the out-of-scope mix and the 5% annotation noise are simulated. Banking77 gives real text, and the model and the quality metrics are real.",
        "Windows are independent, not sequential. Real drift is autocorrelated and a production system would use EWMA control charts over the window series; the metric store is shaped for it.",
        "No auth, no multi-tenancy, no distributed execution. It is a monitoring engine and a read model, not a control plane.",
      ],
      links: [
        {
          label: "llm-drift-monitor",
          href: "https://github.com/AwonAziz/llm-drift-monitor",
          external: true,
        },
      ],
    },
    {
      slug: "incident-copilot",
      title: "Incident copilot: retrieval that knows when to distrust itself",
      year: 2026,
      status: "Advisory only — three builds, 35 tests on the current one",
      summary:
        "An anomaly detector tells you a metric is strange. It does not tell you why, and it has no memory. This searches a postmortem knowledge base for incidents that resembled this one and puts a drafted root-cause hypothesis in front of a human.",
      constraint:
        "The dense half of the hybrid retriever made rankings worse. Below roughly fifty documents the embedder has not learned enough for its ranking to mean anything, and averaging it in actively buried the correct answer. The system had to be able to switch off half of itself.",
      decisions: [
        {
          decision:
            "Two agents with separate contexts, not one prompt asked to retrieve and reason at once",
          why: "Keeps each agent's context scoped to one job, and lets a human read what the investigator actually found before the reporter dresses it up.",
          cost: "Two model calls instead of one, and a handoff where information can be dropped.",
        },
        {
          decision: "Reciprocal rank fusion instead of averaging scores",
          why: "A cosine similarity and a TF-IDF score do not average into anything meaningful. RRF sums 1/(k+rank) with k=60, so a document missing from one retriever simply contributes nothing from it.",
          cost: "Rank-only fusion discards magnitude — a runaway best match and a marginal one look identical if both rank first.",
        },
        {
          decision: "A corpus-size trust gate in front of the dense path",
          why: "Below 50 documents the dense signal is untrusted and queries fall back to sparse only. This is the whole result of the evaluation work.",
          cost: "A magic number that is specific to this corpus and will need revisiting as the knowledge base grows.",
        },
        {
          decision: "TF-IDF first, neural embeddings as a documented one-line swap",
          why: "The whole pipeline stands up with zero downloads and zero API keys, so a reviewer can run it.",
          cost: "Lexical overlap only — 'CPU spike' and 'processor saturation' do not match, which is exactly what forced the next build.",
        },
        {
          decision: "Advisory only. Nothing calls an infrastructure API",
          why: "Auto-remediation is a far larger and riskier scope than what is built, and pretending otherwise produces demos that are impressive right up until they delete something.",
          cost: "It is not a self-healing system, and the word 'self-healing' appears nowhere in the repository.",
        },
      ],
      metrics: [
        { label: "Tests, current build", value: "35" },
        { label: "Held-out eval cases", value: "8" },
        { label: "Builds superseded", value: "3" },
        { label: "Auto-remediation paths", value: "0" },
      ],
      stack: ["Python", "Chroma", "CrewAI", "FastAPI", "Kubernetes", "scikit-learn"],
      notBuilt: [
        "No agent writes to any infrastructure. Output is a draft for a person.",
        "No production knowledge base — the corpus is synthetic and labelled as such.",
        "The neural embedder path was not reachable in the sandbox, so the dense side ran on an LSA fallback and the numbers reflect that.",
      ],
      links: [
        {
          label: "Hybrid-retrieval",
          href: "https://github.com/AwonAziz/Hybrid-retrieval",
          external: true,
        },
        {
          label: "agentic-incident-copilot",
          href: "https://github.com/AwonAziz/agentic-incident-copilot",
          external: true,
        },
        {
          label: "ai-incident-response-system",
          href: "https://github.com/AwonAziz/ai-incident-response-system",
          external: true,
        },
      ],
    },
    {
      slug: "job-funnel",
      title: "Job funnel: eighteen boards, every twenty minutes, no scraping",
      year: 2026,
      status: "Running unattended since 16 Aug 2026 — 486 automated commits",
      summary:
        "Nearly every company careers page is a thin client over an applicant tracking system, and those systems publish the listings as JSON at a public endpoint. A scheduled workflow reads those endpoints, filters, dedupes against the previous run and commits the result to a static page.",
      constraint:
        "The largest job board in the world is outside the system, on purpose. LinkedIn's terms explicitly prohibit automated collection and they publish no readable public search API, so the funnel does not go near them. The correct cost was paying it.",
      decisions: [
        {
          decision: "Two source tiers, labelled differently on the dashboard",
          why: "Tier one is company ATS endpoints (Greenhouse, Lever, Ashby, SmartRecruiters) — freshest signal. Tier two is aggregators — coverage of companies not on the list. The badge colour tells you which kind of result you are reading.",
          cost: "Tier one only works for the four supported systems. Workday and custom sites need a new parser written for them.",
        },
        {
          decision: "Ambiguous locations are kept, not dropped",
          why: "A job survives the filter if its location matches the allow list OR if the location is missing or ambiguous. For a job search, wrongly dropping a real match is the expensive error.",
          cost: "Noise. A filter that never wrongly drops anything will sometimes keep something irrelevant.",
        },
        {
          decision: "Seniority is tagged, not filtered",
          why: "Hiding senior roles is a toggle on the dashboard that remembers itself on that device. The pipeline does not get to decide what the reader is allowed to see.",
          cost: "One more piece of client state to carry.",
        },
        {
          decision: "Failed sources are shown, not hidden",
          why: "Eight of eighteen sources currently return 404 for their board token. A wrong token fails quietly, and a failure that fails quietly belongs in view rather than looking like an oversight.",
          cost: "The dashboard permanently shows a row of red. It looks like a bug, and that is the point.",
        },
        {
          decision: "If every source fails at once, the previous jobs.json is left alone",
          why: "An empty successful response is worse than no response. The commit only lands if the scan produced real data.",
          cost: "A stale page is possible if every source is genuinely dead for an extended period.",
        },
      ],
      metrics: [
        { label: "Sources polled", value: "18" },
        { label: "Scan interval", value: "20 min" },
        { label: "Automated commits", value: "486" },
        { label: "Runtime dependencies", value: "requests only" },
      ],
      stack: ["Python", "GitHub Actions", "GitHub Pages", "requests"],
      notBuilt: [
        "No headless browser, no HTML scraping, no login replay.",
        "No LinkedIn, Indeed, Wellfound or Turing. Those stay manual and the README says why.",
        "The Ashby and SmartRecruiters parsers were written from documentation rather than a captured live response — flagged in known-limitations, not glossed.",
      ],
      links: [
        {
          label: "cleanjobfunnel",
          href: "https://github.com/AwonAziz/cleanjobfunnel",
          external: true,
        },
        {
          label: "Live dashboard",
          href: "https://awonaziz.github.io/cleanjobfunnel/",
          external: true,
        },
      ],
    },
    {
      slug: "model-lifecycle",
      title: "Model lifecycle: drift, retrain, and a promotion that can be refused",
      year: 2026,
      status: "Shipped — 43 tests, 3 drift measures, synthetic data",
      summary:
        "A model that passes every test and still quietly becomes wrong is the failure mode CI cannot see. The service stays healthy, no test fails, and the predictions stop meaning anything. This is the machinery for catching that.",
      constraint:
        "The right drift thresholds are dataset-specific, so they ship as environment variables rather than constants. Anyone who claims there is a correct PSI threshold is guessing.",
      decisions: [
        {
          decision: "Three drift measures, not one",
          why: "PSI catches distribution shift in binned values, a Kolmogorov–Smirnov test asks whether the two samples plausibly share a distribution, and Jensen–Shannon divergence measures distance symmetrically. They fail to agree regularly, and each disagreement is information — a feature can shift in shape without shifting in bin mass.",
          cost: "Three thresholds to tune and a severity rule that has to arbitrate between them.",
        },
        {
          decision: "Champion and challenger with a promotion margin",
          why: "A retrained model does not replace the live one by virtue of being newer. It is logged to MLflow and promoted only if it beats the champion by the configured margin.",
          cost: "Drift can be real and the retrain still produce nothing better. You have burned a pipeline run and are still serving a model you now know is drifting — a worse-feeling outcome, and the correct one.",
        },
        {
          decision: "A drift injector ships alongside the detector",
          why: "scripts/inject_drift.py deliberately corrupts the input so a severe reading can be produced on demand. A detector that has never fired is untested.",
          cost: "The committed severe report is manufactured, and the file says so in its header.",
        },
        {
          decision: "MLflow on SQLite by default",
          why: "Someone cloning the repository gets working experiment tracking on the first command, with no infrastructure to stand up first. Overridable by environment variable.",
          cost: "Single-writer. Fine for one machine, wrong for a team, and the override exists for exactly that reason.",
        },
      ],
      metrics: [
        { label: "Tests", value: "43" },
        { label: "Python", value: "~2,300 lines" },
        { label: "Drift measures", value: "3" },
        { label: "Mean PSI, severe", value: "1.655" },
      ],
      stack: ["Python", "FastAPI", "MLflow", "Evidently AI", "SciPy", "Streamlit", "Docker"],
      notBuilt: [
        "The dataset is synthetic, generated by the project. F1 0.873 and AUC 0.937 are only readable as 'on the data it made up'.",
        "No real traffic. Nothing here has ever served a production request.",
        "No model registry beyond MLflow's own tracking store.",
      ],
      links: [
        {
          label: "ml-lifecycle-platform",
          href: "https://github.com/AwonAziz/ml-lifecycle-platform",
          external: true,
        },
      ],
    },
    {
      slug: "pair-engineer",
      title: "AI pair engineer: four agents, and a budget on what each is told",
      year: 2026,
      status: "Shipped — 4 stages, 20 tests, never executes your code",
      summary:
        "A four-stage review pipeline that runs before a pull request exists: analyse, generate tests, refactor, then compare the original against the refactor and check behaviour survived. It stops at the report.",
      constraint:
        "The tool accepts arbitrary code from a stranger. It generates tests but never executes them, and submitted source is never interpolated into a shell command. Making this useful meant making it safe enough to point at code you did not write.",
      decisions: [
        {
          decision: "Context is budgeted per stage, not broadcast to all of them",
          why: "The test engineer gets the source plus the analyzer's findings filtered to testing categories. The refactoring engineer gets findings filtered to maintainability. The reviewer gets both versions plus the tests. Fewer tokens, lower latency, and no upstream noise leaking into a stage's reasoning.",
          cost: "A filter that has to be maintained as categories change, and the risk that something genuinely cross-cutting gets withheld from the stage that needed it.",
        },
        {
          decision: "No orchestration framework",
          why: "No LangChain, no LangGraph, no CrewAI, no AutoGen. Four prompt files, a client, and Pydantic models. For a linear pipeline a framework adds a dependency, an abstraction and a new set of failure modes in exchange for control flow that fits in one module.",
          cost: "Retries, parsing and error handling are hand-written. When the pipeline stops being linear this decision should be revisited rather than defended.",
        },
        {
          decision: "Model output is validated against a schema, never trusted",
          why: "The parser handles raw JSON, fenced JSON, and JSON with stray prose. When parsing fails it retries with an explicit correction prompt rather than guessing. Malformed responses raise instead of producing a plausible-looking empty result.",
          cost: "More failure paths to handle, and a strictly narrower range of things the model is allowed to say.",
        },
        {
          decision: "The final reviewer does not approve style",
          why: "A refactoring agent will always find something to rename. The reviewer checks behaviour preservation, correctness, complexity, testability and regressions — and explicitly rejects a change that is only cosmetic.",
          cost: "Real readability improvements that happen to be cosmetic get rejected along with the noise.",
        },
      ],
      metrics: [
        { label: "Stages", value: "4" },
        { label: "Tests", value: "20" },
        { label: "Orchestration dependencies", value: "0" },
        { label: "Times it executes your code", value: "0" },
      ],
      stack: ["Python", "Pydantic", "Streamlit", "OpenRouter"],
      notBuilt: [
        "No sandboxed execution. Listed as future work along with the resource limits it would need, rather than shipped and hoped about.",
        "No merge capability. It produces a report, a person decides.",
        "Temperature is pinned to 0.0–0.1 because code analysis has no use for variety.",
      ],
      links: [
        {
          label: "AI-Pair-Engineer",
          href: "https://github.com/AwonAziz/AI-Pair-Engineer",
          external: true,
        },
      ],
    },
  ],

  faq: [
    {
      question: "Can I actually run any of this without a GPU, an API key, or a cloud account?",
      points: [
        "Yes. `llm-drift-monitor` has `make demo-fast` — 14 windows, offline encoder, deterministic mock judge, about 50 seconds, no model download and no network.",
        "`make demo` is the same structure with a real local LLM judge via Ollama. Still no API key, and nothing leaves your machine.",
        "`cleanjobfunnel` has one dependency, `requests`. The incident copilot stands up with zero downloads.",
        "Three of the five systems run end to end with no key and no network, and that is a design constraint rather than a coincidence.",
      ],
    },
    {
      question: "How do you know the drift detector is not just crying wolf?",
      points: [
        "Every detector had to be made able to report no. That was the actual engineering problem: the domain-classifier null sat at 0.63 instead of 0.50, so every window looked like drift until PCA was fitted on the reference first.",
        "The MMD permutation null was computed on 400 points against a 1,400-point observation, which made every window significant. Both nulls are now regression tests.",
        "A permission test now sits in the demo: a 2× traffic spike with an identical intent mix fires nothing. A detector that pages on volume gets muted within a week, so that window is the one that proves the others.",
        "Significance gates whether a window may raise drift; severity always comes from effect size.",
      ],
    },
    {
      question:
        "You have no commercial employment history. Why should anyone take this seriously?",
      points: [
        "That is a fair question, and it is why the page leads with the artifacts rather than a biography.",
        "Every number is either read at runtime by your own browser or openable in a repository. Nothing on this page is a claim you have to take on trust.",
        "The no-go log lists twelve bugs found in the drift monitor and the design changes they forced, each pinned by a regression test. A project that has never failed is a project nobody has run.",
        "I would rather be the person on a team who ships the drift detector and the runbook than the person who claims five years of it.",
      ],
    },
    {
      question: "Why is a portfolio asking me to install Node and clone a repository?",
      points: [
        "Because a portfolio you can scroll is a claim, and a portfolio you can run is evidence. Same reason the instrumentation band above reports on this page rather than describing itself.",
        "The bar was set by the work: a drift monitor that does not run without a GPU has told you something important about how it was tested.",
      ],
    },
  ],

  practice: [
    {
      index: "01",
      title: "Negative results get written down",
      body: "When the hybrid retriever's dense half ranked worse than sparse on two of eight cases, that became a documented constant with a threshold and an explanation, not a quietly deleted branch. A system whose flaws are only discovered by whoever runs it next is worth less than one whose flaws are on the tin.",
      evidence: "Hybrid-retrieval · corpus-size trust gate, with the failing cases named",
    },
    {
      index: "02",
      title: "Limitations live in the README, not a footnote",
      body: "Which parsers were verified against live responses and which were written from documentation. Which numbers came from a fallback embedder. Which knowledge base is synthetic. Where mock-mode output should not be believed. A reviewer should not have to email me to learn what a project cannot do.",
      evidence:
        "cleanjobfunnel · known-limitations, and the eight red sources on the dashboard",
    },
    {
      index: "03",
      title: "Everything runs without a key",
      body: "Five systems, and three of them stand up end to end with no API key and no network, because a project nobody can run is a project nobody will read. The two that need a model say so on their first line.",
      evidence: "pip install -r requirements.txt, then run it — no account",
    },
    {
      index: "04",
      title: "Scope boundaries are drawn on purpose",
      body: "The incident copilot advises and never remediates. The pair engineer generates tests and never executes them. The job funnel leaves LinkedIn alone. In each case the repository states the reason, because a boundary without a reason reads as an oversight.",
      evidence: "Three READMEs, each with an explicit 'what this does not do'",
    },
  ],

  nogolog: [
    {
      date: "Aug 2026",
      title: "The dense retriever made the system worse, so it gets switched off",
      body: "Falling back to LSA because the sandbox could not reach HuggingFace, the dense half ranked an unrelated incident first on two of eight cases that sparse retrieval alone got right. Fusing it in degraded the results. Rather than tune until the number looked good, the dense path is now gated on corpus size and contributes nothing below fifty documents. The failure is the architecture now.",
    },
    {
      date: "Aug 2026",
      title: "LinkedIn is not in the job funnel",
      body: "The largest job board in the world is outside the system. They publish no readable public search API and their terms explicitly prohibit automated collection, so the funnel does not go near them and the README says so plainly. The cost is real and I am paying it on purpose.",
    },
    {
      date: "Jul 2026",
      title: "A retrain that produces nothing better still gets rejected",
      body: "Drift can be severe and the retrained challenger can still fail to beat the champion. In that case the pipeline run is burned and the model being served is one I now know is drifting. Automatic promotion would feel better and be wrong.",
    },
    {
      date: "Aug 2026",
      title: "The pair engineer writes tests and does not run them",
      body: "It accepts arbitrary code from a stranger, so submitted source is treated as untrusted input and is never interpolated into a shell command. That leaves the most valuable thing it could do undone, deliberately, and the repository lists sandboxed execution as future work with the resource limits it would need.",
    },
    {
      date: "2026",
      title: "Not built: a plateau predictor",
      body: "The label is censored out of existence — you cannot observe when a user leaves a plateau, only that they did. The feature is not identifiable from the available data, so it is not built, and saying so is more useful than a model with invented numbers.",
    },
  ],

  archive: [
    {
      name: "Devops-CICD-labs",
      contents:
        "53 labs across Jenkins, Argo CD, Buildkite, Concourse, Docker, Helm, Kubernetes, Prometheus, Grafana, Terraform and Ansible",
      scale: "119 commits",
      date: "Mar 2026",
      href: "https://github.com/AwonAziz/Devops-CICD-labs",
      kind: "lab",
    },
    {
      name: "Cybersecurity-labs",
      contents:
        "34 labs across four tracks — SOC workflow, incident response and adversary emulation, digital forensics, Linux hardening",
      scale: "72 commits",
      date: "Mar – Apr 2026",
      href: "https://github.com/AwonAziz/Cybersecurity-labs",
      kind: "lab",
    },
    {
      name: "RedHat-Linux-Labs",
      contents:
        "8 labs — Podman, multi-container applications, SSH hardening, journald analysis, system diagnostics",
      scale: "24 commits",
      date: "Feb 2026",
      href: "https://github.com/AwonAziz/RedHat-Linux-Labs",
      kind: "lab",
    },
    {
      name: "music-visualizer",
      contents:
        "Web Audio and Canvas, three modes, no framework. Written because React felt like overkill for it",
      scale: "HTML / JS",
      date: "2025",
      href: "https://github.com/AwonAziz/music-visualizer",
      kind: "experiment",
    },
    {
      name: "Crossy Roads in three.js",
      contents:
        "A browser game built from memory of playing the original at nine. The repository description opens with 'horribly optimised'",
      scale: "three.js",
      date: "2025",
      href: "https://github.com/AwonAziz/Silly-crossy-roads-game-in-three.js",
      kind: "experiment",
    },
    {
      name: "Paints-undo-colabs",
      contents:
        "Colab notebooks for running PAINTS-UNDO, a drawing-process reconstruction model",
      scale: "notebook",
      date: "2025",
      href: "https://github.com/AwonAziz/Paints-undo-colabs",
      kind: "experiment",
    },
  ],

  currently: [
    {
      title: "LangGraph, specifically human-in-the-loop",
      body: "The hybrid retrieval build ends at an Approve/Dismiss button with no state behind it. The next version should loop a dismissed report back for re-investigation and write an approved one into the knowledge base as a new postmortem. The eval harness already accepts a pipeline function, so both versions can be scored against the same eight cases.",
    },
    {
      title: "LoRA fine-tuning in PyTorch",
      body: "Learning the training side properly rather than only the serving side. Everything above this line is inference and operations; this is the part I have only read about.",
    },
    {
      title: "An indie fighting game, 70+ characters",
      body: "A long-running personal project and the reason three.js and game loops show up in the archive. An unreasonable roster size and rather the point.",
    },
  ],

  education: [
    {
      name: "Diploma in Artificial Intelligence & Operations",
      issuer: "Al Nafi International Colleges",
      year: "2026",
      detail:
        "RQF Level 6 · 90% at the oral defence. The word that matters in the title is Operations — it is not a course about model architectures, it is a course about what has to exist around a model for it to survive real infrastructure.",
    },
    {
      name: "Machine Learning Certification",
      issuer: "Al Nafi International Colleges",
      year: "2026",
      detail:
        "Alongside the diploma, covering the modelling side that the operations track assumes.",
    },
    {
      name: "Networking Essentials",
      issuer: "Cisco Networking Academy",
      year: "2025",
      detail:
        "The reason the job funnel can tell a tier-one ATS endpoint from an aggregator feed.",
    },
    {
      name: "Introduction to Cybersecurity",
      issuer: "Cisco Networking Academy",
      year: "2025",
      detail:
        "Backs the 34 security labs — SOC workflow, incident response, forensics, Linux hardening.",
    },
    {
      name: "Intermediate Computer Science",
      issuer: "IMCB F-8/4, Islamabad",
      year: "2024",
      detail: "The foundations underneath everything above.",
    },
  ],

  runtime: {
    funnelFeed: "https://awonaziz.github.io/cleanjobfunnel/data/status.json",
    funnelLabel: "cleanjobfunnel · cron */20",
    githubUser: "AwonAziz",
    unavailable: "unreachable",
  },

  contact: {
    heading: "Open to AI engineering and AIOps roles",
    email: "awonaziz786@gmail.com",
    cta: "Send an email",
    availability: "Remote, or relocation to UAE / Saudi Arabia / Qatar",
    note: "The fastest way to judge whether this is a fit is to open one of the repositories and read the limitations section. I would rather be the person on a team who ships the drift detector and the runbook than the person who claims five years of it.",
  },

  footer: {
    note: "Rawalpindi, Pakistan. No analytics, no cookies, no tracking.",
    colophon:
      "Vite · React 19 · TypeScript · Tailwind v4 · GSAP · Lenis · React Three Fiber · custom GLSL. Every number on this page is read at runtime or openable in a repository.",
  },
}) satisfies SiteConfig as SiteConfig;
