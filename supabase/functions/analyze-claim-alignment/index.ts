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
    const { claims, narrativeGoal } = await req.json();
    
    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      return new Response(
        JSON.stringify({ error: "Claims array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!narrativeGoal || typeof narrativeGoal !== "string") {
      return new Response(
        JSON.stringify({ error: "Narrative goal is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-claim-alignment] Analyzing", claims.length, "claims against goal");

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const claimsText = claims.map((c: any, i: number) => 
      `${i + 1}. ID: "${c.id}" | Title: "${c.title}" | Text: "${c.text}"`
    ).join("\n");

    const prompt = `You are an expert at analyzing how claims and facts align with a presenter's narrative goal.

NARRATIVE GOAL (what the presenter wants their audience to believe):
"${narrativeGoal}"

CLAIMS TO ANALYZE:
${claimsText}

For each claim, determine its alignment with the narrative goal:

- "supports": Directly supports or reinforces the narrative goal
- "potential_objection": Could raise concerns but can be addressed (e.g., risks with mitigations)
- "undermines": Contradicts or weakens the narrative goal
- "neutral": Neither helps nor hurts the narrative

Return a JSON object:
{
  "claims": [
    { "id": "claim_id", "alignment": "supports|potential_objection|undermines|neutral", "reason": "Brief explanation (max 15 words)" }
  ]
}

Be thoughtful - a claim about risks isn't automatically "undermines" if it shows awareness and mitigation.
Return ONLY valid JSON, no markdown.`;

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
      console.error("[analyze-claim-alignment] Google AI error:", response.status, errorText);
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[analyze-claim-alignment] Parse error:", parseErr);
      throw new Error("Failed to parse AI response");
    }

    console.log("[analyze-claim-alignment] Analyzed", result.claims?.length, "claims");

    return new Response(
      JSON.stringify({ claims: result.claims }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-claim-alignment] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
