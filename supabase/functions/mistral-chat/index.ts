import { serve } from "std/server";
const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

serve(async (req) => {
  const { messages, model, conversationId } = await req.json();

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      conversation_id: conversationId
    })
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
}); 