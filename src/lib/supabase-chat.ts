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

// ULTIMATE LIGHTNING FAST timeout settings - ABSOLUTE ZERO HANGING!
const REQUEST_TIMEOUT = 15000; // 15 seconds - ULTIMATE SPEED!
const STREAM_TIMEOUT = 18000; // 18 seconds for streaming
const OPTIMAL_CHUNK_SIZE = 12; // Optimal chunk size for smooth streaming

// Performance optimization: Ultra-aggressive timeouts for immediate feedback
const FAST_TIMEOUT = 8000; // 8 seconds for ultra-fast response

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
    
    // Reset abort controller with ultra-fast timeout and connection cleanup
    abortController = new AbortController();
    
    // Add connection reset for preventing hangs on second requests
    const connectionHeaders = {
      'Connection': 'close', // Force connection close to prevent hanging
      'Cache-Control': 'no-cache', // Prevent caching issues
    };
    
    timeoutId = setTimeout(() => {
      console.error('⚡ ULTIMATE TIMEOUT after 15 seconds - ZERO HANGING TOLERANCE!');
      abortController?.abort();
    }, REQUEST_TIMEOUT);
    
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
    
    // Reset abort controller with optimized timeout
    abortController = new AbortController();
    timeoutId = setTimeout(() => {
      console.error('⏰ Request timeout after 35 seconds - aborting for faster feedback');
      abortController?.abort();
    }, REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...authHeaders, ...connectionHeaders },
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
      
      // Optimized error handling with faster retries
      if (response.status === 429) {
        // Rate limit - don't retry, just show message
        let msg = 'Je hebt het maximum aantal verzoeken bereikt. Wacht even en probeer opnieuw.';
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
          throw new Error('Verzoek timeout - AI service duurde te lang. Probeer opnieuw.');
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
      
      // Handle specific error types with English messages
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
      let streamTimeout: NodeJS.Timeout | null = null;
      let lastChunkTime = Date.now();
      let chunkBuffer = ''; // Buffer for smoother chunk processing
      
      const resetStreamTimeout = () => {
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        streamTimeout = setTimeout(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;
          console.error(`⏰ Stream timeout - no data received for ${STREAM_TIMEOUT/1000} seconds (last chunk: ${timeSinceLastChunk}ms ago)`);
          reader.cancel();
        }, STREAM_TIMEOUT);
      };
      
      try {
        resetStreamTimeout();
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
        
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        
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
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
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

