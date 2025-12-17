import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ tensions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');

    const systemPrompt = `Analyze the text for tensions, contradictions, blind spots, and hidden risks.
Return JSON: { "tensions": [{ "type": "contradiction"|"blind_spot"|"hidden_risk"|"strategic_option", "severity": "low"|"medium"|"high", "title": "short title", "description": "explanation", "sourceA": "quote or null", "sourceB": "quote or null", "recommendation": "what to do" }] }
Find 2-5 meaningful tensions. Be specific and actionable.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\nAnalyze this text:\n\n' + text.slice(0, 8000) }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      console.error('Google AI error:', response.status, await response.text());
      return new Response(JSON.stringify({ tensions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"tensions":[]}';
    
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      result = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content);
    } catch {
      result = { tensions: [] };
    }

    const tensionsWithIds = (result.tensions || []).map((t: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      ...t
    }));

    return new Response(JSON.stringify({ tensions: tensionsWithIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('extract-tensions error:', error);
    return new Response(JSON.stringify({ tensions: [], error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
