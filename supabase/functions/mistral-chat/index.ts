import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { MistralClient } from 'npm:@mistralai/mistralai'
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

    const client = new MistralClient(Deno.env.get('MISTRAL_API_KEY') || '')

    const response = await client.chat({
      model: model || "mistral-medium",
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response format from Mistral API')
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Mistral API error:', error)
    return new Response(JSON.stringify({ 
      error: `Error processing request: ${error.message}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 