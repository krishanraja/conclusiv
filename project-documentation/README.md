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

## Getting Started

### Prerequisites
- Node.js 18+
- Lovable Cloud account (for backend features)

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

## Project Structure

```
src/
├── components/
│   ├── input/          # Voice and text input components
│   ├── preview/        # Narrative preview and editing
│   ├── present/        # Presentation mode
│   ├── ui/             # Shared UI components
│   └── layout/         # App layout components
├── hooks/              # Custom React hooks
├── lib/                # Utilities, types, and API
├── store/              # Zustand state management
└── pages/              # Route pages

supabase/
└── functions/          # Edge functions (AI processing)
    ├── build-narrative/
    ├── scrape-business-context/
    └── extract-themes/
```

## Core Flow

```
Input → Build Narrative → Preview → Present
  │           │             │          │
  │           │             │          └── Fullscreen presentation
  │           │             └── Edit, adjust templates
  │           └── AI generates themes + narrative
  └── Voice or paste research
```

## Support

- **Troubleshooting**: See [COMMON_ISSUES.md](./COMMON_ISSUES.md)
- **Architecture Questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Design Questions**: See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
