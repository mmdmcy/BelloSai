import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Anthropic from 'npm:@anthropic-ai/sdk'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, model, conversationId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('CLAUDE_API_KEY')
    })

    const response = await anthropic.messages.create({
      model: model || "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    if (!response || !response.content || !response.content[0] || !response.content[0].text) {
      throw new Error('Invalid response format from Claude API')
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Claude API error:', error)
    return new Response(JSON.stringify({ 
      error: `Error processing request: ${error.message}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 