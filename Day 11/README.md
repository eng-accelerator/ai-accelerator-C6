# Model Council

> One prompt. Four frontier models. A structured debate. One synthesized verdict.

Model Council is a personal research tool that convenes four AI models, has them debate each other across 2–3 rounds, and uses Claude Opus 4.6 as a synthesizer to produce a final verdict with a side-by-side comparison table. It is built on top of [OpenRouter](https://openrouter.ai) so every model is reachable through a single API key.

The goal is simple: surface disagreement between frontier models on hard questions, rather than getting one confident answer from a single model and calling it a day.

---

## The Council

| Seat | Model | Role |
|---|---|---|
| 1 | `anthropic/claude-sonnet-4.6` | Debater |
| 2 | `openai/gpt-5` | Debater |
| 3 | `google/gemini-3.1-pro-preview` | Debater |
| 4 | `x-ai/grok-4.20` | Debater |
| Judge | `anthropic/claude-opus-4.6` | Synthesizer |

All five are routed through OpenRouter. Swap a slug in `app/lib/models.ts` to change the lineup.

## How a Debate Works

1. **Round 01 — Independent.** Every council model sees only the prompt and writes its own answer. Parallel calls.
2. **Round 02 — Critique & Update.** Every model now sees the other three Round 1 answers and is asked to identify where it agrees, where it disagrees, and update its own answer if the others have made valid points.
3. **Round 03 — Final Statements (conditional).** Claude Opus 4.6 classifies whether substantive disagreement remains after Round 2. If yes, a third round auto-fires — each model writes a final position. A "Force Round 3" checkbox lets you trigger it manually.
4. **Synthesis.** Opus 4.6 reads every round and produces a JSON verdict: a row per model (what they agreed with, what they held their ground on, their confidence, the arc of their argument), plus a synthesized final answer.

The UI streams the whole thing live over Server-Sent Events so you can watch tokens arrive in all four cards as the debate unfolds.

## Web Search

Every model call can be augmented with OpenRouter's built-in `:online` mode, which uses [Exa](https://exa.ai) to inject fresh web results as context. A "⟡ Web Search" checkbox is on by default. Toggle it off for prompts that do not need current information — each searched call adds roughly $0.004 on top of the model's own token cost.

Synthesis and the disagreement check are never web-searched; they reason purely over the debate transcript.

## The Verdict Table

Produced by the synthesizer in structured JSON (with a retry on parse failure). Rendered in the UI as:

| Model | Agree | Disagree | Confidence | Reasoning Trace |
|---|---|---|---|---|

Plus a final prose answer in hero type, and a one-click **Export Markdown** button that downloads a self-contained `.md` file with the prompt, every round's outputs, the verdict table, and the final answer.

---

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Inter
- **LLM client:** `openai` SDK pointed at `https://openrouter.ai/api/v1`
- **Streaming:** native Web Streams + Server-Sent Events
- **Animation:** CSS keyframes + `cubic-bezier(0.16, 1, 0.3, 1)`

No database. No auth. Personal tool, runs on localhost.

## Design

The UI follows a **Bold Editorial Studio** aesthetic:

- Strict black-and-white palette. Accent color only from model attribution.
- Inter at extreme weight and size contrasts. 700 headlines, 400 body, 14px uppercase monospace metadata.
- Custom 32-pixel difference-blend cursor that scales 2.5× over interactive elements; the native cursor is hidden.
- Asymmetric model cards with non-uniform border radii (100-pixel corner accents).
- Every hover transition runs at 700 ms or slower on `cubic-bezier(0.16, 1, 0.3, 1)`. No system easing anywhere.

Full spec lives in `PRD-model-council.md` §7.4.

---

## Quick Start

```bash
# 1. Clone
git clone <your-fork-url> model-council
cd model-council/app

# 2. Install
npm install

# 3. Add your OpenRouter key
cp .env.example .env.local
# Edit .env.local and paste your key from https://openrouter.ai/keys

# 4. Run
npm run dev
# Open http://localhost:3000
```

You need an [OpenRouter](https://openrouter.ai) account with credit on it. A typical debate runs roughly $0.10 to $0.40 in model costs depending on prompt size and how much each model writes; web search adds a few cents on top.

## Project Layout

```
model_council/
├── PRD-model-council.md          # Full product spec (8 sections + design)
├── ASSUMPTIONS-model-council.md  # Risk scan across 8 categories
├── README.md                     # This file
└── app/                          # Next.js application
    ├── app/
    │   ├── layout.tsx            # Root layout: Inter, cursor, header, footer
    │   ├── page.tsx              # Hero, prompt bar, rounds, verdict, export
    │   ├── globals.css           # Bold Editorial base styles
    │   └── api/council/route.ts  # SSE streaming endpoint
    ├── components/
    │   ├── Cursor.tsx            # 32px difference-blend cursor
    │   ├── NavHeader.tsx
    │   ├── Footer.tsx
    │   ├── ModelCard.tsx         # Asymmetric radii per variant
    │   ├── RoundSection.tsx      # 2×2 grid per round
    │   └── VerdictTable.tsx
    └── lib/
        ├── models.ts             # Council + synthesizer config
        ├── council.ts            # Orchestration, prompts, JSON retry
        └── export.ts             # Markdown builder
```

## Configuration

| Env Var | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Get one at https://openrouter.ai/keys |
| `OPENROUTER_APP_NAME` | No | Shown in your OpenRouter dashboard |
| `OPENROUTER_APP_URL` | No | HTTP-Referer header sent to OpenRouter |

## Swapping Models

Edit `app/lib/models.ts`:

```ts
export const COUNCIL_MODELS: CouncilModel[] = [
  {
    id: "sonnet",
    slug: "anthropic/claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    provider: "Anthropic",
    shortLabel: "sonnet",
  },
  // ...
];
```

Any slug [OpenRouter](https://openrouter.ai/models) exposes will work. The synthesizer is defined just below and can be swapped the same way.

## Known Limitations

- **Self-reported confidence is not calibrated.** When a model says "5/5", that does not mean it is actually right 95% of the time. Treat the numbers as relative, not absolute.
- **Synthesizer bias.** Using Opus 4.6 as judge when Claude Sonnet 4.6 is a debater is a real bias vector. Rotating the synthesizer occasionally is a good sanity check.
- **Consensus is not truth.** Four models can be wrong in the same direction. The verdict table shows what the council agreed on, not what is actually correct.
- **No follow-up threading.** One prompt, one debate, one verdict. Multi-turn refinement is not implemented in v1.

## Roadmap

- Configurable council per run (swap models from the UI)
- Multi-turn follow-ups on the same debate
- Cost tracking in the footer
- localStorage-backed session history
- Custom system prompts per model

## License

Personal project. MIT, effectively — do whatever you want, no warranty.

---

Built with [Claude Code](https://claude.ai/code) using the [pm-skills](https://github.com/phuryn/pm-skills) plugin for the PRD and risk analysis.
