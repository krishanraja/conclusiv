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
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    console.log('Scraping business context from:', normalizedUrl);

    // Fetch the website content
    let websiteContent = '';
    try {
      const websiteResponse = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NarrativeBot/1.0)',
        },
      });
      
      if (websiteResponse.ok) {
        const html = await websiteResponse.text();
        // Extract text content (simple extraction)
        websiteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000); // Limit to 10k chars
      }
    } catch (fetchError) {
      console.error('Failed to fetch website:', fetchError);
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached' }),
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

    // Parse JSON
    let context;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      context = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
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
    }

    console.log('Successfully extracted business context for:', context.companyName);

    return new Response(
      JSON.stringify({ context }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-business-context function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
