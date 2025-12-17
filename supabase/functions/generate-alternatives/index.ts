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
    const { text, currentNarrative, businessContext } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ alternatives: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not configured');

    const goals = ['funding', 'alignment', 'adversarial'];
    const alternatives = [];

    for (const goal of goals) {
      const goalPrompts: Record<string, string> = {
        funding: 'Reframe this for investors: emphasize growth, market opportunity, traction, and ROI potential.',
        alignment: 'Reframe for internal alignment: emphasize shared goals, team coordination, and clear next steps.',
        adversarial: 'Play devil\'s advocate: highlight risks, challenges, what could go wrong, and blind spots.',
      };

      const prompt = `You are a narrative strategist. ${goalPrompts[goal]}
Return JSON with this structure:
{
  "rationale": "1-2 sentences explaining why this framing works",
  "narrative": {
    "template": "ZoomReveal",
    "colorTheme": "darkCinematic",
    "iconSet": "minimal",
    "sections": [{ "title": "...", "content": "...", "items": [], "position": {"x":0,"y":0}, "icon": "Lightbulb" }],
    "transitions": [{ "type": "fade", "target": "section-0" }]
  }
}

Original content:
${text.slice(0, 6000)}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content);
          
          const sectionsWithIds = (parsed.narrative?.sections || []).map((s: Record<string, unknown>, i: number) => ({
            id: crypto.randomUUID(),
            ...s,
            position: s.position || { x: i * 100, y: 0 }
          }));

          alternatives.push({
            id: crypto.randomUUID(),
            goal,
            goalLabel: goal === 'funding' ? 'Optimized for Funding' : goal === 'alignment' ? 'Internal Alignment' : 'Devil\'s Advocate',
            rationale: parsed.rationale || 'Alternative framing of your narrative',
            narrative: {
              ...parsed.narrative,
              sections: sectionsWithIds,
              transitions: parsed.narrative?.transitions || []
            }
          });
        } catch (e) {
          console.error('Failed to parse alternative:', e);
        }
      }
    }

    return new Response(JSON.stringify({ alternatives }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('generate-alternatives error:', error);
    return new Response(JSON.stringify({ alternatives: [], error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
