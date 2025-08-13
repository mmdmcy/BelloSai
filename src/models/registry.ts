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
  }
];

export type ModelProvider = 'DeepSeek' | 'Claude' | 'Mistral';

export function getModelProvider(modelCode: string): ModelProvider {
  const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
  if (model?.provider === 'Claude') return 'Claude';
  if (model?.provider === 'Mistral') return 'Mistral';
  return 'DeepSeek';
}


