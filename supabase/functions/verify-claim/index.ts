import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationResult {
  status: "verified" | "unverified" | "uncertain";
  confidence: number; // 0-100
  sources: { title: string; url: string }[];
  summary?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim, context } = await req.json();
    
    if (!claim || typeof claim !== "string") {
      return new Response(
        JSON.stringify({ error: "Claim text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-claim] Verifying claim:", claim.slice(0, 100));

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Use Gemini with grounding/search capabilities to verify the claim
    const prompt = `You are a fact-checking assistant. Your task is to verify the following claim and determine if it's supported by real, verifiable information.

CLAIM TO VERIFY:
"${claim}"

${context ? `CONTEXT: ${context}` : ''}

Analyze this claim and provide:
1. Whether it appears to be VERIFIED (supported by evidence), UNVERIFIED (cannot find supporting evidence), or UNCERTAIN (mixed or insufficient evidence)
2. A confidence score from 0-100
3. A brief summary of your findings (1-2 sentences)

Consider:
- Is this a factual claim that can be verified?
- Are there specific numbers, dates, or statistics that can be checked?
- Is this from a reputable source or common knowledge?
- For business/industry claims, are they reasonable based on general knowledge?

Return a JSON object with this structure:
{
  "status": "verified" | "unverified" | "uncertain",
  "confidence": <number 0-100>,
  "summary": "<brief explanation>",
  "checkable": <boolean - whether this claim contains verifiable facts>
}

Be conservative - if you're unsure, mark as "uncertain". Only mark as "verified" if you have high confidence the claim is accurate.`;

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
      console.error("[verify-claim] Google AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", status: "uncertain", confidence: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("[verify-claim] Raw response:", content.slice(0, 300));

    // Parse the JSON response
    let result: VerificationResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      
      result = {
        status: parsed.status || "uncertain",
        confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
        sources: [], // Would need actual search API for real sources
        summary: parsed.summary || undefined,
      };
      
      // Adjust status based on checkability
      if (parsed.checkable === false) {
        result.status = "uncertain";
        result.summary = "This claim doesn't contain easily verifiable facts.";
      }
      
    } catch (parseErr) {
      console.error("[verify-claim] Parse error:", parseErr);
      result = {
        status: "uncertain",
        confidence: 50,
        sources: [],
        summary: "Unable to verify this claim.",
      };
    }

    console.log("[verify-claim] Result:", result.status, "confidence:", result.confidence);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[verify-claim] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        status: "uncertain",
        confidence: 0,
        sources: [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


