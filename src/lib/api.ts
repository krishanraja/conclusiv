import { supabase } from "@/integrations/supabase/client";
import type { Theme, BusinessContext, NarrativeSchema, TemplateName, KeyClaim, Tension, NarrativeAlternative, AudienceMode, NarrativeArchetype, NarrativeDuration } from "./types";
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

export interface ExtractTensionsResponse {
  tensions?: Tension[];
  error?: string;
}

export interface GenerateAlternativesResponse {
  alternatives?: NarrativeAlternative[];
  error?: string;
}

export interface BuildNarrativeOptions {
  audienceMode?: AudienceMode | null;
  archetype?: NarrativeArchetype | null;
  duration?: NarrativeDuration;
  includeTensionSlide?: boolean;
}

// Brand data from Brandfetch
export interface BrandData {
  companyName?: string;
  logo?: {
    url: string;
    type: string;
    theme: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts?: {
    primary: string;
    secondary: string;
  };
  firmographics?: {
    employeeCount: number | null;
    foundedYear: number | null;
    location: string | null;
    companyKind: "public" | "private" | null;
  };
}

export interface FetchBrandDataResponse {
  data?: BrandData;
  error?: string;
}

// Guided research types
export interface GuidedResearchFormulateResponse {
  suggestedQuery?: string;
  followUpQuestions?: {
    id: string;
    question: string;
    options?: string[];
  }[];
  error?: string;
}

export interface GuidedResearchResponse {
  summary?: string;
  keyFindings?: string[];
  citations?: { url: string; title: string }[];
  rawContent?: string;
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
  onProgress?: (stage: number, progress: number) => void,
  options?: BuildNarrativeOptions
): Promise<BuildNarrativeResponse> => {
  try {
    console.log('[API] Building narrative', { 
      textLength: text.length, 
      hasContext: !!businessContext,
      options 
    });

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    if (onProgress) {
      onProgress(1, 25);
      timeouts.push(setTimeout(() => onProgress(2, 45), 2000));
      timeouts.push(setTimeout(() => onProgress(3, 65), 5000));
      timeouts.push(setTimeout(() => onProgress(4, 85), 10000));
    }

    const { data, error } = await supabase.functions.invoke('build-narrative', {
      body: { 
        text,
        businessContext: businessContext || undefined,
        audienceMode: options?.audienceMode || undefined,
        archetype: options?.archetype || undefined,
        duration: options?.duration || 'full',
        includeTensionSlide: options?.includeTensionSlide || false,
      }
    });

    timeouts.forEach(t => clearTimeout(t));
    if (onProgress) onProgress(4, 100);

    if (error) {
      console.error('[API] Edge function error:', error);
      const errorCode = mapErrorToCode(error);
      throw { message: error.message || 'Failed to build narrative', code: errorCode };
    }

    if (data.error) {
      throw { message: data.error, code: data.code || 'UNKNOWN' };
    }

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

export const extractTensions = async (text: string): Promise<ExtractTensionsResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('extract-tensions', {
      body: { text }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { tensions: data.tensions || [] };
  } catch (err) {
    console.error('[API] Error extracting tensions:', err);
    return { tensions: [], error: err instanceof Error ? err.message : 'Failed' };
  }
};

export const generateAlternatives = async (
  text: string,
  currentNarrative: NarrativeSchema,
  businessContext?: BusinessContext | null
): Promise<GenerateAlternativesResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-alternatives', {
      body: { text, currentNarrative, businessContext }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { alternatives: data.alternatives || [] };
  } catch (err) {
    console.error('[API] Error generating alternatives:', err);
    return { alternatives: [], error: err instanceof Error ? err.message : 'Failed' };
  }
};

export const scrapeBusinessContext = async (url: string): Promise<ScrapeBusinessContextResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-business-context', {
      body: { url }
    });

    if (error) {
      const errorCode = mapErrorToCode(error);
      throw { message: error.message || 'Failed to scrape', code: errorCode };
    }
    if (data.error) throw { message: data.error, code: data.code || 'UNKNOWN' };

    return { context: data.context };
  } catch (err) {
    const error = err as { message?: string; code?: ErrorCode };
    return { error: error.message || 'Failed', errorCode: error.code || 'UNKNOWN' };
  }
};

function mapErrorToCode(error: unknown): ErrorCode {
  if (!error) return 'UNKNOWN';
  const err = error as { status?: number; message?: string };
  if (err.status === 429) return 'RATE_LIMIT';
  if (err.status === 402) return 'PAYMENT_REQUIRED';
  const message = String(err.message || '').toLowerCase();
  if (message.includes('timeout')) return 'TIMEOUT';
  if (message.includes('parse') || message.includes('json')) return 'PARSE_ERROR';
  if (message.includes('network')) return 'NETWORK';
  return 'UNKNOWN';
}

export interface ParseDocumentResponse {
  text?: string;
  error?: string;
}

export const parseDocument = async (file: File): Promise<ParseDocumentResponse> => {
  try {
    const buffer = await file.arrayBuffer();
    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

    const { data, error } = await supabase.functions.invoke('parse-document', {
      body: { fileData: base64, fileName: file.name, fileType: file.type }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { text: data.text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed' };
  }
};

export const extractKeyClaims = async (text: string): Promise<ExtractClaimsResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('extract-claims', {
      body: { text }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { claims: data.claims };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed' };
  }
};

export interface NormalizeClaimResponse {
  title?: string;
  text?: string;
  normalized?: boolean;
  error?: string;
}

export const normalizeClaim = async (title: string, text: string): Promise<NormalizeClaimResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('normalize-claim', {
      body: { title, text }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { title: data.title, text: data.text, normalized: data.normalized };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to normalize claim' };
  }
};

// Fetch brand data from Brandfetch
export const fetchBrandData = async (domain: string): Promise<FetchBrandDataResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-brand-data', {
      body: { domain }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to fetch brand data' };
  }
};

// Guided research - formulate query
export const formulateResearchQuery = async (
  topic: string,
  context?: string,
  audience?: string,
  specificQuestions?: string[]
): Promise<GuidedResearchFormulateResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('guided-research', {
      body: { 
        phase: 'formulate',
        topic,
        context,
        audience,
        specificQuestions,
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return {
      suggestedQuery: data.suggestedQuery,
      followUpQuestions: data.followUpQuestions,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to formulate query' };
  }
};

// Guided research - execute research
export const executeResearch = async (
  query: string,
  depth: 'quick' | 'deep' = 'deep'
): Promise<GuidedResearchResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('guided-research', {
      body: { 
        phase: 'research',
        query,
        depth,
      }
    });

    if (error) throw new Error(error.message);
    if (data.error) throw new Error(data.error);

    return {
      summary: data.summary,
      keyFindings: data.keyFindings,
      citations: data.citations,
      rawContent: data.rawContent,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to execute research' };
  }
};
