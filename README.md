# conclusiv

> Transform research into compelling business narratives in seconds.

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

## Overview

conclusiv eliminates the hours spent structuring and formatting presentations, letting professionals focus on what matters: their insights and message. Voice or paste your research, and get a polished narrative presentation in under 60 seconds.

**Live App**: Built with [Lovable](https://lovable.dev/projects/22f7a0d8-d82b-4fb8-8024-819230df03d0)

## Features

### Input Methods
- 🎤 **Voice Input** - Web Speech API (Chrome/Edge) or Whisper transcription
- 📝 **Text Paste** - Support for documents up to 50k+ characters
- 📄 **File Upload** - PDF, DOCX, and Google Docs
- 🌐 **Business Context** - Auto-extract company info from URL

### AI-Powered Intelligence
- 🎯 **Theme Extraction** - Identify 3-7 key themes with priority levels
- 📊 **Narrative Generation** - 4-8 structured sections with transitions
- 🔍 **Claim Verification** - AI-powered fact checking with confidence scores
- ⚡ **Tension Detection** - Find contradictions and blind spots
- 🔄 **Alternative Narratives** - Generate different framings (funding, risk, etc.)

### Presentation
- 🖥️ **Fullscreen Mode** - Keyboard and touch navigation
- 📱 **Mobile Optimized** - Haptic feedback, edge panels, swipe gestures
- 🎨 **5 Templates** - ZoomReveal, LinearStoryboard, FlyoverMap, ContrastSplit, PriorityLadder
- 📤 **Export** - PDF and PowerPoint generation

### Customization
- 🎭 **Audience Modes** - Executives, Product, Investors, Clients, Ops, Briefing
- ⏱️ **Duration Control** - 10s, 1min, 5min, or full presentation
- 🏷️ **Brand Integration** - Logo, colors, and fonts via Brandfetch
- 🖼️ **Section Images** - Pexels integration for imagery

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | Supabase Edge Functions (20 functions) |
| Database | Supabase PostgreSQL |
| AI | Lovable AI Gateway (Gemini 2.5 Flash) |
| Research | Perplexity API |
| Payments | Stripe |
| Testing | Playwright |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Development

```bash
# Clone the repository
git clone <your-repo-url>
cd conclusiv

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run Playwright tests
npm run test:ui      # Run tests with UI
npm run test:headed  # Run tests in headed mode
```

## Project Structure

```
src/
├── components/        # UI components by feature
│   ├── input/        # Voice, text, file input
│   ├── refine/       # Claims, highlights, feedback
│   ├── preview/      # Narrative preview, adjustments
│   └── present/      # Presentation mode
├── hooks/            # React hooks (17 custom hooks)
├── lib/              # Utilities, API, types
├── pages/            # Route pages (11 pages)
└── store/            # Zustand state management

supabase/
├── functions/        # Edge functions (20 functions)
└── migrations/       # Database schema
```

## Documentation

Detailed documentation in [`project-documentation/`](./project-documentation/):

| Document | Description |
|----------|-------------|
| [PURPOSE.md](./project-documentation/PURPOSE.md) | Mission, vision, user personas |
| [ARCHITECTURE.md](./project-documentation/ARCHITECTURE.md) | Technical stack, data flows |
| [FEATURES.md](./project-documentation/FEATURES.md) | Feature catalog with status |
| [DESIGN_SYSTEM.md](./project-documentation/DESIGN_SYSTEM.md) | Colors, typography, components |
| [COMMON_ISSUES.md](./project-documentation/COMMON_ISSUES.md) | Troubleshooting guide |
| [DECISIONS_LOG.md](./project-documentation/DECISIONS_LOG.md) | Architectural decisions |
| [HISTORY.md](./project-documentation/HISTORY.md) | Changelog and versions |

## Deployment

### Vercel (Frontend)

1. Import project to Vercel
2. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy

### Supabase (Backend)

1. Create new Supabase project
2. Run `supabase/migrations/consolidated_schema.sql`
3. Configure Edge Function secrets:
   - `STRIPE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `LOVABLE_API_KEY`
   - `PERPLEXITY_API_KEY`
   - `OPENAI_API_KEY`
   - `PEXELS_API_KEY`
   - `BRANDFETCH_BRAND_API_KEY`

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) and [NEXT_STEPS_GUIDE.md](./NEXT_STEPS_GUIDE.md) for detailed instructions.

## Contributing

1. Read [MASTER_INSTRUCTIONS.md](./project-documentation/MASTER_INSTRUCTIONS.md) for coding guidelines
2. Check [AUDIT_STATUS.md](./project-documentation/AUDIT_STATUS.md) for compliance checklist
3. Update [HISTORY.md](./project-documentation/HISTORY.md) with your changes

## License

Private - All rights reserved.

---

Built with ❤️ using [Lovable](https://lovable.dev)
