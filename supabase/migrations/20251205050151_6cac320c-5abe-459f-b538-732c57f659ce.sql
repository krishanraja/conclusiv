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

-- Enable RLS on all tables
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Analytics sessions policies (admins can view all, users can insert)
CREATE POLICY "Anyone can insert analytics sessions"
ON public.analytics_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their own session"
ON public.analytics_sessions FOR UPDATE
USING (session_id = session_id);

CREATE POLICY "Admins can view all analytics sessions"
ON public.analytics_sessions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Analytics events policies
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
ON public.analytics_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Feedback policies
CREATE POLICY "Anyone can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own feedback"
ON public.feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Contact inquiries policies
CREATE POLICY "Anyone can insert contact inquiries"
ON public.contact_inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
ON public.contact_inquiries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contact inquiries"
ON public.contact_inquiries FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact inquiries"
ON public.contact_inquiries FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX idx_feedback_created ON public.feedback(created_at);
CREATE INDEX idx_contact_status ON public.contact_inquiries(status);