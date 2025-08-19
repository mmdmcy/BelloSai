import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Mistral Edge Function called at:', new Date().toISOString());
    console.log('📝 Request method:', req.method);
    
    // Get authorization header or apikey for anonymous users - but allow all requests
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
    
    // PRODUCTION: Allow all requests without authentication
    console.log('🔓 PRODUCTION MODE: Allowing all requests (anonymous mode)');
    let user = null;
    let userData = null;
    let isAnonymous = true; // Always treat as anonymous in production for now

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model, conversationId, webSearch }: ChatRequest = await req.json()
    console.log('📥 Parsed request:', { messageCount: messages?.length, model, conversationId });

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    // Convert to Mistral's expected format
    const mistralMessages = messages.map(msg => ({
      role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
      content: msg.content
    }))

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MISTRAL_API_KEY') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'mistral-medium',
        messages: mistralMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
        // If using Mistral Agents API we would specify tools; here we include a hint flag for server-side routing.
        web_search: !!webSearch
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Mistral API error:', error)
      throw new Error(`Mistral API error: ${response.status} - ${error}`)
    }

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let full = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const data = JSON.parse(payload);
                const delta = data?.choices?.[0]?.delta?.content;
                if (delta) {
                  full += delta;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: delta, type: 'chunk' })}\n\n`));
                }
              } catch {}
            }
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: full, type: 'complete', model: model || 'mistral-medium' })}\n\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
    }

    // Fallback non-stream
    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || ''
    return new Response(JSON.stringify({ response: content, model: model || 'mistral-medium' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Mistral chat error:', error)
    return new Response(JSON.stringify({ 
      error: `Error processing request: ${error.message}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 