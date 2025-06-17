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
  console.log('🎯 sendChatMessage function called');
  console.log('📥 Parameters:', { messages, model, conversationId, onChunk: !!onChunk });
  
  let abortController: AbortController | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    console.log('🚀 Starting chat message request:', { messages, model, conversationId });
    
    // Get current session (optional for anonymous users)
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Session check:', { session: !!session, error: sessionError });
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }
    
    let authHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (session) {
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
      
      // Add authorization header for authenticated users
      if (session) {
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
    } else {
      console.log('🔓 No session found - proceeding as anonymous user');
      // Add anon key for anonymous users
      authHeaders['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
    }

    // Call the Edge Function
    console.log('🌍 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
    console.log('📡 Calling Edge Function:', url);
    
    console.log('📤 Request payload:', { messages, model, conversationId });
    
    abortController = new AbortController();
    timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after 90 seconds');
      abortController?.abort();
    }, 90000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        messages,
        model,
        conversationId
      }),
      signal: abortController.signal
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

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
    let hasStartedStreaming = false;
    let streamTimeout: NodeJS.Timeout | null = null;

    const resetStreamTimeout = () => {
      if (streamTimeout) {
        clearTimeout(streamTimeout);
      }
      streamTimeout = setTimeout(() => {
        console.error('⏰ Stream timeout - no data received for 30 seconds');
        reader.cancel();
      }, 30000);
    };

    try {
      resetStreamTimeout();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming completed');
          break;
        }

        // Reset timeout on each chunk
        resetStreamTimeout();

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove "data: " prefix
            const data: ChatResponse = JSON.parse(jsonStr);
            console.log('📝 Parsed data:', data);
            
            if (data.type === 'chunk' && data.content) {
              hasStartedStreaming = true;
              fullResponse += data.content;
              onChunk?.(data.content);
            } else if (data.type === 'complete') {
              // Use the complete response from server if available
              if (data.content && data.content.trim() !== '') {
                fullResponse = data.content;
              }
              
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

      if (streamTimeout) {
        clearTimeout(streamTimeout);
      }

      if (!hasStartedStreaming) {
        throw new Error('No streaming data received from AI service');
      }

      console.log('📝 Final fullResponse length:', fullResponse?.length || 0);
      
      if (!fullResponse || fullResponse.trim() === '') {
        throw new Error('Empty response received from AI service');
      }

      return fullResponse;

    } finally {
      if (streamTimeout) {
        clearTimeout(streamTimeout);
      }
      reader.releaseLock();
    }

  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (abortController) {
      abortController.abort();
    }
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