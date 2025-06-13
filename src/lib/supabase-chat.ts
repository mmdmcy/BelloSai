/**
 * Supabase Chat Service
 * 
 * Handles communication with Supabase Edge Functions for AI chat
 * Includes message limits and streaming support
 */

import { supabase } from './supabase';

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

export interface ChatResponse {
  content: string;
  type: 'chunk' | 'complete';
  model?: string;
  messageCount?: number;
  messageLimit?: number;
}

export interface MessageLimitError {
  error: string;
  limit: number;
  current: number;
  subscription_tier: string;
}

export type DeepSeekModel = 'DeepSeek-V3' | 'DeepSeek-R1';

/**
 * Send messages to DeepSeek via Supabase Edge Function with streaming
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  model: DeepSeekModel,
  onChunk?: (chunk: string) => void,
  conversationId?: string
): Promise<string> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    // Call the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages,
        model,
        conversationId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle message limit error
      if (response.status === 429) {
        const limitError = errorData as MessageLimitError;
        throw new Error(`Message limit exceeded: ${limitError.current}/${limitError.limit} messages used. Upgrade your ${limitError.subscription_tier} plan for more messages.`);
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Handle streaming response
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const data: ChatResponse = JSON.parse(jsonStr);
            
            if (data.type === 'chunk' && data.content) {
              onChunk?.(data.content);
            } else if (data.type === 'complete') {
              fullResponse = data.content;
              
              // Update local message count if available
              if (data.messageCount !== undefined && data.messageLimit !== undefined) {
                // You can emit this data for UI updates
                console.log(`Message count: ${data.messageCount}/${data.messageLimit}`);
              }
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
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Get user's current message usage
 */
export async function getMessageUsage(): Promise<{
  messageCount: number;
  messageLimit: number;
  subscriptionTier: string;
} | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('message_count, message_limit, subscription_tier')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Failed to fetch message usage:', error);
      return null;
    }

    return {
      messageCount: data.message_count,
      messageLimit: data.message_limit,
      subscriptionTier: data.subscription_tier
    };

  } catch (error) {
    console.error('Error fetching message usage:', error);
    return null;
  }
}

/**
 * Check if user can send more messages
 */
export async function canSendMessage(): Promise<boolean> {
  const usage = await getMessageUsage();
  return usage ? usage.messageCount < usage.messageLimit : false;
} 