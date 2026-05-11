export type CouncilModel = {
  id: string;
  slug: string;
  displayName: string;
  provider: string;
  shortLabel: string;
};

export const COUNCIL_MODELS: CouncilModel[] = [
  {
    id: "sonnet",
    slug: "anthropic/claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    provider: "Anthropic",
    shortLabel: "sonnet",
  },
  {
    id: "gpt5",
    slug: "openai/gpt-5",
    displayName: "GPT-5",
    provider: "OpenAI",
    shortLabel: "gpt-5",
  },
  {
    id: "gemini",
    slug: "google/gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro",
    provider: "Google",
    shortLabel: "gemini",
  },
  {
    id: "grok",
    slug: "x-ai/grok-4.20",
    displayName: "Grok 4.20",
    provider: "xAI",
    shortLabel: "grok",
  },
];

export const SYNTHESIZER: CouncilModel = {
  id: "opus",
  slug: "anthropic/claude-opus-4.6",
  displayName: "Claude Opus 4.6",
  provider: "Anthropic",
  shortLabel: "opus",
};

export const MODEL_BY_ID = Object.fromEntries(
  [...COUNCIL_MODELS, SYNTHESIZER].map((m) => [m.id, m])
) as Record<string, CouncilModel>;
