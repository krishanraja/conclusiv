-- Fix the analytics_sessions UPDATE policy that has a tautology condition
-- The current policy (session_id = session_id) always evaluates to true

-- Drop the broken policy
DROP POLICY IF EXISTS "Anyone can update their own session" ON analytics_sessions;

-- Analytics sessions should be immutable after creation for data integrity
-- If updates are needed, they should be scoped to the session owner
-- Since we don't have user authentication for anonymous sessions, we'll remove UPDATE capability
-- This is the safest approach for analytics data integrity