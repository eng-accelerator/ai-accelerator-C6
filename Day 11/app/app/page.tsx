"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Download } from "lucide-react";
import { RoundSection } from "@/components/RoundSection";
import { VerdictTable } from "@/components/VerdictTable";
import type { CouncilEvent, VerdictRow } from "@/lib/council";
import { buildMarkdown } from "@/lib/export";

type RoundState = {
  label: string;
  outputs: Record<string, string>;
  doneSet: Set<string>;
};

type Verdict = {
  rows: VerdictRow[];
  finalAnswer: string;
  triggeredRound3: boolean;
  disagreementReason: string;
};

const ROUND_DEFAULT_LABELS: Record<number, string> = {
  1: "Round 01 — Independent",
  2: "Round 02 — Critique & Update",
  3: "Round 03 — Final Statements",
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [forceR3, setForceR3] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Record<number, RoundState>>({});
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleEvent = useCallback((e: CouncilEvent) => {
    switch (e.type) {
      case "round_start": {
        setRounds((prev) => ({
          ...prev,
          [e.round]: {
            label: e.label,
            outputs: {},
            doneSet: new Set(),
          },
        }));
        break;
      }
      case "token": {
        setRounds((prev) => {
          const r = prev[e.round] ?? {
            label: ROUND_DEFAULT_LABELS[e.round] ?? `Round ${e.round}`,
            outputs: {},
            doneSet: new Set(),
          };
          return {
            ...prev,
            [e.round]: {
              ...r,
              outputs: {
                ...r.outputs,
                [e.modelId]: (r.outputs[e.modelId] ?? "") + e.delta,
              },
            },
          };
        });
        break;
      }
      case "model_done": {
        setRounds((prev) => {
          const r = prev[e.round];
          if (!r) return prev;
          const next = new Set(r.doneSet);
          next.add(e.modelId);
          return {
            ...prev,
            [e.round]: {
              ...r,
              outputs: { ...r.outputs, [e.modelId]: e.text },
              doneSet: next,
            },
          };
        });
        break;
      }
      case "verdict": {
        setVerdict({
          rows: e.rows,
          finalAnswer: e.finalAnswer,
          triggeredRound3: e.triggeredRound3,
          disagreementReason: e.disagreementReason,
        });
        break;
      }
      case "error": {
        setError(e.message);
        break;
      }
      case "done": {
        setRunning(false);
        break;
      }
    }
  }, []);

  const convene = async () => {
    if (!prompt.trim() || running) return;
    setError(null);
    setRounds({});
    setVerdict(null);
    setRunning(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, forceRound3: forceR3, webSearch }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try {
            const event = JSON.parse(json) as CouncilEvent;
            handleEvent(event);
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRunning(false);
    }
  };

  const orderedRounds = useMemo(
    () =>
      Object.keys(rounds)
        .map((k) => Number(k))
        .sort((a, b) => a - b),
    [rounds]
  );

  const exportMd = () => {
    const md = buildMarkdown({
      prompt,
      rounds: orderedRounds.map((n) => ({
        label: rounds[n].label,
        outputs: rounds[n].outputs,
      })),
      verdict,
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `council-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-40 pb-24">
      {/* Hero */}
      <section className="min-h-[55vh] flex flex-col justify-center">
        <div className="mono-meta text-muted mb-6">
          A debate chamber for frontier models
        </div>
        <h1
          className="headline text-[12vw] md:text-[10vw] leading-[0.85]"
          style={{ letterSpacing: "-0.05em" }}
        >
          <span className="reveal-span">
            <span style={{ animationDelay: "0ms" }}>model</span>
          </span>
          <br />
          <span className="reveal-span">
            <span style={{ animationDelay: "120ms" }}>council.</span>
          </span>
        </h1>
        <p className="mt-10 max-w-xl text-lg text-muted">
          One prompt. Four models. A structured debate. One final verdict,
          synthesized by Claude Opus 4.6.
        </p>
      </section>

      {/* Prompt bar */}
      <section className="mt-20">
        <div className="mono-meta text-muted mb-3">Prompt</div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the council anything…"
          rows={4}
          disabled={running}
          className="w-full border border-black/10 bg-white p-6 text-xl focus:outline-none focus:border-black resize-none"
          style={{ cursor: "none" }}
        />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 mono-meta text-muted">
              <input
                type="checkbox"
                checked={webSearch}
                onChange={(e) => setWebSearch(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              ⟡ Web Search
            </label>
            <label className="flex items-center gap-3 mono-meta text-muted">
              <input
                type="checkbox"
                checked={forceR3}
                onChange={(e) => setForceR3(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Force Round 3
            </label>
          </div>
          <button
            onClick={convene}
            disabled={running || !prompt.trim()}
            data-cursor-hover
            className="group flex items-center gap-3 border border-black px-8 py-4 mono-meta disabled:opacity-30"
            style={{
              transition: "all 700ms var(--ease-studio)",
            }}
          >
            {running ? "convening…" : "Convene Council"}
            <ArrowUpRight
              size={16}
              className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-700"
              style={{ transitionTimingFunction: "var(--ease-studio)" }}
            />
          </button>
        </div>
        {error && (
          <div className="mt-6 border border-black/10 p-6 text-sm">
            <div className="mono-meta text-muted mb-2">Error</div>
            <div className="whitespace-pre-wrap">{error}</div>
          </div>
        )}
      </section>

      {/* Rounds */}
      {orderedRounds.map((n) => (
        <RoundSection
          key={n}
          round={n}
          label={rounds[n].label}
          outputs={rounds[n].outputs}
          doneSet={rounds[n].doneSet}
        />
      ))}

      {/* Verdict */}
      {verdict && (
        <>
          <section className="mt-32">
            <div className="mono-meta text-muted mb-6">Verdict</div>
            <VerdictTable rows={verdict.rows} />
            {verdict.triggeredRound3 && (
              <div className="mono-meta text-muted mt-6">
                ↳ Round 3 auto-triggered — {verdict.disagreementReason}
              </div>
            )}
          </section>

          <section className="mt-32">
            <div className="mono-meta text-muted mb-6">
              Final Verdict — Claude Opus 4.6
            </div>
            <div className="headline text-3xl md:text-5xl max-w-4xl whitespace-pre-wrap">
              {verdict.finalAnswer}
            </div>
          </section>

          <section className="mt-20">
            <button
              onClick={exportMd}
              data-cursor-hover
              className="group flex items-center gap-3 border border-black px-8 py-4 mono-meta"
            >
              <Download size={16} />
              Export Markdown
            </button>
          </section>
        </>
      )}
    </div>
  );
}
