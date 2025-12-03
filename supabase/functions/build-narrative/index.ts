import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessContext {
  companyName: string;
  industry: string;
  products: string[];
  valuePropositions: string[];
  brandVoice: string;
}

// Smart chunking for long inputs
function chunkText(text: string, maxChunkSize = 8000, overlap = 500): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to break at a paragraph or sentence
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      const sentenceBreak = text.lastIndexOf('. ', end);
      
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak;
      } else if (sentenceBreak > start + maxChunkSize / 2) {
        end = sentenceBreak + 1;
      }
    }

    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, businessContext } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Building narrative from text of length:', text.length);
    console.log('Business context provided:', !!businessContext);

    // Build context-aware system prompt
    let contextPrefix = '';
    if (businessContext) {
      contextPrefix = `You are creating a narrative for ${businessContext.companyName}, a company in the ${businessContext.industry} industry.
Their key products/services: ${businessContext.products.join(', ')}.
Their value propositions: ${businessContext.valuePropositions.join(', ')}.
Brand voice: ${businessContext.brandVoice}.

Tailor the narrative to align with their positioning and speak to their audience.

`;
    }

    const systemPrompt = `${contextPrefix}You are an expert narrative strategist. Your task is to analyze research and create a compelling, presentation-ready narrative.

Analyze the provided text and:
1. Extract 3-7 key themes with priority levels
2. Select the best presentation template
3. Generate a complete narrative with sections

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
          "score": 0.0 to 1.0
        }
      ]
    }
  ],
  "recommendedTemplate": "ZoomReveal" | "LinearStoryboard" | "FlyoverMap" | "ContrastSplit" | "PriorityLadder",
  "narrative": {
    "template": "ZoomReveal",
    "colorTheme": "darkCinematic",
    "iconSet": "minimal",
    "sections": [
      {
        "title": "Section Title",
        "content": "Main narrative content for this section (2-3 sentences)",
        "items": ["Key point 1", "Key point 2"],
        "position": { "x": 0, "y": 0 },
        "icon": "Lightbulb"
      }
    ],
    "transitions": [
      { "type": "zoom_in", "target": "section-1" }
    ]
  }
}

Template Selection Guide:
- ZoomReveal: Best for hierarchical data, big-picture to details
- LinearStoryboard: Best for chronological stories, step-by-step processes
- FlyoverMap: Best for geographic or spatial relationships
- ContrastSplit: Best for comparisons, pros/cons, before/after
- PriorityLadder: Best for ranked lists, priority-based content

Icon options: Lightbulb, TrendingUp, Target, Shield, AlertTriangle, CheckCircle, BarChart3, Users, Zap, Globe, Star, Award, Clock, DollarSign

Guidelines:
- Create 4-8 sections for a good narrative flow
- Each section should tell part of the story
- Use clear, concise language
- Focus on actionable insights
- Make titles punchy and memorable`;

    // Handle long inputs with chunking
    const chunks = chunkText(text);
    let combinedText = text;

    if (chunks.length > 1) {
      console.log(`Processing ${chunks.length} chunks...`);
      
      // For very long documents, summarize chunks first
      const summaries: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Summarizing chunk ${i + 1}/${chunks.length}...`);
        
        const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: 'Summarize the key themes, insights, and data from this text. Keep it concise but preserve all important information.' 
              },
              { role: 'user', content: chunks[i] }
            ],
          }),
        });

        if (!summaryResponse.ok) {
          console.error('Failed to summarize chunk:', await summaryResponse.text());
          continue;
        }

        const summaryData = await summaryResponse.json();
        const summary = summaryData.choices?.[0]?.message?.content;
        if (summary) {
          summaries.push(`=== Section ${i + 1} ===\n${summary}`);
        }
      }

      combinedText = summaries.join('\n\n');
    }

    // Main narrative generation
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
          { role: 'user', content: `Create a compelling narrative from this research:\n\n${combinedText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');

    // Parse the JSON from the response
    let result;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Add unique IDs
    const themesWithIds = (result.themes || []).map((theme: any) => ({
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

    const sectionsWithIds = (result.narrative?.sections || []).map((section: any, index: number) => ({
      id: crypto.randomUUID(),
      title: section.title,
      content: section.content,
      items: section.items,
      position: section.position || { x: index * 100, y: 0 },
      icon: section.icon || 'Lightbulb',
    }));

    const transitionsWithIds = (result.narrative?.transitions || []).map((transition: any, index: number) => ({
      type: transition.type || 'fade',
      target: sectionsWithIds[index]?.id || `section-${index}`,
      duration: transition.duration,
    }));

    console.log('Successfully built narrative with', themesWithIds.length, 'themes and', sectionsWithIds.length, 'sections');

    return new Response(
      JSON.stringify({
        themes: themesWithIds,
        recommendedTemplate: result.recommendedTemplate || 'ZoomReveal',
        narrative: {
          template: result.narrative?.template || result.recommendedTemplate || 'ZoomReveal',
          colorTheme: result.narrative?.colorTheme || 'darkCinematic',
          iconSet: result.narrative?.iconSet || 'minimal',
          sections: sectionsWithIds,
          transitions: transitionsWithIds,
        },
        businessContext: businessContext || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in build-narrative function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
