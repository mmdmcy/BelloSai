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

// RELIABLE timeouts for stable performance!
const DEEPSEEK_API_TIMEOUT = 30000; // 30 seconds - reliable for longer conversations
const STREAM_START_TIMEOUT = 5000; // 5 seconds - reasonable response time

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
          JSON.stringify({ error: 'Ongeldige of verlopen token', details: userError?.message || 'Auth session missing!' }),
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
          JSON.stringify({ error: 'Kon gebruikersgegevens niet ophalen' }),
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
            error: 'Berichtenlimiet overschreden',
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
          JSON.stringify({ error: 'Ongeldige API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log('🔓 Anonymous user request accepted');
      isAnonymous = true;
    } else {
      console.log('❌ Missing authorization header or API key');
      return new Response(
        JSON.stringify({ error: 'Ontbrekende autorisatie header of API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model, conversationId, stream: enableStreaming = true }: ChatRequest = await req.json()
    console.log('📥 Parsed request:', { messageCount: messages?.length, model, conversationId, enableStreaming });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Berichtenarray is vereist' }),
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

    // Optimized message conversion
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

    // Call DeepSeek API with ultra-optimized settings for speed
    console.log('🚀 Calling DeepSeek API with lightning-fast settings:', {
      model: modelId,
      messageCount: deepSeekMessages.length,
      stream: enableStreaming,
      hasApiKey: !!DEEPSEEK_API_KEY
    });
    
    // Reliable timeout for DeepSeek API call - stable performance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ DeepSeek API timeout after 30 seconds - ensuring reliability');
      controller.abort();
    }, DEEPSEEK_API_TIMEOUT);
    
    let deepSeekResponse;
    try {
      console.log('📡 Sending ultra-optimized request to DeepSeek API...');
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
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('📡 DeepSeek API request completed in:', Date.now());
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ DeepSeek API fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Verzoek timeout - DeepSeek API duurde te lang om te reageren' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Kon geen verbinding maken met DeepSeek API' }),
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
        JSON.stringify({ error: `DeepSeek API fout: ${deepSeekResponse.status} - ${deepSeekResponse.statusText}`, details: errorText }),
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

    // Set up optimized streaming response
    console.log('🌊 Setting up optimized streaming response...');
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepSeekResponse.body!.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''
        let hasStartedStreaming = false
        
        // Optimized stream start timeout
        let streamStartTimeout = setTimeout(() => {
          if (!hasStartedStreaming) {
            console.error('❌ DeepSeek streaming did not start within 5s');
            try {
              controller.error(new Error('DeepSeek streaming startte niet binnen 5 seconden. Probeer het opnieuw.'));
            } catch (e) {
              console.warn('Controller already closed or errored');
            }
          }
        }, STREAM_START_TIMEOUT);

        try {
          console.log('�� Starting optimized streaming loop...');
          
          // Skip saving user message here - it's handled by the frontend
          console.log('📝 Skipping user message save - handled by frontend');

          let chunkBuffer = '';
          const CHUNK_SIZE = 8; // Smaller chunks for smoother streaming

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('✅ Streaming completed - no more data');
              // Send any remaining buffer
              if (chunkBuffer.trim()) {
                const sseData = `data: ${JSON.stringify({ content: chunkBuffer, type: 'chunk' })}\n\n`
                try {
                  controller.enqueue(new TextEncoder().encode(sseData))
                  fullResponse += chunkBuffer;
                } catch (e) {
                  console.warn('Failed to enqueue final chunk:', e);
                }
              }
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
                  hasStartedStreaming = true
                  
                  // Add to buffer for smoother streaming
                  chunkBuffer += content
                  
                  // Send optimal chunks for smoother UX
                  while (chunkBuffer.length >= CHUNK_SIZE) {
                    const chunkToSend = chunkBuffer.slice(0, CHUNK_SIZE);
                    chunkBuffer = chunkBuffer.slice(CHUNK_SIZE);
                    
                    fullResponse += chunkToSend
                    
                    // Send the chunk to client
                    const sseData = `data: ${JSON.stringify({ content: chunkToSend, type: 'chunk' })}\n\n`
                    try {
                      controller.enqueue(new TextEncoder().encode(sseData))
                    } catch (e) {
                      console.warn('Failed to enqueue chunk:', e);
                      break;
                    }
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError)
                continue
              }
            }
          }

          // Clear timeout since we're done
          clearTimeout(streamStartTimeout);

          // Validate the response
          if (!hasStartedStreaming) {
            console.error('No streaming data received from DeepSeek API');
            try {
              controller.error(new Error('Geen streaming data ontvangen van AI service'));
            } catch (e) {
              console.warn('Controller already closed or errored');
            }
            return;
          }

          if (!fullResponse || fullResponse.trim() === '') {
            console.error('Empty response received from DeepSeek API');
            try {
              controller.error(new Error('Lege response ontvangen van AI service'));
            } catch (e) {
              console.warn('Controller already closed or errored');
            }
            return;
          }

          // Skip saving AI response here - it's handled by the frontend
          console.log('📝 Skipping AI response save - handled by frontend');

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
          try {
            controller.enqueue(new TextEncoder().encode(completionData))
            controller.close()
            console.log('✅ Stream completed successfully');
          } catch (e) {
            console.warn('Failed to send completion or close controller:', e);
          }

        } catch (error) {
          console.error('Streaming error:', error)
          clearTimeout(streamStartTimeout);
          try {
            controller.error(error)
          } catch (e) {
            console.warn('Controller already closed or errored');
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