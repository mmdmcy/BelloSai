/**
 * Supabase Chat Service
 * 
 * Handles communication with Supabase Edge Functions for AI chat
 * Includes message limits and streaming support with optimized performance
 */

import { supabase } from './supabase';
import type { ModelInfo } from '../types/app';
import { AVAILABLE_MODELS, getModelProvider } from '../models/registry';

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

type ModelProvider = 'DeepSeek' | 'Claude' | 'Mistral' | 'Groq';

// No timeouts - let AI work without any interruption!

// Simple request lock to prevent concurrent requests
let isRequestInProgress = false;

// Session cache to avoid repeated auth calls
let cachedSession: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get model provider based on model code
 */
// moved to models/registry

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
  
  // Check for concurrent requests
  if (isRequestInProgress) {
    console.warn('⚠️ Another request is already in progress, waiting...');
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (isRequestInProgress) {
      console.error('❌ Request lock stuck, forcing reset');
      isRequestInProgress = false; // Force reset the lock
    }
  }
  
  isRequestInProgress = true;
  console.log('🔒 Request lock acquired');
  
  try {
    console.log('🚀 Starting chat message request:', { messages, model: modelCode, conversationId });
    
    // Get current session with caching to avoid repeated auth calls
    console.log('🔍 About to get session...');
    let sessionResult;
    
    // Check if we have a valid cached session
    const now = Date.now();
    if (cachedSession && (now - sessionCacheTime) < SESSION_CACHE_DURATION) {
      console.log('✅ Using cached session');
      sessionResult = { data: { session: cachedSession }, error: null };
    } else {
      try {
        console.log('⏱️ Getting fresh session with 10s timeout...');
        const authPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.warn('⏰ Session retrieval timeout after 10 seconds - continuing without auth');
            reject(new Error('Session timeout'));
          }, 10000) // 10 seconds is reasonable
        );
        
        sessionResult = await Promise.race([authPromise, timeoutPromise]) as any;
        
        // Cache the session if successful
        if (sessionResult && sessionResult.data && sessionResult.data.session) {
          cachedSession = sessionResult.data.session;
          sessionCacheTime = now;
          console.log('✅ Session retrieved and cached');
        } else {
          // Clear cache if no session
          cachedSession = null;
          sessionCacheTime = 0;
          console.log('✅ No session - cleared cache');
        }
      } catch (sessionError) {
        console.error('❌ Session retrieval failed:', sessionError);
        // Clear cache on error
        cachedSession = null;
        sessionCacheTime = 0;
        // Continue with null session if auth fails - this ensures the request continues
        sessionResult = { data: { session: null }, error: sessionError };
      }
    }
    
    let { data: { session }, error: sessionError } = sessionResult;
    
    console.log('🔍 Session check:', { session: !!session, error: sessionError });

    // Enhanced retry logic for failed authentication
    if (sessionError && retryCount === 0) {
      console.log('🔄 Session error detected, continuing without refresh to avoid breaking database connection...');
      // Removed manual refresh that was causing auth state changes and breaking DB connection
    }
    
    // Prepare authentication headers with optimized settings
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session) {
      console.log('✅ Authentication successful, user:', session.user.email);
      console.log('🔑 Access token length:', session.access_token.length);
      console.log('⏰ Token expires at:', new Date(session.expires_at! * 1000));

      // Removed proactive token refresh that was causing auth state changes and breaking DB connection
      // The token will be refreshed naturally when needed, without breaking the database connection
      
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
    let url = '';
    if (provider === 'DeepSeek') url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
    else if (provider === 'Claude') url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-chat`;
    else if (provider === 'Mistral') url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mistral-chat`;
    else if (provider === 'Groq') url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-chat`;
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
      })
    });
    console.log('✅ Fetch request completed, got response');



    console.log('📨 Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Edge Function error:', errorData);
      
      // Handle specific error types with English messages
      
      // Authentication errors - improved retry logic
      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Got 401 error, but skipping refresh to avoid breaking database connection...');
        // Removed manual refresh that was causing auth state changes and breaking DB connection
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
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Streaming completed');
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const jsonStr = line.slice(6);
              const data: ChatResponse = JSON.parse(jsonStr);
              
              if (data.type === 'chunk' && data.content) {
                hasStartedStreaming = true;
                
                // Direct chunk processing - no buffering for immediate display
                console.log('📦 Direct chunk:', data.content.length, 'chars');
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
      // Claude/Mistral/Groq: regular JSON response (no streaming)
      console.log('📦 Processing non-DeepSeek response for provider:', provider);
      const data = await response.json();
      console.log('📦 Non-DeepSeek response data:', data);
      
      if (data.error) throw new Error(data.error);
      
      const responseContent = data.response || '';
      console.log('📦 Extracted response content length:', responseContent.length);
      console.log('📦 Response content preview:', responseContent.substring(0, 200) + '...');
      
      if (!responseContent || responseContent.trim() === '') {
        throw new Error('Empty response received from AI service');
      }
      
      // For non-streaming responses, call onChunk with the full content to update UI
      if (onChunk && responseContent) {
        console.log('📦 Calling onChunk for non-streaming response');
        onChunk(responseContent);
      }
      
      return responseContent;
    }

  } catch (error) {
    console.error('❌ sendChatMessage error:', error);
    
    // Enhanced error handling for better UX
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    
    throw error;
  } finally {
    // ALWAYS release the lock no matter what happens
    isRequestInProgress = false;
    console.log('🔓 Request lock released');
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

/**
 * Clear session cache - useful when auth issues occur
 */
export function clearSessionCache(): void {
  cachedSession = null;
  sessionCacheTime = 0;
  console.log('🧹 Session cache cleared');
} 

