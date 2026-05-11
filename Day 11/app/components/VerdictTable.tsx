"use client";

import type { VerdictRow } from "@/lib/council";

export function VerdictTable({ rows }: { rows: VerdictRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="mono-meta text-muted">
        verdict table unavailable — synthesizer parse failed
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black/10">
            <th className="mono-meta text-left py-4 pr-4 text-muted">Model</th>
            <th className="mono-meta text-left py-4 pr-4 text-muted">Agree</th>
            <th className="mono-meta text-left py-4 pr-4 text-muted">
              Disagree
            </th>
            <th className="mono-meta text-left py-4 pr-4 text-muted">Conf</th>
            <th className="mono-meta text-left py-4 text-muted">
              Reasoning Trace
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.modelId}
              data-cursor-hover
              className="studio-card border-b border-black/10 align-top"
            >
              <td className="py-6 pr-4 headline text-xl min-w-[180px]">
                {r.model}
              </td>
              <td className="py-6 pr-4 text-sm leading-relaxed max-w-[260px]">
                {r.agree}
              </td>
              <td className="py-6 pr-4 text-sm leading-relaxed max-w-[260px]">
                {r.disagree}
              </td>
              <td className="py-6 pr-4 headline text-2xl">{r.confidence}/5</td>
              <td className="py-6 text-sm leading-relaxed max-w-[400px]">
                {r.reasoningTrace}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
