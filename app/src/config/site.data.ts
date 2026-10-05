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
      "AI/MLOps engineer. LoRA fine-tuning on a hand-written autodiff with every layer proved against its reference, drift detection that is calibrated to report no, an evaluation warehouse that fails CI on a stale row, and scheduled automation that has run unattended for weeks.",
    url: env("VITE_SITE_URL", "https://awonaziz.github.io"),
    location: "Islamabad, Pakistan",
    email: "awonaziz786@gmail.com",
  },

  headline: {
    claim: "I build the half of machine learning nobody demos.",
    sub: "AI/MLOps engineer. A LoRA fine-tune on a hand-written NumPy autodiff, proved layer by layer against PyTorch and peft. Drift detectors built until each one can report no. An evaluation warehouse that fails CI rather than publish a stale number. Seven systems, all public, all writing down what broke.",
    availability:
      "Open to remote (EU or US overlap), or relocation to UAE / Saudi Arabia / Qatar / UK / EU",
    ctaPrimary: "Read the systems",
    ctaSecondary: "Check the evidence",
  },

  hero: {
    rotating: ["Reference parity", "Drift detection", "Calibration", "Retrieval evals"],
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
    "PyTorch",
    "NumPy",
    "FastAPI",
    "DuckDB",
    "ONNX Runtime",
    "SQLAlchemy",
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
    {
      label: "Phone",
      handle: "+92 335 5528211",
      href: "tel:+923355528211",
      external: false,
    },
  ],

  stats: [
    { label: "Systems, all public and runnable", value: "07" },
    { label: "Tests across six of them", value: "506" },
    { label: "Automated commits since 16 Aug, unattended", value: "587" },
    { label: "Worst gradient error against central differences", value: "5.9e-09" },
  ],

  systems: [
    {
      slug: "from-scratch-to-served",
      title: "From scratch to served: a LoRA fine-tune where nothing is taken on trust",
      year: 2026,
      status:
        "Shipped — 80 tests, every layer checked against its reference, INT8 served on CPU",
      summary:
        "Most fine-tuning posts show a loss curve. This one shows a parity table. A reverse-mode autodiff written on NumPy, multi-head attention written out rather than called, LoRA on nn.Linear, then an ONNX export and a quantised FastAPI service — with each layer graded against the library it replaces and every number carrying an interval.",
      constraint:
        "A green test suite does not mean the thing is right. The first cross-entropy implementation used `logits - log(softmax(logits))`, which collapses algebraically to `logsumexp(logits)` — a per-row constant, blind to which class is the target. Loss fell smoothly while accuracy stayed pinned at chance, because argmax is scale-invariant. Gradient checking did not catch it: my analytic gradient and my numerical gradient agreed to 1e-10, because both were differentiating the same wrong function. The hard part was realising that gradient checking validates an implementation against its specification and cannot tell you the specification was wrong.",
      diagram: `                  ┌────────────────────────────────────────────┐
   spec ──────────►  │  phase 1  reverse-mode tape on NumPy       │
   torch.optim ───►  │            checked vs central differences  │
   nn.Multihead  ──►  │            worst error 5.9e-09            │
   peft          ───►  └───────────────────┬────────────────────────┘
   onnxruntime   ───►                      │  exact parity, 0.0
                                           ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  phase 3   W' = W + (α/r)·B·A          on nn.Linear directly    │
   └───────────────────────────┬────────────────────────────────────┘
                               │  merge() into base weights
                               ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  serving    ONNX export, dynamic batch/sequence               │
   │             dynamic INT8, QUInt8 per-channel                  │
   │             ONNX Runtime, CPU EP  ──►  FastAPI                │
   │             268.6 MB ──► 67.8 MB     149.6 ms ──► 99.9 ms p50 │
   └────────────────────────────────────────────────────────────────┘`,
      decisions: [
        {
          decision: "Every layer is graded against the library it replaces",
          why: "Central differences for every op, torch.optim for the optimisers, nn.MultiheadAttention for attention, peft for LoRA, onnxruntime for the export. A hand-written implementation that is merely plausible is the normal failure mode; parity at 1e-09 and below is the only evidence that it is the same function.",
          cost: "Copying torch's fused in_proj_weight into the split projections to compare like with like, and maintaining the parity scripts as the reference libraries move. It is a standing maintenance cost, not a one-off.",
        },
        {
          decision:
            "The comparison is paired, with confidence intervals and a significance test",
          why: "LoRA reached 0.9217 against 0.9295 for a full fine-tune while training 1.1% of the weights. McNemar's test on the paired predictions puts that gap at p = 0.006, so it is a real difference — and a small one. Reporting an accuracy table with no interval would have made the same gap look like either noise or a result.",
          cost: "Single seed per arm, so the method is conflated with its initialisation. That is named as the first thing to fix rather than left implicit.",
        },
        {
          decision: "Calibration is treated as a first-class outcome, not a diagnostic",
          why: "LoRA came out better calibrated than full fine-tuning — ECE 0.0180 against 0.0306 — and the linear probe at 0.2650 is nowhere near either. A low-rank update constrains the weights to stay near the pretrained solution, so the logits move less far from whatever calibration was already there. If you are going to threshold on a predicted probability, the cheap method is the safer one to ship.",
          cost: "One model and one dataset. Nothing here establishes that the calibration ordering or the quantisation result generalises; each is a property of this graph until proven otherwise.",
        },
        {
          decision: "Signed INT8 was diagnosed by sweeping eight configurations, not accepted",
          why: "The first serving run reported accuracy 0.9300 → 0.2610, which is chance. Rather than write 'quantisation hurt' and move on, a sweep found unsigned per-channel at 0.9280 and 98.4% agreement for a 4x size reduction. A Gemm-only configuration also scored 1.0000 and compressed nothing — which is what 'the ops you asked to quantise were not in the graph' looks like from the outside.",
          cost: "The per-layer mechanism is a plausible hypothesis, not an established result. The README says so in those words rather than implying the cause was proven.",
        },
        {
          decision: "The LoRA target resolver raises instead of returning an empty list",
          why: "`inject_lora(targets=('q_proj','v_proj'))` silently matched nothing on DistilBERT, which calls them q_lin and v_lin. The run completed, reported 92% validation accuracy, and was in fact a linear probe wearing a LoRA label — the headline result was wrong. Now the resolver maps canonical names onto whatever the architecture calls them, injection raises on zero matches, and a run refuses to report any arm scoring at or below chance.",
          cost: "An arm that fails to load now stops the experiment instead of producing a number, which occasionally turns a working run into a stopped one.",
        },
        {
          decision: "/health deliberately does not touch the model",
          why: "A liveness probe that loads the graph turns a slow cold start into an orchestrator restart loop. /ready is the endpoint that should fail until warm, and it is the one wired to the load balancer.",
          cost: "One more endpoint to reason about, and a health check that cannot tell you whether the weights are readable.",
        },
      ],
      metrics: [
        { label: "Tests, offline on CPU", value: "80" },
        { label: "Worst gradient error", value: "5.9e-09" },
        { label: "LoRA vs peft parity", value: "0.0" },
        { label: "Trainable params", value: "741,124" },
        { label: "Model size, fp32 → int8", value: "268.6 → 67.8 MB" },
        { label: "p50 latency, fp32 → int8", value: "149.6 → 99.9 ms" },
      ],
      stack: [
        "Python",
        "NumPy",
        "PyTorch",
        "peft",
        "ONNX",
        "ONNX Runtime",
        "FastAPI",
        "pytest",
      ],
      notBuilt: [
        "Single seed per arm. The 0.78-point LoRA/full gap is significant by McNemar on 4,000 examples, but one seed conflates the method with its initialisation. Multiple seeds with mean and standard deviation is the next thing to fix.",
        "Rank was not ablated. r ∈ {1,2,4,8,16} is the obvious next experiment and the single most-asked LoRA question.",
        "One model, one dataset. DistilBERT on AG News, encoder-only — nothing here involves decoder-only attention, KV-cache serving or generation, which is where most current LLM serving work sits.",
        "CPU only, single thread, and deliberately so: the figure is meant to measure latency rather than core count. There are no GPU serving numbers and no batching-under-load profile.",
        "The two serving tests skip on a clean clone because the exported ONNX artefacts are 320 MB of regenerable output that .gitignore keeps out of the repository. The CI badge reports 78/2 rather than 80, which is the honest count for anyone who reads the log.",
      ],
      links: [
        {
          label: "from-scratch-to-served",
          href: "https://github.com/AwonAziz/from-scratch-to-served",
          external: true,
        },
      ],
    },
    {
      slug: "eval-analytics",
      title:
        "Evaluation warehouse: six questions that are hard in a notebook and trivial in SQL",
      year: 2026,
      status: "Shipped — 141 tests, 5 migrations, a quality gate that fails CI",
      summary:
        "Every project here already writes evaluation artefacts — per-prediction arrays, serving reports, drift metrics. This puts them in a DuckDB star schema behind real migrations and answers the six questions that decide whether a model change was an improvement: LoRA against a full fine-tune, calibration by arm, INT8 against FP32, drift trend, error by document length, and which slices still lose.",
      constraint:
        "An evaluation number is only as trustworthy as the row underneath it. A warehouse that silently mixes measured telemetry with generated fixtures will eventually publish a synthetic result as though it were real, and nobody reviewing the dashboard will know which is which. So every row carries a `data_origin` column, rejected rows are counted rather than tolerated, and editing a migration that has already been applied raises instead of letting the schema drift away from what CI built.",
      diagram: `   run artefacts (.npy, .json)  +  telemetry.db
                    │
              extract   reshape bytes ──► derive token counts, entropy
                    │
              land      stg_*_raw, every column nullable text
                    │         so a bad row survives to be counted
              validate  Pydantic contracts ──► ingestion_rejection
                    │         (strict: unknown keys fail loudly)
              transform conform dims · surrogate keys · slice projection
                    │
              load      typed marts  +  mart_freshness
                    │
              eap check ──► quality gate, run by CI on every push
                    │   1 validation_rejections   (limit 0)
                    │   2 referential_integrity
                    │   3 mart_freshness         (per-mart, not global)
                    │   4 last_ingestion_run
                    │   5 analytical_coverage    (else the six
                    │                            analyses are
                    │                            quietly meaningless)`,
      decisions: [
        {
          decision:
            "Every row is labelled with where it came from, and the default build has only generated rows",
          why: "The fine-tuning artefacts belong to a separate repository, so that module fabricates files of exactly those shapes from a fixed seed and `eap build` regenerates them byte-for-byte. Measured rows appear only when the upstream telemetry database is present — 5,140 per-request predictions, of which 2,762 carry a gold label and 2,378 are unlabelled production traffic kept with a NULL label rather than discarded or guessed at. Filter any figure to data_origin = 'real' to see only measured numbers.",
          cost: "The headline figures on a fresh clone are from generated data. That is stated at the top of the README rather than in a footnote, and it is why the synthetic generator encodes specific findings instead of noise.",
        },
        {
          decision: "The quality gate fails the build rather than warning in it",
          why: "Five checks, and the fifth is the one that matters most: analytical coverage. Fewer than two arms, fewer than two quantisations, a missing slice family, no drift features, too few labelled predictions — each of those makes the six analyses quietly meaningless while every individual query still returns rows. A gate that only checked for orphans would pass a warehouse that had lost the ability to answer the question.",
          cost: "Mart freshness is deliberately not a global frontier. Drift measurements legitimately extend past the evaluation date, so comparing every mart to the newest date in the warehouse would flag a complete build as stale. It is per-mart against its own staging table instead.",
        },
        {
          decision:
            "Rejected rows are counted, with machine-readable error codes and the raw payload",
          why: "Contracts are strict about unknown keys, so a renamed upstream column fails loudly rather than passing silently. Bounds are mostly physical rather than statistical — confidence in [0,1], n_correct <= n_samples, accuracy inside its own confidence interval, trainable_params <= total_params. The default build must produce zero rejections and CI fails otherwise; the rejection path itself is exercised by tests against deliberately corrupted artefacts.",
          cost: "A row that would have been quietly wrong is now a failed build. That is the intent, but it means upstream schema changes surface as red rather than as a subtly different number.",
        },
        {
          decision:
            "Surrogate keys are BLAKE2b over the natural grain, not the database's hash()",
          why: "Identical inputs then produce identical keys, which makes a diff of the warehouse a meaningful review artifact. A content-dependent hash would make every rebuild look like a total rewrite.",
          cost: "Key derivation has to be applied consistently in the transform layer, and an out-of-band insert that skips it produces orphans the gate will catch.",
        },
        {
          decision: "/sql is restricted rather than trusted",
          why: "Single statement, must begin with SELECT or WITH, write and DDL keywords rejected, row cap enforced. Fifteen blocked statements are asserted in the test suite, so the guard cannot rot as the keyword list grows.",
          cost: "The read-only surface is narrower than a real analyst would want, and widening it means widening the blocklist.",
        },
      ],
      metrics: [
        { label: "Tests, hermetic by default", value: "141" },
        { label: "Versioned SQL migrations", value: "5" },
        { label: "Analyses behind the API", value: "6" },
        { label: "Blocked SQL statements asserted", value: "15" },
        { label: "Charts in the dashboard", value: "17" },
        { label: "Quality-gate checks", value: "5" },
      ],
      stack: [
        "Python",
        "DuckDB",
        "SQLAlchemy",
        "Pandas",
        "Pydantic",
        "FastAPI",
        "Streamlit",
        "Plotly",
      ],
      notBuilt: [
        "The fine-tune artefacts are generated, not measured. Real numbers replace them by dropping files into data/raw/ with no code change, but a fresh clone has only the synthetic rows.",
        "INT8 quantisation is approximated by rounding pre-softmax activations onto a group-wise symmetric grid. It reproduces realistic disagreement rates; it is not a simulation of a particular kernel.",
        "Bootstrap intervals resample documents, which is the right unit for a paired comparison but does not capture variance across training runs. One training run per arm is modelled.",
        "Ingestion is single-writer and local. There is no scheduler, no incremental partition strategy and no warehouse anyone else writes to.",
      ],
      links: [
        {
          label: "eval-analytics-platform",
          href: "https://github.com/AwonAziz/eval-analytics-platform",
          external: true,
        },
      ],
    },
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
         EMBEDDING DRIFT                  OUTPUT QUALITY                 │
         MMD, permutation-calibrated      accuracy · macro-F1 · AUC      │
         sliced Wasserstein               ECE · MCE · adaptive-ECE       │
         domain-classifier AUC            Brier · reliability curves     │
         normalised Fréchet               abstention · per-intent damage │
         k-NN novelty rate                in-scope vs out-of-scope       │
         concept gap                      label-free proxies             │
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
          decision: "Six embedding-drift detectors, not one",
          why: "Permutation-calibrated MMD catches shape change the marginals miss, sliced Wasserstein gives a threshold you can argue about, domain-classifier AUC answers the most decision-relevant question — could a model tell reference from today's traffic? — k-NN novelty converts an abstract distance into a number a product manager can act on, and the concept gap catches a vocabulary the reference never contained. They fail differently, and the disagreement is the signal.",
          cost: "Five thresholds to tune plus a voting rule, and a sixth detector firing does not mean a sixth problem.",
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
        { label: "Drift detectors", value: "6" },
        { label: "API endpoints", value: "17" },
        { label: "CI jobs", value: "4" },
        { label: "Calibration bugs pinned by regression tests", value: "6" },
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
      status: "Advisory only — three builds, 38 tests on the current one",
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
        { label: "Tests, current build", value: "38" },
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
      status: "Running unattended since 16 Aug 2026 — 587 automated commits",
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
        { label: "Automated commits", value: "587" },
        { label: "Human commits, all time", value: "3" },
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
        "`from-scratch-to-served` is `python -m pytest tests -q` — 80 tests offline on CPU in about 25 seconds. On a fresh clone 78 run and 2 skip, because the two serving tests need exported ONNX artefacts that are 320 MB of regenerable output and gitignored. The badge reports 78/2 rather than 80 because that is the honest count for anyone reading the log.",
        "`cleanjobfunnel` has one dependency, `requests`. The evaluation warehouse needs no upstream database at all — its suite is hermetic by default.",
        "Four of the seven systems run end to end with no key and no network, and that is a design constraint rather than a coincidence.",
      ],
    },
    {
      question: "How do you know the numbers are real?",
      points: [
        "Everything quantitative in this page is either read at runtime by your own browser or openable in a repository. Nothing here is a claim you have to take on trust.",
        "The hand-written autodiff is graded against central differences (worst error 5.9e-09) and against `torch.optim`. The attention is graded against `nn.MultiheadAttention` at 1.19e-07. The LoRA implementation matches Hugging Face `peft` exactly, 0.0. Those are reference implementations, not my own opinion of correctness.",
        "Comparisons that could be noise are paired and tested: the LoRA-against-full-fine-tune gap carries a McNemar p of 0.006, and the evaluation warehouse resamples documents for bootstrap intervals rather than quoting a point estimate.",
        "Where a number is generated rather than measured, the repository says so in the same sentence. The evaluation warehouse labels every row with a `data_origin` column precisely so a synthetic figure can never be read as a measured one.",
      ],
    },
    {
      question: "How do you know the drift detector is not just crying wolf?",
      points: [
        "Every detector had to be made able to report no. That was the actual engineering problem: the domain-classifier null sat at 0.63 instead of 0.50, so every window looked like drift until PCA was fitted on the reference first.",
        "The MMD permutation null was computed on 400 points against a 1,400-point observation, which made every window significant. Both nulls are now regression tests.",
        "Six calibration bugs in total are pinned by regression tests, including a tautological accuracy computation that always returned 1.0 and a missing veto cap on the judge.",
        "A permission test now sits in the demo: a 2× traffic spike with an identical intent mix fires nothing. A detector that pages on volume gets muted within a week, so that window is the one that proves the others.",
        "Significance gates whether a window may raise drift; severity always comes from effect size.",
      ],
    },
    {
      question:
        "You have no commercial employment history. Why should anyone take this seriously?",
      points: [
        "That is a fair question, and it is why the page leads with the artifacts rather than a biography.",
        "The no-go log is the argument. It lists the bugs this work found in itself — the log-softmax shortcut that made loss fall while accuracy stayed at chance, the signed quantisation that took the model to chance, the LoRA target resolver that silently matched nothing — each with the design change it forced.",
        "A project that has never failed is a project nobody has run.",
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
      title: "Nothing is taken on trust, including by me",
      body: "The autodiff is graded against central differences. Attention is graded against `nn.MultiheadAttention`. LoRA is graded against Hugging Face `peft` and matches it exactly. ONNX predictions are graded against PyTorch at 1.0000 agreement. Where a claim could have been checked and was not, the gap shows up as a bug: a linear probe was quietly reporting itself as a LoRA run, and a log-softmax shortcut was making the loss fall while accuracy stayed at chance.",
      evidence: "from-scratch-to-served · worst gradient error 5.9e-09, peft parity 0.0",
    },
    {
      index: "02",
      title: "Negative results get written down",
      body: "When the hybrid retriever's dense half ranked worse than sparse on two of eight cases, that became a documented constant with a threshold and an explanation, not a quietly deleted branch. When signed INT8 quantisation took the model to chance accuracy, the fix came from sweeping eight configurations rather than from accepting the first result. A system whose flaws are only discovered by whoever runs it next is worth less than one whose flaws are on the tin.",
      evidence: "Hybrid-retrieval · corpus-size trust gate, with the failing cases named",
    },
    {
      index: "03",
      title: "A number that could be synthetic says so in the same sentence",
      body: "The evaluation warehouse carries a `data_origin` column on every row, so a generated figure can never be read as a measured one, and filtering to 'real' shows only what was actually observed. The committed severe drift report is manufactured on purpose and its header says so. The quantisation mechanism is labelled a hypothesis in the code because the effect is reproducible and the per-layer cause is not established.",
      evidence:
        "eval-analytics-platform · data_origin on every row; llm-drift-monitor · inject_drift.py",
    },
    {
      index: "04",
      title: "Scope boundaries are drawn on purpose",
      body: "The incident copilot advises and never remediates. The pair engineer generates tests and never executes them. The job funnel leaves LinkedIn alone. The warehouse's default build has only generated rows until a real database is pointed at it. In each case the repository states the reason, because a boundary without a reason reads as an oversight.",
      evidence: "Four READMEs, each with an explicit 'what this does not do'",
    },
  ],

  nogolog: [
    {
      date: "Oct 2026",
      title: "The loss went down and the model learned nothing",
      body: "The first cross-entropy implementation used `logits - log(softmax(logits))`, which collapses to `logsumexp(logits)` — a per-row constant, completely blind to which class was the target. Logits grew, so logsumexp grew, so the loss fell, while argmax stayed pinned at chance because argmax is scale-invariant. Gradient checking did not catch it: my analytic gradient and my numerical gradient agreed to 1e-10, because both were differentiating the same wrong function. Gradient checking tells you an implementation matches its specification; only an independent ground truth can tell you the specification was wrong. There is now a regression test that exists purely to guard that shortcut.",
    },
    {
      date: "Oct 2026",
      title: "Quantisation destroyed the model, and then the fix was found by sweeping",
      body: "The first INT8 serving run reported accuracy 0.9300 → 0.2610, which is chance. Instead of writing 'quantisation hurt' and moving on, eight configurations were swept against the same fp32 reference: unsigned per-channel held 0.9280 at 98.4% agreement for a 4x size reduction, while signed per-tensor collapsed. The mechanism is plausible — a symmetric grid spanning [-128, 127] wastes half its range on a one-sided channel — and it is stated as a hypothesis in the code, because I verified the effect reproducibly and did not prove the per-layer reason. A sixth configuration scored a perfect 1.0000 and compressed nothing, which is what 'the ops you asked to quantise were not in the graph' looks like from the outside.",
    },
    {
      date: "Oct 2026",
      title: "A linear probe was wearing a LoRA label",
      body: "`inject_lora(targets=('q_proj','v_proj'))` silently matched nothing on DistilBERT, which calls them q_lin and v_lin. The run completed, reported 92% validation accuracy, and was in fact a linear probe — the headline result of the experiment was wrong. Three permanent fixes: the resolver maps canonical names onto whatever the architecture calls them, injection raises instead of returning an empty list, and a run refuses to report any arm scoring at or below chance, because exactly-chance means a checkpoint failed to load, which is a completely different finding.",
    },
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
      title: "Multiple seeds, and an ablation of the rank",
      body: "The fine-tune ran one seed per arm, so the 0.78-point LoRA-against-full gap is significant by McNemar on 4,000 examples but the method is conflated with its initialisation. r ∈ {1, 2, 4, 8, 16} is also unablated, and it is the single most-asked LoRA question. Both are named as the next thing to fix in the repository's own limitations rather than left for a reviewer to notice.",
    },
    {
      title: "Real telemetry into the evaluation warehouse",
      body: "The warehouse already labels every row with its origin and will pick up measured data the moment an upstream database is present — 5,140 per-request predictions, of which 2,378 are unlabelled traffic currently kept with a NULL label. Pointing it at the drift monitor's real store is a path change, not a rewrite. What I want to find out is whether the generated findings survive contact with real numbers.",
    },
    {
      title: "LangGraph, specifically human-in-the-loop",
      body: "The hybrid retrieval build ends at an Approve/Dismiss button with no state behind it. The next version should loop a dismissed report back for re-investigation and write an approved one into the knowledge base as a new postmortem. The eval harness already accepts a pipeline function, so both versions can be scored against the same eight cases.",
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
        "EduQual (UK) · RQF Level 6, the bachelor's-level equivalent · 90%. The word that matters in the title is Operations — it is not a course about model architectures, it is a course about what has to exist around a model for it to survive real infrastructure.",
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
    availability:
      "Remote (EU or US overlap), or relocation to UAE / Saudi Arabia / Qatar / UK / EU",
    note: "The fastest way to judge whether this is a fit is to open one of the repositories and read the limitations section. I would rather be the person on a team who ships the drift detector and the runbook than the person who claims five years of it.",
  },

  footer: {
    note: "Islamabad, Pakistan. No analytics, no cookies, no tracking.",
    colophon:
      "Vite · React 19 · TypeScript · Tailwind v4 · GSAP · Lenis · React Three Fiber · custom GLSL. Every number on this page is read at runtime or openable in a repository.",
  },
}) satisfies SiteConfig as SiteConfig;
