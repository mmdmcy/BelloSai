import { corsHeaders } from '../_shared/cors.ts'

interface ChatRequest {
  messages: Array<{ type?: 'user' | 'ai'; role?: 'user' | 'assistant' | 'system'; content: string }>;
  model: string;
  conversationId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages, model }: ChatRequest = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const qwenApiKey = Deno.env.get('QWEN_API_KEY') || Deno.env.get('DASHSCOPE_API_KEY') || ''
    if (!qwenApiKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: QWEN_API_KEY/DASHSCOPE_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const qwenMessages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...messages.map(m => ({ role: (m.role || (m.type === 'user' ? 'user' : 'assistant')) as 'user'|'assistant'|'system', content: m.content }))
    ]

    const resp = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: qwenMessages, stream: true })
    })

    if (!resp.ok) {
      const err = await resp.text()
      return new Response(JSON.stringify({ error: `Qwen API error: ${resp.status}`, details: err }), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Stream SSE back to client with chunk/complete events
    if (resp.headers.get('content-type')?.includes('text/event-stream')) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = resp.body!.getReader();
          const decoder = new TextDecoder();
          let full = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') continue;
              try {
                const data = JSON.parse(payload);
                const delta = data?.choices?.[0]?.delta?.content;
                if (delta) {
                  full += delta;
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: delta, type: 'chunk' })}\n\n`));
                }
              } catch {
                continue;
              }
            }
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: full, type: 'complete', model })}\n\n`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
    }

    // Fallback non-stream
    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content || ''
    return new Response(JSON.stringify({ response: content, model }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


