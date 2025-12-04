import { supabase } from "@/integrations/supabase/client";
import type { Theme, BusinessContext, NarrativeSchema, TemplateName, KeyClaim } from "./types";
import type { ErrorCode } from "@/components/ui/error-recovery";

export interface ExtractThemesResponse {
  themes: Theme[];
  error?: string;
}

export interface BuildNarrativeResponse {
  themes?: Theme[];
  recommendedTemplate?: TemplateName;
  narrative?: NarrativeSchema;
  businessContext?: BusinessContext;
  error?: string;
  errorCode?: ErrorCode;
}

export interface ScrapeBusinessContextResponse {
  context?: BusinessContext;
  error?: string;
  errorCode?: ErrorCode;
}

export interface ExtractClaimsResponse {
  claims?: KeyClaim[];
  error?: string;
}

export const extractThemesFromAI = async (text: string): Promise<ExtractThemesResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('extract-themes', {
      body: { text }
    });

    if (error) {
      console.error('[API] Edge function error:', error);
      throw new Error(error.message || 'Failed to extract themes');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { themes: data.themes };
  } catch (err) {
    console.error('[API] Error extracting themes:', err);
    return { 
      themes: [], 
      error: err instanceof Error ? err.message : 'Failed to extract themes' 
    };
  }
};

export const buildNarrative = async (
  text: string,
  businessContext?: BusinessContext | null,
  onProgress?: (stage: number, progress: number) => void
): Promise<BuildNarrativeResponse> => {
  try {
    console.log('[API] Building narrative', { 
      textLength: text.length, 
      hasContext: !!businessContext 
    });

    // Simulate progress stages during the API call
    const progressInterval = setInterval(() => {
      if (onProgress) {
        // Gradual progress simulation
        onProgress(1, 25);
        setTimeout(() => onProgress(2, 45), 2000);
        setTimeout(() => onProgress(3, 65), 5000);
        setTimeout(() => onProgress(4, 85), 10000);
      }
    }, 100);

    const { data, error } = await supabase.functions.invoke('build-narrative', {
      body: { 
        text,
        businessContext: businessContext || undefined
      }
    });

    clearInterval(progressInterval);
    if (onProgress) onProgress(4, 100);

    if (error) {
      console.error('[API] Edge function error:', error);
      
      // Map Supabase errors to our error codes
      const errorCode = mapErrorToCode(error);
      throw { message: error.message || 'Failed to build narrative', code: errorCode };
    }

    if (data.error) {
      throw { message: data.error, code: data.code || 'UNKNOWN' };
    }

    console.log('[API] Narrative built successfully', {
      themes: data.themes?.length,
      sections: data.narrative?.sections?.length
    });

    return {
      themes: data.themes,
      recommendedTemplate: data.recommendedTemplate,
      narrative: data.narrative,
      businessContext: data.businessContext,
    };
  } catch (err) {
    console.error('[API] Error building narrative:', err);
    
    const error = err as { message?: string; code?: ErrorCode };
    return { 
      error: error.message || 'Failed to build narrative',
      errorCode: error.code || 'UNKNOWN'
    };
  }
};

export const scrapeBusinessContext = async (url: string): Promise<ScrapeBusinessContextResponse> => {
  try {
    console.log('[API] Scraping business context', { url });

    const { data, error } = await supabase.functions.invoke('scrape-business-context', {
      body: { url }
    });

    if (error) {
      console.error('[API] Edge function error:', error);
      const errorCode = mapErrorToCode(error);
      throw { message: error.message || 'Failed to scrape business context', code: errorCode };
    }

    if (data.error) {
      throw { message: data.error, code: data.code || 'UNKNOWN' };
    }

    console.log('[API] Business context scraped', { 
      companyName: data.context?.companyName 
    });

    return { context: data.context };
  } catch (err) {
    console.error('[API] Error scraping business context:', err);
    
    const error = err as { message?: string; code?: ErrorCode };
    return { 
      error: error.message || 'Failed to scrape business context',
      errorCode: error.code || 'UNKNOWN'
    };
  }
};

// Helper to map various error formats to our ErrorCode type
function mapErrorToCode(error: unknown): ErrorCode {
  if (!error) return 'UNKNOWN';
  
  const err = error as { status?: number; message?: string };
  
  if (err.status === 429) return 'RATE_LIMIT';
  if (err.status === 402) return 'PAYMENT_REQUIRED';
  
  const message = String(err.message || '').toLowerCase();
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('parse') || message.includes('json')) return 'PARSE_ERROR';
  if (message.includes('network') || message.includes('fetch')) return 'NETWORK';
  
  return 'UNKNOWN';
}

export const extractKeyClaims = async (text: string): Promise<ExtractClaimsResponse> => {
  try {
    console.log('[API] Extracting key claims', { textLength: text.length });

    const { data, error } = await supabase.functions.invoke('extract-claims', {
      body: { text }
    });

    if (error) {
      console.error('[API] Edge function error:', error);
      throw new Error(error.message || 'Failed to extract claims');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    console.log('[API] Claims extracted', { count: data.claims?.length });

    return { claims: data.claims };
  } catch (err) {
    console.error('[API] Error extracting claims:', err);
    return { 
      error: err instanceof Error ? err.message : 'Failed to extract claims' 
    };
  }
};
