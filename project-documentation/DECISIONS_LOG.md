# Decisions Log

This document records significant architectural and design decisions.

## Template

```markdown
## [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context
What is the issue that we're seeing that is motivating this decision?

### Decision
What is the change that we're proposing and/or doing?

### Rationale
Why is this change being proposed? What alternatives were considered?

### Consequences
What becomes easier or more difficult as a result of this change?

### Revisit Conditions
Under what circumstances should this decision be reconsidered?
```

---

## Voice-First Input Approach

**Date**: 2024-01-15
**Status**: Accepted

### Context
Users often have research in their heads or in audio format. Typing out research is friction.

### Decision
Make voice input the primary (most prominent) input method, with text paste as secondary.

### Rationale
- Reduces friction for users who think verbally
- Differentiates from competitors
- Mobile-friendly
- Faster for stream-of-consciousness input

**Alternatives Considered**:
- Text-first with voice as option (traditional approach)
- File upload first (requires more user preparation)

### Consequences
- **Easier**: Getting started, mobile usage, accessibility for some users
- **Harder**: Precise input editing, browser compatibility (Chrome/Edge only)

### Revisit Conditions
- If >30% of users disable voice and use text only
- If browser support for Web Speech API declines

---

## 3-Step Flow (Input → Preview → Present)

**Date**: 2024-01-15
**Status**: Accepted

### Context
Original flow had 5 steps: Input → Extract → Review → Template → Editor → Present

### Decision
Consolidate to 3 steps with AI handling extraction, template selection, and narrative generation in one call.

### Rationale
- Reduces user friction and decision fatigue
- AI is good enough to make reasonable defaults
- Users can still adjust in Preview
- Faster time-to-presentation

**Alternatives Considered**:
- Keep 5 steps for maximum control
- 2 steps (Input → Present) with no editing

### Consequences
- **Easier**: Faster to presentation, less cognitive load
- **Harder**: Users wanting fine-grained control at each step

### Revisit Conditions
- If users frequently need to redo narratives due to wrong template selection
- If we add complex features that need their own step

---

## Business Context as Optional Enhancement

**Date**: 2024-01-15
**Status**: Accepted

### Context
Business context (company info) can significantly improve narrative personalization but requires extra input from user.

### Decision
Make business context optional via collapsible URL input. Auto-scrape when URL provided.

### Rationale
- Doesn't block users who want quick results
- Provides significant value when used
- Auto-scraping reduces manual input
- Collapsible UI keeps main flow clean

**Alternatives Considered**:
- Required business context (higher friction)
- Manual form fields (more work for user)
- No business context (lower quality output)

### Consequences
- **Easier**: Quick start without setup, better output when context provided
- **Harder**: Users may not discover the feature

### Revisit Conditions
- If personalized narratives have significantly higher completion rates
- If scraping becomes unreliable

---

## Lovable AI Gateway Over Direct API

**Date**: 2024-01-15
**Status**: Accepted

### Context
Need LLM access for narrative generation. Options: Direct OpenAI, Direct Anthropic, Lovable AI Gateway.

### Decision
Use Lovable AI Gateway with gemini-2.5-flash model.

### Rationale
- No API key management required
- Built-in rate limiting
- Cost included in Lovable platform
- Consistent availability
- Fast model good for interactive use

**Alternatives Considered**:
- Direct OpenAI API (requires user API key)
- Direct Anthropic API (requires user API key)
- Multiple providers with fallback

### Consequences
- **Easier**: No setup, consistent experience, no key management
- **Harder**: Less model choice, dependent on Lovable infrastructure

### Revisit Conditions
- If Lovable AI Gateway has reliability issues
- If specific model capabilities are needed (e.g., Claude for complex reasoning)
- If costs become prohibitive

---

## Web Speech API Over External Service

**Date**: 2024-01-15
**Status**: Accepted

### Context
Voice transcription needed. Options: Browser Web Speech API, Whisper API, AssemblyAI, etc.

### Decision
Use browser's native Web Speech API.

### Rationale
- No additional cost
- No additional latency (local processing)
- Good enough accuracy for this use case
- Privacy (audio stays local)

**Alternatives Considered**:
- Whisper API (higher accuracy, cost per minute)
- AssemblyAI (real-time, cost per minute)
- Google Cloud Speech (high accuracy, complex setup)

### Consequences
- **Easier**: No API setup, no cost, instant feedback
- **Harder**: Browser compatibility limited, less accurate than cloud services

### Revisit Conditions
- If accuracy complaints are common
- If we need to support Firefox/Safari
- If we need transcription of uploaded audio files

---

## Zustand Over Redux/Context

**Date**: 2024-01-15
**Status**: Accepted

### Context
Need state management for multi-step flow with shared state across components.

### Decision
Use Zustand for state management.

### Rationale
- Minimal boilerplate
- No providers needed
- Easy to use with TypeScript
- Good devtools
- Perfect for medium complexity apps

**Alternatives Considered**:
- Redux Toolkit (more boilerplate, better for large teams)
- React Context (simpler but re-render issues)
- Jotai (atomic, more setup for our use case)

### Consequences
- **Easier**: Quick setup, simple API, no context providers
- **Harder**: Team familiarity (if coming from Redux)

### Revisit Conditions
- If state becomes too complex for single store
- If we need time-travel debugging extensively

---

## Edge Functions Over Client-Side AI

**Date**: 2024-01-15
**Status**: Accepted

### Context
AI calls need to be made. Options: Client-side with API key, server-side via edge functions.

### Decision
Use Supabase Edge Functions for all AI calls.

### Rationale
- Secrets (API keys) stay server-side
- Better error handling and retry logic
- Can aggregate/process before returning
- Rate limiting at server level

**Alternatives Considered**:
- Client-side with exposed API key (security risk)
- Traditional backend server (more infrastructure)

### Consequences
- **Easier**: Secure, centralized logic, can process data before returning
- **Harder**: Cold starts, debugging, additional deployment step

### Revisit Conditions
- If edge function latency becomes problematic
- If we need persistent connections (websockets)

---

## Post-Setup Guidance for User Flow Clarity

**Date**: 2024-12-14
**Status**: Accepted

### Context
After completing the personalization setup (adding business context, selecting story mode), users land back on the homepage with the setup drawer closed. While the Upload/Generate buttons have shimmer borders to attract attention, user testing revealed that after going through personalization, users may have forgotten that their next action is to add content. The transition from "personalize" to "add content" wasn't immediately clear.

### Decision
Add a contextual post-setup guidance message that appears after the setup sheet closes:
1. A subtle inline "Ready. Add your content below." message with a checkmark icon
2. Uses the gradient-text style consistent with brand design
3. Auto-dismisses after 5 seconds OR when user starts adding content
4. Replaces the "Tap settings to personalize" hint on mobile when setup is complete

### Rationale
- Provides clear transition from personalization to content input
- Maintains elegant, minimalist aesthetic (not a toast)
- Respects busy CEO users - gentle nudge, not hand-holding
- Auto-dismisses to avoid clutter
- Uses existing animation patterns for smooth UX
- Works on both mobile and desktop experiences

**Alternatives Considered**:
- Toast notification (rejected: user specifically requested no toast)
- Auto-focus on textarea (too aggressive, might trigger keyboard on mobile)
- Highlight/pulse animation on buttons only (insufficient context)
- Persistent hint text (too static, doesn't communicate state change)

### Consequences
- **Easier**: Clear next action after personalization, reduced confusion
- **Harder**: Additional state to manage, slightly more complex component logic

### Revisit Conditions
- If user feedback indicates the message is redundant or annoying
- If engagement with Upload/Generate doesn't improve
- If we add more onboarding steps that change the flow
