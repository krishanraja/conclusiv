-- Create research templates table
CREATE TABLE public.research_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  industry TEXT,
  primary_question_template TEXT,
  known_concerns_template TEXT,
  success_criteria_template TEXT,
  red_flags_template TEXT,
  audience TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own templates"
ON public.research_templates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert their own templates"
ON public.research_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates"
ON public.research_templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
ON public.research_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_research_templates_updated_at
BEFORE UPDATE ON public.research_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();