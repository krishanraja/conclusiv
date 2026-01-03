# conclusiv

> Transform research into compelling business narratives

## Quick Links

| Document | Purpose |
|----------|---------|
| [PURPOSE.md](./PURPOSE.md) | Mission, vision, and core value proposition |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical stack, data flows, and system design |
| [FEATURES.md](./FEATURES.md) | Feature catalog with implementation status |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Colors, typography, components, and patterns |
| [COMMON_ISSUES.md](./COMMON_ISSUES.md) | Troubleshooting guide for known issues |
| [DECISIONS_LOG.md](./DECISIONS_LOG.md) | Architectural decisions and rationale |
| [HISTORY.md](./HISTORY.md) | Changelog and version history |
| [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md) | Engineering guidelines for AI agents |
| [AUDIT_STATUS.md](./AUDIT_STATUS.md) | Compliance tracking against master instructions |
| [PROJECT_NOTES.md](./PROJECT_NOTES.md) | Running decisions, TODOs, quick references |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (for backend features)

### Development
```bash
npm install
npm run dev
```

### Key Concepts

| Term | Definition |
|------|------------|
| **Narrative** | A structured presentation generated from research input |
| **Theme** | A key topic or concept extracted from the research |
| **Section** | A slide-like unit within a narrative |
| **Template** | A presentation style (ZoomReveal, LinearStoryboard, etc.) |
| **Business Context** | Optional company info to personalize output |
| **Key Claim** | An assertion or statement extracted for review |
| **Tension** | A contradiction, blind spot, or hidden risk in content |
| **Audience Mode** | Target audience adaptation (exec, investors, etc.) |
| **Archetype** | Narrative format (strategy_brief, investor_pitch, etc.) |

## Project Structure

```
src/
├── components/
│   ├── input/          # Voice, text, and file input components
│   ├── refine/         # Claims review and content refinement
│   ├── preview/        # Narrative preview and editing
│   ├── present/        # Presentation mode
│   ├── ui/             # Shared UI components (shadcn)
│   ├── mobile/         # Mobile-specific components
│   └── layout/         # App layout components
├── hooks/              # Custom React hooks (17 hooks)
├── lib/                # Utilities, types, API, templates
├── store/              # Zustand state management
└── pages/              # Route pages (11 pages)

supabase/
└── functions/          # Edge functions (20 functions)
    ├── build-narrative/
    ├── extract-claims/
    ├── verify-claim/
    ├── guided-research/
    └── ... (16 more)
```

## Core Flow

```
Input → Refine → Preview → Present
  │        │        │         │
  │        │        │         └── Fullscreen presentation with animations
  │        │        └── Edit sections, adjust settings, export
  │        └── Review claims, highlight passages, add voice feedback
  └── Voice input, paste text, upload files, add business context
```

## Intelligence Phases

| Phase | Feature | Description |
|-------|---------|-------------|
| 1 | Audience Mode | Adapt content for executives, investors, product teams, etc. |
| 2 | Tension Detector | Find contradictions and blind spots in content |
| 3 | Narrative Archetypes | Apply structured formats (strategy brief, pitch, etc.) |
| 4 | Adaptive Compression | Control duration (10s to full presentation) |
| 5 | View Modes | Present, reader, or external sharing modes |
| 6 | Company Brain | Apply historical context and patterns |
| 7 | Alternative Narratives | Generate different framings for goals |

## Edge Functions (20)

| Function | Purpose |
|----------|---------|
| `build-narrative` | Generate complete narrative from input |
| `extract-themes` | Extract key themes from content |
| `extract-claims` | Extract assertions for review |
| `extract-tensions` | Find contradictions and risks |
| `verify-claim` | Fact-check claims with AI |
| `normalize-claim` | Clean up claim text |
| `generate-alternatives` | Create alternative narratives |
| `guided-research` | Perplexity-powered research |
| `scrape-business-context` | Extract company info from URL |
| `fetch-brand-data` | Get logo/colors from Brandfetch |
| `parse-document` | Extract text from PDF/DOCX |
| `parse-google-doc` | Import from Google Docs |
| `transcribe-audio` | Whisper transcription |
| `search-images` | Pexels image search |
| `create-checkout` | Stripe checkout session |
| `customer-portal` | Stripe billing portal |
| `check-subscription` | Verify subscription status |
| `verify-share-password` | Check share link password |
| `send-contact-email` | Contact form emails |
| `send-feedback-email` | Feedback submission emails |

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and onboarding state |
| `subscriptions` | Stripe subscription data |
| `usage` | Weekly build count tracking |
| `narratives` | Saved/shared narratives |
| `analytics_sessions` | Session tracking |
| `analytics_events` | Event tracking |
| `feedback` | User feedback |
| `research_jobs` | Async research queue |

## Support

- **Troubleshooting**: See [COMMON_ISSUES.md](./COMMON_ISSUES.md)
- **Architecture Questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Design Questions**: See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Engineering Guidelines**: See [MASTER_INSTRUCTIONS.md](./MASTER_INSTRUCTIONS.md)

## Deployment

See the root directory for deployment guides:
- [SUPABASE_SETUP.md](../SUPABASE_SETUP.md) - Supabase configuration
- [NEXT_STEPS_GUIDE.md](../NEXT_STEPS_GUIDE.md) - Step-by-step deployment
- [MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md) - Migration notes

---

*Last updated: 2025-01-03*
