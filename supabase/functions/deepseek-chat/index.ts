import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    console.log('🚀 Edge Function called');
    
    // Get authorization header or apikey for anonymous users
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 API key present:', !!apiKey);
    
    // Create Supabase client with service role key for admin operations
    console.log('🔧 Creating Supabase client');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://uxqrdnotdkcwfwcifajf.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let user = null;
    let userData = null;
    let isAnonymous = false;

    if (authHeader) {
      // Authenticated user
      console.log('👤 Verifying JWT token');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
      console.log('👤 User result:', { user: !!authUser, error: userError });
      
      if (userError || !authUser) {
        console.log('❌ Auth failed:', userError);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token', details: userError?.message || 'Auth session missing!' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      user = authUser;
      console.log('✅ User authenticated:', user.email);

      // Check user's message limit using admin client
      const { data: userDataResult, error: userDataError } = await supabaseAdmin
        .from('users')
        .select('message_count, message_limit, subscription_tier')
        .eq('id', user.id)
        .single()

      if (userDataError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userData = userDataResult;

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
      if (apiKey !== expectedAnonKey) {
        console.log('❌ Invalid API key for anonymous user');
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('🔓 Anonymous user request accepted');
      isAnonymous = true;
    } else {
      console.log('❌ Missing authorization header or API key');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header or API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { messages, model, conversationId, stream: enableStreaming = true }: ChatRequest = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert messages to DeepSeek format
    const deepSeekMessages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When showing code, use proper markdown formatting with language-specific code blocks.'
      }
    ];

    // Add conversation history
    for (const msg of messages) {
      if ('type' in msg) {
        // Old format for backward compatibility
      deepSeekMessages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
      } else {
        // New format with role directly
        deepSeekMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
    }

    // Get the DeepSeek model ID
    const modelId = DEEPSEEK_MODELS[model] || 'deepseek-chat';

    // Call DeepSeek API
    console.log('🚀 Calling DeepSeek API with:', {
      model: modelId,
      messageCount: deepSeekMessages.length,
      stream: enableStreaming,
      hasApiKey: !!DEEPSEEK_API_KEY
    });
    
    // Add timeout to DeepSeek API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ DeepSeek API timeout after 80 seconds');
      controller.abort();
    }, 80000); // 80 second timeout
    
    let deepSeekResponse;
    try {
      deepSeekResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: deepSeekMessages,
          stream: enableStreaming,
          temperature: 0.7,
          max_tokens: enableStreaming ? 4000 : 500 // Shorter responses for title generation
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ DeepSeek API fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout - DeepSeek API took too long to respond' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to connect to DeepSeek API' }),
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
        JSON.stringify({ error: `DeepSeek API error: ${deepSeekResponse.status} - ${deepSeekResponse.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment user's message count using admin client (only for authenticated users)
    if (!isAnonymous && user && userData) {
      const { error: incrementError } = await supabaseAdmin
        .from('users')
        .update({ 
          message_count: userData.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (incrementError) {
        console.error('Failed to increment message count:', incrementError)
      }
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

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepSeekResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''
        let hasStartedStreaming = false

        if (!reader) {
          controller.error(new Error('No reader available'))
          return
        }

        try {
          console.log('🌊 Starting streaming loop...');
          
          // Save user message first before starting stream
          if (conversationId) {
            try {
              await supabaseAdmin.from('messages').insert({
                conversation_id: conversationId,
                type: 'user',
                content: messages[messages.length - 1].content,
                model: model
              })
              console.log('✅ User message saved successfully');
            } catch (dbError) {
              console.error('Failed to save user message:', dbError);
              controller.error(new Error('Database error: Failed to save user message'));
              return;
            }
          }

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('✅ Streaming completed - no more data');
              break;
            }

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.trim() === '') continue
              if (line.trim() === 'data: [DONE]') continue
              if (!line.startsWith('data: ')) continue

              try {
                const jsonStr = line.slice(6) // Remove "data: " prefix
                const data = JSON.parse(jsonStr)
                
                const content = data.choices?.[0]?.delta?.content
                if (content) {
                  fullResponse += content
                  hasStartedStreaming = true
                  
                  // Send the chunk to client
                  const sseData = `data: ${JSON.stringify({ content, type: 'chunk' })}\n\n`
                  controller.enqueue(new TextEncoder().encode(sseData))
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError)
                continue
              }
            }
          }

          // Validate the response
          if (!hasStartedStreaming) {
            console.error('No streaming data received from DeepSeek API');
            controller.error(new Error('No streaming data received from AI service'));
            return;
          }

          if (!fullResponse || fullResponse.trim() === '') {
            console.error('Empty response received from DeepSeek API');
            controller.error(new Error('Empty response received from AI service'));
            return;
          }

          // Save AI response with retry logic
          if (conversationId) {
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                await supabaseAdmin.from('messages').insert({
                  conversation_id: conversationId,
                  type: 'ai',
                  content: fullResponse,
                  model: model
                })
                console.log('✅ AI response saved successfully');
                break;
              } catch (dbError) {
                console.error(`Failed to save AI response (attempt ${retryCount + 1}):`, dbError);
                retryCount++;
                
                if (retryCount === maxRetries) {
                  // Don't throw error, just log it - the response was still delivered to the client
                  console.error('Failed to save AI response after all retries');
                } else {
                  // Wait before retrying
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
            }
          }

          // Send completion signal
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
          controller.enqueue(new TextEncoder().encode(completionData))
          controller.close()

        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 