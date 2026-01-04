# Common Issues

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Clear `.vite` cache, restart dev server |
| Voice not working | Check browser (Chrome/Edge for Web Speech) or use Whisper |
| API timeout | Reduce input length or retry |
| Blank preview | Check console for errors |
| Edge function errors | Check Supabase logs, verify secrets |
| Auth issues | Clear local storage, refresh |

---

## Edge Function Issues

### CORS Errors

**Symptom**: Console shows `Access-Control-Allow-Origin` error

**Cause**: Edge function missing CORS headers

**Solution**:
```typescript
// Add to edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle OPTIONS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

// Include in all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

**Prevention**: Always use the corsHeaders template in new functions.

---

### Rate Limit (429 Error)

**Symptom**: "Rate limit exceeded" error

**Cause**: Too many API calls in short period

**Solution**:
1. Wait 60 seconds and retry
2. Reduce input text length
3. Remove business context (reduces API calls)

**Prevention**: Built-in retry with exponential backoff handles most cases.

---

### Payment Required (402 Error)

**Symptom**: "Usage limit reached" error

**Cause**: Lovable AI credits exhausted or subscription needed

**Solution**: 
- Add credits to Lovable account
- Or upgrade to Pro subscription

---

### Timeout Errors

**Symptom**: Request hangs then fails

**Cause**: Very long input, network issues, or cold start

**Solution**:
1. Reduce input to <20,000 characters
2. Check network connection
3. Retry with simpler request
4. Wait for cold start (first request after idle)

---

### Missing Environment Variables

**Symptom**: Edge function returns 500 error with "Missing X" message

**Cause**: Required secret not set in Supabase

**Solution**:
1. Go to Supabase Dashboard → Edge Functions → Manage secrets
2. Add the missing secret
3. Redeploy the function

**Required Secrets**:
```
STRIPE_SECRET_KEY          # For payments
RESEND_API_KEY             # For emails
LOVABLE_API_KEY            # For AI processing
PERPLEXITY_API_KEY         # For research
OPENAI_API_KEY             # For transcription
PEXELS_API_KEY             # For images
BRANDFETCH_BRAND_API_KEY   # For brand data
```

---

## Voice Recording Issues

### Voice Button Not Appearing

**Symptom**: No microphone button visible

**Cause**: Browser doesn't support Web Speech API

**Solution**: Use Chrome or Edge browser, or the voice button will use Whisper transcription as fallback

**Affected Browsers**: Firefox, Safari (use Whisper fallback)

---

### Voice Not Transcribing

**Symptom**: Button appears but no transcription

**Cause**: Microphone permissions denied

**Solution**:
1. Click lock icon in address bar
2. Allow microphone access
3. Refresh page

---

### Transcription Cuts Off

**Symptom**: Voice stops recording prematurely

**Cause**: Silence detection triggered

**Solution**: Speak continuously or restart recording

---

### Whisper Transcription Fails

**Symptom**: Audio uploads but no transcription returned

**Cause**: OpenAI API key missing or audio format issue

**Solution**:
1. Verify `OPENAI_API_KEY` is set in Supabase secrets
2. Ensure audio is under 25MB
3. Check Supabase logs for specific error

---

## Loading Issues

### Infinite Loading

**Symptom**: Loading spinner never stops

**Cause**: API call failed silently or response parsing failed

**Solution**:
1. Check console for errors
2. Refresh page
3. Try with shorter input

**Debug**: Check edge function logs in Supabase dashboard

---

### Loading Stuck at Specific Stage

**Symptom**: Progress stops at certain percentage

**Cause**: Chunk processing or AI call hanging

**Solution**:
1. Wait up to 90 seconds for long documents
2. If still stuck, refresh and try shorter input

---

### Loading Goes Backwards

**Symptom**: Progress bar moves backwards

**Cause**: This should not happen - progress is locked forward

**Solution**: If you see this, report as bug (we track last progress value with useRef)

---

## Build/TypeScript Issues

### Module Export Errors

**Symptom**: `Module has no exported member 'X'`

**Cause**: Import/export mismatch or caching

**Solution**:
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

**Prevention**: Use `import type { X }` for type-only imports

---

### Type Mismatch Errors

**Symptom**: TypeScript complains about types

**Cause**: Types out of sync with actual data

**Solution**: Check `src/lib/types.ts` matches API response shape

---

## Preview/Present Issues

### Blank Preview Screen

**Symptom**: Preview shows nothing after build

**Cause**: Narrative not set in store or parsing error

**Solution**:
1. Check console for errors
2. Verify narrative exists: `useNarrativeStore.getState().narrative`
3. Check edge function logs

---

### Sections Not Displaying Icons

**Symptom**: Icons show as blank or default

**Cause**: Icon name not in iconMap

**Solution**: Check `src/lib/icons.tsx` has mapping for icon name

---

### Present Mode Keyboard Not Working

**Symptom**: Arrow keys don't navigate

**Cause**: Focus not on presentation element

**Solution**: Click anywhere in presentation to focus

---

### Mobile Edge Buttons Not Visible

**Symptom**: Can't access sidebars on mobile

**Cause**: Animation delay (1 second in present mode)

**Solution**: Wait for buttons to animate in, or check if viewport is too narrow

---

## Data Issues

### Business Context Not Populating

**Symptom**: URL scraped but context shows empty

**Cause**: Website blocking scraper or no extractable content

**Solution**:
1. Try different URL (homepage works best)
2. Proceed without business context

---

### Brand Data Not Loading

**Symptom**: Logo/colors not appearing after entering URL

**Cause**: Brandfetch API can't find domain or rate limit

**Solution**:
1. Try with just domain (e.g., `example.com` not `https://www.example.com/page`)
2. Upload logo manually if Brandfetch fails

---

### Themes Missing After Build

**Symptom**: Preview shows no themes

**Cause**: AI response didn't include themes or parsing failed

**Solution**: Check edge function logs for AI response

---

### Claims Not Extracting

**Symptom**: RefineScreen shows no claims

**Cause**: Content too short or AI couldn't identify claims

**Solution**:
1. Ensure input has assertive statements
2. Try with more detailed content
3. Check extract-claims function logs

---

## Authentication Issues

### Can't Sign In

**Symptom**: Sign in fails or loops

**Cause**: Session issues or Supabase auth configuration

**Solution**:
1. Clear local storage
2. Clear cookies for the domain
3. Check Supabase Auth logs

---

### Session Lost After Refresh

**Symptom**: User logged out after page refresh

**Cause**: Session persistence issue

**Solution**:
1. Check that Supabase client is configured with persistSession: true
2. Verify auth.onAuthStateChange is set up correctly

---

### Profile Not Created

**Symptom**: User signs up but no profile in database

**Cause**: Trigger `handle_new_user()` failed

**Solution**:
1. Check if trigger exists: 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. If missing, run the consolidated schema
3. Manually create profile if needed

---

## Subscription Issues

### Subscription Status Wrong

**Symptom**: User is Pro but shows as Free (or vice versa)

**Cause**: Stripe webhook didn't update database

**Solution**:
1. Check Stripe dashboard for webhook events
2. Verify Supabase subscriptions table
3. Call `check-subscription` edge function to sync

---

### Checkout Not Working

**Symptom**: Can't complete Stripe checkout

**Cause**: Missing Stripe secret or configuration

**Solution**:
1. Verify `STRIPE_SECRET_KEY` is set
2. Check Stripe dashboard for errors
3. Ensure price IDs are correct

---

## General Debugging Steps

1. **Check Console**: Open DevTools → Console for errors
2. **Check Network**: DevTools → Network for failed requests
3. **Check Logs**: Review edge function logs in Supabase dashboard
4. **Clear Cache**: Delete `.vite` folder and restart
5. **Reduce Complexity**: Try with minimal input
6. **Check Browser**: Ensure using Chrome/Edge for full features
7. **Check Auth**: Verify user is authenticated if required
8. **Check Subscription**: Verify user has access to feature

## Reporting Issues

When reporting issues, include:
- Browser and version
- Console errors (screenshot)
- Network errors (screenshot)
- Input length (character count)
- Steps to reproduce
- Edge function logs if available
- User subscription status
- Device type (desktop/mobile)---*Last updated: 2025-01-03*
