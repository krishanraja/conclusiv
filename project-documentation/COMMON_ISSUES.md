# Common Issues

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Clear `.vite` cache, restart dev server |
| Voice not working | Check browser (Chrome/Edge only) |
| API timeout | Reduce input length or retry |
| Blank preview | Check console for errors |

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

**Cause**: Lovable AI credits exhausted

**Solution**: Add credits to Lovable account

---

### Timeout Errors

**Symptom**: Request hangs then fails

**Cause**: Very long input or network issues

**Solution**:
1. Reduce input to <20,000 characters
2. Check network connection
3. Retry with simpler request

---

## Voice Recording Issues

### Voice Button Not Appearing

**Symptom**: No microphone button visible

**Cause**: Browser doesn't support Web Speech API

**Solution**: Use Chrome or Edge browser

**Affected Browsers**: Firefox, Safari (no native support)

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

## Loading Issues

### Infinite Loading

**Symptom**: Loading spinner never stops

**Cause**: API call failed silently or response parsing failed

**Solution**:
1. Check console for errors
2. Refresh page
3. Try with shorter input

**Debug**: Check edge function logs for errors

---

### Loading Stuck at Specific Stage

**Symptom**: Progress stops at certain percentage

**Cause**: Chunk processing or AI call hanging

**Solution**:
1. Wait up to 90 seconds for long documents
2. If still stuck, refresh and try shorter input

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

## Data Issues

### Business Context Not Populating

**Symptom**: URL scraped but context shows empty

**Cause**: Website blocking scraper or no extractable content

**Solution**:
1. Try different URL (homepage works best)
2. Proceed without business context

---

### Themes Missing After Build

**Symptom**: Preview shows no themes

**Cause**: AI response didn't include themes or parsing failed

**Solution**: Check edge function logs for AI response

---

## General Debugging Steps

1. **Check Console**: Open DevTools → Console for errors
2. **Check Network**: DevTools → Network for failed requests
3. **Check Logs**: Review edge function logs in dashboard
4. **Clear Cache**: Delete `.vite` folder and restart
5. **Reduce Complexity**: Try with minimal input
6. **Check Browser**: Ensure using Chrome/Edge for full features

## Reporting Issues

When reporting issues, include:
- Browser and version
- Console errors (screenshot)
- Input length (character count)
- Steps to reproduce
- Edge function logs if available
