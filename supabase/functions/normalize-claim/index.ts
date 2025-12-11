import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TITLE_MAX = 60;
const TEXT_MAX = 200;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, text } = await req.json();
    
    if (!title && !text) {
      return new Response(
        JSON.stringify({ error: 'Title or text required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[normalize-claim] Input:', { titleLen: title?.length, textLen: text?.length });

    // Check if normalization is needed
    const needsNormalization = (title?.length > TITLE_MAX * 1.5) || (text?.length > TEXT_MAX * 1.5);
    
    if (!needsNormalization) {
      // Just truncate if slightly over
      return new Response(
        JSON.stringify({
          title: title?.slice(0, TITLE_MAX) || '',
          text: text?.slice(0, TEXT_MAX) || '',
          normalized: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to normalize verbose content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[normalize-claim] LOVABLE_API_KEY not configured');
      // Fallback to truncation
      return new Response(
        JSON.stringify({
          title: title?.slice(0, TITLE_MAX) || '',
          text: text?.slice(0, TEXT_MAX) || '',
          normalized: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a concise editor. Clean up claims to be scannable and clear.
Rules:
- Title: 5-8 words max, action-oriented headline
- Text: Max 200 characters, one clear statement
- Preserve the core meaning
- Remove filler words and redundancy
- Use active voice`;

    const userPrompt = `Clean up this claim:

Title: ${title}
Text: ${text}

Return JSON only: {"title": "...", "text": "..."}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[normalize-claim] AI error:', response.status, errorText);
      // Fallback to truncation
      return new Response(
        JSON.stringify({
          title: title?.slice(0, TITLE_MAX) || '',
          text: text?.slice(0, TEXT_MAX) || '',
          normalized: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[normalize-claim] Normalized:', parsed);
      return new Response(
        JSON.stringify({
          title: parsed.title?.slice(0, TITLE_MAX) || title?.slice(0, TITLE_MAX),
          text: parsed.text?.slice(0, TEXT_MAX) || text?.slice(0, TEXT_MAX),
          normalized: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback
    return new Response(
      JSON.stringify({
        title: title?.slice(0, TITLE_MAX) || '',
        text: text?.slice(0, TEXT_MAX) || '',
        normalized: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[normalize-claim] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
