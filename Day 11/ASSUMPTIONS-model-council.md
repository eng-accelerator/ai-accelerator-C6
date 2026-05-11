# Assumptions — Model Council

Risk scan across the 8 categories (Value, Usability, Viability, Feasibility, Ethics, GTM, Strategy, Team). Each assumption gets a confidence rating (1 = total guess, 5 = near-certain) and a cheap test.

Context: personal-use web app, single user, OpenRouter-backed, four-model debate + Opus 4.6 synthesizer.

---

## 1. Value — will it actually be useful?

| # | Assumption | Confidence | Test |
|---|---|---|---|
| V1 | A four-model debate produces materially better answers than asking one top model | **2** | Blind A/B: run 20 real prompts through Council vs. Opus-alone, rate both on a 1–5 usefulness scale a week later. |
| V2 | The user will actually wait 60–90s for a debate instead of reaching for ChatGPT | **3** | Dogfood for one week. Count how many times you open Council vs. a single-model UI for real questions. |
| V3 | Seeing disagreement is more valuable than seeing one confident answer | **3** | After 10 debates, check: did the verdict table change your decision vs. what the first model alone would have told you? |
| V4 | The verdict table columns (Agree/Disagree/Confidence/Trace) are the *right* columns | **2** | After 10 debates, note which column you actually read. Drop or replace unused ones. |

**Biggest value risk:** V1. If four models just converge on the same answer 90% of the time, the whole app collapses into "expensive single-model chat." Worth a cheap pre-build test: manually run 5 hard prompts through all four models today and check whether they actually disagree in interesting ways.

## 2. Usability — will you use it without friction?

| # | Assumption | Confidence | Test |
|---|---|---|---|
| U1 | Watching streaming debates live is engaging, not annoying | **3** | Build v0.2 without streaming first. See if you miss it. |
| U2 | Four cards side-by-side is readable (not cognitive overload) | **3** | Mock the layout in Figma / HTML before coding; squint at it. |
| U3 | The user won't want to interrupt mid-debate ("stop, I've seen enough") | **2** | Track how often you'd want a "stop" button in first week of use. |
| U4 | One prompt at a time is enough — no threading, no follow-ups needed in v1 | **3** | See how often you reflexively want to ask a follow-up. |
| U5 | Markdown export is the right share format (vs. link, screenshot, or copy-to-clipboard) | **3** | First week: note which method you actually reach for. |

**Biggest usability risk:** U2 + U3. Four streaming cards is a *lot* of live text. May need a "collapse previous rounds" control sooner than planned.

## 3. Viability — is it worth running?

| # | Assumption | Confidence | Test |
|---|---|---|---|
| Vi1 | Cost per debate is acceptable ($0.10–$0.40 estimated) | **3** | Instrument cost logging from day 1. Kill switch at $5/day. |
| Vi2 | OpenRouter rate limits are generous enough for 10–30 debates/day | **4** | Check OpenRouter rate-limit docs before coding. Log 429s. |
| Vi3 | No billing / quota surprises from any single model provider routed through OpenRouter | **3** | Set a hard OpenRouter account cap. |
| Vi4 | Personal-use only means no compliance / privacy / ToS worries | **4** | Skim OpenRouter ToS for "no redistribution of model outputs" clauses. |

**Biggest viability risk:** Vi1. Five models × 2–3 rounds × long prompts can silently 10× the expected cost. **Mandatory: log token usage per call and show running cost in the footer.**

## 4. Feasibility — can we actually build it?

| # | Assumption | Confidence | Test |
|---|---|---|---|
| F1 | All four model slugs work on OpenRouter right now (`claude-sonnet-4.6`, `gpt-5`, `gemini-3.1-pro-preview`, `grok-4.20`) | **3** | `curl` each model with a hello-world prompt before writing any app code. |
| F2 | All four models stream via OpenRouter's OpenAI-compatible SSE | **3** | Same curl test with `stream: true`. Verify chunk format. |
| F3 | Opus 4.6 reliably produces valid JSON for the verdict table | **2** | Run the synthesizer prompt 20 times with varied inputs, measure parse-fail rate. Add retry + JSON-mode if supported. |
| F4 | Total round-trip stays under 90s for typical prompts | **3** | Time the slowest model (likely Grok or Gemini preview) on a representative prompt. |
| F5 | Pairwise disagreement classifier is accurate enough to gate Round 3 | **2** | After 20 debates, manually label "should have fired Round 3" and compare to the classifier's calls. |
| F6 | SSE + Next.js App Router + parallel streams to 4 models in one response is achievable without exotic infra | **3** | Prototype the SSE fan-out in a 1-hour spike before committing to the stack. |
| F7 | The Bold Editorial design (custom cursor, staggered reveals, marquee) does not fight with streaming text updates | **2** | Build a static design mockup first, then wire streaming into it. Watch for reveal animations replaying on every token. |

**Biggest feasibility risks:**
- **F3** (JSON reliability) — the single most likely thing to break v1. Must build retry-on-parse-fail from day 1.
- **F7** (design × streaming collision) — the reveal animations are designed for page loads, not 200 streamed tokens/sec. Animate the *round containers*, not individual text spans that are still mutating.

## 5. Ethics — should we build it?

| # | Assumption | Confidence | Test |
|---|---|---|---|
| E1 | Prompts sent through OpenRouter don't leak sensitive user data (it's your data, your key, but still flows through providers) | **4** | Read OpenRouter + each provider's data-use policy. Add a "don't paste secrets" notice above the prompt bar. |
| E2 | The synthesizer (Opus 4.6) won't systematically favor Claude's own Round 2 output when judging | **2** | Occasionally rerun synthesis with a *different* synthesizer (e.g., GPT-5 or Gemini) and compare verdicts. |
| E3 | Confidence scores reported by models are not meaningless (i.e., not purely hallucinated numbers) | **2** | Calibration check: on 20 factual questions with known answers, correlate self-reported confidence with actual correctness. |
| E4 | Presenting four-model consensus as "better" doesn't falsely launder bad answers (four models can be wrong in the same direction) | **3** | Include a footer disclaimer. Track cases where consensus was wrong. |

**Biggest ethics risk:** E2. Using Opus as judge when Claude Sonnet is a debater is a real bias vector. Worth documenting as a known limitation and rotating judges occasionally.

## 6. Go-to-Market — how does it reach users?

N/A for v1 — personal tool, one user. Skipping.

If it ever becomes shareable: the bigger risks would be API-key BYO friction, cost-per-debate sticker shock, and provider ToS around reselling outputs.

## 7. Strategy & Objectives

| # | Assumption | Confidence | Test |
|---|---|---|---|
| S1 | This is better than waiting 6 months for frontier models to converge and making the whole idea moot | **3** | Set a 4-week re-evaluation date: is the app still more useful than GPT-5 + extended thinking alone? |
| S2 | Four is the right number — not three (cheaper, simpler) or five (Llama / Mistral for diversity) | **3** | Run one debate with three models, one with five. Feel the difference in cost and quality. |
| S3 | Debate rounds > sampling + voting (simpler technique) | **2** | Build a 50-line "ask 4 models, pick majority" baseline. Compare. |
| S4 | The problem you're solving is "I want better answers" not "I want to watch models fight" (i.e., utility, not entertainment) | **3** | Honest self-check after week 1: which one drove you back to the app? |

**Biggest strategy risk:** S3. Parallel sampling + majority vote is 10× simpler and may capture 80% of the value. Worth a cheap baseline before investing in debate orchestration.

## 8. Team

Single-operator project. Skipping most of this category.

| # | Assumption | Confidence | Test |
|---|---|---|---|
| T1 | You (the user) will maintain this past v1.0 or knowingly let it rot | **3** | Commit to 4 weeks of dogfooding before deciding to expand or archive. |
| T2 | Claude Code is sufficient for build + iteration; no human collaborators needed | **4** | Just a stated constraint. |

---

## Top-5 to validate *before* writing code

Ranked by `impact × likelihood-of-being-wrong`:

1. **F1 — Model slugs work on OpenRouter.** 10-minute `curl` test. If any slug 404s, the whole PRD shifts.
2. **V1 — Four models actually disagree interestingly.** Run 5 hard prompts through all four models manually. If they converge 90% of the time, rethink the whole app.
3. **F3 — Opus 4.6 JSON reliability for the verdict table.** Run the synthesis prompt 20 times, measure parse-fail rate, decide if retry + schema + structured-output mode is needed.
4. **Vi1 — Actual cost per debate.** Run one full debate manually, sum token costs. If >$0.50, cap round count or shrink the council.
5. **S3 — Is simple majority-vote 80% as good?** Build a 50-line baseline before the debate orchestration. Compare on 5 prompts.

**If all five pass, green light for v0.1 scaffolding.**

---

## What to do with this

- **Blockers to clear first:** F1, V1, F3, Vi1, S3 (the top-5).
- **Build-time safeguards:** cost logger (Vi1), JSON retry + schema (F3), "don't paste secrets" notice (E1), rotating judge occasionally (E2).
- **Defer:** GTM and Team categories — revisit only if the app grows beyond a personal tool.
- **Next skill:** `pm-execution:pre-mortem` to walk through *launch-day* failure modes, then `prioritize-assumptions` if the top-5 balloons.
