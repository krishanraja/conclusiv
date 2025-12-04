import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileData, fileName, fileType } = await req.json();

    if (!fileData || !fileName || !fileType) {
      console.error('[parse-document] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing file data, name, or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[parse-document] Processing file:', fileName, 'Type:', fileType);

    // Check for unsupported file types - DOCX not supported by AI API
    if (fileType.includes('wordprocessingml') || fileType.includes('msword') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.error('[parse-document] Word documents not supported');
      return new Response(
        JSON.stringify({ 
          error: 'Word documents (.docx, .doc) are not yet supported. Please convert to PDF and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only accept PDF files
    if (fileType !== 'application/pdf') {
      console.error('[parse-document] Unsupported file type:', fileType);
      return new Response(
        JSON.stringify({ error: 'Only PDF files are supported at this time.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[parse-document] LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Convert binary to base64 for the API
    const base64ForAPI = btoa(String.fromCharCode(...binaryData));
    const dataUri = `data:application/pdf;base64,${base64ForAPI}`;

    console.log('[parse-document] Sending PDF to AI for extraction...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a document text extractor. Your job is to extract ALL the text content from the provided PDF document. Return ONLY the extracted text, nothing else. Preserve paragraph breaks. Do not add any commentary or formatting markers.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this PDF document. Return only the raw text content.'
              },
              {
                type: 'file',
                file: {
                  filename: fileName,
                  file_data: dataUri
                }
              }
            ]
          }
        ],
        max_tokens: 100000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[parse-document] AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content;

    if (!extractedText) {
      console.error('[parse-document] No text extracted from response');
      throw new Error('Failed to extract text from document');
    }

    console.log('[parse-document] Successfully extracted', extractedText.length, 'characters');

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[parse-document] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to parse document' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});