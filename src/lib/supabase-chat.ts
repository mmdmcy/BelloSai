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
    console.log('🚀 Starting chat message request:', { messages, model, conversationId });
    
    // Get current session
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Session check:', { session: !!session, error: sessionError });
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }
    
    if (!session) {
      console.error('❌ No session found');
      throw new Error('Please log in to continue');
    }
    
    console.log('✅ Authentication successful, user:', session.user.email);
    console.log('🔑 Access token length:', session.access_token.length);
    console.log('⏰ Token expires at:', new Date(session.expires_at! * 1000));

    // Check if token is expired and refresh if needed
    const now = Date.now() / 1000;
    if (session.expires_at && session.expires_at < now) {
      console.log('🔄 Token expired, refreshing...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('❌ Failed to refresh token:', refreshError);
        throw new Error('Session expired. Please log in again.');
      }
      
      // Use the refreshed session
      session = refreshData.session;
      console.log('✅ Token refreshed successfully');
    }

    // Call the Edge Function
    console.log('🌍 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
    console.log('📡 Calling Edge Function:', url);
    
    console.log('📤 Request payload:', { messages, model, conversationId });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages,
        model,
        conversationId
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log('📨 Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Edge Function error:', errorData);
      
      // Handle message limit error
      if (response.status === 429) {
        const limitError = errorData as MessageLimitError;
        throw new Error(`Message limit exceeded: ${limitError.current}/${limitError.limit} messages used. Upgrade your ${limitError.subscription_tier} plan for more messages.`);
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Handle streaming response
    if (!response.body) {
      console.error('❌ No response body from Edge Function');
      throw new Error('No response body');
    }

    console.log('🌊 Starting to read streaming response...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Received chunk:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const data: ChatResponse = JSON.parse(jsonStr);
            console.log('📝 Parsed data:', data);
            
            if (data.type === 'chunk' && data.content) {
              onChunk?.(data.content);
            } else if (data.type === 'complete') {
              fullResponse = data.content;
              
              // Update local message count if available
              if (data.messageCount !== undefined && data.messageLimit !== undefined) {
                console.log(`📊 Message count: ${data.messageCount}/${data.messageLimit}`);
              }
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse streaming chunk:', parseError, 'Line:', line);
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