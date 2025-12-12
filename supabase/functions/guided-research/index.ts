import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StructuredInput {
  decisionType: string;
  companyName: string;
  websiteUrl?: string;
  industry?: string;
  primaryQuestion: string;
  knownConcerns?: string;
  successCriteria?: string;
  redFlags?: string;
  audience?: string;
}

// Build a specific, actionable research query from structured input
function buildResearchQuery(input: StructuredInput): string {
  const parts: string[] = [];
  
  // Target identification
  let target = input.companyName;
  if (input.websiteUrl) {
    target += ` (${input.websiteUrl})`;
  }
  if (input.industry) {
    target += `, a ${input.industry} company`;
  }
  
  // Decision context
  const contextMap: Record<string, string> = {
    'investment': 'for investment due diligence',
    'market entry': 'for market entry analysis',
    'competitive analysis': 'for competitive positioning',
    'trend analysis': 'for trend and future forecasting',
    'due diligence': 'for partnership due diligence',
    'opportunity sizing': 'for opportunity sizing and TAM analysis',
  };
  const context = contextMap[input.decisionType] || `for ${input.decisionType}`;
  
  parts.push(`Research ${target} ${context}.`);
  
  // Primary question
  if (input.primaryQuestion) {
    parts.push(`\n\nPrimary focus: ${input.primaryQuestion}`);
  }
  
  // Known concerns to investigate
  if (input.knownConcerns) {
    parts.push(`\n\nKnown concerns to investigate: ${input.knownConcerns}`);
  }
  
  // Success criteria
  if (input.successCriteria) {
    parts.push(`\n\nKey success indicators to verify: ${input.successCriteria}`);
  }
  
  // Red flags
  if (input.redFlags) {
    parts.push(`\n\nPotential red flags to look for: ${input.redFlags}`);
  }
  
  // Audience framing
  if (input.audience) {
    const audienceMap: Record<string, string> = {
      'self': 'exploratory research format',
      'team': 'tactical team briefing format',
      'execs': 'executive summary format with key metrics',
      'investors': 'investor-focused analysis with financial emphasis',
    };
    parts.push(`\n\nTailor output for: ${audienceMap[input.audience] || input.audience}`);
  }
  
  return parts.join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phase, structuredInput, query, depth, transcript, decisionType } = await req.json();
    
    console.log('[guided-research] Request:', { phase, depth });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    // Phase: Structure Voice Input
    if (phase === 'structure-voice') {
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!transcript) {
        return new Response(
          JSON.stringify({ error: 'Transcript required for voice structuring' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `You are an assistant that extracts structured research information from a user's stream-of-consciousness voice input.
Given a transcript, extract and return a JSON object with the following fields (only include fields that are clearly mentioned):
- companyName: The company or subject being researched
- websiteUrl: Any website or URL mentioned
- industry: The industry or sector
- primaryQuestion: The main question they want answered
- knownConcerns: Things they're already worried about
- successCriteria: What would make them say yes
- redFlags: What would make them say no

Return ONLY valid JSON, no other text.`;

      const userPrompt = `Decision type context: ${decisionType}

Voice transcript:
"${transcript}"

Extract structured fields:`;

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
        console.error('[guided-research] Voice structuring error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to structure voice input' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const structured = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ structured }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (e) {
          console.error('[guided-research] JSON parse error:', e);
        }
      }

      return new Response(
        JSON.stringify({ error: 'Failed to parse structured response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase 1: Query Formulation (uses Lovable AI with structured input)
    if (phase === 'formulate') {
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build query from structured input
      const researchQuery = buildResearchQuery(structuredInput);
      
      console.log('[guided-research] Built query from structured input:', researchQuery.slice(0, 200));

      // Use AI to refine and polish the query
      const systemPrompt = `You are a research strategist. Given a structured research request, refine it into a clear, comprehensive query optimized for deep web research.
Keep the specificity - company names, URLs, industries, and specific questions should remain.
Make it search-engine friendly while maintaining the business context.
Return only the refined query, no JSON or other formatting.`;

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
            { role: 'user', content: researchQuery }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[guided-research] Formulation error:', response.status, errorText);
        // Fall back to the pre-built query if AI refinement fails
        return new Response(
          JSON.stringify({ suggestedQuery: researchQuery }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const refinedQuery = data.choices?.[0]?.message?.content?.trim() || researchQuery;

      return new Response(
        JSON.stringify({ suggestedQuery: refinedQuery }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      // Use sonar-deep-research for thorough research, sonar-pro for quick
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
              content: `You are a business research analyst conducting due diligence. Provide comprehensive, factual research with citations.
Structure your response as:
1. Executive Summary (2-3 sentences answering the primary question)
2. Key Findings (bullet points with specific data points)
3. Detailed Analysis (organized by topic)
4. Risk Assessment (specific to the concerns raised)
5. Sources and Citations

Be specific, data-driven, and actionable. Include financial data, recent news, and market position where available.` 
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
      JSON.stringify({ error: 'Invalid phase. Use "formulate", "research", or "structure-voice".' }),
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
