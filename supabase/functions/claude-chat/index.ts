import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Claude Edge Function called at:', new Date().toISOString());
    console.log('📝 Request method:', req.method);
    
    // Get authorization header or apikey for anonymous users
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
    
    // Create Supabase client for authenticated operations
    console.log('🔧 Creating Supabase client');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://uxqrdnotdkcwfwcifajf.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    
    let user = null;
    let userData = null;
    let isAnonymous = true;

    // Try to authenticate user if auth header is present
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔍 Validating user token...');
      
      try {
        const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
        
        if (!userError && authUser) {
          user = authUser;
          isAnonymous = false;
          console.log('✅ User authenticated:', user.email);

          // Fetch user data for authenticated users
          console.log('📊 Fetching user data...');
          const { data: userDataResult, error: userDataError } = await supabaseAdmin
            .from('users')
            .select('message_count, message_limit, subscription_tier')
            .eq('id', user.id)
            .single()

          if (!userDataError && userDataResult) {
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
                  error: 'Message limit exceeded',
                  limit: userData.message_limit,
                  current: userData.message_count,
                  subscription_tier: userData.subscription_tier
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          } else {
            console.error('❌ Failed to fetch user data:', userDataError);
          }
        } else {
          console.log('⚠️ Invalid or expired token, proceeding as anonymous:', userError?.message);
        }
      } catch (authError) {
        console.log('⚠️ Auth error, proceeding as anonymous:', authError);
      }
    } else if (apiKey) {
      console.log('🔓 API key provided - anonymous user request');
    } else {
      console.log('🔓 No auth headers - anonymous user request');
    }

    console.log('👤 User status:', { isAnonymous, hasUser: !!user, hasUserData: !!userData });

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model, conversationId } = await req.json()
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