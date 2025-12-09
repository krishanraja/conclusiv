# Project Notes

Running decisions, TODOs, and quick references for the conclusiv project.

---

## Quick Reference

### Key Files
| Purpose | File |
|---------|------|
| Master Guidelines | `project-documentation/MASTER_INSTRUCTIONS.md` |
| Compliance Status | `project-documentation/AUDIT_STATUS.md` |
| API Layer | `src/lib/api.ts` |
| Types | `src/lib/types.ts` |
| State | `src/store/narrativeStore.ts` |
| Design Tokens | `src/index.css` |

### Feature Limits
```typescript
free: { buildsPerWeek: 1, maxSections: 4, canExport: false }
pro: { buildsPerWeek: Infinity, maxSections: Infinity, canExport: true }
```

---

## Running Decisions

### 2025-12-09
- **Build Limit UX**: Changed from disabling button to clickable upgrade prompt
- **Master Instructions**: Added comprehensive engineering guidelines
- **Audit**: Created AUDIT_STATUS.md for tracking compliance

---

## Active TODOs

- [ ] Add structured logging utilities (consider `src/lib/logger.ts`)
- [ ] Unit tests for utility functions
- [ ] Edge function integration tests
- [ ] Session ID tracking for frontend logs

---

## Design System Quick Reference

### Colors (HSL)
```css
--primary: 78 100% 83%      /* Lime green accent */
--secondary: 0 0% 8%         /* Dark surface */
--accent: 157 35% 28%        /* Teal accent */
--background: 0 0% 2%        /* Near black */
--foreground: 0 0% 98%       /* Near white */
```

### Usage
```tsx
// ✅ Correct - use semantic tokens
className="bg-primary text-primary-foreground"
className="text-muted-foreground"

// ❌ Wrong - no hardcoded colors
className="bg-lime-400 text-black"
```

---

## Error Handling Pattern

```typescript
// Standard return shape
interface ApiResponse<T> {
  data?: T;
  error?: string;
  errorCode?: ErrorCode;
}

// Error codes
type ErrorCode = 'RATE_LIMIT' | 'PAYMENT_REQUIRED' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN';
```

---

## Edge Function Template

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const log = {
  info: (ctx: string, msg: string, data?: Record<string, unknown>) => 
    console.log(`[INFO][${ctx}] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (ctx: string, msg: string, err?: unknown) => 
    console.error(`[ERROR][${ctx}] ${msg}`, err),
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Your logic here
    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    log.error(requestId, 'Request failed', error);
    return new Response(
      JSON.stringify({ error: error.message, code: 'UNKNOWN' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

*Last updated: 2025-12-09*
