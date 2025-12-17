import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from DOCX file (Office Open XML format)
async function extractTextFromDocx(base64Data: string): Promise<string> {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const zip = new JSZip();
    await zip.loadAsync(bytes);

    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) {
      throw new Error("Could not find document.xml in DOCX file");
    }

    const text = documentXml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();

    return text;
  } catch (error) {
    console.error("[parse-document] DOCX extraction error:", error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from PPTX file (Office Open XML format)
async function extractTextFromPptx(base64Data: string): Promise<string> {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const zip = new JSZip();
    await zip.loadAsync(bytes);

    const textParts: string[] = [];
    
    const slideFiles = Object.keys(zip.files).filter(
      name => name.match(/^ppt\/slides\/slide\d+\.xml$/)
    ).sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async("string");
      if (slideXml) {
        const slideNum = slideFile.match(/slide(\d+)/)?.[1];
        textParts.push(`\n--- Slide ${slideNum} ---\n`);
        
        const slideText = slideXml
          .replace(/<a:t>([^<]*)<\/a:t>/g, '$1 ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
        
        if (slideText) {
          textParts.push(slideText);
        }
      }
    }

    const notesFiles = Object.keys(zip.files).filter(
      name => name.match(/^ppt\/notesSlides\/notesSlide\d+\.xml$/)
    );

    if (notesFiles.length > 0) {
      textParts.push('\n\n--- Speaker Notes ---\n');
      for (const notesFile of notesFiles) {
        const notesXml = await zip.file(notesFile)?.async("string");
        if (notesXml) {
          const notesText = notesXml
            .replace(/<a:t>([^<]*)<\/a:t>/g, '$1 ')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
          
          if (notesText && notesText.length > 10) {
            textParts.push(notesText + '\n');
          }
        }
      }
    }

    return textParts.join('\n').trim();
  } catch (error) {
    console.error("[parse-document] PPTX extraction error:", error);
    throw new Error(`Failed to extract text from PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

serve(async (req) => {
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

    console.info(`[parse-document] Processing file: ${fileName} Type: ${fileType}`);

    let extractedText = '';

    // Handle DOCX files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileName.toLowerCase().endsWith('.docx')) {
      console.info('[parse-document] Extracting text from DOCX...');
      extractedText = await extractTextFromDocx(fileData);
      console.info(`[parse-document] Successfully extracted ${extractedText.length} characters from DOCX`);
    }
    // Handle PPTX files
    else if (fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
             fileName.toLowerCase().endsWith('.pptx')) {
      console.info('[parse-document] Extracting text from PPTX...');
      extractedText = await extractTextFromPptx(fileData);
      console.info(`[parse-document] Successfully extracted ${extractedText.length} characters from PPTX`);
    }
    // Handle PDF files - use AI API
    else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      console.info('[parse-document] Sending PDF to AI for extraction...');
      
      const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
      const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
      
      if (!GOOGLE_AI_API_KEY) {
        console.error('[parse-document] GOOGLE_AI_API_KEY not configured');
        throw new Error('GOOGLE_AI_API_KEY is not configured');
      }

      // Use chunked base64 conversion to avoid stack overflow on large files
      let base64ForAPI = '';
      const chunkSize = 32768;
      for (let i = 0; i < binaryData.length; i += chunkSize) {
        const chunk = binaryData.subarray(i, i + chunkSize);
        base64ForAPI += String.fromCharCode.apply(null, Array.from(chunk));
      }
      base64ForAPI = btoa(base64ForAPI);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: 'You are a document text extractor. Extract ALL the text content from this PDF document. Return ONLY the extracted text. Preserve paragraph breaks. Do not add commentary.' },
                { inlineData: { mimeType: 'application/pdf', data: base64ForAPI } }
              ]
            }],
            generationConfig: { maxOutputTokens: 100000 },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[parse-document] Google AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: 'PDF processing is temporarily limited due to high demand.',
              suggestion: 'Try uploading as a Word document (.docx) or paste text directly - these process instantly without limits.',
              code: 'RATE_LIMITED'
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw new Error(`Google AI error: ${response.status}`);
      }

      const data = await response.json();
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.info(`[parse-document] Successfully extracted ${extractedText.length} characters from PDF`);
    }
    // Unsupported file type
    else {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${fileType}. Please upload a PDF, Word (.docx), or PowerPoint (.pptx) file.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!extractedText || extractedText.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Could not extract meaningful text from the document. The file may be empty or corrupted.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
