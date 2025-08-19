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
      body: JSON.stringify({ model, messages: qwenMessages })
    })

    if (!resp.ok) {
      const err = await resp.text()
      return new Response(JSON.stringify({ error: `Qwen API error: ${resp.status}`, details: err }), { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content || ''
    return new Response(JSON.stringify({ response: content, model }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})


