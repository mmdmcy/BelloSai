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
    const { messages, model, conversationId }: ChatRequest = await req.json()
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
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Mistral API error:', error)
      throw new Error(`Mistral API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    console.log('Mistral response:', JSON.stringify(data, null, 2))

    // Validate response format
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Invalid response format from Mistral API')
    }

    const choice = data.choices[0]
    if (!choice.message || !choice.message.content) {
      throw new Error('No message content found in Mistral response')
    }

    // Return in the format expected by the frontend (response field for non-DeepSeek providers)
    const responseData = {
      response: choice.message.content,
      model: model || 'mistral-medium'
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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