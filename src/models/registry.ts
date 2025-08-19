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
    capabilities: ['text', 'reasoning'],
    description: 'State-of-the-art performance. Cost-efficient.',
    premium: false
  },
  {
    name: 'Mistral Small 3.1',
    code: 'mistral-small-latest',
    provider: 'Mistral',
    capabilities: ['text', 'reasoning', 'multimodal'],
    description: 'SOTA. Multimodal. Multilingual. Apache 2.0.',
    premium: false
  },
  {
    name: 'Codestral',
    code: 'codestral-latest',
    provider: 'Mistral',
    capabilities: ['text', 'code'],
    description: 'Lightweight, fast, proficient in 80+ programming languages.',
    premium: false
  },
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




