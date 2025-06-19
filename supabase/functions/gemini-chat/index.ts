import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, connection, cache-control',
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

// Optimized timeouts for better performance
const GEMINI_API_TIMEOUT = 25000; // 25 seconds instead of 100

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Gemini Edge Function called at:', new Date().toISOString());
    
    // Optimized authentication check (similar to DeepSeek)
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')
    console.log('🔑 Auth header present:', !!authHeader);
    console.log('🔑 API key present:', !!apiKey);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    let user = null;
    let userData = null;
    let isAnonymous = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      console.log('🔍 Validating user token...');
      
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token)
      if (userError || !authUser) {
        console.log('❌ Invalid or expired token:', userError?.message);
        return new Response(
          JSON.stringify({ error: 'Ongeldige of verlopen token', details: userError?.message || 'Auth session missing!' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      user = authUser;
      console.log('✅ User authenticated:', user.email);
      
      // Fast user data fetch
      const { data: userDataResult, error: userDataError } = await supabaseAdmin
        .from('users')
        .select('message_count, message_limit, subscription_tier')
        .eq('id', user.id)
        .single()
      if (userDataError) {
        return new Response(
          JSON.stringify({ error: 'Kon gebruikersgegevens niet ophalen' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userData = userDataResult;
      if (userData.message_count >= userData.message_limit) {
        return new Response(
          JSON.stringify({ 
            error: 'Berichtenlimiet overschreden',
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
          JSON.stringify({ error: 'Ongeldige API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      isAnonymous = true;
    } else {
      return new Response(
        JSON.stringify({ error: 'Ontbrekende autorisatie header of API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    console.log('📥 Parsing request body...');
    const { messages, model, conversationId, stream: enableStreaming = false }: ChatRequest = await req.json()
    console.log('📥 Parsed request:', { messageCount: messages?.length, model, conversationId });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Berichtenarray is vereist' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert to Gemini format - optimized
    const geminiMessages: GeminiMessage[] = messages.map((msg) => {
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
    });

    // Build optimized payload for Gemini
    const geminiPayload = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Optimized for faster responses
      }
    };

    // Gemini endpoint with debug logging
    const modelId = model.replace(/^models\//, '');
    const endpoint = `${GEMINI_BASE_URL}/${modelId}:generateContent?key=${GEMINI_API_KEY}`;
    console.log('🔧 Gemini model debug:', {
      inputModel: model,
      processedModelId: modelId,
      finalEndpoint: endpoint.replace(GEMINI_API_KEY, '[API_KEY_HIDDEN]')
    });

    // Optimized timeout for Gemini API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Gemini API timeout after 25 seconds');
      controller.abort()
    }, GEMINI_API_TIMEOUT);
    
    let geminiResponse;
    try {
      console.log('📡 Sending optimized request to Gemini API...');
      geminiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('📡 Gemini API request completed');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Gemini API fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Verzoek timeout - Gemini API duurde te lang om te reageren' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Kon geen verbinding maken met Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API fout: ${geminiResponse.status} - ${geminiResponse.statusText}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Optimized message count increment (fire-and-forget)
    if (!isAnonymous && user && userData) {
      console.log('📊 Incrementing user message count...');
      supabaseAdmin
        .from('users')
        .update({ 
          message_count: userData.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .then(({ error: incrementError }) => {
          if (incrementError) {
            console.error('Failed to increment message count:', incrementError)
          } else {
            console.log('✅ Message count incremented successfully');
          }
        });
    }

    // Process response
    const responseData = await geminiResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content || content.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Lege response ontvangen van Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
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
    console.error('Gemini Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Interne serverfout', details: error instanceof Error ? error.message : error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 