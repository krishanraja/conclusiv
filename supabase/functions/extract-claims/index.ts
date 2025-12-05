import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-claims] Processing text of length:", text.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert analyst who extracts key claims and facts from research documents.

Your task is to identify 8-10 of the most important claims, facts, or assertions from the provided text.

For each claim:
1. Extract the core assertion as a clear, concise statement
2. If possible, identify what part of the text it came from (optional source field)
3. Focus on claims that are substantive and would impact business decisions

Return a JSON object with a "claims" array containing objects with:
- id: unique string (e.g., "claim_1", "claim_2", etc.)
- text: the claim as a clear statement (max 200 chars)
- source: optional brief reference to where in the text this came from

Example output:
{
  "claims": [
    { "id": "claim_1", "text": "Market growth is projected at 15% annually through 2028", "source": "Market analysis section" },
    { "id": "claim_2", "text": "Customer acquisition costs have decreased 30% year-over-year" }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract key claims from this research:\n\n${text.slice(0, 30000)}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extract-claims] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("[extract-claims] Raw AI response:", content.slice(0, 500));

    // Parse the JSON from the response
    let claims;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      claims = parsed.claims || parsed;
    } catch (parseErr) {
      console.error("[extract-claims] Parse error:", parseErr);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Add default fields to claims
    const normalizedClaims = claims.map((claim: any, index: number) => ({
      id: claim.id || `claim_${index + 1}`,
      text: claim.text || "",
      source: claim.source || undefined,
      approved: null,
      flaggedMisleading: false,
    }));

    console.log("[extract-claims] Extracted", normalizedClaims.length, "claims");

    return new Response(
      JSON.stringify({ claims: normalizedClaims }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[extract-claims] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});