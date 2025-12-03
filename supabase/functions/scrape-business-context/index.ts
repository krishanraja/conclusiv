import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const requestStart = Date.now();
  
  log.info(requestId, 'Request received', { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    log.info(requestId, 'Scrape request', { url });

    if (!url || typeof url !== 'string') {
      log.warn(requestId, 'Invalid input: URL required');
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      log.error(requestId, 'LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    log.info(requestId, 'URL normalized', { original: url, normalized: normalizedUrl });

    // Fetch the website content
    let websiteContent = '';
    const fetchStart = Date.now();
    
    try {
      log.info(requestId, 'Fetching website content');
      
      const websiteResponse = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NarrativeBot/1.0)',
        },
      });
      
      log.timing(requestId, 'Website fetch', fetchStart);
      log.info(requestId, 'Website response', { 
        status: websiteResponse.status, 
        ok: websiteResponse.ok 
      });
      
      if (websiteResponse.ok) {
        const html = await websiteResponse.text();
        log.info(requestId, 'HTML received', { htmlLength: html.length });
        
        // Extract text content (simple extraction)
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000); // Limit to 10k chars
          
        log.info(requestId, 'Content extracted', { extractedLength: websiteContent.length });
      } else {
        log.warn(requestId, 'Website fetch failed', { status: websiteResponse.status });
      }
    } catch (fetchError) {
      log.error(requestId, 'Website fetch error', fetchError);
      // Continue with AI extraction from URL alone
    }

    // Use AI to extract business context
    const systemPrompt = `You are a business analyst. Extract company information from the website content provided.

Return a JSON object with this exact structure:
{
  "companyName": "Company Name",
  "industry": "Industry/Sector",
  "products": ["Product 1", "Product 2"],
  "valuePropositions": ["Value prop 1", "Value prop 2"],
  "brandVoice": "Professional/Casual/Technical/etc"
}

If information is not available, make reasonable inferences from the domain name and any available content.
Keep arrays to 3-5 items max.`;

    const userContent = websiteContent 
      ? `Website URL: ${normalizedUrl}\n\nWebsite Content:\n${websiteContent}`
      : `Website URL: ${normalizedUrl}\n\nNo content could be fetched. Please infer what you can from the domain name.`;

    log.info(requestId, 'Calling AI for context extraction', { 
      hasContent: !!websiteContent,
      contentLength: websiteContent.length
    });

    const aiStart = Date.now();
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
          { role: 'user', content: userContent }
        ],
      }),
    });

    log.timing(requestId, 'AI context extraction', aiStart);

    if (!response.ok) {
      const errorText = await response.text();
      log.error(requestId, 'AI gateway error', { status: response.status, error: errorText });
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached', code: 'PAYMENT_REQUIRED' }),
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

    // Parse JSON
    let context;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      context = JSON.parse(jsonStr);
      log.info(requestId, 'Context parsed', { companyName: context.companyName });
    } catch (parseError) {
      log.warn(requestId, 'JSON parse failed, using fallback', { error: String(parseError) });
      
      // Return a basic context from URL
      const domain = new URL(normalizedUrl).hostname.replace('www.', '');
      const name = domain.split('.')[0];
      context = {
        companyName: name.charAt(0).toUpperCase() + name.slice(1),
        industry: 'Technology',
        products: [],
        valuePropositions: [],
        brandVoice: 'Professional',
      };
      log.info(requestId, 'Using fallback context', { companyName: context.companyName });
    }

    log.timing(requestId, 'Total request', requestStart);
    log.info(requestId, 'Request complete', { 
      companyName: context.companyName,
      totalTimeMs: Date.now() - requestStart
    });

    return new Response(
      JSON.stringify({ context }),
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
