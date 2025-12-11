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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `Analyze the text for tensions, contradictions, blind spots, and hidden risks.
Return JSON: { "tensions": [{ "type": "contradiction"|"blind_spot"|"hidden_risk"|"strategic_option", "severity": "low"|"medium"|"high", "title": "short title", "description": "explanation", "sourceA": "quote or null", "sourceB": "quote or null", "recommendation": "what to do" }] }
Find 2-5 meaningful tensions. Be specific and actionable.`
          },
          { role: 'user', content: text.slice(0, 8000) }
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ tensions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"tensions":[]}';
    
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
