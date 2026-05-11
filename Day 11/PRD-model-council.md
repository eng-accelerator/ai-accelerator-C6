# PRD — Model Council

## 1. Summary

Model Council is a web app that sends a single user prompt to four leading AI models, has them debate each other across 2–3 structured rounds, and uses Claude Opus 4.6 as a synthesizer to produce a final verdict with a side-by-side comparison table. The goal is to help the user get a higher-quality, multi-perspective answer than any single model can give alone.

## 2. Contacts

| Name | Role | Comment |
|---|---|---|
| Owner (you) | Product owner + sole user | Defines requirements, uses the app daily |
| Claude Code | Implementation partner | Scaffolds, builds, and iterates on the app |
| OpenRouter | Model provider | Single API gateway for all four council models + synthesizer |

## 3. Background

**Context.** Different frontier models have different strengths, biases, and failure modes. Asking one model a hard question often gives a confident-but-incomplete answer. Today the user has to manually open 4 tabs, paste the same prompt, and mentally compare answers — slow, lossy, and there is no structured debate.

**Why now.** OpenRouter now exposes all four target models (Claude Sonnet 4.6, GPT-5, Gemini 3.1 Pro Preview, Grok 4.20) behind one OpenAI-compatible API. This removes the biggest historical blocker — juggling four SDKs, four keys, four rate-limit schemes — and makes a multi-model debate app a weekend-sized project instead of a month-sized one.

**What changed.** (a) OpenRouter's unified API, (b) streaming support across all four models, (c) Claude Opus 4.6 as a strong synthesizer capable of reconciling disagreements.

## 4. Objective

**Primary objective.** Give the user a single interface where one prompt produces a debated, synthesized answer from four top models, with a verdict table that makes agreement and disagreement visible at a glance.

**Why it matters.**
- Higher-quality answers on ambiguous or high-stakes questions (strategy, technical trade-offs, writing critique).
- Faster workflow — no tab juggling, no manual comparison.
- Visible reasoning — you see *why* models disagree, not just *that* they do.

**Key Results (SMART).**
- **KR1:** End-to-end debate (Round 1 → Round 2 → synthesis) completes in under 90 seconds for a typical prompt (≤500 tokens input, ≤800 tokens per response).
- **KR2:** 100% of runs produce a verdict table with all four columns filled: Agree, Disagree, Confidence, Reasoning Trace.
- **KR3:** Markdown export downloads a self-contained `.md` file with prompt, all rounds, and final verdict.
- **KR4:** Round 3 auto-triggers whenever pairwise disagreement after Round 2 exceeds the disagreement threshold (defined in §7.2).

## 5. Market Segment

**For whom.** A single power user (you) who:
- Regularly asks AI models non-trivial questions (strategy, coding trade-offs, writing, research).
- Already pays for / has access to multiple frontier models and wants them compared, not chosen in advance.
- Values transparent reasoning over a single confident answer.

**Constraints.**
- Personal tool — no auth, no multi-tenancy, no billing, no SLA.
- OpenRouter API key stored locally (env var), never committed.
- Runs on localhost; deployment optional.

## 6. Value Proposition

**Jobs to be done.**
- "When I have a hard question, I want to hear multiple expert opinions *and* watch them push back on each other, so I can trust the final answer."
- "When models disagree, I want to see *why* — not just pick one."
- "When I find a great debate, I want to save and share it."

**Gains.**
- One prompt → four perspectives → one synthesized verdict.
- Visible debate: see each model critique the others in Round 2.
- Exportable markdown for sharing or archiving.

**Pains avoided.**
- No tab-juggling across four web UIs.
- No mental diffing of four parallel answers.
- No hidden consensus bias — disagreements are surfaced, not averaged away.

**Why this beats single-model chat.** ChatGPT, Claude.ai, Gemini, and Grok all give you one voice. Model Council gives you four voices *plus* a judge, with structured rounds. It is the only form factor that makes model disagreement a first-class citizen.

## 7. Solution

### 7.1 UX / User Flow

**Single-page chat-style web app.**

1. **Prompt bar** at top — textarea + "Convene Council" button. Optional toggle: "Force Round 3".
2. **Live debate stream** below — as each round runs, cards appear for each model with streaming text. User watches the debate unfold in real time.
3. **Verdict table** — renders once the synthesizer finishes. Columns: Model | Agree | Disagree | Confidence | Reasoning Trace.
4. **Final verdict card** — Opus 4.6's synthesized answer in prose.
5. **Export button** — downloads the full session as `.md`.

**Layout sketch (text wireframe).**
```
┌────────────────────────────────────────────────┐
│  [ prompt textarea ]             [ Convene ▸ ] │
│  ☐ Force Round 3                                │
├────────────────────────────────────────────────┤
│  Round 1 — Independent Answers                  │
│  ┌─ Sonnet 4.6 ─┐ ┌─ GPT-5 ─┐ ┌─ Gemini ─┐ ┌─ Grok ─┐
│  │ streaming... │ │ streaming│ │ streaming│ │ stream │
│  └──────────────┘ └──────────┘ └──────────┘ └────────┘
│                                                 │
│  Round 2 — Critique & Update                    │
│  [ same four cards, each seeing the other 3 ]  │
│                                                 │
│  Round 3 — Final Statements (auto-fired)        │
│  [ only if disagreement > threshold ]           │
│                                                 │
│  ═══════════ Verdict Table ═══════════          │
│  | Model  | Agree | Disagree | Conf | Trace |  │
│                                                 │
│  ═══════════ Final Verdict (Opus 4.6) ══════    │
│  [ synthesized answer ]                         │
│                                                 │
│  [ ⬇ Export as Markdown ]                      │
└────────────────────────────────────────────────┘
```

### 7.2 Key Features

**F1. Four-model parallel debate.**
- Council: `anthropic/claude-sonnet-4.6`, `openai/gpt-5`, `google/gemini-3.1-pro-preview`, `x-ai/grok-4.20`.
- Synthesizer: `anthropic/claude-opus-4.6`.
- All calls via OpenRouter (OpenAI-compatible SDK, one API key).

**F2. Structured debate rounds.**
- **Round 1 — Independent:** all four models answer the raw prompt in parallel. No cross-talk.
- **Round 2 — Critique & Update:** each model receives the other three Round 1 answers with the instruction "identify where you agree, disagree, and update your answer if warranted." Parallel calls.
- **Round 3 — Final Statement (conditional):** auto-fires if the synthesizer's disagreement check flags unresolved conflict. Each model gets Round 2 outputs and writes a final statement.
- **Synthesis:** Opus 4.6 receives all rounds and produces (a) the verdict table, (b) a final prose answer.

**F3. Disagreement detection (auto Round 3 trigger).**
- After Round 2, a lightweight Opus 4.6 call classifies pairwise agreement: `agree / partial / disagree`.
- If ≥ 2 pairs are `disagree`, Round 3 auto-fires.
- User can override with "Force Round 3" checkbox.

**F4. Live streaming UI.**
- Server-Sent Events (SSE) from Next.js API route.
- Each model card streams tokens as they arrive.
- Round transitions render as section headers.

**F5. Verdict table.**
- Columns: **Model**, **Agree** (what this model agreed with consensus on), **Disagree** (where it held its ground), **Confidence** (self-reported 1–5 from final round), **Reasoning Trace** (2–3 sentence summary of its argument arc).
- Generated by Opus 4.6 in the synthesis step as structured JSON, then rendered as a table.

**F6. Markdown export.**
- Button downloads `council-<timestamp>.md` with: prompt, each round's full outputs, verdict table, final verdict.
- Self-contained, no assets, shareable as a gist.

### 7.3 Technology

- **Frontend:** Next.js 15 (App Router) + React + Tailwind + shadcn/ui.
- **Backend:** Next.js API routes, SSE for streaming.
- **LLM client:** `openai` npm SDK pointed at `https://openrouter.ai/api/v1` with `OPENROUTER_API_KEY`.
- **Orchestration:** Plain TypeScript — `Promise.all` for parallel round calls, sequential between rounds.
- **Structured synthesis:** Opus 4.6 called with a JSON schema prompt for the verdict table.
- **Storage:** None server-side. `localStorage` keeps last 10 sessions for the user. Export = client-side blob download.
- **Env:** `.env.local` with `OPENROUTER_API_KEY`. Never committed.

### 7.4 Design System — Bold Editorial Studio

**Aesthetic.** Typography-first creative studio. Pure black-and-white palette, custom interactive cursor, motion-driven reveals. The debate UI should feel like a design studio portfolio, not a dev tool.

**Color palette.**
- Primary background: `#FFFFFF`
- Primary text: `#000000`
- Secondary text / metadata: `#525252`, `#737373`
- Accents and borders: `#000000` at 10% opacity
- Footer background: `#0A0A0A` with `#FFFFFF` text
- **Strict rule:** any color only comes from project photography / model avatars. UI itself stays monochrome.

**Typography — Inter.**
- Headlines: `font-weight: 700; letter-spacing: -0.05em; line-height: 0.9`
- Body: `font-weight: 400; letter-spacing: -0.02em; line-height: 1.5`
- Mono / metadata: `font-family: monospace; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em`

**Interactions.**
- **Custom cursor.** 32px circle, `1px solid black` border, white background, `mix-blend-mode: difference`, `position: fixed`, `pointer-events: none`, `z-index: 9999`. Lerp movement via `requestAnimationFrame` for a lagging smooth effect. Scale `2.5x` on hover of `a` / `button`. Body gets `cursor: none`.
- **Image hover.** `grayscale(100%) → grayscale(0%)` over 700ms, plus `scale(1.05)` transform.

**Animations.**
- **Reveal:** text spans slide from `translate-y(100%) → 0%` with `cubic-bezier(0.16, 1, 0.3, 1)` over 1s. Used for hero headline and round-transition headers.
- **Marquee:** linear infinite scroll, 30s duration, pauses on container hover.
- **All hover states:** minimum 500ms, always `cubic-bezier(0.16, 1, 0.3, 1)`. No system easing.

**Layout flow.**
1. **Nav header.** Fixed, `mix-blend-mode: difference`. Left: lowercase `mc` logo (24px, 700, tracking-tighter). Right: `+` menu toggle. Padding 24px.
2. **Hero.** ≥80vh, centered. Headline `font-size: 12vw`, weight 700, tracking-tighter, with staggered letter reveal. Sub-headline 24px, `#525252`, mt-32.
3. **Prompt bar.** Large textarea, monospace metadata label above it, single "CONVENE COUNCIL" button styled as a thin-bordered pill.
4. **Round sections.** Each round is a full-width section with a monospace label ("ROUND 01 — INDEPENDENT") and a 2×2 grid of model cards (single column on mobile). Section-based vertical flow with generous whitespace.
5. **Model cards.** 4:3 aspect ratio. Asymmetrical rounded corners — alternating: Card A `border-top-left-radius: 100px`, Card B `border-top-right-radius: 100px; border-bottom-left-radius: 40px`, Card C `border-radius: 40px`, Card D mirror of A. Hover overlay: black at 10% opacity with `arrow-up-right` icon top-right. Bottom metadata row separated by `1px #000000/10` border-top: model name (24px), provider, round number (mono).
6. **Verdict table.** Full-width, minimal. 1px `#000000/10` dividers. Monospace column headers. Row hover = 10% black overlay.
7. **Final verdict card.** Hero-style large type for the synthesized answer. Opus 4.6 attribution in monospace metadata.
8. **Footer.** `#0A0A0A` background, `#FFFFFF` text. Four-column desktop grid. Cols 1–2: "MODEL COUNCIL" brand + short bio. Col 3: "COUNCIL" (list of models). Col 4: "META" (session count, export link). Bottom bar: thin `white/10` border-top with copyright in 14px.

**Hard rules.**
- MUST keep strict black-and-white palette.
- MUST use smooth easing (≥500ms) on all hover states.
- MUST hide the default browser cursor (`cursor: none` on body).
- DO NOT use borders heavier than 1px.
- DO NOT use system easing — always `cubic-bezier(0.16, 1, 0.3, 1)`.

**Implementation notes.**
- shadcn/ui components will need heavy restyling — treat shadcn as structural primitives, not visual defaults.
- Custom cursor as a top-level client component in `app/layout.tsx`.
- Inter loaded via `next/font/google` with `--font-inter` CSS variable.
- Framer Motion for staggered letter reveals and round transitions.

### 7.5 Assumptions (to validate)

- **A1:** OpenRouter exposes all four target model IDs with streaming support. *(Must verify model slugs before coding.)*
- **A2:** Total round-trip stays under 90s for typical prompts. Grok and Gemini previews can be slow — may need timeouts and a "still thinking…" state.
- **A3:** Opus 4.6 reliably produces valid JSON for the verdict table. *(Will need retry-on-parse-fail logic.)*
- **A4:** Pairwise disagreement classification is cheap and accurate enough to gate Round 3. *(Fallback: simple keyword/length heuristic.)*
- **A5:** Cost per debate (~5 model calls × 2 rounds + synthesis ≈ 10–15 calls) is acceptable to the user. Rough estimate: $0.10–$0.40 per debate depending on prompt size.
- **A6:** User is comfortable running `pnpm dev` locally; no hosted deployment needed for v1.

## 8. Release

**Timeframe.** Weekend-sized MVP. Rough phases:

**v0.1 — Skeleton (few hours)**
- Next.js scaffold, env wiring, OpenRouter client, one-model single-call test.

**v0.2 — Round 1 (half day)**
- Parallel call to all four models, render four static cards (no streaming yet).

**v0.3 — Streaming (half day)**
- SSE pipe, live token streaming into cards.

**v0.4 — Round 2 + debate loop (half day)**
- Critique prompt, Round 2 parallel call with Round 1 context injected.

**v0.5 — Synthesizer + verdict table (half day)**
- Opus 4.6 synthesis, structured JSON output, table rendering, final verdict card.

**v0.6 — Round 3 auto-trigger + export (few hours)**
- Disagreement classifier, conditional Round 3, markdown export button.

**v1.0 — Polish**
- Error states, timeouts, retry-on-JSON-parse-fail, localStorage history, shadcn polish.

**Future (not in v1):**
- Configurable council (swap models per run).
- Multi-turn follow-ups on the same debate.
- Cost tracking dashboard.
- Hosted deploy with auth.
- Custom debate prompts / persona overrides per model.
