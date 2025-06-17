/**
 * Supabase Chat Service
 * 
 * Handles communication with Supabase Edge Functions for AI chat
 * Includes message limits and streaming support
 */

import { supabase } from './supabase';
import { AVAILABLE_MODELS, ModelInfo } from '../App';

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

export type ModelProvider = 'DeepSeek' | 'Gemini';

function getModelProvider(modelCode: string): ModelProvider {
  const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
  return model?.provider === 'Gemini' ? 'Gemini' : 'DeepSeek';
}

/**
 * Send messages to DeepSeek via Supabase Edge Function with streaming
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  modelCode: string,
  onChunk?: (chunk: string) => void,
  conversationId?: string,
  retryCount: number = 0
): Promise<string> {
  console.log('🎯 sendChatMessage function called');
  console.log('📥 Parameters:', { messages, model: modelCode, conversationId, onChunk: !!onChunk, retryCount });
  
  let abortController: AbortController | null = null;
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    console.log('🚀 Starting chat message request:', { messages, model: modelCode, conversationId });
    
    // Get current session (optional for anonymous users)
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Session check:', { session: !!session, error: sessionError });
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      
      // If session error and we haven't retried yet, try to refresh session
      if (retryCount === 0) {
        console.log('🔄 Attempting to refresh session and retry...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            console.log('✅ Session refreshed, retrying request...');
            return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh session:', refreshError);
        }
      }
      
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

    // Kies juiste edge function
    const provider = getModelProvider(modelCode);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${provider === 'Gemini' ? 'gemini-chat' : 'deepseek-chat'}`;
    console.log('📡 Calling Edge Function:', url);
    
    abortController = new AbortController();
    timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after 120 seconds');
      abortController?.abort();
    }, 120000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        messages,
        model: modelCode,
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
      
      // Handle specific error types with retry logic
      if (response.status === 429) {
        // Rate limit - don't retry, just show message
        let msg = 'Je hebt het maximum aantal verzoeken bereikt. Wacht even en probeer het opnieuw.';
        if (errorData && errorData.error && errorData.error.toLowerCase().includes('rate')) {
          msg = errorData.error;
        }
        throw new Error(msg);
      }
      
      if (response.status === 408) {
        // Timeout error - retry once if we haven't already
        if (retryCount === 0) {
          console.log('🔄 Got timeout error, retrying once...');
          return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
        } else {
          throw new Error('Request timeout - AI service took too long to respond. Probeer het opnieuw.');
        }
      }
      
      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Got 401 error, attempting to refresh session and retry...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            console.log('✅ Session refreshed after 401, retrying request...');
            return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh session after 401:', refreshError);
        }
      }
      
      // Network errors - retry once
      if ((response.status >= 500 && response.status < 600) && retryCount === 0) {
        console.log('🔄 Got server error, retrying once...');
        return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
      }
      
      // Andere errors
      throw new Error(errorData.error || `Er is een fout opgetreden bij het verwerken van je bericht. Probeer het opnieuw of neem contact op met support. (HTTP ${response.status})`);
    }

    // DeepSeek: streaming, Gemini: geen streaming
    if (provider === 'DeepSeek') {
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
      let lastChunkTime = Date.now();
      
      const resetStreamTimeout = () => {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        streamTimeout = setTimeout(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;
          console.error(`⏰ Stream timeout - no data received for 60 seconds (last chunk: ${timeSinceLastChunk}ms ago)`);
          reader.cancel();
        }, 60000);
      };
      
      try {
        resetStreamTimeout();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Streaming completed');
            break;
          }
          
          lastChunkTime = Date.now();
          resetStreamTimeout();
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const jsonStr = line.slice(6);
              const data: ChatResponse = JSON.parse(jsonStr);
              console.log('📝 Parsed data:', data);
              if (data.type === 'chunk' && data.content) {
                hasStartedStreaming = true;
                fullResponse += data.content;
                onChunk?.(data.content);
              } else if (data.type === 'complete') {
                if (data.content && data.content.trim() !== '') {
                  fullResponse = data.content;
                }
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
        
        const responseLength = fullResponse.length;
        if (responseLength > 0 && responseLength < 50) {
          console.warn('⚠️ Response seems unusually short, but continuing...');
        }
        
        return fullResponse;
      } finally {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        reader.releaseLock();
      }
    } else {
      // Gemini: geen streaming, gewone JSON response
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.response || '';
    }

  } catch (error) {
    console.error('Chat service error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - AI service took too long to respond. Probeer het opnieuw.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Netwerk fout. Controleer je internetverbinding en probeer het opnieuw.');
      }
    }
    
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