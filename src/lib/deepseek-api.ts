/**
 * DeepSeek API Integration Service
 * 
 * Provides interface for communicating with DeepSeek AI models
 * Supports both deepseek-chat (V3) and deepseek-reasoner (R1) models
 * with streaming responses
 */

const DEEPSEEK_API_KEY = 'sk-fbb7da173a5f49fba390704359b035fc';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export const DEEPSEEK_MODELS = {
  'DeepSeek-V3': 'deepseek-chat',
  'DeepSeek-R1': 'deepseek-reasoner'
} as const;

export type DeepSeekModelName = keyof typeof DEEPSEEK_MODELS;

/**
 * Send a message to DeepSeek API with streaming response
 */
export async function sendToDeepSeek(
  messages: DeepSeekMessage[],
  model: DeepSeekModelName,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const modelId = DEEPSEEK_MODELS[model];
  
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const data: DeepSeekStreamChunk = JSON.parse(jsonStr);
            
            const content = data.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk?.(content);
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError);
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error(`Failed to get response from DeepSeek: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a conversation context for DeepSeek
 * Converts our app messages to DeepSeek format
 */
export function createDeepSeekContext(chatMessages: Array<{ type: 'user' | 'ai'; content: string }>): DeepSeekMessage[] {
  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When showing code, use proper markdown formatting with language-specific code blocks.'
    }
  ];

  // Convert chat messages to DeepSeek format
  for (const msg of chatMessages) {
    messages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  return messages;
}

/**
 * Test DeepSeek API connection
 */
export async function testDeepSeekConnection(): Promise<boolean> {
  try {
    const testMessages: DeepSeekMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello" to test the connection.' }
    ];

    await sendToDeepSeek(testMessages, 'DeepSeek-V3');
    return true;
  } catch (error) {
    console.error('DeepSeek connection test failed:', error);
    return false;
  }
} 