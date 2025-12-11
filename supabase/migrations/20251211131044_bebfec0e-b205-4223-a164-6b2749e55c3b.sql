-- Create company_brain table for persistent company context
CREATE TABLE public.company_brain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT,
  historical_themes JSONB DEFAULT '[]'::jsonb,
  tone_patterns JSONB DEFAULT '{}'::jsonb,
  strategic_guardrails TEXT[] DEFAULT ARRAY[]::TEXT[],
  emphasized_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  narratives_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_brain ENABLE ROW LEVEL SECURITY;

-- Users can view their own company brain
CREATE POLICY "Users can view their own company brain"
ON public.company_brain
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own company brain
CREATE POLICY "Users can insert their own company brain"
ON public.company_brain
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own company brain
CREATE POLICY "Users can update their own company brain"
ON public.company_brain
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own company brain
CREATE POLICY "Users can delete their own company brain"
ON public.company_brain
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_company_brain_updated_at
BEFORE UPDATE ON public.company_brain
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();