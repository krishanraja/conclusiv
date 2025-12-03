import { supabase } from "@/integrations/supabase/client";
import { Theme, BusinessContext, NarrativeSchema, TemplateName } from "./types";

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
}

export interface ScrapeBusinessContextResponse {
  context?: BusinessContext;
  error?: string;
}

export const extractThemesFromAI = async (text: string): Promise<ExtractThemesResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('extract-themes', {
      body: { text }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to extract themes');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { themes: data.themes };
  } catch (err) {
    console.error('Error extracting themes:', err);
    return { 
      themes: [], 
      error: err instanceof Error ? err.message : 'Failed to extract themes' 
    };
  }
};

export const buildNarrative = async (
  text: string,
  businessContext?: BusinessContext | null
): Promise<BuildNarrativeResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('build-narrative', {
      body: { 
        text,
        businessContext: businessContext || undefined
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to build narrative');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      themes: data.themes,
      recommendedTemplate: data.recommendedTemplate,
      narrative: data.narrative,
      businessContext: data.businessContext,
    };
  } catch (err) {
    console.error('Error building narrative:', err);
    return { 
      error: err instanceof Error ? err.message : 'Failed to build narrative' 
    };
  }
};

export const scrapeBusinessContext = async (url: string): Promise<ScrapeBusinessContextResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-business-context', {
      body: { url }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to scrape business context');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { context: data.context };
  } catch (err) {
    console.error('Error scraping business context:', err);
    return { 
      error: err instanceof Error ? err.message : 'Failed to scrape business context' 
    };
  }
};
