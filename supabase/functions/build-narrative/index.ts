import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Structured logging
const log = {
  info: (context: string, message: string, data?: Record<string, unknown>) => 
    console.log(`[INFO][${context}] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (context: string, message: string, data?: Record<string, unknown>) => 
    console.warn(`[WARN][${context}] ${message}`, data ? JSON.stringify(data) : ''),
  error: (context: string, message: string, error?: unknown) => 
    console.error(`[ERROR][${context}] ${message}`, error),
  timing: (context: string, operation: string, startTime: number) => 
    console.log(`[TIMING][${context}] ${operation}: ${Date.now() - startTime}ms`),
};

interface BusinessContext {
  companyName: string;
  industry: string;
  products: string[];
  valuePropositions: string[];
  brandVoice: string;
}

interface CompanyBrain {
  historicalThemes: string[];
  tonePatterns: Record<string, string>;
  strategicGuardrails: string[];
  emphasizedTopics: string[];
}

type AudienceMode = "exec" | "product" | "investors" | "clients" | "ops" | "briefing";
type NarrativeArchetype = "strategy_brief" | "exec_decision_memo" | "investor_pitch" | "gtm_plan" | "problem_framing" | "root_cause" | "workshop_outline" | "competitive_teardown";
type NarrativeDuration = "10s" | "1min" | "5min" | "full";

// Audience-specific prompt modifiers
const audiencePrompts: Record<AudienceMode, string> = {
  exec: `AUDIENCE: C-Suite Executives
- Use high-level strategic language
- Focus on business impact and ROI
- Minimize technical details
- Lead with decisions needed, not background
- Every section should answer "So what?" for leadership
- Include clear recommendations and next steps`,

  product: `AUDIENCE: Product Team
- Include technical depth where relevant
- Focus on user impact and feature implications
- Connect to roadmap and priorities
- Use product terminology naturally
- Highlight dependencies and technical considerations
- Include metrics that matter for product decisions`,

  investors: `AUDIENCE: Investors
- Lead with market opportunity and growth potential
- Include relevant metrics and traction data
- Address risks proactively with mitigations
- Show competitive differentiation clearly
- Focus on scalability and unit economics
- Use confident but substantiated claims`,

  clients: `AUDIENCE: External Clients
- Emphasize value delivery and outcomes
- Build trust through credibility signals
- Focus on their problems, not your solution
- Use accessible, non-jargon language
- Include proof points and social proof
- Make next steps crystal clear`,

  ops: `AUDIENCE: Operations Team
- Focus on process clarity and dependencies
- Include timelines and milestones
- Highlight resource requirements
- Address implementation concerns
- Be specific about responsibilities
- Include risk factors and contingencies`,

  briefing: `AUDIENCE: Military-Style Briefing
- Use crisp, direct language - no fluff
- Structure: Situation, Mission, Execution, Admin, Command
- Lead with the bottom line up front (BLUF)
- Use bullet points over paragraphs
- Include clear success criteria
- Time-bound all actions`,
};

// Archetype-specific prompt modifiers
const archetypePrompts: Record<NarrativeArchetype, string> = {
  strategy_brief: `ARCHETYPE: Strategy Brief
Structure the narrative as:
1. Strategic Context - The landscape
2. The Opportunity/Challenge - What we're facing
3. Strategic Options - Paths forward
4. Recommended Approach - Our best bet
5. Key Risks - What could go wrong
6. Success Metrics - How we'll know it worked
Focus on strategic thinking, not tactical details.`,

  exec_decision_memo: `ARCHETYPE: Executive Decision Memo
Structure the narrative as:
1. Decision Required - What needs deciding
2. Background - Essential context only
3. Options Considered - Usually 3 options
4. Recommendation - Your pick and why
5. Implications - What happens next
6. Ask - What you need from them
Be direct and decisive. Executives want your recommendation.`,

  investor_pitch: `ARCHETYPE: Investor Pitch
Structure the narrative as:
1. The Problem - Pain point that exists
2. The Solution - How you solve it
3. Market Size - TAM/SAM/SOM
4. Traction - What you've achieved
5. Business Model - How you make money
6. The Ask - What you want
Make it compelling. This is a sales document.`,

  gtm_plan: `ARCHETYPE: Go-To-Market Plan
Structure the narrative as:
1. Market Opportunity - Where we're going
2. Target Segments - Who we're targeting first
3. Value Proposition - Why they'll buy
4. Channel Strategy - How we'll reach them
5. Launch Plan - The rollout
6. Success Metrics - KPIs to track
Be specific about tactics, not just strategy.`,

  problem_framing: `ARCHETYPE: Problem Framing
Structure the narrative as:
1. The Symptom - What we're observing
2. The Real Problem - What's actually happening
3. Root Causes - Why it's happening
4. Impact - Why it matters
5. Constraints - What we're working with
6. Reframe - The question we should be asking
Don't jump to solutions. This is about understanding.`,

  root_cause: `ARCHETYPE: Root Cause Analysis
Structure the narrative as:
1. Issue Statement - What went wrong
2. Timeline - Sequence of events
3. Contributing Factors - What enabled it
4. Root Cause - The fundamental issue
5. Corrective Actions - How to fix it
6. Preventive Measures - How to prevent recurrence
Be thorough and non-blaming. Focus on systems.`,

  workshop_outline: `ARCHETYPE: Workshop Outline
Structure the narrative as:
1. Workshop Objectives - What we'll achieve
2. Pre-Work - What attendees should prepare
3. Session Flow - The agenda breakdown
4. Key Activities - Exercises and discussions
5. Expected Outputs - What we'll produce
6. Next Steps - What happens after
Make it actionable for a facilitator.`,

  competitive_teardown: `ARCHETYPE: Competitive Teardown
Structure the narrative as:
1. Competitor Overview - Who they are
2. Their Strategy - What they're doing
3. Strengths - Where they excel
4. Weaknesses - Where they're vulnerable
5. Our Differentiation - How we're different
6. Strategic Implications - What this means for us
Be objective but strategic. Find the insights.`,
};

// Duration-specific prompt modifiers
const durationPrompts: Record<NarrativeDuration, string> = {
  "10s": `LENGTH: Ultra-Brief (10-second read)
- Create exactly 2-3 sections maximum
- Each section: one headline, one sentence max
- No bullet points - headlines only
- This is an elevator pitch, not a document
- Total content should fit on one slide`,

  "1min": `LENGTH: Brief (1-minute read)
- Create 3-4 sections maximum
- Each section: headline + 2-3 tight bullet points
- No paragraphs, just crisp bullets
- Focus on the absolute essentials
- Reader should grasp key message in 60 seconds`,

  "5min": `LENGTH: Standard (5-minute read)
- Create 5-6 sections
- Each section: headline + short paragraph + 3-4 bullets
- Include supporting evidence
- Allow for moderate detail
- This is a complete but concise brief`,

  full: `LENGTH: Comprehensive (Full depth)
- Create 6-8 sections for complete coverage
- Each section: headline + full explanation + detailed bullets
- Include all relevant context and evidence
- Don't truncate for brevity
- This is a thorough document`,
};

// Smart chunking for long inputs
function chunkText(text: string, maxChunkSize = 8000, overlap = 500): string[] {
  log.info('chunking', 'Starting text chunking', { 
    textLength: text.length, 
    maxChunkSize, 
    overlap 
  });

  if (text.length <= maxChunkSize) {
    log.info('chunking', 'Text fits in single chunk');
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

  log.info('chunking', 'Chunking complete', { chunkCount: chunks.length });
  return chunks;
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      log.warn('retry', `Attempt ${attempt}/${maxAttempts} failed`, { error: String(error) });
      if (attempt === maxAttempts) throw error;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      log.info('retry', `Waiting ${delay}ms before retry`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStart = Date.now();
  
  log.info(requestId, 'Request received', { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      businessContext, 
      audienceMode, 
      archetype, 
      duration = 'full',
      includeTensionSlide = false,
      companyBrain
    } = await req.json();
    
    log.info(requestId, 'Request parsed', { 
      textLength: text?.length || 0,
      hasBusinessContext: !!businessContext,
      businessName: businessContext?.companyName,
      audienceMode,
      archetype,
      duration,
      includeTensionSlide,
      hasCompanyBrain: !!companyBrain
    });

    // Input validation
    if (!text || typeof text !== 'string') {
      log.warn(requestId, 'Invalid input: text required');
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 20) {
      log.warn(requestId, 'Input too short', { length: trimmedText.length });
      return new Response(
        JSON.stringify({ error: 'Text is too short. Please provide at least 20 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      log.error(requestId, 'LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    let contextPrefix = '';
    
    // Business context
    if (businessContext) {
      log.info(requestId, 'Building context-aware prompt', { 
        company: businessContext.companyName 
      });
      contextPrefix += `You are creating a narrative for ${businessContext.companyName}, a company in the ${businessContext.industry} industry.
Their key products/services: ${businessContext.products.join(', ')}.
Their value propositions: ${businessContext.valuePropositions.join(', ')}.
Brand voice: ${businessContext.brandVoice}.

Tailor the narrative to align with their positioning and speak to their audience.

`;
    }

    // Company brain context
    if (companyBrain) {
      log.info(requestId, 'Injecting company brain context');
      const brain = companyBrain as CompanyBrain;
      if (brain.historicalThemes?.length > 0) {
        contextPrefix += `HISTORICAL CONTEXT: This company has previously emphasized these themes: ${brain.historicalThemes.join(', ')}.
`;
      }
      if (brain.strategicGuardrails?.length > 0) {
        contextPrefix += `STRATEGIC GUARDRAILS: Avoid contradicting these established positions: ${brain.strategicGuardrails.join('; ')}.
`;
      }
      if (brain.emphasizedTopics?.length > 0) {
        contextPrefix += `KEY TOPICS: These topics are particularly important to this company: ${brain.emphasizedTopics.join(', ')}.
`;
      }
      contextPrefix += '\n';
    }

    // Audience mode
    if (audienceMode && audiencePrompts[audienceMode as AudienceMode]) {
      log.info(requestId, 'Applying audience mode', { audienceMode });
      contextPrefix += audiencePrompts[audienceMode as AudienceMode] + '\n\n';
    }

    // Archetype
    if (archetype && archetypePrompts[archetype as NarrativeArchetype]) {
      log.info(requestId, 'Applying archetype', { archetype });
      contextPrefix += archetypePrompts[archetype as NarrativeArchetype] + '\n\n';
    }

    // Duration
    if (duration && durationPrompts[duration as NarrativeDuration]) {
      log.info(requestId, 'Applying duration constraints', { duration });
      contextPrefix += durationPrompts[duration as NarrativeDuration] + '\n\n';
    }

    // Tension slide
    if (includeTensionSlide) {
      log.info(requestId, 'Including tension slide instruction');
      contextPrefix += `SPECIAL INSTRUCTION: Include a "Tension" or "Blind Spot" section that surfaces contradictions, hidden risks, or strategic tensions in the content. This should feel like a consultant's secret weapon - surfacing what others might miss.

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
- Make titles punchy and memorable
- For short inputs (<500 chars), create 2-4 sections
- For very long inputs, synthesize the key themes rather than covering everything`;

    // Handle long inputs with chunking
    const chunks = chunkText(trimmedText);
    let combinedText = trimmedText;

    if (chunks.length > 1) {
      log.info(requestId, 'Processing multiple chunks', { chunkCount: chunks.length });
      
      // For very long documents, summarize chunks first
      const summaries: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkStart = Date.now();
        log.info(requestId, `Processing chunk ${i + 1}/${chunks.length}`, { 
          chunkLength: chunks[i].length 
        });
        
        const summaryResponse = await retryWithBackoff(async () => {
          return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: 'Summarize the key themes, insights, and data from this text. Keep it concise but preserve all important information. Focus on actionable insights.' 
                },
                { role: 'user', content: chunks[i] }
              ],
            }),
          });
        });

        log.timing(requestId, `Chunk ${i + 1} API call`, chunkStart);

        if (!summaryResponse.ok) {
          const errorText = await summaryResponse.text();
          log.error(requestId, `Chunk ${i + 1} summarization failed`, { 
            status: summaryResponse.status, 
            error: errorText 
          });
          continue;
        }

        const summaryData = await summaryResponse.json();
        const summary = summaryData.choices?.[0]?.message?.content;
        if (summary) {
          summaries.push(`=== Section ${i + 1} ===\n${summary}`);
          log.info(requestId, `Chunk ${i + 1} summarized`, { summaryLength: summary.length });
        }
      }

      combinedText = summaries.join('\n\n');
      log.info(requestId, 'All chunks combined', { combinedLength: combinedText.length });
    }

    // Main narrative generation
    const mainStart = Date.now();
    log.info(requestId, 'Starting main narrative generation');

    const response = await retryWithBackoff(async () => {
      return fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
    });

    log.timing(requestId, 'Main narrative API call', mainStart);

    if (!response.ok) {
      const errorText = await response.text();
      log.error(requestId, 'AI gateway error', { status: response.status, error: errorText });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.', code: 'PAYMENT_REQUIRED' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      log.error(requestId, 'No content in AI response');
      throw new Error('No content in AI response');
    }

    log.info(requestId, 'AI response received', { contentLength: content.length });

    // Parse the JSON from the response
    let result;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      result = JSON.parse(jsonStr);
      log.info(requestId, 'JSON parsed successfully', {
        themeCount: result.themes?.length,
        sectionCount: result.narrative?.sections?.length,
        template: result.recommendedTemplate
      });
    } catch (parseError) {
      log.error(requestId, 'JSON parse failed', { 
        error: String(parseError),
        contentPreview: content.slice(0, 200)
      });
      
      // Attempt recovery: try to extract JSON from malformed response
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        try {
          result = JSON.parse(content.slice(jsonStartIndex, jsonEndIndex + 1));
          log.info(requestId, 'JSON recovery successful');
        } catch {
          log.error(requestId, 'JSON recovery failed');
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Add unique IDs
    const themesWithIds = (result.themes || []).map((theme: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      name: theme.name,
      priority: theme.priority || 'medium',
      keep: true,
      items: ((theme.items as Array<Record<string, unknown>>) || []).map((item) => ({
        id: crypto.randomUUID(),
        text: item.text,
        type: item.type || 'insight',
        score: item.score || 0.5,
      })),
    }));

    const sectionsWithIds = ((result.narrative?.sections as Array<Record<string, unknown>>) || []).map((section, index: number) => ({
      id: crypto.randomUUID(),
      title: section.title,
      content: section.content,
      items: section.items,
      position: section.position || { x: index * 100, y: 0 },
      icon: section.icon || 'Lightbulb',
    }));

    const transitionsWithIds = ((result.narrative?.transitions as Array<Record<string, unknown>>) || []).map((transition, index: number) => ({
      type: transition.type || 'fade',
      target: sectionsWithIds[index]?.id || `section-${index}`,
      duration: transition.duration,
    }));

    log.timing(requestId, 'Total request processing', requestStart);
    log.info(requestId, 'Request complete', {
      themes: themesWithIds.length,
      sections: sectionsWithIds.length,
      totalTimeMs: Date.now() - requestStart
    });

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
        audienceMode: audienceMode || null,
        archetype: archetype || null,
        duration: duration || 'full',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error(requestId, 'Request failed', error);
    log.timing(requestId, 'Failed request duration', requestStart);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
