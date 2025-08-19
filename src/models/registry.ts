import { ModelInfo } from '../types/app';

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    name: 'Claude Haiku 3',
    code: 'claude-3-haiku-20240307',
    provider: 'Claude',
    capabilities: ['text', 'reasoning'],
    description: 'Fast, cost-effective Claude 3 Haiku model.',
    premium: false
  },
  {
    name: 'DeepSeek V3',
    code: 'DeepSeek-V3',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek chat model, strong general AI.',
    premium: false
  },
  {
    name: 'DeepSeek R1',
    code: 'DeepSeek-R1',
    provider: 'DeepSeek',
    capabilities: ['text', 'code', 'reasoning'],
    description: 'DeepSeek reasoner, optimized for reasoning.',
    premium: true
  },
  {
    name: 'Mistral Medium 3',
    code: 'mistral-medium-latest',
    provider: 'Mistral',
    source: 'Mistral',
    capabilities: ['text', 'reasoning', 'multimodal', 'agentic'],
    description: 'State-of-the-art performance. Multimodal, coding, function-calling.',
    premium: false,
    forChat: true
  },
  {
    name: 'Mistral Small 3.1',
    code: 'mistral-small-latest',
    provider: 'Mistral',
    source: 'Mistral',
    capabilities: ['text', 'reasoning', 'multimodal', 'lightweight'],
    description: 'SOTA small model. Multimodal. Multilingual. Apache 2.0.',
    premium: false,
    forChat: true
  },
  {
    name: 'Codestral',
    code: 'codestral-latest',
    provider: 'Mistral',
    source: 'Mistral',
    capabilities: ['text', 'code', 'agentic'],
    description: 'Coding specialist. Fast, proficient in 80+ languages. FIM support.',
    premium: false,
    forChat: true
  },
  // New Mistral family additions
  { name: 'Magistral Medium', code: 'magistral-medium-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'agentic'], description: 'Frontier-class reasoning model for enterprise use.', premium: false, forChat: true },
  { name: 'Devstral Medium', code: 'devstral-medium-2507', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'agentic'], description: 'Advanced coding agents: multi-file edits, tool use.', premium: false, forChat: true },
  { name: 'Mistral Large', code: 'mistral-large-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'multimodal', 'agentic'], description: 'Large model for complex multilingual reasoning.', premium: false, forChat: true },
  { name: 'Pixtral Large', code: 'pixtral-large-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['multimodal', 'text', 'reasoning'], description: 'Vision-capable large model with frontier reasoning.', premium: false, forChat: true },
  { name: 'Pixtral 12B', code: 'pixtral-12b', provider: 'Mistral', source: 'Mistral', capabilities: ['multimodal', 'text', 'lightweight'], description: '12B vision-capable small model.', premium: false, forChat: true },
  { name: 'Mistral NeMo', code: 'mistral-nemo', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'lightweight'], description: 'Code-focused open-weight model, strong multilingual.', premium: false, forChat: true },
  { name: 'Mistral Saba', code: 'mistral-saba-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Region-specialized text model (ME/SA languages).', premium: false, forChat: true },
  { name: 'Open Mistral 7B', code: 'open-mistral-7b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: '7B transformer, fast and customizable.', premium: false, forChat: true },
  { name: 'Open Mixtral 8x7B', code: 'open-mixtral-8x7b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Sparse MoE, strong general performance.', premium: false, forChat: true },
  { name: 'Open Mixtral 8x22B', code: 'open-mixtral-8x22b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Most performant open model; strong function calling.', premium: false, forChat: true },
  { name: 'Ministral 8B', code: 'ministral-8b-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: 'Edge-focused 8B model.', premium: false, forChat: true },
  { name: 'Ministral 3B', code: 'ministral-3b-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: 'Most efficient edge model.', premium: false, forChat: true },
  { name: 'Magistral Small', code: 'magistral-small-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'lightweight'], description: 'Small reasoning model, multilingual domain reasoning.', premium: false, forChat: true },
  { name: 'Devstral Small', code: 'devstral-small-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'agentic', 'lightweight'], description: 'Open coding model for agents; tools and edits.', premium: false, forChat: true },
  { name: 'Mistral Small 3.2', code: 'mistral-small-2506', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'multimodal', 'lightweight'], description: 'Updated small multimodal model (June 2025).', premium: false, forChat: true },
  { name: 'Mistral Small 3.1', code: 'mistral-small-2503', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'multimodal', 'lightweight'], description: 'Small multimodal model (Mar 2025).', premium: false, forChat: true },
  { name: 'Mistral Small 3', code: 'mistral-small-2501', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: 'Small model (Jan 2025).', premium: false, forChat: true },
  { name: 'Mistral OCR', code: 'mistral-ocr-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['ocr', 'multimodal', 'text'], description: 'Document understanding OCR API.', premium: false, forChat: false },
  { name: 'Voxtral Small', code: 'voxtral-small-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['voice', 'text', 'lightweight'], description: 'Speech/audio understanding on chat completions.', premium: false, forChat: false },
  { name: 'Voxtral Mini', code: 'voxtral-mini-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['voice', 'text', 'lightweight'], description: 'Low-latency speech recognition for edge.', premium: false, forChat: false },
  { name: 'Voxtral Mini Transcribe', code: 'voxtral-mini-2507', provider: 'Mistral', source: 'Mistral', capabilities: ['voice'], description: 'Audio input transcription via /audio/transcriptions.', premium: false, forChat: false },
  { name: 'Mistral Moderation', code: 'mistral-moderation-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['classifier'], description: 'Text content moderation classifier.', premium: false, forChat: false },
  { name: 'Codestral Embed', code: 'codestral-embed-2505', provider: 'Mistral', source: 'Mistral', capabilities: ['embedding', 'code'], description: 'Embedding model for code.', premium: false, forChat: false },
  { name: 'Mistral Embed', code: 'mistral-embed', provider: 'Mistral', source: 'Mistral', capabilities: ['embedding', 'text'], description: 'Text embedding model.', premium: false, forChat: false },
  {
    name: 'Llama 3.1 8B Instant',
    code: 'llama-3.1-8b-instant',
    provider: 'Groq',
    capabilities: ['text', 'reasoning'],
    description: 'Fast 8B model with 131K context. Great latency.',
    premium: false
  },
  {
    name: 'Llama 3.3 70B Versatile',
    code: 'llama-3.3-70b-versatile',
    provider: 'Groq',
    capabilities: ['text', 'reasoning', 'code'],
    description: 'High-quality 70B model with 131K context, 32K output.',
    premium: false
  },
  {
    name: 'GPT-OSS 20B',
    code: 'openai/gpt-oss-20b',
    provider: 'Groq',
    capabilities: ['text', 'reasoning', 'code', 'function_calling'],
    description: 'Open-weight MoE 20B, fast and cost-efficient with tool use.',
    premium: false
  },
  {
    name: 'GPT-OSS 120B',
    code: 'openai/gpt-oss-120b',
    provider: 'Groq',
    capabilities: ['text', 'reasoning', 'code', 'function_calling'],
    description: 'Flagship open-weight MoE 120B with strong reasoning and coding.',
    premium: true
  }
];

export type ModelProvider = 'DeepSeek' | 'Claude' | 'Mistral' | 'Groq';

export function getModelProvider(modelCode: string): ModelProvider {
  const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
  if (model?.provider === 'Claude') return 'Claude';
  if (model?.provider === 'Mistral') return 'Mistral';
  if (model?.provider === 'Groq') return 'Groq';
  return 'DeepSeek';
}




