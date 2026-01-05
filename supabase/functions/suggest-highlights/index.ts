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
    const { rawText, narrativeGoal } = await req.json();
    
    if (!rawText || typeof rawText !== "string") {
      return new Response(
        JSON.stringify({ error: "Raw text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!narrativeGoal || typeof narrativeGoal !== "string") {
      return new Response(
        JSON.stringify({ error: "Narrative goal is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[suggest-highlights] Analyzing text of length:", rawText.length);

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Truncate text if too long
    const textToAnalyze = rawText.slice(0, 15000);

    const prompt = `You are an expert at identifying key passages that support a narrative goal.

NARRATIVE GOAL (what the presenter wants to convey):
"${narrativeGoal}"

TEXT TO ANALYZE:
"""
${textToAnalyze}
"""

Identify 3-7 passages (exact text snippets from the document) that best support the narrative goal.

For each passage:
1. Find the EXACT text that appears in the document (must be a verbatim match)
2. Categorize it:
   - "proof_point": Hard evidence, data, metrics
   - "emotional_hook": Compelling story, human element
   - "credibility_signal": Awards, testimonials, partnerships
   - "key_metric": Specific numbers that impress

Return a JSON object:
{
  "highlights": [
    {
      "text": "The exact text snippet from the document (15-100 words)",
      "category": "proof_point|emotional_hook|credibility_signal|key_metric",
      "reason": "Why this supports the narrative (max 10 words)"
    }
  ]
}

CRITICAL: The "text" field must contain text that appears EXACTLY in the document. Do not paraphrase.
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
      console.error("[suggest-highlights] Google AI error:", response.status, errorText);
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
      console.error("[suggest-highlights] Parse error:", parseErr);
      throw new Error("Failed to parse AI response");
    }

    // Find actual positions in the text
    const highlightsWithPositions = (result.highlights || [])
      .map((h: any) => {
        const start = rawText.indexOf(h.text);
        if (start === -1) {
          // Try to find a close match (first 50 chars)
          const partialText = h.text.slice(0, 50);
          const partialStart = rawText.indexOf(partialText);
          if (partialStart !== -1) {
            // Find the end of the sentence or paragraph
            const endMatch = rawText.slice(partialStart).match(/[.!?]\s|\n\n/);
            const endOffset = endMatch ? endMatch.index! + 1 : h.text.length;
            return {
              start: partialStart,
              end: partialStart + endOffset,
              text: rawText.slice(partialStart, partialStart + endOffset),
              category: h.category,
              reason: h.reason,
            };
          }
          return null; // Skip if we can't find it
        }
        return {
          start,
          end: start + h.text.length,
          text: h.text,
          category: h.category,
          reason: h.reason,
        };
      })
      .filter(Boolean);

    console.log("[suggest-highlights] Found", highlightsWithPositions.length, "highlights");

    return new Response(
      JSON.stringify({ highlights: highlightsWithPositions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[suggest-highlights] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
