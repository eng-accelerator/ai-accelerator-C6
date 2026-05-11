import OpenAI from "openai";
import { COUNCIL_MODELS, CouncilModel, SYNTHESIZER } from "./models";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "sk-or-v1-REPLACE_ME") {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to app/.env.local and restart `npm run dev`."
    );
  }
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "Model Council",
    },
  });
}

export type RoundOutput = {
  modelId: string;
  text: string;
};

export type CouncilEvent =
  | { type: "round_start"; round: number; label: string }
  | { type: "token"; round: number; modelId: string; delta: string }
  | { type: "model_done"; round: number; modelId: string; text: string }
  | { type: "round_end"; round: number }
  | {
      type: "verdict";
      rows: VerdictRow[];
      finalAnswer: string;
      triggeredRound3: boolean;
      disagreementReason: string;
    }
  | { type: "error"; message: string }
  | { type: "done" };

export type VerdictRow = {
  modelId: string;
  model: string;
  agree: string;
  disagree: string;
  confidence: number;
  reasoningTrace: string;
};

const ROUND_1_SYSTEM = `You are a participant in a structured debate among four frontier AI models. This is Round 1: INDEPENDENT ANSWERS. You have not yet seen any other model's response.

Answer the user's prompt directly, clearly, and with your own reasoning. Be specific. State your confidence at the end on a scale of 1-5 (1 = guessing, 5 = near-certain).`;

const ROUND_2_SYSTEM = `You are a participant in a structured debate among four frontier AI models. This is Round 2: CRITIQUE & UPDATE.

You have seen the other three models' Round 1 answers. Your task:
1. Briefly note where you AGREE with the others.
2. Clearly identify where you DISAGREE and why.
3. Update your own answer if the others have made valid points — but only if you actually find them convincing. Do not capitulate for politeness.

Finish with your updated confidence (1-5).`;

const ROUND_3_SYSTEM = `You are a participant in a structured debate among four frontier AI models. This is Round 3: FINAL STATEMENT. Round 3 was auto-triggered because significant disagreement remained after Round 2.

Write your FINAL position. Be concise. Include:
1. Your final answer.
2. The one disagreement you still hold, and why you hold it.
3. Your final confidence (1-5).`;

const SYNTHESIZER_SYSTEM = `You are the synthesizer judge for a multi-model debate (Claude Opus 4.6). You have seen every model's contribution across all rounds.

Your task: produce a verdict. Respond ONLY with a single JSON object (no prose, no markdown fences) matching this schema:

{
  "rows": [
    {
      "modelId": "sonnet" | "gpt5" | "gemini" | "grok",
      "model": "display name",
      "agree": "1-2 sentence summary of what this model agreed with",
      "disagree": "1-2 sentence summary of where this model held its ground",
      "confidence": 1-5,
      "reasoningTrace": "2-3 sentences describing the arc of this model's argument across rounds"
    }
  ],
  "finalAnswer": "The synthesized final answer in 1-3 paragraphs. Pick sides where the evidence is clear. Call out remaining open questions honestly."
}

Be fair. Do not favor Claude Sonnet just because Anthropic also made you. If you disagree with the majority, say so in finalAnswer.`;

const DISAGREEMENT_CHECK_SYSTEM = `You are a brief debate referee. You will see four models' Round 2 updated answers to the same prompt. Decide whether unresolved substantive disagreement remains.

Respond ONLY with a single JSON object:
{ "disagree": true | false, "reason": "one short sentence" }

Rule: return true only if at least two pairs of models substantively disagree on the answer (not stylistic, not hedging). Otherwise false.`;

function formatOthers(round1: RoundOutput[], selfId: string): string {
  return round1
    .filter((r) => r.modelId !== selfId)
    .map((r) => {
      const m = COUNCIL_MODELS.find((c) => c.id === r.modelId)!;
      return `### ${m.displayName} (${m.provider})\n\n${r.text}`;
    })
    .join("\n\n---\n\n");
}

function formatAllRounds(
  prompt: string,
  r1: RoundOutput[],
  r2: RoundOutput[],
  r3: RoundOutput[] | null
): string {
  const section = (title: string, outs: RoundOutput[]) =>
    `## ${title}\n\n` +
    outs
      .map((r) => {
        const m = COUNCIL_MODELS.find((c) => c.id === r.modelId)!;
        return `### ${m.displayName}\n\n${r.text}`;
      })
      .join("\n\n");

  return (
    `# Original Prompt\n\n${prompt}\n\n` +
    section("Round 1 — Independent", r1) +
    "\n\n" +
    section("Round 2 — Critique & Update", r2) +
    (r3 ? "\n\n" + section("Round 3 — Final Statements", r3) : "")
  );
}

async function streamOne(
  client: OpenAI,
  model: CouncilModel,
  systemPrompt: string,
  userPrompt: string,
  round: number,
  webSearch: boolean,
  onEvent: (e: CouncilEvent) => void
): Promise<RoundOutput> {
  try {
    const stream = await client.chat.completions.create({
      model: webSearch ? `${model.slug}:online` : model.slug,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        full += delta;
        onEvent({ type: "token", round, modelId: model.id, delta });
      }
    }
    onEvent({ type: "model_done", round, modelId: model.id, text: full });
    return { modelId: model.id, text: full };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const failText = `[${model.displayName} failed: ${msg}]`;
    onEvent({ type: "model_done", round, modelId: model.id, text: failText });
    return { modelId: model.id, text: failText };
  }
}

async function runRound(
  client: OpenAI,
  round: number,
  label: string,
  systemFor: (m: CouncilModel) => string,
  userFor: (m: CouncilModel) => string,
  webSearch: boolean,
  onEvent: (e: CouncilEvent) => void
): Promise<RoundOutput[]> {
  onEvent({ type: "round_start", round, label });
  const results = await Promise.all(
    COUNCIL_MODELS.map((m) =>
      streamOne(client, m, systemFor(m), userFor(m), round, webSearch, onEvent)
    )
  );
  onEvent({ type: "round_end", round });
  return results;
}

async function checkDisagreement(
  client: OpenAI,
  prompt: string,
  r2: RoundOutput[]
): Promise<{ disagree: boolean; reason: string }> {
  try {
    const content = `# Prompt\n${prompt}\n\n# Round 2 Updated Answers\n\n${formatOthers(
      r2,
      "__none__"
    )}`;
    const res = await client.chat.completions.create({
      model: SYNTHESIZER.slug,
      messages: [
        { role: "system", content: DISAGREEMENT_CHECK_SYSTEM },
        { role: "user", content },
      ],
      response_format: { type: "json_object" } as never,
    });
    const text = res.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return {
      disagree: !!parsed.disagree,
      reason: parsed.reason ?? "",
    };
  } catch (err) {
    return {
      disagree: false,
      reason: `disagreement check failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

async function synthesize(
  client: OpenAI,
  prompt: string,
  r1: RoundOutput[],
  r2: RoundOutput[],
  r3: RoundOutput[] | null
): Promise<{ rows: VerdictRow[]; finalAnswer: string }> {
  const user =
    `Original prompt:\n\n${prompt}\n\n` +
    `All debate rounds:\n\n${formatAllRounds(prompt, r1, r2, r3)}`;

  const tryOnce = async () => {
    const res = await client.chat.completions.create({
      model: SYNTHESIZER.slug,
      messages: [
        { role: "system", content: SYNTHESIZER_SYSTEM },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" } as never,
    });
    const text = res.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(text);
  };

  let parsed: { rows?: VerdictRow[]; finalAnswer?: string } = {};
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      parsed = await tryOnce();
      if (Array.isArray(parsed.rows) && typeof parsed.finalAnswer === "string") {
        break;
      }
    } catch {
      // retry
    }
  }

  const rows: VerdictRow[] = (parsed.rows ?? []).map((r) => ({
    modelId: r.modelId,
    model: r.model ?? r.modelId,
    agree: r.agree ?? "",
    disagree: r.disagree ?? "",
    confidence: Number(r.confidence) || 0,
    reasoningTrace: r.reasoningTrace ?? "",
  }));

  return {
    rows,
    finalAnswer: parsed.finalAnswer ?? "[Synthesizer failed to produce a final answer.]",
  };
}

export async function runCouncil(
  prompt: string,
  forceRound3: boolean,
  webSearch: boolean,
  onEvent: (e: CouncilEvent) => void
) {
  const client = getClient();

  // Round 1
  const r1 = await runRound(
    client,
    1,
    webSearch ? "Round 01 — Independent ⟡ web" : "Round 01 — Independent",
    () => ROUND_1_SYSTEM,
    () => prompt,
    webSearch,
    onEvent
  );

  // Round 2 — critique only needs web search for fresh facts if the debate is time-sensitive
  const r2 = await runRound(
    client,
    2,
    webSearch ? "Round 02 — Critique & Update ⟡ web" : "Round 02 — Critique & Update",
    () => ROUND_2_SYSTEM,
    (m) =>
      `Original prompt:\n\n${prompt}\n\n---\n\nYour own Round 1 answer:\n\n${
        r1.find((r) => r.modelId === m.id)?.text ?? ""
      }\n\n---\n\nThe other models' Round 1 answers:\n\n${formatOthers(r1, m.id)}`,
    webSearch,
    onEvent
  );

  // Round 3 trigger
  const check = forceRound3
    ? { disagree: true, reason: "forced by user" }
    : await checkDisagreement(client, prompt, r2);

  let r3: RoundOutput[] | null = null;
  if (check.disagree) {
    r3 = await runRound(
      client,
      3,
      webSearch ? "Round 03 — Final Statements ⟡ web" : "Round 03 — Final Statements",
      () => ROUND_3_SYSTEM,
      (m) =>
        `Original prompt:\n\n${prompt}\n\n---\n\nYour Round 2 answer:\n\n${
          r2.find((r) => r.modelId === m.id)?.text ?? ""
        }\n\n---\n\nThe other models' Round 2 answers:\n\n${formatOthers(r2, m.id)}`,
      webSearch,
      onEvent
    );
  }

  // Synthesis
  const { rows, finalAnswer } = await synthesize(client, prompt, r1, r2, r3);
  onEvent({
    type: "verdict",
    rows,
    finalAnswer,
    triggeredRound3: !!r3,
    disagreementReason: check.reason,
  });
  onEvent({ type: "done" });
}
