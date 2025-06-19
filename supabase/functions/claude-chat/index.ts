import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Claude Edge Function called at:', new Date().toISOString());
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

    // Convert to Claude's expected format
    const claudeMessages = messages.map(msg => ({
      role: (msg.role || msg.type) === 'user' ? 'user' : 'assistant',
      content: [
        {
          type: 'text',
          text: msg.content
        }
      ]
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('CLAUDE_API_KEY') || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: claudeMessages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    console.log('Claude response:', JSON.stringify(data, null, 2))

    // Extract text from Claude's response format
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new Error('Invalid response format from Claude API')
    }

    const textContent = data.content.find(block => block.type === 'text')
    if (!textContent || !textContent.text) {
      throw new Error('No text content found in Claude response')
    }

    // Return in the format expected by the client (response field for non-DeepSeek providers)
    const responseData = {
      response: textContent.text,
      model: model || 'claude-3-haiku-20240307'
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Claude chat error:', error)
    return new Response(JSON.stringify({ 
      error: `Error processing request: ${error.message}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 