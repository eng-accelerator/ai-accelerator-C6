import { COUNCIL_MODELS, SYNTHESIZER } from "@/lib/models";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white mt-32">
      <div className="max-w-[1600px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <h2 className="headline text-5xl md:text-7xl">
            model
            <br />
            council
          </h2>
          <p className="mt-8 max-w-md text-white/70 text-sm leading-relaxed">
            A debate chamber for frontier models. One prompt. Four voices. One
            verdict.
          </p>
        </div>
        <div>
          <div className="mono-meta text-white/40 mb-6">Council</div>
          <ul className="space-y-3">
            {COUNCIL_MODELS.map((m) => (
              <li key={m.id} className="text-base">
                {m.displayName}
              </li>
            ))}
            <li className="text-white/40 text-sm pt-2">
              synth — {SYNTHESIZER.displayName}
            </li>
          </ul>
        </div>
        <div>
          <div className="mono-meta text-white/40 mb-6">Meta</div>
          <ul className="space-y-3 text-base">
            <li>v0.1 — skeleton</li>
            <li>openrouter</li>
            <li>localhost</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between text-sm text-white/50">
          <span>© {new Date().getFullYear()} — Personal build</span>
          <span>Bold Editorial Studio</span>
        </div>
      </div>
    </footer>
  );
}
