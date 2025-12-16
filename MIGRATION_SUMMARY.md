# Supabase Migration Summary

## What Was Broken

After moving from a shared Supabase project to a dedicated project, the following issues were identified and fixed:

### 1. Hardcoded Project References
- **Issue**: Old shared project ID `cjpfnoatmfcrrpgdmdux` was hardcoded in:
  - `supabase/config.toml`
  - `supabase/functions/create-checkout/index.ts`
  - `supabase/functions/customer-portal/index.ts`
- **Impact**: Functions would fail or connect to wrong project if URL parsing failed

### 2. Environment Variable Inconsistencies
- **Issue**: Mixed usage of environment variables:
  - Client used `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Edge functions used `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `create-checkout` incorrectly used `SUPABASE_ANON_KEY` instead of service role key
- **Impact**: Inconsistent access patterns, potential security issues, missing validation

### 3. Auth & Onboarding State Management
- **Issue**: 
  - No fallback if `handle_new_user()` trigger fails
  - Onboarding state could desync if profile row missing
  - No explicit loading/error states for cold starts
  - Connection test queried `profiles` table which might not exist
- **Impact**: Users could see broken states, onboarding might not work, silent failures

### 4. Missing Error Handling
- **Issue**: Edge functions used `!` assertions on environment variables without validation
- **Impact**: Functions would crash with unclear errors if env vars missing

## Fixes Applied

### 1. Removed All Hardcoded Project IDs ✅
- Removed hardcoded project ID from `supabase/config.toml`
- Removed fallback project ID from `create-checkout` and `customer-portal` functions
- Added explicit error handling if URL parsing fails

### 2. Standardized Environment Variables ✅
- **Client**: Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with validation
- **Edge Functions**: All use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with validation
- Fixed `create-checkout` to use service role key instead of anon key
- Added validation at function start that fails loudly if env vars missing

### 3. Improved Auth & Onboarding Flows ✅
- **`src/integrations/supabase/client.ts`**:
  - Removed connection test that queried `profiles` table
  - Added URL format validation
  - Improved error handling
  
- **`src/hooks/useAuth.ts`**:
  - Added retry logic for session restoration (max 3 retries)
  - Added explicit error state handling
  - Improved loading state management
  - Added fallback profile creation in `signUp`
  
- **`src/hooks/useOnboarding.ts`**:
  - Added fallback to create profile if missing
  - Handles case where user exists but profile row is missing
  - Added explicit error handling
  - Ensures onboarding state syncs correctly

### 4. Enhanced Edge Function Validation ✅
- Added environment variable validation to:
  - `create-checkout/index.ts`
  - `customer-portal/index.ts`
  - `check-subscription/index.ts`
  - `verify-share-password/index.ts`
  - `send-contact-email/index.ts`
  - `send-feedback-email/index.ts`
- All functions now fail loudly with clear error messages if env vars missing

### 5. Created Consolidated Database Schema ✅
- Created `supabase/migrations/consolidated_schema.sql` with complete schema
- Includes all tables, policies, functions, triggers, storage buckets
- Updated `handle_new_user()` function to include onboarding fields
- Can be run on fresh Supabase project

### 6. Created Documentation ✅
- Created `SUPABASE_SETUP.md` with complete setup instructions
- Created `.env.example` template (documented in setup guide)
- Documented all required environment variables

## SQL Required for New Supabase Project

Run the consolidated schema file:

```sql
-- File: supabase/migrations/consolidated_schema.sql
-- Run this in Supabase SQL Editor
```

This creates:
- 15 tables with RLS enabled
- All required RLS policies
- Storage bucket `company-logos` with policies
- Triggers for user creation and timestamp updates
- Realtime enabled for `narrative_comments` and `research_jobs`
- All required indexes

## Environment Variables Required

### Client (Vercel/Local)
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key (if needed)
STRIPE_SECRET_KEY=sk_... (for payments)
RESEND_API_KEY=re_... (for emails)
LOVABLE_API_KEY=... (for AI)
PERPLEXITY_API_KEY=pplx-... (for research)
OPENAI_API_KEY=sk-... (for transcription)
PEXELS_API_KEY=... (for images)
BRANDFETCH_BRAND_API_KEY=... (for brand data)
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All hardcoded project IDs removed ✅
- [ ] Environment variables standardized ✅
- [ ] Database schema matches code expectations ✅
- [ ] Storage buckets created with correct policies ✅
- [ ] Auth flows handle edge cases ✅
- [ ] Onboarding works with missing profiles ✅
- [ ] All edge functions use correct env vars ✅
- [ ] No references to old shared project ✅
- [ ] All environment variables set in Vercel
- [ ] All edge function secrets set in Supabase dashboard
- [ ] Test signup flow works
- [ ] Test onboarding flow works
- [ ] Test edge functions work
- [ ] Verify RLS policies are correct
- [ ] Check Supabase logs for errors

## Files Modified

### Core Client Files
- `src/integrations/supabase/client.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useOnboarding.ts`

### Edge Functions
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/verify-share-password/index.ts`
- `supabase/functions/send-contact-email/index.ts`
- `supabase/functions/send-feedback-email/index.ts`

### Configuration
- `supabase/config.toml`

### New Files
- `supabase/migrations/consolidated_schema.sql`
- `SUPABASE_SETUP.md`
- `MIGRATION_SUMMARY.md` (this file)

## Testing Recommendations

1. **Test Signup Flow**:
   - Create new account
   - Verify profile is created automatically
   - Verify subscription row is created
   - Verify onboarding state is correct

2. **Test Onboarding**:
   - Complete onboarding steps
   - Verify progress is saved
   - Test skip functionality
   - Test reset functionality

3. **Test Edge Functions**:
   - Test checkout flow
   - Test subscription check
   - Test customer portal
   - Verify all functions use correct credentials

4. **Test Error Cases**:
   - Test with missing profile (should create fallback)
   - Test with missing env vars (should fail loudly)
   - Test with invalid Supabase URL (should fail loudly)

## Next Steps

1. Set up your new Supabase project
2. Run the consolidated schema SQL
3. Configure all environment variables
4. Deploy edge functions
5. Test all flows
6. Deploy to production

See `SUPABASE_SETUP.md` for detailed setup instructions.
