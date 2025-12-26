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

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    const prompt = `You are an expert analyst who extracts key claims and facts from research documents.

Your task is to identify the most important claims, facts, or assertions from the provided text. Extract as many claims as are genuinely significant - this could be 5 for a short document or 15+ for a comprehensive one. Focus on quality over hitting a specific number.

For each claim:
1. Create a SHORT, scannable title (5-8 words max) that captures the insight
2. Extract the core assertion as a clear, concise statement
3. If possible, identify what part of the text it came from (optional source field)
4. Focus on claims that are substantive and would impact business decisions
5. IMPORTANT: If the document explicitly mentions alternative options, competing choices, or different possibilities for this claim (e.g., multiple ICP targets, different market segments, alternative strategies), include them in the "alternatives" array

The title should be:
- Action-oriented or insight-focused
- Easy to scan quickly
- Never start with "The" or "A"

Return a JSON object with a "claims" array containing objects with:
- id: unique string (e.g., "claim_1", "claim_2", etc.)
- title: short scannable headline (5-8 words max)
- text: the full claim as a clear statement (max 200 chars)
- source: optional brief reference to where in the text this came from
- alternatives: optional array of alternative options ONLY if the document explicitly mentions other valid choices. Each alternative has { title, text }. Do NOT fabricate alternatives - only include them when the source document explicitly presents multiple options.

Example output:
{
  "claims": [
    { "id": "claim_1", "title": "15% Annual Market Growth Through 2028", "text": "Market growth is projected at 15% annually through 2028, driven by increased adoption in emerging markets.", "source": "Market analysis section" },
    { "id": "claim_2", "title": "Prioritize Music Educators as ICP", "text": "Music educators (choir/band directors) are the priority ICP due to high pain and a budget.", "source": "ICP Selection & Prioritization", "alternatives": [
      { "title": "Prioritize Dance Studios as ICP", "text": "Dance studios represent a strong alternative ICP with recurring revenue needs and scheduling pain points." },
      { "title": "Prioritize Private Music Teachers as ICP", "text": "Private music instructors have high volume and clear billing challenges, making them a viable primary target." }
    ] }
  ]
}

Extract key claims from this research:

${text.slice(0, 30000)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[extract-claims] Google AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
      title: claim.title || `Claim ${index + 1}`,
      text: claim.text || "",
      source: claim.source || undefined,
      approved: null,
      flaggedMisleading: false,
      alternatives: Array.isArray(claim.alternatives) && claim.alternatives.length > 0
        ? claim.alternatives.map((alt: any) => ({
            title: alt.title || "",
            text: alt.text || "",
          }))
        : undefined,
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