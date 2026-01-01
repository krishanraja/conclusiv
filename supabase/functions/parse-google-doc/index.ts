import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract document ID from various Google Docs URL formats
function extractDocId(url: string): string | null {
  // Handle various Google Docs URL formats:
  // https://docs.google.com/document/d/{DOC_ID}/edit
  // https://docs.google.com/document/d/{DOC_ID}/view
  // https://docs.google.com/document/d/{DOC_ID}/pub
  // https://docs.google.com/document/d/{DOC_ID}
  
  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      console.error('[parse-google-doc] Missing URL');
      return new Response(
        JSON.stringify({ error: 'Google Docs URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`[parse-google-doc] Processing URL: ${url}`);

    // Extract document ID from the URL
    const docId = extractDocId(url);
    
    if (!docId) {
      console.error('[parse-google-doc] Could not extract document ID from URL');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Google Docs URL. Please provide a valid Google Docs link.',
          suggestion: 'The URL should look like: https://docs.google.com/document/d/YOUR_DOC_ID/edit'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`[parse-google-doc] Extracted document ID: ${docId}`);

    // Fetch the document content as plain text
    // This works for publicly shared documents
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    
    console.info(`[parse-google-doc] Fetching from: ${exportUrl}`);

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Conclusiv/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`[parse-google-doc] Fetch failed with status: ${response.status}`);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Document not found. Please check the URL is correct.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 403 || response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot access this document. Please make sure the document is set to "Anyone with the link can view".',
            suggestion: 'In Google Docs, click Share → Change to "Anyone with the link" → Viewer'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Failed to fetch document: ${response.status}`);
    }

    const text = await response.text();
    
    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'The document appears to be empty or could not be read.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up the text - remove excessive whitespace but preserve paragraph structure
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.info(`[parse-google-doc] Successfully extracted ${cleanedText.length} characters`);

    return new Response(
      JSON.stringify({ text: cleanedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-google-doc] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to parse Google Doc',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


