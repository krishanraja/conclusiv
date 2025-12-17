import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

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

// Parse research response into structured format
function parseResearchResponse(content: string) {
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

  return { summary: summary || content.slice(0, 300), keyFindings: keyFindings.slice(0, 8) };
}

// Execute the actual Perplexity research
async function executePerplexityResearch(query: string, depth: string, PERPLEXITY_API_KEY: string) {
  // Phase 1 fix: Default to sonar-pro (faster, 10-30s) instead of sonar-deep-research (2-5 min)
  // sonar-deep-research is only used for explicit "deep" research now
  const model = depth === 'deep' ? 'sonar-pro' : 'sonar'; // Changed from sonar-deep-research
  
  console.log('[guided-research] Executing research with model:', model);

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
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error('Research failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const citations = data.citations || [];

  console.log('[guided-research] Research complete, citations:', citations.length);

  const { summary, keyFindings } = parseResearchResponse(content);

  return {
    summary,
    keyFindings,
    citations: citations.map((url: string) => ({
      url,
      title: url.split('/').pop()?.replace(/-/g, ' ') || 'Source',
    })),
    rawContent: content,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phase, structuredInput, query, depth, transcript, decisionType, jobId } = await req.json();
    
    console.log('[guided-research] Request:', { phase, depth, jobId });

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Phase: Process background job
    if (phase === 'process-job' && jobId) {
      if (!PERPLEXITY_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(
          JSON.stringify({ error: 'Missing configuration' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Get the job
      const { data: job, error: jobError } = await supabase
        .from('research_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        console.error('[guided-research] Job not found:', jobId, jobError);
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update job to processing
      await supabase
        .from('research_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);

      try {
        // Execute the research
        const results = await executePerplexityResearch(job.query, job.depth, PERPLEXITY_API_KEY);

        // Update job with results
        await supabase
          .from('research_jobs')
          .update({ 
            status: 'completed', 
            results,
            completed_at: new Date().toISOString() 
          })
          .eq('id', jobId);

        console.log('[guided-research] Job completed:', jobId);

        return new Response(
          JSON.stringify({ success: true, jobId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (researchError) {
        console.error('[guided-research] Job failed:', jobId, researchError);
        
        await supabase
          .from('research_jobs')
          .update({ 
            status: 'failed', 
            error: researchError instanceof Error ? researchError.message : 'Research failed',
            completed_at: new Date().toISOString() 
          })
          .eq('id', jobId);

        return new Response(
          JSON.stringify({ error: 'Job failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Phase: Create a background job
    if (phase === 'create-job') {
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Query required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return job creation info - the client will handle DB insert with their auth context
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Create job in client with auth context' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase: Structure Voice Input
    if (phase === 'structure-voice') {
      if (!GOOGLE_AI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!transcript) {
        return new Response(
          JSON.stringify({ error: 'Transcript required for voice structuring' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = `You are an assistant that extracts structured research information from a user's stream-of-consciousness voice input.
Given a transcript, extract and return a JSON object with the following fields (only include fields that are clearly mentioned):
- companyName: The company or subject being researched
- websiteUrl: Any website or URL mentioned
- industry: The industry or sector
- primaryQuestion: The main question they want answered
- knownConcerns: Things they're already worried about
- successCriteria: What would make them say yes
- redFlags: What would make them say no

Return ONLY valid JSON, no other text.

Decision type context: ${decisionType}

Voice transcript:
"${transcript}"

Extract structured fields:`;

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
        console.error('[guided-research] Voice structuring error:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to structure voice input' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
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

    // Phase 1: Query Formulation (uses Google AI with structured input)
    if (phase === 'formulate') {
      if (!GOOGLE_AI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build query from structured input
      const researchQuery = buildResearchQuery(structuredInput);
      
      console.log('[guided-research] Built query from structured input:', researchQuery.slice(0, 200));

      // Use AI to refine and polish the query
      const prompt = `You are a research strategist. Given a structured research request, refine it into a clear, comprehensive query optimized for deep web research.
Keep the specificity - company names, URLs, industries, and specific questions should remain.
Make it search-engine friendly while maintaining the business context.
Return only the refined query, no JSON or other formatting.

${researchQuery}`;

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
        console.error('[guided-research] Formulation error:', response.status, errorText);
        // Fall back to the pre-built query if AI refinement fails
        return new Response(
          JSON.stringify({ suggestedQuery: researchQuery }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const refinedQuery = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || researchQuery;

      return new Response(
        JSON.stringify({ suggestedQuery: refinedQuery }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Phase 2: Direct Research (synchronous - for quick scans)
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

      try {
        const results = await executePerplexityResearch(query, depth || 'quick', PERPLEXITY_API_KEY);
        return new Response(
          JSON.stringify(results),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('[guided-research] Research error:', error);
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : 'Research failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid phase. Use "formulate", "research", "structure-voice", "create-job", or "process-job".' }),
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