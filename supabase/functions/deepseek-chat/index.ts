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
  messages: Array<{ type: 'user' | 'ai'; content: string }>;
  model: 'DeepSeek-V3' | 'DeepSeek-R1';
  conversationId?: string;
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
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user's message limit
    const { data: userData, error: userDataError } = await supabase
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

    // Parse request body
    const { messages, model, conversationId }: ChatRequest = await req.json()

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
      deepSeekMessages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    // Get the DeepSeek model ID
    const modelId = DEEPSEEK_MODELS[model] || 'deepseek-chat';

    // Call DeepSeek API with streaming
    const deepSeekResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: deepSeekMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!deepSeekResponse.ok) {
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${deepSeekResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Increment user's message count
    const { error: incrementError } = await supabase
      .from('users')
      .update({ 
        message_count: userData.message_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (incrementError) {
      console.error('Failed to increment message count:', incrementError)
    }

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepSeekResponse.body?.getReader()
        const decoder = new TextDecoder()
        let fullResponse = ''

        if (!reader) {
          controller.error(new Error('No reader available'))
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

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

          // Send completion signal
          const completionData = `data: ${JSON.stringify({ 
            content: fullResponse, 
            type: 'complete',
            model: model,
            messageCount: userData.message_count + 1,
            messageLimit: userData.message_limit
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(completionData))
          
          // Save conversation to database if conversationId is provided
          if (conversationId && fullResponse) {
            try {
              // Save user message
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                type: 'user',
                content: messages[messages.length - 1].content,
                model: model
              })

              // Save AI response
              await supabase.from('messages').insert({
                conversation_id: conversationId,
                type: 'ai',
                content: fullResponse,
                model: model
              })
            } catch (dbError) {
              console.error('Failed to save conversation:', dbError)
            }
          }

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