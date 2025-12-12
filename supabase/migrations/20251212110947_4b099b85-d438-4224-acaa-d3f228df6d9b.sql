-- Create research_jobs table for async job processing
CREATE TABLE public.research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  query TEXT NOT NULL,
  depth TEXT NOT NULL DEFAULT 'quick',
  subject TEXT,
  decision_type TEXT,
  audience TEXT,
  results JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.research_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own research jobs" 
ON public.research_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research jobs" 
ON public.research_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research jobs" 
ON public.research_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all jobs"
ON public.research_jobs
FOR ALL
USING (auth.role() = 'service_role');

-- Create index for polling queries
CREATE INDEX idx_research_jobs_user_status ON public.research_jobs(user_id, status);
CREATE INDEX idx_research_jobs_pending ON public.research_jobs(status) WHERE status IN ('pending', 'processing');

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_jobs;