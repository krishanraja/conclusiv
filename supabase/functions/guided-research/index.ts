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
    const { phase, topic, context, audience, specificQuestions, query, depth } = await req.json();
    
    console.log('[guided-research] Request:', { phase, topic, depth });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    // Phase 1: Question Formulation (uses Lovable AI)
    if (phase === 'formulate') {
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `You are a research strategist helping formulate the perfect research query.
Given a topic and context, synthesize a clear, comprehensive research query and suggest follow-up questions.
Be specific and actionable. Focus on what would make a compelling business narrative.`;

      const userPrompt = `Topic: ${topic}
Context: ${context || 'General business research'}
Audience: ${audience || 'Executives'}
${specificQuestions ? `User's specific questions: ${specificQuestions.join(', ')}` : ''}

Generate:
1. A synthesized research query (2-3 sentences, specific and searchable)
2. 3-4 follow-up questions to refine the research

Return JSON: {
  "suggestedQuery": "...",
  "followUpQuestions": [
    { "id": "q1", "question": "...", "options": ["Option A", "Option B", "Option C"] },
    ...
  ]
}`;

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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[guided-research] Formulation error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to formulate query' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify(parsed),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to parse formulation response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase 2: Deep Research (uses Perplexity)
    if (phase === 'research') {
      if (!PERPLEXITY_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'PERPLEXITY_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Query required for research phase' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use sonar-deep-research for thorough research, sonar for quick
      const model = depth === 'deep' ? 'sonar-deep-research' : 'sonar-pro';
      
      console.log('[guided-research] Starting research with model:', model);

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: `You are a business research analyst. Provide comprehensive, factual research with citations.
Structure your response as:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Detailed Analysis
4. Sources and Citations

Be specific, data-driven, and actionable.` 
            },
            { role: 'user', content: query }
          ],
          search_recency_filter: 'month',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[guided-research] Research error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Research failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];

      console.log('[guided-research] Research complete, citations:', citations.length);

      // Parse the response into structured format
      const lines = content.split('\n');
      let summary = '';
      const keyFindings: string[] = [];
      let inFindings = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('executive summary') || trimmed.toLowerCase().includes('summary')) {
          inFindings = false;
          continue;
        }
        if (trimmed.toLowerCase().includes('key findings') || trimmed.toLowerCase().includes('key points')) {
          inFindings = true;
          continue;
        }
        if (trimmed.toLowerCase().includes('detailed analysis') || trimmed.toLowerCase().includes('analysis')) {
          inFindings = false;
        }
        
        if (inFindings && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
          keyFindings.push(trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        } else if (!inFindings && !summary && trimmed.length > 50) {
          summary = trimmed;
        }
      }

      return new Response(
        JSON.stringify({
          summary: summary || content.slice(0, 300),
          keyFindings: keyFindings.slice(0, 8),
          citations: citations.map((url: string) => ({
            url,
            title: url.split('/').pop()?.replace(/-/g, ' ') || 'Source',
          })),
          rawContent: content,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid phase. Use "formulate" or "research".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[guided-research] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
