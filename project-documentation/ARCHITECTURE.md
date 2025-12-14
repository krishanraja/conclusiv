# conclusiv Architecture

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI components and logic |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animation** | Framer Motion | Smooth transitions |
| **State** | Zustand | Lightweight state management |
| **Backend** | Supabase Edge Functions | Serverless AI processing |
| **AI** | Lovable AI Gateway | LLM access (Gemini) |
| **Build** | Vite | Fast development and bundling |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├──────────────┬──────────────────┬───────────────────────────┤
│  InputScreen │   PreviewScreen  │      PresentScreen        │
│  - Voice     │   - Narrative    │      - Fullscreen         │
│  - Text      │   - Templates    │      - Navigation         │
│  - Context   │   - Adjustments  │      - Animations         │
└──────────────┴──────────────────┴───────────────────────────┘
                           │
                           │ API Calls (supabase.functions.invoke)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Edge Functions                     │
├────────────────────┬────────────────────────────────────────┤
│  build-narrative   │  scrape-business-context               │
│  - Chunk text      │  - Fetch website                       │
│  - Call AI         │  - Extract content                     │
│  - Parse response  │  - AI enrichment                       │
└────────────────────┴────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Lovable AI Gateway                           │
│            (google/gemini-2.5-flash)                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Input Flow
```
User speaks/pastes → rawText state → handleBuild() → Edge Function
         │
         └── Optional: Business URL → scrape-business-context → businessContext
```

### 2. Build Narrative Flow
```
rawText + businessContext
         │
         ▼
┌─────────────────────────────────────┐
│      build-narrative function       │
│  1. Check text length               │
│  2. If long: chunk + summarize      │
│  3. Generate narrative via AI       │
│  4. Parse JSON response             │
│  5. Add unique IDs                  │
│  6. Return structured data          │
└─────────────────────────────────────┘
         │
         ▼
{ themes, recommendedTemplate, narrative }
         │
         ▼
Store updates → Navigate to Preview
```

### 3. Presentation Flow
```
Preview Screen → User clicks "Present"
         │
         ▼
PresentScreen (fullscreen)
         │
         ├── Keyboard: Left/Right arrows
         ├── Click: Next section
         └── Escape: Exit to preview
```

## State Management (Zustand)

```typescript
interface NarrativeState {
  // Input
  rawText: string;
  businessWebsite: string;
  businessContext: BusinessContext | null;
  
  // Generated
  themes: Theme[];
  narrative: NarrativeSchema | null;
  selectedTemplate: TemplateName | null;
  
  // UI
  currentStep: "input" | "preview" | "present";
  isLoading: boolean;
  loadingStage: number;
  loadingProgress: number;
  
  // Presentation
  currentSectionIndex: number;
  viewMode: "present" | "reader";
}
```

## Edge Functions

### build-narrative
- **Input**: `{ text: string, businessContext?: BusinessContext }`
- **Output**: `{ themes, recommendedTemplate, narrative }`
- **Features**:
  - Smart text chunking for long inputs (>8000 chars)
  - Parallel chunk summarization
  - Context-aware prompting
  - JSON parsing with fallback

### scrape-business-context
- **Input**: `{ url: string }`
- **Output**: `{ context: BusinessContext }`
- **Features**:
  - URL normalization
  - Website content extraction
  - AI-powered context extraction

## File Structure

```
src/
├── components/
│   ├── input/
│   │   ├── InputScreen.tsx      # Main input UI
│   │   ├── VoiceRecorder.tsx    # Voice button component
│   │   └── BusinessContextInput.tsx
│   ├── preview/
│   │   ├── PreviewScreen.tsx    # Main preview UI
│   │   ├── NarrativePreview.tsx # Narrative display
│   │   └── QuickAdjustments.tsx # Theme/template tweaks
│   ├── present/
│   │   └── PresentScreen.tsx    # Fullscreen presentation
│   ├── ui/
│   │   ├── button.tsx           # Shimmer button variant
│   │   ├── loading.tsx          # Loading overlay
│   │   ├── error-recovery.tsx   # Error handling UI
│   │   └── InlineNotification.tsx # Professional notification system
│   └── mobile/
│       └── MobileAnimations.tsx # Haptic-enabled mobile animations
├── hooks/
│   ├── useVoiceRecorder.ts      # Web Speech API hook
│   ├── useHaptics.ts            # Haptic feedback (vibration)
│   └── use-toast.ts             # Legacy toast bridge → InlineNotification
├── store/
│   └── narrativeStore.ts        # Zustand store
├── lib/
│   ├── api.ts                   # API client functions
│   ├── types.ts                 # TypeScript types
│   ├── icons.tsx                # Icon mapping
│   └── templates/               # Template definitions
└── pages/
    └── Index.tsx                # Main page
```

## Security Considerations

1. **API Keys**: Stored in Supabase secrets, never exposed to client
2. **CORS**: Configured per-function in config.toml
3. **Rate Limiting**: Handled by Lovable AI Gateway
4. **Input Validation**: Text length limits enforced
