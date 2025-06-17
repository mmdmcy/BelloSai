import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ChatRequest {
  messages: Array<{ type: 'user' | 'ai'; content: string } | { role: string; content: string }>;
  model: string;
  conversationId?: string;
  stream?: boolean;
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check (zelfde als deepseek)
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    let user = null;
    let userData = null;
    let isAnonymous = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (userError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token', details: userError?.message || 'Auth session missing!' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = authUser;
      const { data: userDataResult, error: userDataError } = await supabaseAdmin
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
      userData = userDataResult;
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
    } else if (apiKey) {
      const expectedAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (apiKey !== expectedAnonKey) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      isAnonymous = true;
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header or API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { messages, model, conversationId, stream: enableStreaming = false }: ChatRequest = await req.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Zet om naar Gemini formaat
    const geminiMessages: GeminiMessage[] = [
      ...messages.map((msg) => {
        if ('type' in msg) {
          return {
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }
        } else {
          return {
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          }
        }
      })
    ];

    // Alleen de laatste user prompt sturen (zoals Gemini API verwacht)
    const lastUserMsg = geminiMessages.reverse().find(m => m.role === 'user');
    const contextMsgs = geminiMessages.filter(m => m.role !== 'user');
    const geminiPayload = {
      contents: [
        ...(contextMsgs.length > 0 ? contextMsgs : []),
        lastUserMsg ? lastUserMsg : { role: 'user', parts: [{ text: '' }] }
      ]
    };

    // Gemini endpoint
    const endpoint = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100000);
    let geminiResponse;
    try {
      geminiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout - Gemini API took too long to respond' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to connect to Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status} - ${geminiResponse.statusText}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Response verwerken
    const responseData = await geminiResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const responsePayload: any = { 
      response: content,
      model: model
    };
    if (!isAnonymous && userData) {
      responsePayload.messageCount = userData.message_count + 1;
      responsePayload.messageLimit = userData.message_limit;
    }
    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 