-- Add unique constraint to usage table to prevent duplicate entries per user per week
ALTER TABLE public.usage
ADD CONSTRAINT usage_user_week_unique UNIQUE (user_id, week_start);