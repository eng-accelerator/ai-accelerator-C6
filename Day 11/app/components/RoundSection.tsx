"use client";

import { COUNCIL_MODELS } from "@/lib/models";
import { ModelCard } from "./ModelCard";

const VARIANTS = ["a", "b", "c", "d"] as const;

export function RoundSection({
  round,
  label,
  outputs,
  doneSet,
}: {
  round: number;
  label: string;
  outputs: Record<string, string>;
  doneSet: Set<string>;
}) {
  return (
    <section className="mt-32">
      <div className="mono-meta text-muted mb-6">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COUNCIL_MODELS.map((m, i) => (
          <ModelCard
            key={m.id}
            model={m}
            text={outputs[m.id] ?? ""}
            variant={VARIANTS[i]}
            round={round}
            done={doneSet.has(m.id)}
          />
        ))}
      </div>
    </section>
  );
}
