import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

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
    
    // DEBUG: Log all headers (excluding sensitive data)
    const headers = Object.fromEntries(req.headers.entries());
    console.log('📋 All request headers:', {
      ...headers,
      'authorization': authHeader ? 'Bearer [REDACTED]' : undefined,
      'apikey': apiKey ? '[API KEY PRESENT]' : undefined
    });
    
    // Create Supabase client with service role key for admin operations
    console.log('🔧 Creating Supabase client');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://uxqrdnotdkcwfwcifajf.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let user = null;
    let userData = null;
    let isAnonymous = false;

    // Optimized authentication check
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔍 Validating user token...');
      
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
      
      if (userError || !authUser) {
        console.log('❌ Invalid or expired token:', userError?.message);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token', details: userError?.message || 'Auth session missing!' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      user = authUser;
      console.log('✅ User authenticated:', user.email);

      // Fast user data fetch with optimized query
      console.log('📊 Fetching user data...');
      const { data: userDataResult, error: userDataError } = await supabaseAdmin
        .from('users')
        .select('message_count, message_limit, subscription_tier')
        .eq('id', user.id)
        .single()

      if (userDataError) {
        console.error('❌ Failed to fetch user data:', userDataError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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
    } else if (apiKey) {
      // Anonymous user - verify API key matches anon key
      const expectedAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      console.log('🔑 Anonymous key verification:', {
        providedKeyLength: apiKey.length,
        expectedKeyLength: expectedAnonKey?.length || 0,
        providedPrefix: apiKey.substring(0, 20) + '...',
        expectedPrefix: expectedAnonKey?.substring(0, 20) + '...' || 'missing',
        keysMatch: apiKey === expectedAnonKey,
        environmentVariableExists: !!expectedAnonKey
      });
      
      // Log all environment variables starting with SUPABASE for debugging
      console.log('🔍 Available Supabase env vars:', {
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
        SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      });
      
      if (!expectedAnonKey) {
        console.error('❌ SUPABASE_ANON_KEY environment variable not set');
        // For now, allow requests without the anon key to make anonymous mode work
        console.log('⚠️ Allowing anonymous request without key verification (fallback mode)');
        isAnonymous = true;
      } else if (apiKey !== expectedAnonKey) {
        console.log('❌ Invalid API key for anonymous user');
        console.log('🔍 Debug key comparison:', {
          expectedStart: expectedAnonKey?.substring(0, 30),
          providedStart: apiKey.substring(0, 30),
          expectedEnd: expectedAnonKey?.substring(-10),
          providedEnd: apiKey.substring(-10)
        });
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        console.log('🔓 Anonymous user request accepted');
        isAnonymous = true;
      }
    } else {
      console.log('⚠️ No auth headers provided - allowing as anonymous for debugging');
      isAnonymous = true;
    }

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

    // Optimized message count increment (only for authenticated users)
    if (!isAnonymous && user && userData) {
      console.log('📊 Incrementing user message count...');
      // Use fire-and-forget for better performance
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
    }

    // Handle non-streaming response
    if (!enableStreaming) {
      const responseData = await deepSeekResponse.json()
      const content = responseData.choices?.[0]?.message?.content || ''
      
      const responsePayload: any = { 
        response: content,
        model: model
      };
      
      // Add message count info only for authenticated users
      if (!isAnonymous && userData) {
        responsePayload.messageCount = userData.message_count + 1;
        responsePayload.messageLimit = userData.message_limit;
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