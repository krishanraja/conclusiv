import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, type = 'goal' } = await req.json();
    
    if (!input || typeof input !== "string") {
      return new Response(
        JSON.stringify({ error: "Input text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-narrative-intent] Processing:", type, "length:", input.length);

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    let prompt: string;
    
    if (type === 'goal') {
      prompt = `You are an expert at extracting clear narrative intent from executive communication.

The user has stated what they want their audience to take away from their presentation or document. Extract the structured intent.

USER INPUT:
"${input}"

Extract and return a JSON object with:
{
  "coreMessage": "The single most important takeaway in one clear sentence (max 20 words)",
  "targetAudience": "Who this message is for (e.g., 'Investors', 'Board', 'Team') - infer if not stated",
  "desiredOutcome": "What action or belief change they want (e.g., 'Approve funding', 'Align on strategy')"
}

Be concise and action-oriented. If something isn't clear, make a reasonable inference based on business context.
Return ONLY valid JSON, no markdown.`;
    } else if (type === 'objections') {
      prompt = `You are an expert at extracting objections and rebuttals from executive communication.

The user has described concerns their audience might have and how to address them.

USER INPUT:
"${input}"

Extract and return a JSON object with:
{
  "keyObjections": ["List of 2-4 key objections/concerns mentioned"],
  "rebuttals": ["How each objection is addressed, in same order"]
}

If rebuttals aren't clear, leave that array empty.
Return ONLY valid JSON, no markdown.`;
    } else {
      prompt = `You are an expert at extracting priority proof points from executive communication.

The user has described which evidence or proof points matter most to them.

USER INPUT:
"${input}"

Extract and return a JSON object with:
{
  "priorityProofPoints": ["List of 2-5 key proof points or evidence types mentioned, in order of priority"]
}

Focus on specific, tangible proof (metrics, testimonials, data) not vague claims.
Return ONLY valid JSON, no markdown.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extract-narrative-intent] Google AI error:", response.status, errorText);
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON
    let intent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      intent = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[extract-narrative-intent] Parse error:", parseErr);
      throw new Error("Failed to parse AI response");
    }

    console.log("[extract-narrative-intent] Extracted:", intent);

    return new Response(
      JSON.stringify({ intent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[extract-narrative-intent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
