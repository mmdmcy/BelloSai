import { corsHeaders } from '../_shared/cors.ts'

interface ChatRequest {
  messages: Array<{ type?: 'user' | 'ai'; role?: 'user' | 'assistant' | 'system'; content: string }>;
  model: string;
  conversationId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Groq Edge Function called at:', new Date().toISOString());
    console.log('📝 Request method:', req.method);

    // Auth headers (not strictly required for Groq call; used for potential future persistence)
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 API key present:', !!apiKey);

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model }: ChatRequest = await req.json()
    console.log('📥 Parsed request:', { messageCount: messages?.length, model });

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    // Convert to OpenAI-compatible format for Groq
    const groqMessages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses. When showing code, use proper markdown code fences with language tags.'
      },
      ...messages.map((msg) => ({
        role: (msg.role || (msg.type === 'user' ? 'user' : 'assistant')) as 'user' | 'assistant' | 'system',
        content: msg.content ?? ''
      }))
    ];

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not set in environment');
      return new Response(JSON.stringify({ error: 'Server configuration error: GROQ_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Groq Chat Completions (OpenAI-compatible route)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return new Response(JSON.stringify({ error: `Groq API error: ${response.status} - ${error}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    // OpenAI-compatible shape: choices[0].message.content
    const content = data?.choices?.[0]?.message?.content || '';
    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty response from Groq API' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const responseData = {
      response: content,
      model
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Groq chat error:', error);
    return new Response(JSON.stringify({ 
      error: `Error processing request: ${error.message}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})


