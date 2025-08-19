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
    forChat: true,
    inputPricePerMTokens: 0.4,
    outputPricePerMTokens: 2,
    supportsWebSearch: true
  },
  {
    name: 'Mistral Small 3.1',
    code: 'mistral-small-latest',
    provider: 'Mistral',
    source: 'Mistral',
    capabilities: ['text', 'reasoning', 'multimodal', 'lightweight'],
    description: 'SOTA small model. Multimodal. Multilingual. Apache 2.0.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.3,
    supportsWebSearch: true
  },
  {
    name: 'Codestral',
    code: 'codestral-latest',
    provider: 'Mistral',
    source: 'Mistral',
    capabilities: ['text', 'code', 'agentic'],
    description: 'Coding specialist. Fast, proficient in 80+ languages. FIM support.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.2,
    outputPricePerMTokens: 0.6,
    supportsWebSearch: false
  },
  // New Mistral family additions
  { name: 'Magistral Medium', code: 'magistral-medium-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'agentic'], description: 'Frontier-class reasoning model for enterprise use.', premium: false, forChat: true, inputPricePerMTokens: 2, outputPricePerMTokens: 5, supportsWebSearch: true },
  { name: 'Devstral Medium', code: 'devstral-medium-2507', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'agentic'], description: 'Advanced coding agents: multi-file edits, tool use.', premium: false, forChat: true },
  { name: 'Mistral Large', code: 'mistral-large-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'multimodal', 'agentic'], description: 'Large model for complex multilingual reasoning.', premium: false, forChat: true, inputPricePerMTokens: 2, outputPricePerMTokens: 6, supportsWebSearch: true },
  { name: 'Pixtral Large', code: 'pixtral-large-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['multimodal', 'text', 'reasoning'], description: 'Vision-capable large model with frontier reasoning.', premium: false, forChat: true, inputPricePerMTokens: 2, outputPricePerMTokens: 6 },
  { name: 'Pixtral 12B', code: 'pixtral-12b', provider: 'Mistral', source: 'Mistral', capabilities: ['multimodal', 'text', 'lightweight'], description: '12B vision-capable small model.', premium: false, forChat: true, inputPricePerMTokens: 0.15, outputPricePerMTokens: 0.15 },
  { name: 'Mistral NeMo', code: 'mistral-nemo', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'lightweight'], description: 'Code-focused open-weight model, strong multilingual.', premium: false, forChat: true },
  { name: 'Mistral Saba', code: 'mistral-saba-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Region-specialized text model (ME/SA languages).', premium: false, forChat: true },
  { name: 'Open Mistral 7B', code: 'open-mistral-7b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: '7B transformer, fast and customizable.', premium: false, forChat: true, inputPricePerMTokens: 0.25, outputPricePerMTokens: 0.25 },
  { name: 'Open Mixtral 8x7B', code: 'open-mixtral-8x7b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Sparse MoE, strong general performance.', premium: false, forChat: true, inputPricePerMTokens: 0.7, outputPricePerMTokens: 0.7 },
  { name: 'Open Mixtral 8x22B', code: 'open-mixtral-8x22b', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning'], description: 'Most performant open model; strong function calling.', premium: false, forChat: true, inputPricePerMTokens: 2, outputPricePerMTokens: 6 },
  { name: 'Ministral 8B', code: 'ministral-8b-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: 'Edge-focused 8B model.', premium: false, forChat: true },
  { name: 'Ministral 3B', code: 'ministral-3b-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'lightweight'], description: 'Most efficient edge model.', premium: false, forChat: true },
  { name: 'Magistral Small', code: 'magistral-small-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'reasoning', 'lightweight'], description: 'Small reasoning model, multilingual domain reasoning.', premium: false, forChat: true },
  { name: 'Devstral Small', code: 'devstral-small-latest', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'code', 'agentic', 'lightweight'], description: 'Open coding model for agents; tools and edits.', premium: false, forChat: true },
  { name: 'Mistral Small 3.2', code: 'mistral-small-2506', provider: 'Mistral', source: 'Mistral', capabilities: ['text', 'multimodal', 'lightweight'], description: 'Updated small multimodal model (June 2025).', premium: false, forChat: true, inputPricePerMTokens: 0.1, outputPricePerMTokens: 0.3 },
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
  ,
  // Qwen (Alibaba Cloud) - best & cheapest latest chat models
  {
    name: 'Qwen Max',
    code: 'qwen-max',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'reasoning', 'agentic'],
    description: 'Flagship Qwen for complex, multi-step tasks.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 1.6,
    outputPricePerMTokens: 6.4,
    supportsWebSearch: true
  },
  {
    name: 'Qwen Plus',
    code: 'qwen-plus',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'reasoning', 'agentic'],
    description: 'Balanced performance, speed, and price. Supports thinking and non-thinking modes.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.4,
    outputPricePerMTokens: 1.2,
    pricingNotes: 'Tiered by input length; thinking mode output up to $4/M.',
    supportsWebSearch: true
  },
  {
    name: 'Qwen Flash',
    code: 'qwen-flash',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'lightweight'],
    description: 'Fastest and most price-efficient for simple jobs.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.05,
    outputPricePerMTokens: 0.4,
    pricingNotes: 'Tiered by input length; up to 1M context.',
    supportsWebSearch: true
  },
  {
    name: 'Qwen Turbo',
    code: 'qwen-turbo',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'lightweight'],
    description: 'Cost-effective general model (superseded by Flash for newest).',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.05,
    outputPricePerMTokens: 0.2,
    pricingNotes: 'Thinking mode output around $0.5/M.',
    supportsWebSearch: true
  },
  {
    name: 'QwQ Plus (Reasoning)',
    code: 'qwq-plus',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'reasoning'],
    description: 'Reinforcement-learned reasoning model with strong math/code.',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.8,
    outputPricePerMTokens: 2.4,
    supportsWebSearch: true
  },
  {
    name: 'Qwen VL Plus',
    code: 'qwen-vl-plus',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'multimodal', 'ocr'],
    description: 'Multimodal visual understanding with OCR; supports images.',
    premium: false,
    forChat: false,
    inputPricePerMTokens: 0.21,
    outputPricePerMTokens: 0.63,
    pricingNotes: 'Image/video tokens billed; up to 16k tokens per image.'
  },
  // Qwen3 snapshot models (chat)
  {
    name: 'Qwen3 235B Thinking (2507)',
    code: 'qwen3-235b-a22b-thinking-2507',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'reasoning', 'agentic'],
    description: 'Qwen3 thinking-only snapshot (Jul 2025).',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.7,
    outputPricePerMTokens: 8.4,
    supportsWebSearch: true
  },
  {
    name: 'Qwen3 235B Instruct (2507)',
    code: 'qwen3-235b-a22b-instruct-2507',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text'],
    description: 'Qwen3 non-thinking snapshot (Jul 2025).',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.7,
    outputPricePerMTokens: 2.8,
    supportsWebSearch: true
  },
  {
    name: 'Qwen3 30B Thinking (2507)',
    code: 'qwen3-30b-a3b-thinking-2507',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'reasoning'],
    description: 'Qwen3 30B thinking-only snapshot (Jul 2025).',
    premium: false,
    forChat: true,
    inputPricePerMTokens: 0.2,
    outputPricePerMTokens: 2.4,
    supportsWebSearch: true
  },
  {
    name: 'Qwen3 30B Instruct (2507)',
    code: 'qwen3-30b-a3b-instruct-2507',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text'],
    description: 'Qwen3 30B non-thinking snapshot (Jul 2025).',
    premium: false,
    forChat: true,
    pricingNotes: 'Output price not specified in provided sheet; refer to Model Studio.',
    supportsWebSearch: true
  },
  // Qwen3 Coder
  {
    name: 'Qwen3 Coder Plus',
    code: 'qwen3-coder-plus',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'code', 'agentic'],
    description: 'Qwen3 code model (tiered pricing; cache discounts).',
    premium: false,
    forChat: true,
    pricingNotes: 'Tiered; cached input up to 75% off during promo.',
    supportsWebSearch: true
  },
  {
    name: 'Qwen3 Coder Flash',
    code: 'qwen3-coder-flash',
    provider: 'Qwen',
    source: 'Alibaba Cloud',
    capabilities: ['text', 'code', 'lightweight'],
    description: 'Qwen3 coder flash (tiered pricing).',
    premium: false,
    forChat: true,
    supportsWebSearch: true
  }
];

export type ModelProvider = 'DeepSeek' | 'Claude' | 'Mistral' | 'Groq' | 'Qwen';

export function getModelProvider(modelCode: string): ModelProvider {
  const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
  if (model?.provider === 'Claude') return 'Claude';
  if (model?.provider === 'Mistral') return 'Mistral';
  if (model?.provider === 'Groq') return 'Groq';
  if (model?.provider === 'Qwen') return 'Qwen';
  return 'DeepSeek';
}




