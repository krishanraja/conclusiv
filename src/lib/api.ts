import { supabase } from "@/integrations/supabase/client";
import { Theme } from "./types";

export interface ExtractThemesResponse {
  themes: Theme[];
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
