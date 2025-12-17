import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    console.log('Extracting themes from text of length:', text.length);

    const prompt = `You are an expert research analyst. Your task is to analyze research text and extract structured themes.

Analyze the provided text and extract 3-7 key themes. For each theme, identify specific items (insights, risks, metrics, trends, opportunities, problems, or drivers).

You MUST respond with a valid JSON object in this exact format:
{
  "themes": [
    {
      "name": "Theme Name",
      "priority": "high" | "medium" | "low",
      "items": [
        {
          "text": "The specific insight or point",
          "type": "insight" | "risk" | "metric" | "trend" | "opportunity" | "problem" | "driver",
          "score": 0.0 to 1.0 (relevance/importance score)
        }
      ]
    }
  ]
}

Guidelines:
- Extract 3-7 themes based on content density
- Each theme should have 2-6 items
- Assign priority based on importance: "high" for critical themes, "medium" for supporting themes, "low" for minor themes
- Score items from 0.0-1.0 based on significance
- Type classification:
  - "insight": Key findings or conclusions
  - "risk": Potential dangers or challenges
  - "metric": Quantitative data or measurements
  - "trend": Patterns or directions
  - "opportunity": Potential advantages or possibilities
  - "problem": Issues or challenges identified
  - "driver": Factors causing change or impact

Detect common structures like SWOT analysis, competitive analysis, or problem-solution frameworks.

Analyze the following research text and extract themes:

${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');

    // Parse the JSON from the response
    let themes;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      themes = parsed.themes;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Add unique IDs to themes and items
    const themesWithIds = themes.map((theme: any) => ({
      id: crypto.randomUUID(),
      name: theme.name,
      priority: theme.priority || 'medium',
      keep: true,
      items: (theme.items || []).map((item: any) => ({
        id: crypto.randomUUID(),
        text: item.text,
        type: item.type || 'insight',
        score: item.score || 0.5,
      })),
    }));

    console.log('Successfully extracted', themesWithIds.length, 'themes');

    return new Response(
      JSON.stringify({ themes: themesWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-themes function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
