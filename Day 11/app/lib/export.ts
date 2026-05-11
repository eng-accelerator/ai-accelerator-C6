import type { VerdictRow } from "./council";
import { COUNCIL_MODELS } from "./models";

export type RoundState = Record<string, string>;

export function buildMarkdown(opts: {
  prompt: string;
  rounds: { label: string; outputs: RoundState }[];
  verdict: {
    rows: VerdictRow[];
    finalAnswer: string;
    triggeredRound3: boolean;
    disagreementReason: string;
  } | null;
}) {
  const { prompt, rounds, verdict } = opts;
  const lines: string[] = [];
  lines.push(`# Model Council Session`);
  lines.push("");
  lines.push(`**Timestamp:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`## Prompt`);
  lines.push("");
  lines.push(prompt);
  lines.push("");

  rounds.forEach((r) => {
    lines.push(`## ${r.label}`);
    lines.push("");
    COUNCIL_MODELS.forEach((m) => {
      const text = r.outputs[m.id];
      if (!text) return;
      lines.push(`### ${m.displayName}`);
      lines.push("");
      lines.push(text);
      lines.push("");
    });
  });

  if (verdict) {
    lines.push(`## Verdict Table`);
    lines.push("");
    lines.push(`| Model | Agree | Disagree | Confidence | Reasoning Trace |`);
    lines.push(`| --- | --- | --- | --- | --- |`);
    verdict.rows.forEach((row) => {
      const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(
        `| ${esc(row.model)} | ${esc(row.agree)} | ${esc(row.disagree)} | ${row.confidence}/5 | ${esc(row.reasoningTrace)} |`
      );
    });
    lines.push("");
    if (verdict.triggeredRound3) {
      lines.push(
        `> Round 3 was auto-triggered. Reason: ${verdict.disagreementReason}`
      );
      lines.push("");
    }
    lines.push(`## Final Verdict — Claude Opus 4.6`);
    lines.push("");
    lines.push(verdict.finalAnswer);
    lines.push("");
  }

  return lines.join("\n");
}
