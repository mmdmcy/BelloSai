export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  model?: string;
}

export interface CustomizationSettings {
  showQuestions: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  gradientEnabled: boolean;
  gradientColors: string[];
  selectedTheme: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColors: string[];
  gradientEnabled: boolean;
  fontFamily: string;
  borderRadius: string;
  shadows: boolean;
  glassEffect: boolean;
  retroMode: boolean;
}

export interface ModelCapability {
  key: string;
  label: string;
  icon: string;
}

export interface ModelInfo {
  name: string;
  code: string;
  provider: 'DeepSeek' | 'Claude' | 'Mistral' | 'Groq' | 'Qwen';
  source?: string; // e.g., Meta, OpenAI, Mistral
  capabilities: string[];
  description?: string;
  premium?: boolean;
  forChat?: boolean; // filter flag for chat selector visibility
  inputPricePerMTokens?: number; // USD
  outputPricePerMTokens?: number; // USD
  pricingNotes?: string;
  supportsWebSearch?: boolean;
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  text: { key: 'text', label: 'Text', icon: 'FileText' },
  image: { key: 'image', label: 'Image', icon: 'Image' },
  audio: { key: 'audio', label: 'Audio', icon: 'Mic' },
  video: { key: 'video', label: 'Video', icon: 'Video' },
  code: { key: 'code', label: 'Code', icon: 'Code' },
  function_calling: { key: 'function_calling', label: 'Function Calling', icon: 'FunctionSquare' },
  caching: { key: 'caching', label: 'Caching', icon: 'Database' },
  structured_outputs: { key: 'structured_outputs', label: 'Structured Output', icon: 'ListChecks' },
  search: { key: 'search', label: 'Search', icon: 'Globe' },
  tuning: { key: 'tuning', label: 'Tuning', icon: 'SlidersHorizontal' },
  reasoning: { key: 'reasoning', label: 'Reasoning', icon: 'Brain' },
  multimodal: { key: 'multimodal', label: 'Multimodal', icon: 'Image' },
  ocr: { key: 'ocr', label: 'OCR', icon: 'ScanText' },
  voice: { key: 'voice', label: 'Voice', icon: 'Mic' },
  embedding: { key: 'embedding', label: 'Embedding', icon: 'Database' },
  classifier: { key: 'classifier', label: 'Classifier', icon: 'ShieldCheck' },
  agentic: { key: 'agentic', label: 'Agentic', icon: 'Workflow' },
  lightweight: { key: 'lightweight', label: 'Lightweight', icon: 'Feather' },
};




