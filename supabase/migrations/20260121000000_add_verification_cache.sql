-- ============================================================================
-- VERIFICATION CACHE TABLE
-- ============================================================================
-- This table caches verification results to avoid redundant API calls
-- and improve performance of the verification system.
-- ============================================================================

CREATE TABLE public.verification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_hash TEXT NOT NULL UNIQUE,
  claim_text TEXT NOT NULL,
  verification_result JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_verification_cache_hash ON public.verification_cache(claim_hash);
CREATE INDEX idx_verification_cache_cached_at ON public.verification_cache(cached_at);

-- Enable RLS
ALTER TABLE public.verification_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read cache
CREATE POLICY "Allow authenticated users to read verification cache"
  ON public.verification_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow all authenticated users to insert into cache
CREATE POLICY "Allow authenticated users to insert verification cache"
  ON public.verification_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow all authenticated users to update cache (for hit counting)
CREATE POLICY "Allow authenticated users to update verification cache"
  ON public.verification_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to clean up old cache entries (older than 7 days)
CREATE OR REPLACE FUNCTION clean_verification_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.verification_cache
  WHERE cached_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: You can set up a cron job with pg_cron to run this periodically:
-- SELECT cron.schedule('clean-verification-cache', '0 3 * * *', 'SELECT clean_verification_cache()');

COMMENT ON TABLE public.verification_cache IS 'Caches verification results to improve performance and reduce API costs';
COMMENT ON COLUMN public.verification_cache.claim_hash IS 'SHA-256 hash of normalized claim text for fast lookups';
COMMENT ON COLUMN public.verification_cache.hits IS 'Number of times this cached entry has been used';
COMMENT ON COLUMN public.verification_cache.cached_at IS 'When this entry was last refreshed';
