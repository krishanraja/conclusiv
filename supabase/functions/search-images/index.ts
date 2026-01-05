import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request for debugging
    console.log('[search-images] Request received:', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
    });

    // Parse request body with error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Request body is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestBody = JSON.parse(bodyText);
      console.log('[search-images] Request body:', { query: requestBody.query, perPage: requestBody.perPage });
    } catch (parseError) {
      console.error('[search-images] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, perPage = 8 } = requestBody;
    
    // Validate query
    if (!query) {
      console.error('[search-images] No query provided');
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate perPage
    const perPageNum = Number(perPage);
    if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 80) {
      return new Response(
        JSON.stringify({ error: 'perPage must be between 1 and 80' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY');
    if (!PEXELS_API_KEY) {
      console.error('[search-images] PEXELS_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Pexels API key not configured',
          hint: 'Please set PEXELS_API_KEY environment variable in Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key format (should start with a letter/number, be reasonably long)
    if (PEXELS_API_KEY.length < 20) {
      console.warn('[search-images] PEXELS_API_KEY seems too short, may be invalid');
    }

    console.log(`[search-images] Searching for: "${query}" (${perPage} images)`);

    // Clean up the query for better results
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=${perPageNum}&orientation=landscape`;
    
    console.log(`[search-images] Calling Pexels API: "${cleanQuery}" (${perPageNum} images)`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[search-images] Pexels API error: ${response.status} - ${errorText}`);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to search images';
      if (response.status === 401) {
        errorMessage = 'Invalid Pexels API key. Please check your configuration.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status >= 500) {
        errorMessage = 'Pexels API is temporarily unavailable. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          details: errorText.substring(0, 200) // Limit error text length
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: PexelsResponse = await response.json();
    
    console.log(`[search-images] Found ${data.total_results} results, returning ${data.photos.length} images`);

    // Transform to a simpler format
    const images = data.photos.map(photo => ({
      id: photo.id.toString(),
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || cleanQuery,
      width: photo.width,
      height: photo.height,
    }));

    return new Response(
      JSON.stringify({ 
        images,
        query: cleanQuery,
        totalResults: data.total_results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[search-images] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
