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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const goals = ['funding', 'alignment', 'adversarial'];
    const alternatives = [];

    for (const goal of goals) {
      const goalPrompts: Record<string, string> = {
        funding: 'Reframe this for investors: emphasize growth, market opportunity, traction, and ROI potential.',
        alignment: 'Reframe for internal alignment: emphasize shared goals, team coordination, and clear next steps.',
        adversarial: 'Play devil\'s advocate: highlight risks, challenges, what could go wrong, and blind spots.',
      };

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
              content: `You are a narrative strategist. ${goalPrompts[goal]}
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
}`
            },
            { role: 'user', content: `Original content:\n${text.slice(0, 6000)}` }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
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
