-- Phase 2-4: Tables for 2X customer value features

-- 1. Research history table for storing research queries and results
CREATE TABLE IF NOT EXISTS public.research_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  subject TEXT,
  decision_type TEXT,
  audience TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Presentation analytics table for tracking views
CREATE TABLE IF NOT EXISTS public.presentation_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE CASCADE,
  share_id TEXT NOT NULL,
  viewer_id TEXT, -- anonymous or user id
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'section_view', 'complete', 'time_spent'
  section_index INTEGER,
  time_spent_seconds INTEGER,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Narrative comments for collaborative feedback
CREATE TABLE IF NOT EXISTS public.narrative_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT,
  section_id TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.narrative_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Add password field to narratives for protected sharing
ALTER TABLE public.narratives ADD COLUMN IF NOT EXISTS share_password TEXT;

-- 5. Presenter notes table
CREATE TABLE IF NOT EXISTS public.presenter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(narrative_id, section_id)
);

-- Enable RLS on all tables
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenter_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for research_history
CREATE POLICY "Users can view their own research history"
  ON public.research_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research history"
  ON public.research_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research history"
  ON public.research_history FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for presentation_analytics (public for tracking, owner can view all)
CREATE POLICY "Anyone can insert analytics"
  ON public.presentation_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Narrative owners can view their analytics"
  ON public.presentation_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.narratives n
      WHERE n.id = narrative_id AND n.user_id = auth.uid()
    )
  );

-- RLS policies for narrative_comments (public for shared narratives)
CREATE POLICY "Anyone can view comments on public narratives"
  ON public.narrative_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.narratives n
      WHERE n.id = narrative_id AND n.is_public = true
    )
  );

CREATE POLICY "Anyone can add comments to public narratives"
  ON public.narrative_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.narratives n
      WHERE n.id = narrative_id AND n.is_public = true
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.narrative_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for presenter_notes
CREATE POLICY "Users can manage notes for their narratives"
  ON public.presenter_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.narratives n
      WHERE n.id = narrative_id AND n.user_id = auth.uid()
    )
  );

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.narrative_comments;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_history_user_id ON public.research_history(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_share_id ON public.presentation_analytics(share_id);
CREATE INDEX IF NOT EXISTS idx_narrative_comments_narrative_id ON public.narrative_comments(narrative_id);
CREATE INDEX IF NOT EXISTS idx_presenter_notes_narrative_id ON public.presenter_notes(narrative_id);