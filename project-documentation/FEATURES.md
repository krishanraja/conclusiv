# Features

## Feature Status Legend

| Status | Meaning |
|--------|---------|
| ✅ | Implemented and tested |
| 🔄 | In progress |
| ⏳ | Planned |
| ❌ | Not planned |

## Core Features

### Input Methods

| Feature | Status | Notes |
|---------|--------|-------|
| Voice input (Web Speech) | ✅ | Chrome/Edge, pulsing mic button |
| Voice input (Whisper) | ✅ | Server-side transcription for all browsers |
| Text paste | ✅ | Supports large documents (50k+ chars) |
| Business URL scraping | ✅ | Auto-extracts company context |
| File upload (PDF) | ✅ | Via parse-document edge function |
| File upload (DOCX) | ✅ | Via parse-document edge function |
| Google Docs import | ✅ | Via parse-google-doc edge function |

### AI Processing

| Feature | Status | Notes |
|---------|--------|-------|
| Theme extraction | ✅ | 3-7 themes with priority levels |
| Narrative generation | ✅ | 4-8 sections with transitions |
| Template recommendation | ✅ | 5 template types |
| Long document chunking | ✅ | Smart paragraph-aware chunking |
| Business context personalization | ✅ | Tailored to company voice |
| Key claims extraction | ✅ | Extract assertions from content |
| Claim verification | ✅ | AI-powered fact checking |
| Tension detection | ✅ | Find contradictions and blind spots |
| Alternative narratives | ✅ | Generate different framings |
| Guided research | ✅ | Perplexity-powered research |

### Intelligence Phases

| Phase | Feature | Status | Notes |
|-------|---------|--------|-------|
| 1 | Audience Mode | ✅ | exec, product, investors, clients, ops, briefing |
| 2 | Tension Detector | ✅ | Contradictions, blind spots, hidden risks |
| 3 | Narrative Archetypes | ✅ | 8 archetype templates |
| 4 | Adaptive Compression | ✅ | 10s, 1min, 5min, full durations |
| 5 | View Modes | ✅ | present, reader, external |
| 6 | Company Brain | 🔄 | Historical themes and patterns |
| 7 | Alternative Narratives | ✅ | funding, alignment, adversarial, optimistic, risk |

### Refinement

| Feature | Status | Notes |
|---------|--------|-------|
| Key claims review | ✅ | Approve, reject, edit claims |
| Claim alternatives | ✅ | AI-generated alternative framings |
| Text highlighting | ✅ | Highlight key passages |
| Voice feedback | ✅ | Add spoken context |
| Claim normalization | ✅ | AI cleanup of claim text |

### Presentation

| Feature | Status | Notes |
|---------|--------|-------|
| Fullscreen present mode | ✅ | Keyboard navigation |
| Reader mode | ✅ | Scrollable view |
| External view mode | ✅ | Clean shareable view |
| Section navigation | ✅ | Click, arrows, swipe |
| Animated transitions | ✅ | Framer Motion |
| Exit to preview | ✅ | Escape key |
| Mobile presentation | ✅ | Touch gestures, edge panels |
| Speaker notes panel | ✅ | Right slide-out on mobile |
| Section list panel | ✅ | Left slide-out on mobile |

### Editing

| Feature | Status | Notes |
|---------|--------|-------|
| Edit section content | ✅ | Inline text editing |
| Change section icons | ✅ | Icon picker UI |
| Section images | ✅ | Pexels integration |
| Toggle themes | ✅ | Keep/remove themes |
| Change template | ✅ | Template selector |
| Reorder sections | ⏳ | Drag and drop planned |
| Logo customization | ✅ | Position, size, visibility |
| Color customization | ✅ | Primary, secondary, accent |
| Font customization | ✅ | Primary and secondary fonts |

### Export & Sharing

| Feature | Status | Notes |
|---------|--------|-------|
| Shareable link | ✅ | Unique URL generation |
| Password protection | ✅ | Optional share password |
| PDF export | ✅ | jsPDF integration |
| PowerPoint export | ✅ | pptxgenjs integration |
| Embed code | ⏳ | iframe embed planned |

### Brand Integration

| Feature | Status | Notes |
|---------|--------|-------|
| Logo upload | ✅ | User-uploaded logo |
| Logo from URL | ✅ | Brandfetch integration |
| Logo variants | ✅ | Light/dark, svg/png options |
| Brand colors | ✅ | Primary, secondary, accent |
| Brand fonts | ✅ | From Brandfetch |
| Firmographics | ✅ | Employee count, founded year, location |

## Template Types

| Template | Best For | Status |
|----------|----------|--------|
| ZoomReveal | Hierarchical data, big-picture to details | ✅ |
| LinearStoryboard | Chronological stories, step-by-step | ✅ |
| FlyoverMap | Geographic/spatial relationships | ✅ |
| ContrastSplit | Comparisons, pros/cons | ✅ |
| PriorityLadder | Ranked lists, priority-based | ✅ |

## Narrative Archetypes

| Archetype | Description | Status |
|-----------|-------------|--------|
| strategy_brief | High-level strategic overview | ✅ |
| exec_decision_memo | Executive decision document | ✅ |
| investor_pitch | Investment pitch deck style | ✅ |
| gtm_plan | Go-to-market planning | ✅ |
| problem_framing | Problem definition and analysis | ✅ |
| root_cause | Root cause analysis format | ✅ |
| workshop_outline | Workshop facilitation guide | ✅ |
| competitive_teardown | Competitive analysis | ✅ |

## UI/UX Features

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-stage loading | ✅ | Progress indicators with C logo |
| Error recovery UI | ✅ | Retry options with error codes |
| Inline notifications | ✅ | Professional non-intrusive feedback |
| Responsive design | ✅ | Mobile-first approach |
| Dark theme | ✅ | Default cinematic theme |
| Haptic feedback | ✅ | Mobile touch feedback |
| Mobile animations | ✅ | PulseRing, CardStack, ScrollReveal |
| Start over option | ✅ | Reset from any screen |
| Post-setup guidance | ✅ | Contextual hints |
| Onboarding flow | ✅ | First-time user guidance |
| RefineScreen tabs | ✅ | Review, Highlight, Voice options |
| Edge navigation buttons | ✅ | Mobile sidebar access |
| Keyboard shortcuts | ⏳ | Full keyboard nav planned |

## User Management

| Feature | Status | Notes |
|---------|--------|-------|
| Email/password auth | ✅ | Supabase Auth |
| User profiles | ✅ | Display name, company logo |
| Onboarding state | ✅ | Track completion progress |
| Subscription tiers | ✅ | Free, Pro via Stripe |
| Usage tracking | ✅ | Weekly build counts |
| Build limits | ✅ | Free: 1/week, Pro: unlimited |

## Analytics & Feedback

| Feature | Status | Notes |
|---------|--------|-------|
| Session tracking | ✅ | Device, browser, referrer |
| Event tracking | ✅ | User actions and flows |
| Feedback forms | ✅ | In-app feedback submission |
| Contact form | ✅ | Email via Resend |

## Browser Support

| Browser | Voice (Web Speech) | Voice (Whisper) | Full Features |
|---------|-------------------|-----------------|---------------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ❌ | ✅ | ✅ |
| Safari | ❌ | ✅ | ✅ |

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Time to first narrative | <30s | ~20s |
| Long document (50k chars) | <90s | ~60s |
| Page load | <3s | ~2s |
| Animation frame rate | 60fps | 60fps |
| Lighthouse Performance | >90 | ~92 |

## API Rate Limits

| API | Limit | Handling |
|-----|-------|----------|
| Lovable AI Gateway | Platform managed | Retry with backoff |
| Perplexity | 20 req/min | Queue system |
| Brandfetch | 250 req/month | Cache results |
| Pexels | 200 req/hour | Client-side caching |

## Future Roadmap

### In Progress 🔄
- [ ] Company Brain historical context
- [ ] Full keyboard shortcuts

### Planned ⏳
- [ ] Section reordering via drag and drop
- [ ] Custom color theme builder
- [ ] Embed code generation
- [ ] Collaboration features
- [ ] Real-time co-editing
- [ ] Version history per narrative
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] API access for integrations

### Under Consideration
- [ ] Team/organization accounts
- [ ] White-label option
- [ ] Custom AI model selection
- [ ] Offline mode
- [ ] Browser extension

---

*Last updated: 2025-01-03*
