import { serve } from "std/server";
const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");

serve(async (req) => {
  const { messages, model, conversationId } = await req.json();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
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