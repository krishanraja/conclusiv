# Idiot-Proof Next Steps Guide

Follow these steps **in order**. Don't skip any steps!

## Step 1: Create Your Supabase Project (5 minutes)

1. **Go to Supabase**: Open https://app.supabase.com in your browser
2. **Sign in** (or create an account if you don't have one)
3. **Click the green "New Project" button** (top right)
4. **Fill in the form**:
   - **Name**: Type `conclusiv` (or whatever you want)
   - **Database Password**: 
     - Click "Generate a password" OR create your own strong password
     - **IMPORTANT**: Copy this password and save it somewhere safe (you'll need it!)
   - **Region**: Pick the one closest to you (e.g., "US East" if you're in the US)
   - **Pricing Plan**: Select "Free" (unless you want to pay)
5. **Click "Create new project"**
6. **Wait 2-3 minutes** while it sets up (you'll see a progress screen)

## Step 2: Get Your Project Credentials (2 minutes)

Once your project is ready:

1. **In the left sidebar**, click **"Settings"** (gear icon at the bottom)
2. **Click "API"** in the settings menu
3. **You'll see a page with your credentials**. Copy these **one at a time**:

   **a) Project URL:**
   - Find the section labeled "Project URL"
   - Copy the URL (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Paste it somewhere safe** (like a text file)

   **b) anon public key:**
   - Find the section labeled "Project API keys"
   - Find the key labeled **"anon"** or **"public"**
   - Click the eye icon to reveal it, then click the copy button
   - **Paste it somewhere safe**

   **c) service_role key:**
   - Still on the same page, find the key labeled **"service_role"**
   - Click the eye icon to reveal it, then click the copy button
   - **IMPORTANT**: This is secret! Don't share it publicly.
   - **Paste it somewhere safe**

## Step 3: Set Up Your Database Schema (5 minutes)

1. **In Supabase dashboard**, click **"SQL Editor"** in the left sidebar
2. **Click "New query"** button (top right)
3. **Open this file on your computer**: `supabase/migrations/consolidated_schema.sql`
   - You can find it in your project folder
   - Right-click the file and choose "Open with" > "Notepad" (or any text editor)
4. **Select ALL the text** in that file (Ctrl+A or Cmd+A)
5. **Copy it** (Ctrl+C or Cmd+C)
6. **Go back to Supabase SQL Editor**
7. **Paste the entire SQL code** into the editor (Ctrl+V or Cmd+V)
8. **Click the green "Run" button** (or press Ctrl+Enter)
9. **Wait for it to finish** - you should see "Success. No rows returned" at the bottom
10. **If you see errors**: 
    - Take a screenshot
    - Check that you copied the ENTIRE file
    - Try running it again

## Step 4: Verify Storage Bucket Was Created (1 minute)

1. **In Supabase dashboard**, click **"Storage"** in the left sidebar
2. **You should see a bucket called `company-logos`**
3. **If you don't see it**: 
   - Go back to SQL Editor
   - Run this command:
     ```sql
     INSERT INTO storage.buckets (id, name, public)
     VALUES ('company-logos', 'company-logos', true)
     ON CONFLICT (id) DO NOTHING;
     ```
   - Click Run

## Step 5: Set Up Vercel Environment Variables (5 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** (or create account)
3. **Find your project** (or import it if you haven't)
4. **Click on your project name**
5. **Click "Settings"** (top menu)
6. **Click "Environment Variables"** (left sidebar)
7. **Add these TWO variables** (one at a time):

   **Variable 1:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Paste your Project URL from Step 2a (the `https://xxx.supabase.co` one)
   - **Environment**: Check all three boxes (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2:**
   - **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Value**: Paste your anon/public key from Step 2b
   - **Environment**: Check all three boxes (Production, Preview, Development)
   - Click **"Save"**

8. **After adding both**, you should see them in the list

## Step 6: Set Up Supabase Edge Function Secrets (5 minutes)

**IMPORTANT**: Supabase automatically provides `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY` to all edge functions. You **DO NOT** need to add these manually - they're already available!

1. **Go back to Supabase dashboard**
2. **Click "Edge Functions"** in the left sidebar
3. **Click "Manage secrets"** button (or look for "Secrets" in the menu)
4. **Skip the Supabase variables** - they're already there automatically!

5. **Add these optional secrets** (only if you use these features):
   - `STRIPE_SECRET_KEY` - if you use payments
   - `RESEND_API_KEY` - if you send emails
   - `LOVABLE_API_KEY` - if you use AI features
   - `PERPLEXITY_API_KEY` - if you use research features
   - `OPENAI_API_KEY` - if you use transcription
   - `PEXELS_API_KEY` - if you use image search
   - `BRANDFETCH_BRAND_API_KEY` - if you use brand data

## Step 7: Deploy Edge Functions (Optional - 10 minutes)

**Only do this if you have edge functions to deploy:**

1. **Open your terminal/command prompt**
2. **Navigate to your project folder**:
   ```bash
   cd path/to/your/conclusiv/folder
   ```
3. **Install Supabase CLI** (if you haven't):
   ```bash
   npm install -g supabase
   ```
4. **Login to Supabase**:
   ```bash
   supabase login
   ```
   - This will open a browser - approve the login
5. **Link to your project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   - Replace `YOUR_PROJECT_ID` with the ID from your Supabase URL
   - Example: If your URL is `https://abcdefgh.supabase.co`, your project ID is `abcdefgh`
6. **Deploy all functions**:
   ```bash
   supabase functions deploy
   ```

**OR deploy individually:**
```bash
supabase functions deploy create-checkout
supabase functions deploy check-subscription
supabase functions deploy customer-portal
# ... etc for each function
```

## Step 8: Test Everything (10 minutes)

### Test 1: Check Your App Works

1. **Go to your Vercel deployment** (or run locally with `npm run dev`)
2. **Open the app in your browser**
3. **Check the browser console** (F12 > Console tab)
4. **Look for any red errors** - if you see Supabase connection errors, check your environment variables

### Test 2: Try Signing Up

1. **Go to the `/auth` page** (or click sign up)
2. **Create a test account**:
   - Email: `test@example.com` (or any email)
   - Password: `test123456` (or any password, min 6 characters)
   - Click "Sign Up"
3. **Check if it works**:
   - You should be redirected to the home page
   - No error messages should appear

### Test 3: Verify Database

1. **Go back to Supabase dashboard**
2. **Click "Table Editor"** in the left sidebar
3. **Click on the `profiles` table**
4. **You should see a row** with your test user's email
5. **Click on the `subscriptions` table**
6. **You should see a row** with status "free"

### Test 4: Test Onboarding

1. **In your app**, you should see an onboarding flow
2. **Try completing a step** - it should save
3. **Refresh the page** - your progress should still be there

## Step 9: Troubleshooting

### Problem: "Missing VITE_SUPABASE_URL" error

**Solution:**
- Go to Vercel > Settings > Environment Variables
- Make sure `VITE_SUPABASE_URL` is set
- Make sure you checked all three environment boxes
- Redeploy your app (go to Deployments > click "..." > Redeploy)

### Problem: "Profile missing" error

**Solution:**
- Go to Supabase > SQL Editor
- Run this to check if the trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- If nothing shows up, the schema didn't run correctly - go back to Step 3

### Problem: Edge function errors

**Solution:**
- Go to Supabase > Edge Functions > Logs
- Check the error message
- Make sure all secrets are set (Step 6)
- Check that secrets have the correct names (case-sensitive!)

### Problem: Can't sign up

**Solution:**
- Check Supabase > Authentication > Users - do you see the user?
- Check Supabase > Table Editor > profiles - is there a row?
- If user exists but no profile, the trigger might have failed
- Try creating the profile manually in SQL Editor:
  ```sql
  INSERT INTO profiles (id, email, display_name)
  VALUES ('USER_ID_HERE', 'email@example.com', 'Test User');
  ```

## Step 10: You're Done! 🎉

If all tests pass, you're ready to go! Your app is now connected to your own Supabase project.

## Quick Reference: Where to Find Things

- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com
- **Your Project URL**: Supabase > Settings > API > Project URL
- **Your API Keys**: Supabase > Settings > API > Project API keys
- **SQL Editor**: Supabase > SQL Editor
- **Environment Variables**: Vercel > Project > Settings > Environment Variables
- **Edge Function Secrets**: Supabase > Edge Functions > Manage secrets

## Need Help?

1. **Check the error message** - it usually tells you what's wrong
2. **Check Supabase logs**: Supabase > Logs (in left sidebar)
3. **Check Vercel logs**: Vercel > Project > Deployments > Click a deployment > View Function Logs
4. **Verify environment variables** are set correctly
5. **Make sure the schema ran** without errors

## Common Mistakes to Avoid

❌ **Don't** use the service_role key in your client code (it's secret!)
❌ **Don't** skip setting environment variables
❌ **Don't** forget to run the SQL schema
❌ **Don't** use the old project's credentials
✅ **Do** save your database password somewhere safe
✅ **Do** test everything after setup
✅ **Do** check the logs if something breaks

---

**That's it!** Follow these steps in order and you'll be up and running. If you get stuck, go back and re-read the step you're on - you probably missed something small.
