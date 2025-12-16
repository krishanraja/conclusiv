# Supabase Setup Guide

This guide will help you set up a new Supabase project for the Conclusiv application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- A new Supabase project created

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Conclusiv (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key)
   - **service_role key** (keep this secret!)

## Step 3: Configure Environment Variables

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### For Local Development

1. Create a `.env.local` file in the project root
2. Add the same variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

## Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/consolidated_schema.sql` from this repository
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** to execute

This will create:
- All required tables (profiles, subscriptions, narratives, etc.)
- Row Level Security (RLS) policies
- Database functions and triggers
- Storage buckets
- Realtime subscriptions

## Step 5: Configure Storage Buckets

The schema migration should create the `company-logos` bucket automatically. Verify:

1. Go to **Storage** in Supabase dashboard
2. Confirm `company-logos` bucket exists
3. Verify it's set to **Public**

## Step 6: Configure Edge Function Secrets

1. Go to **Edge Functions** in Supabase dashboard
2. Click **Manage secrets**
3. Add the following secrets:

### Required Secrets

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### Optional Secrets (for specific features)

```
STRIPE_SECRET_KEY=sk_... (for payments)
RESEND_API_KEY=re_... (for emails)
LOVABLE_API_KEY=... (for AI processing)
PERPLEXITY_API_KEY=pplx-... (for research)
OPENAI_API_KEY=sk-... (for transcription)
PEXELS_API_KEY=... (for image search)
BRANDFETCH_BRAND_API_KEY=... (for brand data)
```

## Step 7: Deploy Edge Functions

If you have edge functions to deploy:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy
```

Or deploy individual functions:

```bash
supabase functions deploy create-checkout
supabase functions deploy check-subscription
# ... etc
```

## Step 8: Verify Setup

### Test Database Connection

1. In your local app, run `npm run dev`
2. Check browser console for any Supabase connection errors
3. Try signing up a test user

### Test Authentication

1. Navigate to `/auth` in your app
2. Create a test account
3. Verify:
   - User is created in Supabase Auth
   - Profile row is created automatically
   - Subscription row is created automatically

### Test Edge Functions

1. Try a feature that uses edge functions (e.g., checkout, subscription check)
2. Check Supabase dashboard > Edge Functions > Logs for any errors

## Step 9: Configure Email (Optional)

If you want email verification or password resets:

1. Go to **Authentication** > **Settings** in Supabase dashboard
2. Configure email templates
3. Set up SMTP or use Supabase's default email service

## Troubleshooting

### "Missing VITE_SUPABASE_URL" error

- Verify `.env.local` exists and has correct values
- Restart your dev server after adding env vars
- For Vercel, ensure env vars are set in project settings

### "Profile missing" errors

- Check that the `handle_new_user()` trigger is installed
- Verify RLS policies are enabled on `profiles` table
- Check Supabase logs for trigger execution errors

### Edge function errors

- Verify all required secrets are set in Supabase dashboard
- Check edge function logs in Supabase dashboard
- Ensure function has correct JWT verification settings in `supabase/config.toml`

### RLS policy errors

- Verify user is authenticated (`auth.uid()` is not null)
- Check that policies match your use case
- Review policy conditions in `consolidated_schema.sql`

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] Service role key is NEVER exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket policies are configured correctly
- [ ] Edge function secrets are set in Supabase (not in code)
- [ ] Email verification is configured (if using)
- [ ] CORS settings are appropriate for your domain
- [ ] No hardcoded project IDs or keys in code

## Next Steps

- Review the [Architecture documentation](../project-documentation/ARCHITECTURE.md)
- Set up monitoring and error tracking
- Configure backup and recovery procedures
- Review and customize RLS policies for your needs

## Support

If you encounter issues:

1. Check Supabase dashboard logs
2. Review browser console for client errors
3. Check edge function logs in Supabase dashboard
4. Verify all environment variables are set correctly
