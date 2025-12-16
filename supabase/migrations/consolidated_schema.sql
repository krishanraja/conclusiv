-- ============================================================================
-- CONSOLIDATED SUPABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the Conclusiv application.
-- Run this on a fresh Supabase project to set up all required tables, policies,
-- functions, triggers, and storage buckets.
--
-- IMPORTANT: Run this in order, or use the individual migration files in
-- chronological order if you need incremental migrations.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  company_logo_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  plan TEXT NOT NULL DEFAULT 'free',
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  builds_count INTEGER DEFAULT 0,
  last_build_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Narratives storage for shareable links
CREATE TABLE public.narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_id TEXT UNIQUE,
  title TEXT,
  narrative_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  share_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. ANALYTICS & FEEDBACK TABLES
-- ============================================================================

-- Analytics sessions table
CREATE TABLE public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  device TEXT,
  browser TEXT,
  referrer TEXT,
  pages_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page TEXT,
  step TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('quick_rating', 'nps', 'detailed', 'bug_report', 'feature_request')),
  rating INTEGER CHECK (rating >= 0 AND rating <= 10),
  message TEXT,
  context JSONB DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact inquiries table
CREATE TABLE public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'closed')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. COMPANY & RESEARCH TABLES
-- ============================================================================

-- Company brain table for persistent company context
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

-- Research history table for storing research queries and results
CREATE TABLE public.research_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  subject TEXT,
  decision_type TEXT,
  audience TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Research templates table
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

-- Research jobs table for async job processing
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

-- ============================================================================
-- 5. PRESENTATION & COLLABORATION TABLES
-- ============================================================================

-- Presentation analytics table for tracking views
CREATE TABLE public.presentation_analytics (
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

-- Narrative comments for collaborative feedback
CREATE TABLE public.narrative_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT,
  section_id TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.narrative_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Presenter notes table
CREATE TABLE public.presenter_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narrative_id UUID REFERENCES public.narratives(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(narrative_id, section_id)
);

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_brain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenter_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with onboarding fields
  INSERT INTO public.profiles (id, email, display_name, onboarding_completed, onboarding_step)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    FALSE,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default subscription (free)
  INSERT INTO public.subscriptions (user_id, status, plan)
  VALUES (NEW.id, 'free', 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_brain_updated_at ON public.company_brain;
CREATE TRIGGER update_company_brain_updated_at
  BEFORE UPDATE ON public.company_brain
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_research_templates_updated_at ON public.research_templates;
CREATE TRIGGER update_research_templates_updated_at
  BEFORE UPDATE ON public.research_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Usage policies
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage;
CREATE POLICY "Users can view their own usage"
ON public.usage FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage;
CREATE POLICY "Users can insert their own usage"
ON public.usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage;
CREATE POLICY "Users can update their own usage"
ON public.usage FOR UPDATE
USING (auth.uid() = user_id);

-- Narratives policies
DROP POLICY IF EXISTS "Users can view their own narratives" ON public.narratives;
CREATE POLICY "Users can view their own narratives"
ON public.narratives FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view public narratives" ON public.narratives;
CREATE POLICY "Anyone can view public narratives"
ON public.narratives FOR SELECT
USING (is_public = true);

DROP POLICY IF EXISTS "Users can insert their own narratives" ON public.narratives;
CREATE POLICY "Users can insert their own narratives"
ON public.narratives FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own narratives" ON public.narratives;
CREATE POLICY "Users can update their own narratives"
ON public.narratives FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own narratives" ON public.narratives;
CREATE POLICY "Users can delete their own narratives"
ON public.narratives FOR DELETE
USING (auth.uid() = user_id);

-- Analytics sessions policies
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON public.analytics_sessions;
CREATE POLICY "Anyone can insert analytics sessions"
ON public.analytics_sessions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all analytics sessions" ON public.analytics_sessions;
CREATE POLICY "Admins can view all analytics sessions"
ON public.analytics_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Analytics events policies
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Feedback policies
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.feedback;
CREATE POLICY "Users can view their own feedback"
ON public.feedback FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Contact inquiries policies
DROP POLICY IF EXISTS "Anyone can insert contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Anyone can insert contact inquiries"
ON public.contact_inquiries FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own inquiries" ON public.contact_inquiries;
CREATE POLICY "Users can view their own inquiries"
ON public.contact_inquiries FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can view all contact inquiries"
ON public.contact_inquiries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can update contact inquiries"
ON public.contact_inquiries FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Company brain policies
DROP POLICY IF EXISTS "Users can view their own company brain" ON public.company_brain;
CREATE POLICY "Users can view their own company brain"
ON public.company_brain FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company brain" ON public.company_brain;
CREATE POLICY "Users can insert their own company brain"
ON public.company_brain FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company brain" ON public.company_brain;
CREATE POLICY "Users can update their own company brain"
ON public.company_brain FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own company brain" ON public.company_brain;
CREATE POLICY "Users can delete their own company brain"
ON public.company_brain FOR DELETE
USING (auth.uid() = user_id);

-- Research history policies
DROP POLICY IF EXISTS "Users can view their own research history" ON public.research_history;
CREATE POLICY "Users can view their own research history"
ON public.research_history FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own research history" ON public.research_history;
CREATE POLICY "Users can insert their own research history"
ON public.research_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own research history" ON public.research_history;
CREATE POLICY "Users can delete their own research history"
ON public.research_history FOR DELETE
USING (auth.uid() = user_id);

-- Research templates policies
DROP POLICY IF EXISTS "Users can view their own templates" ON public.research_templates;
CREATE POLICY "Users can view their own templates"
ON public.research_templates FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own templates" ON public.research_templates;
CREATE POLICY "Users can insert their own templates"
ON public.research_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.research_templates;
CREATE POLICY "Users can update their own templates"
ON public.research_templates FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.research_templates;
CREATE POLICY "Users can delete their own templates"
ON public.research_templates FOR DELETE
USING (auth.uid() = user_id);

-- Research jobs policies
DROP POLICY IF EXISTS "Users can view their own research jobs" ON public.research_jobs;
CREATE POLICY "Users can view their own research jobs"
ON public.research_jobs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own research jobs" ON public.research_jobs;
CREATE POLICY "Users can insert their own research jobs"
ON public.research_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own research jobs" ON public.research_jobs;
CREATE POLICY "Users can update their own research jobs"
ON public.research_jobs FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all jobs" ON public.research_jobs;
CREATE POLICY "Service role can manage all jobs"
ON public.research_jobs FOR ALL
USING (auth.role() = 'service_role');

-- Presentation analytics policies
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.presentation_analytics;
CREATE POLICY "Anyone can insert analytics"
ON public.presentation_analytics FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Narrative owners can view their analytics" ON public.presentation_analytics;
CREATE POLICY "Narrative owners can view their analytics"
ON public.presentation_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.narratives n
    WHERE n.id = narrative_id AND n.user_id = auth.uid()
  )
);

-- Narrative comments policies
DROP POLICY IF EXISTS "Anyone can view comments on public narratives" ON public.narrative_comments;
CREATE POLICY "Anyone can view comments on public narratives"
ON public.narrative_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.narratives n
    WHERE n.id = narrative_id AND n.is_public = true
  )
);

DROP POLICY IF EXISTS "Anyone can add comments to public narratives" ON public.narrative_comments;
CREATE POLICY "Anyone can add comments to public narratives"
ON public.narrative_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.narratives n
    WHERE n.id = narrative_id AND n.is_public = true
  )
);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.narrative_comments;
CREATE POLICY "Users can delete their own comments"
ON public.narrative_comments FOR DELETE
USING (auth.uid() = user_id);

-- Presenter notes policies
DROP POLICY IF EXISTS "Users can manage notes for their narratives" ON public.presenter_notes;
CREATE POLICY "Users can manage notes for their narratives"
ON public.presenter_notes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.narratives n
    WHERE n.id = narrative_id AND n.user_id = auth.uid()
  )
);

-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for company logos bucket
DROP POLICY IF EXISTS "Users can upload their own logo" ON storage.objects;
CREATE POLICY "Users can upload their own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Users can update their own logo" ON storage.objects;
CREATE POLICY "Users can update their own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own logo" ON storage.objects;
CREATE POLICY "Users can delete their own logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 11. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_research_history_user_id ON public.research_history(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_share_id ON public.presentation_analytics(share_id);
CREATE INDEX IF NOT EXISTS idx_narrative_comments_narrative_id ON public.narrative_comments(narrative_id);
CREATE INDEX IF NOT EXISTS idx_presenter_notes_narrative_id ON public.presenter_notes(narrative_id);
CREATE INDEX IF NOT EXISTS idx_research_jobs_user_status ON public.research_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_research_jobs_pending ON public.research_jobs(status) WHERE status IN ('pending', 'processing');

-- ============================================================================
-- 12. REALTIME
-- ============================================================================

-- Enable realtime for comments and research jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.narrative_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_jobs;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
