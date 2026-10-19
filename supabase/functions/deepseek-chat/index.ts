/**
 * DeepSeek Chat Edge Function
 * 
 * This Supabase Edge Function handles AI chat requests using the DeepSeek API.
 * It processes user messages, manages authentication, enforces usage limits,
 * and streams responses back to the client in real-time.
 * 
 * Supported Models:
 * - DeepSeek-V3: Advanced general-purpose chat model (Free tier)
 * - DeepSeek-R1: Reasoning-optimized model (Premium tier)
 * 
 * Features:
 * - Real-time streaming responses for immediate feedback
 * - User authentication and anonymous usage support
 * - Message limit enforcement based on subscription tier
 * - Automatic message counting and database updates
 * - Error handling and graceful fallbacks
 * - Unicode content sanitization for JSON safety
 * 
 * Authentication Flow:
 * 1. Accepts Bearer token or API key for anonymous users
 * 2. Validates user session and fetches usage data
 * 3. Enforces message limits based on subscription tier
 * 4. Updates message count after successful response
 * 
 * Rate Limiting:
 * - Anonymous: ANON_DAILY_MESSAGE_LIMIT requests per IP per UTC day (default 3), enforced server-side
 * - Free tier: 20 messages/month
 * - Pro tier: Unlimited messages
 * 
 * Technical Details:
 * - Deployed as Deno runtime Edge Function
 * - Uses DeepSeek's REST API with streaming support
 * - Implements CORS for browser compatibility
 * - Handles message format conversion between UI and API
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createAdminClient, enforceAnonymousQuota } from "../_shared/anonymous-quota.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, connection, cache-control',
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Array<{ type: 'user' | 'ai'; content: string } | { role: string; content: string }>;
  model: 'DeepSeek-V3' | 'DeepSeek-R1';
  conversationId?: string;
  stream?: boolean;
}

// No timeouts - let AI work without interruption!

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY') || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

const DEEPSEEK_MODELS = {
  'DeepSeek-V3': 'deepseek-chat',
  'DeepSeek-R1': 'deepseek-reasoner'
} as const;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 DeepSeek Edge Function called at:', new Date().toISOString());
    console.log('📝 Request method:', req.method);
    
    // Get authorization header or apikey for anonymous users
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 API key present:', !!apiKey);
    
    // Create Supabase client for authenticated operations
    console.log('🔧 Creating Supabase client');
    const supabaseAdmin = createAdminClient()
    if (!supabaseAdmin) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Supabase environment is not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    let user = null;
    let userData = null;
    let isAnonymous = true;

    // Try to authenticate user if auth header is present
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔍 Validating user token...');
      
      try {
        const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
        
        if (!userError && authUser) {
          user = authUser;
          isAnonymous = false;
          console.log('✅ User authenticated:', user.email);

          // Fetch user data for authenticated users
          console.log('📊 Fetching user data...');
          const { data: userDataResult, error: userDataError } = await supabaseAdmin
            .from('users')
            .select('message_count, message_limit, subscription_tier')
            .eq('id', user.id)
            .single()

          if (!userDataError && userDataResult) {
            userData = userDataResult;
            console.log('📊 User data:', { 
              messageCount: userData.message_count, 
              messageLimit: userData.message_limit, 
              subscriptionTier: userData.subscription_tier 
            });

            // Check if user has exceeded message limit
            if (userData.message_count >= userData.message_limit) {
              return new Response(
                JSON.stringify({ 
                  error: 'Message limit exceeded',
                  limit: userData.message_limit,
                  current: userData.message_count,
                  subscription_tier: userData.subscription_tier
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else {
            console.error('❌ Failed to fetch user data:', userDataError);
          }
        } else {
          console.log('⚠️ Invalid or expired token, proceeding as anonymous:', userError?.message);
        }
      } catch (authError) {
        console.log('⚠️ Auth error, proceeding as anonymous:', authError);
      }
    } else if (apiKey) {
      console.log('🔓 API key provided - anonymous user request');
    } else {
      console.log('🔓 No auth headers - anonymous user request');
    }

    console.log('👤 User status:', { isAnonymous, hasUser: !!user, hasUserData: !!userData });

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model, conversationId, stream: enableStreaming = true }: ChatRequest = await req.json()
    console.log('📥 Parsed request:', { messageCount: messages?.length, model, conversationId, enableStreaming });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Anonymous callers share the owner's provider key: enforce the server-side
    // per-IP daily quota before spending it (the localStorage counter is only a hint).
    if (isAnonymous) {
      const limited = await enforceAnonymousQuota(req, supabaseAdmin, corsHeaders)
      if (limited) return limited
    }

    // Convert messages to DeepSeek format - optimized conversion
    const deepSeekMessages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When showing code, use proper markdown formatting with language-specific code blocks.'
      }
    ];

    // Safe message conversion with proper Unicode handling
    for (const msg of messages) {
      let content = '';
      
      // Safely handle message content
      try {
        content = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
        
        // Clean up problematic characters that can break JSON parsing
        // Remove control characters but preserve Unicode emojis
        content = content
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
          .replace(/\uFEFF/g, '') // Remove BOM
          .trim(); // Remove extra whitespace
          
        // Ensure we have valid UTF-8 by encoding and decoding
        content = new TextDecoder().decode(new TextEncoder().encode(content));
        
      } catch (error) {
        console.warn('⚠️ Failed to process message content:', error);
        content = '[Message content could not be processed]';
      }
      
      if ('type' in msg) {
        // Old format for backward compatibility
        deepSeekMessages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: content
        });
      } else {
        // New format with role directly
        deepSeekMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: content
        });
      }
    }

    // Get the DeepSeek model ID with debug logging
    const modelId = DEEPSEEK_MODELS[model] || 'deepseek-chat';
    console.log('🔧 Model mapping debug:', {
      inputModel: model,
      mappedModelId: modelId,
      availableModels: Object.keys(DEEPSEEK_MODELS),
      hasMatchingKey: model in DEEPSEEK_MODELS
    });

    // Call DeepSeek API with ultra-optimized settings for speed
    console.log('🚀 Calling DeepSeek API with lightning-fast settings:', {
      model: modelId,
      messageCount: deepSeekMessages.length,
      stream: enableStreaming,
      hasApiKey: !!DEEPSEEK_API_KEY
    });
    
    // No timeouts - let DeepSeek work without interruption!
    let deepSeekResponse;
    try {
      console.log('📡 Sending request to DeepSeek API...');
      deepSeekResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Connection': 'close', // Prevent connection reuse that can cause hanging
          'Cache-Control': 'no-cache' // Prevent caching issues
        },
        body: JSON.stringify({
          model: modelId,
          messages: deepSeekMessages,
          stream: enableStreaming,
          temperature: 0.7,
          max_tokens: enableStreaming ? 3000 : 500, // Optimized token limits
          // Add performance optimizations
          top_p: 0.95,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }, null, 0), // Use proper JSON.stringify parameters to handle Unicode
      });
      console.log('📡 DeepSeek API request completed');
    } catch (fetchError) {
      console.error('❌ DeepSeek API fetch error:', fetchError);
      
      return new Response(
        JSON.stringify({ error: 'Could not connect to DeepSeek API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📨 DeepSeek API response status:', deepSeekResponse.status);

    if (!deepSeekResponse.ok) {
      const errorText = await deepSeekResponse.text();
      console.error('❌ DeepSeek API error:', {
        status: deepSeekResponse.status,
        statusText: deepSeekResponse.statusText,
        error: errorText
      });
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${deepSeekResponse.status} - ${deepSeekResponse.statusText}`, details: errorText }),
        { status: deepSeekResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle non-streaming response
    if (!enableStreaming) {
      const responseData = await deepSeekResponse.json()
      const content = responseData.choices?.[0]?.message?.content || ''
      
      const responsePayload: any = { 
        response: content,
        model: model
      };
      
      // Add message count info for authenticated users
      if (!isAnonymous && userData) {
        responsePayload.messageCount = userData.message_count + 1;
        responsePayload.messageLimit = userData.message_limit;
      }
      
      // Save conversation and increment message count for authenticated users
      if (!isAnonymous && user && userData && conversationId && content) {
        console.log('💾 Saving non-streaming conversation for authenticated user...');
        
        // Increment message count (fire-and-forget for performance)
        supabaseAdmin
          .from('users')
          .update({ 
            message_count: userData.message_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(({ error: incrementError }) => {
            if (incrementError) {
              console.error('Failed to increment message count:', incrementError)
            } else {
              console.log('✅ Message count incremented successfully');
            }
          });
          
        // Save conversation
        const conversationTitle = messages[0]?.content?.substring(0, 50) || 'New Chat';
        supabaseAdmin
          .from('conversations')
          .upsert({
            id: conversationId,
            user_id: user.id,
            title: conversationTitle,
            model: model,
            updated_at: new Date().toISOString()
          })
          .then(({ error: convError }) => {
            if (convError) {
              console.error('Failed to save conversation:', convError);
            } else {
              console.log('✅ Conversation saved successfully');
            }
          });
          
        // Save messages
        const messagesToSave = [
          {
            id: Date.now(),
            conversation_id: conversationId,
            role: 'user',
            content: messages[messages.length - 1]?.content || '',
            created_at: new Date().toISOString()
          },
          {
            id: Date.now() + 1,
            conversation_id: conversationId,
            role: 'assistant',
            content: content,
            created_at: new Date().toISOString()
          }
        ];
        
        supabaseAdmin
          .from('messages')
          .insert(messagesToSave)
          .then(({ error: msgError }) => {
            if (msgError) {
              console.error('Failed to save messages:', msgError);
            } else {
              console.log('✅ Messages saved successfully');
            }
          });
      }
      
      return new Response(
        JSON.stringify(responsePayload),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Set up FIXED streaming response
    console.log('🌊 Setting up FIXED streaming response...');
    const stream = new ReadableStream({
      async start(controller) {
        let isControllerActive = true;
        const reader = deepSeekResponse.body!.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''
        let hasStartedStreaming = false
        
        // No timeouts - let streaming work without interruption!

        try {
          console.log('🔄 Starting FIXED streaming loop...');

          while (true) {
            if (!isControllerActive) break;
            
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('✅ Streaming completed - no more data');
              break;
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (!isControllerActive) break;
              if (line.trim() === '') continue
              if (line.trim() === 'data: [DONE]') continue
              if (!line.startsWith('data: ')) continue

              try {
                const jsonStr = line.slice(6) // Remove "data: " prefix
                const data = JSON.parse(jsonStr)
                
                const content = data.choices?.[0]?.delta?.content
                if (content && isControllerActive) {
                  hasStartedStreaming = true
                  fullResponse += content
                  
                  // Send the chunk to client
                  const sseData = `data: ${JSON.stringify({ content, type: 'chunk' })}\n\n`
                  try {
                    controller.enqueue(new TextEncoder().encode(sseData))
                  } catch (e) {
                    console.warn('Failed to enqueue chunk:', e);
                    isControllerActive = false;
                    break;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError)
                continue
              }
            }
          }

          // Validate response
          if (!hasStartedStreaming) {
            console.error('No streaming data received from DeepSeek API');
            if (isControllerActive) {
              isControllerActive = false;
              controller.error(new Error('No streaming data received'));
            }
            return;
          }

          if (!fullResponse || fullResponse.trim() === '') {
            console.error('Empty response received from DeepSeek API');
            if (isControllerActive) {
              isControllerActive = false;
              controller.error(new Error('Empty response received'));
            }
            return;
          }

          // Send completion signal
          if (isControllerActive) {
            const completionPayload: any = { 
              content: fullResponse, 
              type: 'complete',
              model: model
            };
            
            // Add message count info for authenticated users
            if (!isAnonymous && userData) {
              completionPayload.messageCount = userData.message_count + 1;
              completionPayload.messageLimit = userData.message_limit;
            }
            
            const completionData = `data: ${JSON.stringify(completionPayload)}\n\n`
            try {
              controller.enqueue(new TextEncoder().encode(completionData))
              controller.close()
              isControllerActive = false;
              console.log('✅ Stream completed successfully');
              
              // Save conversation and increment message count for authenticated users
              if (!isAnonymous && user && userData && conversationId && fullResponse) {
                console.log('💾 Saving conversation for authenticated user...');
                
                // Increment message count
                supabaseAdmin
                  .from('users')
                  .update({ 
                    message_count: userData.message_count + 1,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', user.id)
                  .then(({ error: incrementError }) => {
                    if (incrementError) {
                      console.error('Failed to increment message count:', incrementError)
                    } else {
                      console.log('✅ Message count incremented successfully');
                    }
                  });
                  
                // Save conversation
                const conversationTitle = messages[0]?.content?.substring(0, 50) || 'New Chat';
                supabaseAdmin
                  .from('conversations')
                  .upsert({
                    id: conversationId,
                    user_id: user.id,
                    title: conversationTitle,
                    model: model,
                    updated_at: new Date().toISOString()
                  })
                  .then(({ error: convError }) => {
                    if (convError) {
                      console.error('Failed to save conversation:', convError);
                    } else {
                      console.log('✅ Conversation saved successfully');
                    }
                  });
                  
                // Save messages
                const messagesToSave = [
                  {
                    id: Date.now(),
                    conversation_id: conversationId,
                    role: 'user',
                    content: messages[messages.length - 1]?.content || '',
                    created_at: new Date().toISOString()
                  },
                  {
                    id: Date.now() + 1,
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: fullResponse,
                    created_at: new Date().toISOString()
                  }
                ];
                
                supabaseAdmin
                  .from('messages')
                  .insert(messagesToSave)
                  .then(({ error: msgError }) => {
                    if (msgError) {
                      console.error('Failed to save messages:', msgError);
                    } else {
                      console.log('✅ Messages saved successfully');
                    }
                  });
              }
              
            } catch (e) {
              console.warn('Failed to close controller:', e);
              isControllerActive = false;
            }
          }

        } catch (error) {
          console.error('Streaming error:', error)
          if (isControllerActive) {
            isControllerActive = false;
            try {
              controller.error(error)
            } catch (e) {
              console.warn('Controller error failed:', e);
            }
          }
        } finally {
          try {
            reader.releaseLock();
          } catch (e) {
            console.warn('Failed to release reader lock:', e);
          }
        }
      }
    })

    console.log('🌊 Returning optimized streaming response');
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Interne serverfout', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})