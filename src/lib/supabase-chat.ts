/**
 * Supabase Chat Service
 * 
 * Handles communication with Supabase Edge Functions for AI chat
 * Includes message limits and streaming support with optimized performance
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

type ModelProvider = 'DeepSeek' | 'Gemini';

// Configuration constants for reliable performance
const REQUEST_TIMEOUT = Infinity; // No timeout - let AI work!
const STREAM_TIMEOUT = Infinity; // No stream timeout
const OPTIMAL_CHUNK_SIZE = 12; // Characters per chunk for smooth streaming

// Performance optimization: Balanced timeouts for reliable responses
const FAST_TIMEOUT = 20000; // 20 seconds for reliable response

/**
 * Get model provider based on model code
 */
function getModelProvider(modelCode: string): ModelProvider {
  const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
  return model?.provider === 'Gemini' ? 'Gemini' : 'DeepSeek';
}

/**
 * Send messages to AI via Supabase Edge Function with optimized streaming
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
    
    // No timeouts - let AI work without interruption!
    abortController = new AbortController();
    
    // Get current session with error recovery
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('🔍 Session check:', { session: !!session, error: sessionError });

    // Enhanced retry logic for failed authentication
    if (sessionError && retryCount === 0) {
      console.log('🔄 Session error detected, attempting fresh refresh...');
      try {
        // Force a fresh session
        await supabase.auth.signOut();
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session) {
          session = refreshData.session;
          console.log('✅ Session completely refreshed after error');
        }
      } catch (refreshError) {
        console.warn('⚠️ Complete session refresh failed, continuing as anonymous');
      }
    }
    
    // Prepare authentication headers with optimized settings
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session) {
      console.log('✅ Authentication successful, user:', session.user.email);
      console.log('🔑 Access token length:', session.access_token.length);
      console.log('⏰ Token expires at:', new Date(session.expires_at! * 1000));

      // Proactive token refresh for better performance
      const now = Date.now() / 1000;
      const timeUntilExpiry = (session.expires_at || 0) - now;
      
      // Refresh if token expires within 5 minutes (300 seconds)
      if (session.expires_at && timeUntilExpiry < 300) {
        console.log('🔄 Token expires soon, proactively refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('❌ Failed to refresh token:', refreshError);
          throw new Error('Session expired. Please log in again.');
        }
        
        // Use the refreshed session
        session = refreshData.session;
        console.log('✅ Token refreshed proactively');
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

    // Choose appropriate edge function
    const provider = getModelProvider(modelCode);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${provider === 'Gemini' ? 'gemini-chat' : 'deepseek-chat'}`;
    console.log('📡 Calling Edge Function:', url);
    console.log('📡 Request payload:', { messages, model: modelCode, conversationId });
    
    console.log('🚀 About to make fetch request...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          ...msg,
          content: typeof msg.content === 'string' ? 
            msg.content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim() : 
            String(msg.content || '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
        })),
        model: modelCode,
        conversationId
      }),
      signal: abortController.signal
    });
    console.log('✅ Fetch request completed, got response');

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    console.log('📨 Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Edge Function error:', errorData);
      
      // Handle specific error types with English messages
      if (response.status === 408) {
        // Timeout error - retry once if we haven't already
        if (retryCount === 0) {
          console.log('🔄 Got timeout error, retrying once...');
          return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
        } else {
          throw new Error('Request timeout - AI service took too long. Please try again.');
        }
      }
      
      // Authentication errors - improved retry logic
      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Got 401 error, attempting to refresh session and retry...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            console.log('✅ Session refreshed after 401, retrying request...');
            return sendChatMessage(messages, modelCode, onChunk, conversationId, retryCount + 1);
          }
        } catch (refreshError) {
          console.warn('⚠️ Session refresh failed');
        }
      }
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for other status codes
      throw new Error(`Request failed with status ${response.status}. Please try again.`);
    }

    // Optimized streaming for DeepSeek, regular response for Gemini
    if (provider === 'DeepSeek') {
      if (!response.body) {
        console.error('❌ No response body from Edge Function');
        throw new Error('No response body');
      }
      console.log('🌊 Starting optimized streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let hasStartedStreaming = false;
      // No stream timeout needed
      let lastChunkTime = Date.now();
      let chunkBuffer = ''; // Buffer for smoother chunk processing
      
      // No stream timeouts - let AI stream without interruption!
      
              try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ Streaming completed');
              // Process any remaining buffer
              if (chunkBuffer.trim()) {
                onChunk?.(chunkBuffer);
                fullResponse += chunkBuffer;
              }
              break;
            }
            
            lastChunkTime = Date.now();
          
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
                
                // Add content to buffer for smoother streaming
                chunkBuffer += data.content;
                
                // Process buffer in optimal chunks for smoother UX
                while (chunkBuffer.length >= OPTIMAL_CHUNK_SIZE) {
                  const chunkToSend = chunkBuffer.slice(0, OPTIMAL_CHUNK_SIZE);
                  chunkBuffer = chunkBuffer.slice(OPTIMAL_CHUNK_SIZE);
                  fullResponse += chunkToSend;
                  onChunk?.(chunkToSend);
                }
                
              } else if (data.type === 'complete') {
                // Send any remaining buffer
                if (chunkBuffer.trim()) {
                  fullResponse += chunkBuffer;
                  onChunk?.(chunkBuffer);
                  chunkBuffer = '';
                }
                
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
        
        // No timeout to clear
        
        if (!hasStartedStreaming) {
          throw new Error('Geen streaming data ontvangen van AI service');
        }
        
        console.log('📝 Final fullResponse length:', fullResponse?.length || 0);
        if (!fullResponse || fullResponse.trim() === '') {
          throw new Error('Lege response ontvangen van AI service');
        }
        
        const responseLength = fullResponse.length;
        if (responseLength > 0 && responseLength < 10) {
          console.warn('⚠️ Response seems unusually short, but continuing...');
        }
        
        return fullResponse;
      } finally {
        // No timeout to clear
        reader.releaseLock();
      }
    } else {
      // Gemini: regular JSON response (no streaming)
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.response || '';
    }

  } catch (error) {
    console.error('Chat service error:', error);
    
    // Enhanced error handling for better UX
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Verzoek timeout - AI service duurde te lang. Probeer opnieuw.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your internet connection and try again.');
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

