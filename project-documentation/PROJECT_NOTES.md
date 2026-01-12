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
| Database Schema | `supabase/migrations/consolidated_schema.sql` |

### Current Version
- **Version**: 0.6.0
- **Last Major Update**: 2025-01-03
- **Edge Functions**: 20 functions deployed
- **Database Tables**: 15+ tables with RLS

### Feature Limits
```typescript
free: { 
  buildsPerWeek: 1, 
  maxSections: 4, 
  canExport: false,
  canShare: false 
}
pro: { 
  buildsPerWeek: Infinity, 
  maxSections: Infinity, 
  canExport: true,
  canShare: true 
}
```

---

## Running Decisions

### 2025-01-03
- **Documentation Audit**: Complete update of all documentation to match current state
- **Supabase Migration**: Completed migration to dedicated project with consolidated schema
- **20 Edge Functions**: Full suite of AI-powered functions deployed

### 2025-01-01
- **Intelligence Phases 1-7**: Full implementation of narrative intelligence system
- **Presentation Styling**: Logo, colors, fonts customization added

### 2024-12-14
- **Build Limit UX**: Changed from disabling button to clickable upgrade prompt
- **Branded Loading**: Unified C logo loading experience across all states
- **Mobile Polish**: Haptic feedback, edge buttons, improved animations
- **RefineScreen Redesign**: Three-tab design with onboarding

---

## Active TODOs

- [ ] Add keyboard shortcuts throughout app
- [ ] Implement section reordering via drag and drop
- [ ] Company Brain historical context (Phase 6 completion)
- [ ] Custom color theme builder
- [ ] Real-time collaboration features

---

## Design System Quick Reference

### Colors (HSL)
```css
--background: 0 0% 2%;           /* Deep dark black */
--card: 0 0% 4%;                 /* Elevated surfaces */
--foreground: 0 0% 98%;          /* Primary text */
--muted-foreground: 0 0% 72%;   /* Secondary text */
--primary: 78 100% 83%;          /* Light yellowish-green - matches logo gradient start */
--shimmer-start: 78 100% 83%;   /* Light yellowish-green */
--shimmer-end: 157 35% 28%;     /* Dark teal-green - matches logo gradient end */
```

### Usage
```tsx
// ✅ Correct - use semantic tokens
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="bg-card border-border"

// ❌ Wrong - no hardcoded colors
className="bg-cyan-500 text-black"
className="bg-[#1a1a2e]"
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
type ErrorCode = 
  | 'RATE_LIMIT' 
  | 'PAYMENT_REQUIRED' 
  | 'TIMEOUT' 
  | 'PARSE_ERROR' 
  | 'NETWORK' 
  | 'UNKNOWN';
```

---

## State Management Patterns

### Step Flow
```typescript
currentStep: "input" | "refine" | "preview" | "present"
```

### Intelligence Phases
```typescript
// Phase 1: Audience
audienceMode: "exec" | "product" | "investors" | "clients" | "ops" | "briefing" | null

// Phase 2: Tensions
tensions: Tension[]
includeTensionSlide: boolean

// Phase 3: Archetypes  
selectedArchetype: NarrativeArchetype | null

// Phase 4: Duration
duration: "10s" | "1min" | "5min" | "full"

// Phase 5: View Mode
viewMode: "present" | "reader" | "external"

// Phase 6: Company Brain
companyBrain: CompanyBrain | null

// Phase 7: Alternatives
alternatives: NarrativeAlternative[]
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
    // Validate environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');

    // Your logic here
    log.info(requestId, 'Processing request');
    
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

## Database Quick Reference

### User Data Tables
```sql
-- Core user tables
profiles (id, email, display_name, onboarding_completed, onboarding_step)
subscriptions (user_id, stripe_customer_id, status, plan)
usage (user_id, week_start, builds_count)
narratives (user_id, share_id, title, narrative_data, is_public, share_password)
```

### Analytics Tables
```sql
analytics_sessions (session_id, user_id, device, browser, referrer)
analytics_events (session_id, event_type, event_data)
feedback (user_id, rating, message, page, tags)
```

---

## Environment Variables

### Required (Client)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Required (Edge Functions)
```bash
# Auto-provided by Supabase
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY

# For specific features
STRIPE_SECRET_KEY          # Payments
RESEND_API_KEY             # Emails
LOVABLE_API_KEY            # AI Gateway
PERPLEXITY_API_KEY         # Research
OPENAI_API_KEY             # Transcription
PEXELS_API_KEY             # Images
BRANDFETCH_BRAND_API_KEY   # Brand data
```

---

## Testing

### Run Tests
```bash
npm run test          # Run all tests
npm run test:ui       # Interactive UI mode
npm run test:headed   # See browser
```

### Test Files
```
e2e/
├── example.spec.ts    # Example tests
└── ... (add your tests)
```

---

## Deployment Checklist

### Pre-Deploy
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Environment variables set
- [ ] Database schema up to date

### Post-Deploy
- [ ] Health check (load app)
- [ ] Auth flow works
- [ ] Build narrative works
- [ ] Subscription check works
- [ ] No console errors

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview build

# Database
supabase login           # Login to Supabase
supabase link            # Link to project
supabase functions deploy # Deploy all functions

# Testing
npm run test             # Run Playwright tests
```

---

*Last updated: 2025-01-03*
