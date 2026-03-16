// Only confirmed working Groq chat models as of March 2026
// Production models are stable; preview models may change
export const AVAILABLE_MODELS = [
  // ── Production ──────────────────────────────────────────────
  { id: 'llama-3.3-70b-versatile',   label: 'Llama 3.3 70B',     short: 'Llama 3.3',    tier: 'production' },
  { id: 'llama-3.1-8b-instant',      label: 'Llama 3.1 8B',      short: 'Llama 3.1',    tier: 'production' },
  { id: 'openai/gpt-oss-120b',       label: 'GPT-OSS 120B',      short: 'GPT-OSS 120B', tier: 'production' },
  { id: 'openai/gpt-oss-20b',        label: 'GPT-OSS 20B',       short: 'GPT-OSS 20B',  tier: 'production' },
  // ── Preview ─────────────────────────────────────────────────
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct',        label: 'Llama 4 Scout 17B',    short: 'L4 Scout',    tier: 'preview' },
  { id: 'qwen/qwen-3-32b',                                   label: 'Qwen 3 32B',           short: 'Qwen 3',      tier: 'preview' },
  { id: 'moonshotai/kimi-k2-instruct-0905',                  label: 'Kimi K2',              short: 'Kimi K2',     tier: 'preview' },
];

export const getModelInfo = (id) =>
  AVAILABLE_MODELS.find(m => m.id === id) || { id, label: id.split('/').pop(), short: id.split('/').pop(), tier: 'unknown' };