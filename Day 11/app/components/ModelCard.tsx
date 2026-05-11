"use client";

import type { CouncilModel } from "@/lib/models";

type Props = {
  model: CouncilModel;
  text: string;
  variant: "a" | "b" | "c" | "d";
  round: number;
  done: boolean;
};

const RADIUS_BY_VARIANT: Record<Props["variant"], string> = {
  a: "rounded-tl-[100px] rounded-br-[8px]",
  b: "rounded-tr-[100px] rounded-bl-[40px]",
  c: "rounded-[40px]",
  d: "rounded-tr-[100px] rounded-bl-[8px]",
};

export function ModelCard({ model, text, variant, round, done }: Props) {
  return (
    <article
      data-cursor-hover
      className={`studio-card relative flex flex-col border border-black/10 bg-white overflow-hidden ${RADIUS_BY_VARIANT[variant]}`}
      style={{ transition: "all 700ms var(--ease-studio)" }}
    >
      <header className="flex items-start justify-between p-6 border-b border-black/10">
        <div>
          <div className="mono-meta text-muted">{model.provider}</div>
          <h3 className="headline text-2xl mt-1">{model.displayName}</h3>
        </div>
        <div className="mono-meta text-muted">
          R{round.toString().padStart(2, "0")}
          {done ? " ●" : " ○"}
        </div>
      </header>
      <div className="flex-1 p-6 min-h-[240px]">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {text || (
            <span className="text-muted italic">awaiting tokens…</span>
          )}
        </p>
      </div>
    </article>
  );
}
