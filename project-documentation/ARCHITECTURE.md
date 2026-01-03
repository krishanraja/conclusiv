# conclusiv Architecture

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI components and logic |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animation** | Framer Motion | Smooth transitions and mobile effects |
| **State** | Zustand | Lightweight state management |
| **Backend** | Supabase Edge Functions | Serverless AI processing |
| **Database** | Supabase PostgreSQL | User data, narratives, analytics |
| **AI Gateway** | Lovable AI Gateway | LLM access (Gemini 2.5 Flash) |
| **Research** | Perplexity API | Deep research capabilities |
| **Transcription** | OpenAI Whisper | Voice-to-text |
| **Brand Data** | Brandfetch API | Logo and brand colors |
| **Images** | Pexels API | Section imagery |
| **Payments** | Stripe | Subscriptions and checkout |
| **Email** | Resend | Contact and feedback emails |
| **Build** | Vite | Fast development and bundling |
| **Testing** | Playwright | End-to-end testing |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React 18)                                │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────────┤
│ InputScreen │ RefineScreen│PreviewScreen│PresentScreen│    Pages (11)       │
│ - Voice     │ - Claims    │ - Narrative │ - Fullscreen│ - Auth, Blog, FAQ   │
│ - Text      │ - Highlight │ - Templates │ - Navigation│ - Share, Profile    │
│ - Upload    │ - Voice     │ - Adjust    │ - Animations│ - Contact, Terms    │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────────┘
                                    │
                                    │ API Calls (supabase.functions.invoke)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Supabase Edge Functions (20)                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│    Content Processing   │      AI Analysis        │       Utilities         │
│ • build-narrative       │ • extract-themes        │ • create-checkout       │
│ • parse-document        │ • extract-claims        │ • customer-portal       │
│ • parse-google-doc      │ • extract-tensions      │ • check-subscription    │
│ • transcribe-audio      │ • verify-claim          │ • send-contact-email    │
│ • scrape-business-context│ • generate-alternatives│ • send-feedback-email   │
│ • fetch-brand-data      │ • normalize-claim       │ • verify-share-password │
│ • search-images         │ • guided-research       │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
                                    │
                                    │ External APIs
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ Lovable AI      │ Perplexity      │ OpenAI Whisper  │ Brandfetch / Pexels   │
│ (Gemini 2.5)    │ (Research)      │ (Transcription) │ (Brand/Images)        │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

## Data Flow

### 1. Input Flow
```
User speaks/pastes/uploads → rawText state → handleBuild() → Edge Function
         │
         ├── Voice: Web Speech API or Whisper transcription
         ├── File: parse-document (PDF/DOCX) or parse-google-doc
         └── Business URL → scrape-business-context + fetch-brand-data → businessContext
```

### 2. Refine Flow (Optional)
```
rawText → extract-claims → keyClaims state
                │
                ├── User approves/rejects claims
                ├── User highlights key passages
                ├── User adds voice feedback
                └── verify-claim for fact checking
```

### 3. Build Narrative Flow
```
rawText + keyClaims + businessContext + options
         │
         ▼
┌─────────────────────────────────────────┐
│       build-narrative function          │
│  1. Validate inputs                     │
│  2. Check text length                   │
│  3. If long: chunk + summarize          │
│  4. Apply audience mode + archetype     │
│  5. Generate narrative via AI           │
│  6. Apply duration compression          │
│  7. Parse JSON response                 │
│  8. Add unique IDs                      │
│  9. Return structured data              │
└─────────────────────────────────────────┘
         │
         ▼
{ themes, recommendedTemplate, narrative, tensions }
         │
         ▼
Store updates → Navigate to Preview
```

### 4. Preview & Presentation Flow
```
Preview Screen → User adjusts settings
         │
         ├── Quick Adjustments (audience, duration, template, themes)
         ├── Section editing (content, icons, images)
         ├── Generate alternatives
         └── Export (PDF, PPTX)
         │
         ▼
User clicks "Present" → PresentScreen (fullscreen)
         │
         ├── Keyboard: Left/Right arrows
         ├── Touch: Swipe gestures
         ├── Click: Next section
         └── Escape: Exit to preview
```

### 5. Share Flow
```
Narrative → Generate share_id → Store in narratives table
         │
         └── Optional: Set password → Hash password
         │
Share URL → verify-share-password (if protected) → Render narrative
```

## State Management (Zustand)

```typescript
interface NarrativeState {
  // Input
  rawText: string;
  businessWebsite: string;
  businessContext: BusinessContext | null;
  userUploadedLogoUrl: string | null;
  
  // Refinement
  highlights: RefinementHighlight[];
  keyClaims: KeyClaim[];
  voiceFeedback: string;
  
  // Generated
  themes: Theme[];
  narrative: NarrativeSchema | null;
  selectedTemplate: TemplateName | null;
  tensions: Tension[];
  alternatives: NarrativeAlternative[];
  
  // Intelligence Phases
  audienceMode: AudienceMode | null;          // Phase 1
  includeTensionSlide: boolean;                // Phase 2
  selectedArchetype: NarrativeArchetype | null; // Phase 3
  duration: NarrativeDuration;                 // Phase 4
  viewMode: ViewMode;                          // Phase 5
  companyBrain: CompanyBrain | null;           // Phase 6
  // Phase 7: alternatives (above)
  
  // Presentation Styling
  presentationStyle: PresentationStyle;
  
  // UI
  currentStep: "input" | "refine" | "preview" | "present";
  isLoading: boolean;
  loadingStage: number;
  loadingProgress: number;
  
  // Presentation Navigation
  currentSectionIndex: number;
  
  // Change Tracking
  originalSettings: QuickAdjustmentSettings | null;
  currentNarrativeId: string | null;
}
```

## Edge Functions

### build-narrative
- **Input**: `{ text, businessContext?, audienceMode?, archetype?, duration?, includeTensionSlide?, storyPillars? }`
- **Output**: `{ themes, recommendedTemplate, narrative }`
- **Features**:
  - Smart text chunking for long inputs (>8000 chars)
  - Parallel chunk summarization
  - Audience-aware prompting
  - Duration-based compression
  - JSON parsing with fallback

### extract-claims
- **Input**: `{ text }`
- **Output**: `{ claims: KeyClaim[] }`
- **Features**:
  - Extracts key assertions and statements
  - Generates alternative framings
  - Identifies sources when available

### verify-claim
- **Input**: `{ claim, context? }`
- **Output**: `{ status, confidence, summary }`
- **Features**:
  - AI-powered fact checking
  - Confidence scoring (0-100)
  - Verification status (verified/unverified/uncertain)

### guided-research
- **Input**: `{ phase, structuredInput?, query?, depth? }`
- **Output**: `{ suggestedQuery?, summary?, keyFindings?, citations? }`
- **Features**:
  - Formulate phase: Convert structured input to research query
  - Research phase: Execute via Perplexity API
  - Quick/deep research modes

### scrape-business-context
- **Input**: `{ url }`
- **Output**: `{ context: BusinessContext }`
- **Features**:
  - URL normalization
  - Website content extraction
  - AI-powered context extraction

### fetch-brand-data
- **Input**: `{ domain }`
- **Output**: `{ data: BrandData }`
- **Features**:
  - Brandfetch API integration
  - Logo variants (light/dark, svg/png)
  - Brand colors and fonts
  - Firmographics

### All Edge Functions
- CORS headers on all responses
- OPTIONS handler for preflight
- Structured logging: `[INFO/WARN/ERROR][requestId] message`
- Environment variable validation
- Timeout handling

## File Structure

```
src/
├── App.tsx                      # Main app with routing
├── main.tsx                     # Entry point
├── index.css                    # Design tokens and global styles
├── vite-env.d.ts               # Vite type definitions
│
├── assets/                      # Static assets (fonts, images)
│
├── components/
│   ├── analytics/              # Analytics tracking components
│   ├── auth/                   # Authentication UI
│   ├── celebration/            # Success celebrations
│   ├── cinematic/              # Cinematic presentation effects
│   ├── dev/                    # Development-only components
│   ├── editor/                 # Content editing components
│   ├── feedback/               # User feedback forms
│   ├── input/                  # InputScreen and related
│   │   ├── InputScreen.tsx     # Main input UI
│   │   ├── VoiceRecorder.tsx   # Web Speech API voice input
│   │   └── BusinessContextInput.tsx
│   ├── intelligence/           # AI intelligence features
│   ├── layout/                 # App layout components
│   ├── mobile/                 # Mobile-specific components
│   │   └── MobileAnimations.tsx # Haptic-enabled animations
│   ├── onboarding/             # User onboarding flow
│   ├── power-user/             # Pro user features
│   ├── present/                # Presentation mode
│   │   └── PresentScreen.tsx   # Fullscreen presentation
│   ├── preview/                # Preview and editing
│   │   ├── PreviewScreen.tsx   # Main preview UI
│   │   ├── NarrativePreview.tsx # Narrative display
│   │   └── QuickAdjustments.tsx # Settings panel
│   ├── refine/                 # RefineScreen components
│   ├── seo/                    # SEO meta components
│   ├── share/                  # Sharing functionality
│   ├── subscription/           # Subscription management
│   ├── template/               # Template components
│   ├── ui/                     # Shared UI components (shadcn)
│   │   ├── button.tsx          # Shimmer button variant
│   │   ├── loading.tsx         # Loading overlay
│   │   ├── error-recovery.tsx  # Error handling UI
│   │   └── InlineNotification.tsx # Notification system
│   └── NavLink.tsx
│
├── hooks/
│   ├── use-mobile.tsx          # Mobile detection
│   ├── use-toast.ts            # Toast bridge to notifications
│   ├── useAnalytics.ts         # Analytics tracking
│   ├── useAnalyticsTracker.ts  # Event tracking
│   ├── useAuth.ts              # Authentication state
│   ├── useAuthStateMachine.ts  # Auth flow state machine
│   ├── useBrandLogo.ts         # Brand logo selection
│   ├── useCelebration.ts       # Success animations
│   ├── useFeedback.ts          # Feedback submission
│   ├── useHaptics.ts           # Haptic feedback (vibration)
│   ├── useOnboarding.ts        # Onboarding state
│   ├── useReducedMotion.ts     # Motion preference
│   ├── useResearchJob.ts       # Research job polling
│   ├── useSubscription.ts      # Subscription status
│   ├── useVoiceRecorder.ts     # Web Speech API hook
│   └── useWhisperRecorder.ts   # Whisper transcription hook
│
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase client config
│       └── types.ts            # Generated DB types
│
├── lib/
│   ├── api.ts                  # API client functions
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions
│   ├── icons.tsx               # Icon mapping
│   ├── logger.ts               # Frontend logging
│   ├── crypto.ts               # Encryption utilities
│   ├── imagePreloader.ts       # Critical image preloading
│   ├── blogData.ts             # Blog content
│   ├── mockAI.ts               # Development mocks
│   ├── archetypes/             # Narrative archetype definitions
│   ├── exports/                # PDF/PPTX export utilities
│   └── templates/              # Template definitions
│
├── pages/
│   ├── Index.tsx               # Main app page
│   ├── Auth.tsx                # Authentication page
│   ├── Blog.tsx                # Blog listing
│   ├── BlogPost.tsx            # Individual blog post
│   ├── Contact.tsx             # Contact form
│   ├── FAQ.tsx                 # FAQ page
│   ├── NotFound.tsx            # 404 page
│   ├── Privacy.tsx             # Privacy policy
│   ├── Profile.tsx             # User profile
│   ├── Share.tsx               # Shared narrative view
│   └── Terms.tsx               # Terms of service
│
└── store/
    └── narrativeStore.ts       # Zustand store

supabase/
├── config.toml                 # Supabase local config
├── migrations/
│   └── consolidated_schema.sql # Complete database schema
└── functions/                  # Edge functions (20 total)
    ├── build-narrative/
    ├── check-subscription/
    ├── create-checkout/
    ├── customer-portal/
    ├── extract-claims/
    ├── extract-tensions/
    ├── extract-themes/
    ├── fetch-brand-data/
    ├── generate-alternatives/
    ├── guided-research/
    ├── normalize-claim/
    ├── parse-document/
    ├── parse-google-doc/
    ├── scrape-business-context/
    ├── search-images/
    ├── send-contact-email/
    ├── send-feedback-email/
    ├── transcribe-audio/
    ├── verify-claim/
    └── verify-share-password/

e2e/                            # Playwright E2E tests
public/                         # Static public assets
```

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, onboarding state |
| `subscriptions` | Stripe subscription status |
| `usage` | Weekly build count tracking |
| `narratives` | Saved/shared narratives |
| `analytics_sessions` | User session tracking |
| `analytics_events` | Event tracking |
| `feedback` | User feedback submissions |
| `contact_submissions` | Contact form submissions |
| `user_roles` | Admin/user roles |
| `research_jobs` | Async research job queue |
| `narrative_comments` | Narrative collaboration |

## Security Considerations

1. **API Keys**: All secrets stored in Supabase Edge Function secrets, never exposed to client
2. **Environment Variables**: Validated at function start with loud failures
3. **CORS**: Configured per-function, allowing only authorized origins
4. **Rate Limiting**: Handled by Lovable AI Gateway and Supabase
5. **Input Validation**: Text length limits enforced, sanitization applied
6. **RLS Policies**: Row Level Security on all user data tables
7. **Password Hashing**: Share passwords hashed before storage
8. **Service Role**: Only used server-side, never exposed to client

## Environment Variables

### Client (Vercel/Local)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Edge Functions (Supabase Secrets)
```
# Auto-provided by Supabase
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY

# Required for features
STRIPE_SECRET_KEY          # Payments
RESEND_API_KEY             # Emails
LOVABLE_API_KEY            # AI Gateway
PERPLEXITY_API_KEY         # Research
OPENAI_API_KEY             # Transcription
PEXELS_API_KEY             # Images
BRANDFETCH_BRAND_API_KEY   # Brand data
```

---

*Last updated: 2025-01-03*
