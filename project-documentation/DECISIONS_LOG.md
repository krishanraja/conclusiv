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

## Dedicated Supabase Project Migration

**Date**: 2025-01-03
**Status**: Accepted

### Context
The application was originally on a shared Supabase project, causing potential conflicts and security concerns. Hardcoded project IDs were scattered throughout the codebase.

### Decision
Migrate to a dedicated Supabase project with:
1. Consolidated schema in single SQL file
2. All hardcoded project IDs removed
3. Environment variable validation in all edge functions
4. Comprehensive deployment documentation

### Rationale
- **Security**: Dedicated project isolates data and secrets
- **Maintainability**: Single schema file easier to manage
- **Reliability**: No conflicts with other projects
- **Portability**: Can deploy to any Supabase project

**Files Created**:
- `supabase/migrations/consolidated_schema.sql`
- `SUPABASE_SETUP.md`
- `MIGRATION_SUMMARY.md`
- `NEXT_STEPS_GUIDE.md`

### Consequences
- **Easier**: Clean deployments, clear documentation, no shared state
- **Harder**: Need to set up all secrets and run schema on new projects

### Revisit Conditions
- If we need multi-tenant architecture
- If schema becomes too large for single file

---

## Seven Intelligence Phases Architecture

**Date**: 2025-01-01
**Status**: Accepted

### Context
Narrative generation was one-size-fits-all. Users needed more control over output format, audience, and framing.

### Decision
Implement 7 progressive intelligence phases:
1. **Audience Mode**: Adapt for executives, investors, product teams, etc.
2. **Tension Detector**: Find contradictions and blind spots
3. **Narrative Archetypes**: Apply structured formats (strategy_brief, etc.)
4. **Adaptive Compression**: Control duration (10s to full)
5. **View Modes**: Present, reader, external sharing
6. **Company Brain**: Historical context and patterns
7. **Alternative Narratives**: Generate different framings

### Rationale
- **User Control**: Users can tune output to their needs
- **Differentiation**: Unique intelligence features
- **Progressive**: Optional phases, don't overwhelm new users
- **Reusable**: Each phase is independent and composable

### Consequences
- **Easier**: Rich customization, professional output, target audience matching
- **Harder**: More state to manage, more UI complexity

### Revisit Conditions
- If phases are rarely used (consider removal)
- If new intelligence needs emerge

---

## 20 Edge Functions Architecture

**Date**: 2025-01-01
**Status**: Accepted

### Context
Originally had 3 edge functions. As features expanded (claim verification, research, brand data), needed more specialized functions.

### Decision
Expand to 20 focused edge functions, each with single responsibility:
- **Content Processing**: build-narrative, parse-document, transcribe-audio, etc.
- **AI Analysis**: extract-themes, extract-claims, verify-claim, etc.
- **Utilities**: create-checkout, send-contact-email, etc.

### Rationale
- **Single Responsibility**: Each function does one thing well
- **Maintainability**: Easier to debug and update
- **Scalability**: Functions scale independently
- **Security**: Minimal permissions per function

### Consequences
- **Easier**: Debugging, testing, updates, security
- **Harder**: More functions to deploy and monitor

### Revisit Conditions
- If deployment becomes too complex
- If we need to consolidate for cold start performance

---

## Key Claims Extraction and Verification

**Date**: 2024-12-20
**Status**: Accepted

### Context
Users paste content containing assertions and claims. No way to verify accuracy or review key statements before building narrative.

### Decision
Add RefineScreen with:
1. Extract key claims from content using AI
2. Allow approve/reject/edit of claims
3. Generate alternative framings for claims
4. Verify claims using AI fact-checking
5. Normalize claim text for clarity

### Rationale
- **Accuracy**: Catch errors before they become slides
- **User Control**: Choose what assertions to include
- **Quality**: Better narratives from curated claims
- **Trust**: Verification builds confidence in output

### Consequences
- **Easier**: Quality control, fact-checking, claim management
- **Harder**: Additional step in flow, more complexity

### Revisit Conditions
- If users skip refinement consistently
- If claim extraction accuracy is poor

---

## 4-Step Flow (Input → Refine → Preview → Present)

**Date**: 2024-12-14
**Status**: Accepted

### Context
Original 3-step flow (Input → Preview → Present) didn't allow content refinement before narrative generation.

### Decision
Add `refine` step between input and preview:
- Review extracted claims
- Highlight important passages
- Add voice feedback
- Verify claims

### Rationale
- **Quality**: Better input = better output
- **User Control**: Review before AI processes
- **Optional**: Users can skip if they want quick results

### Consequences
- **Easier**: Quality narratives, claim review, user confidence
- **Harder**: Longer flow for some users

### Revisit Conditions
- If skip rate is >80%
- If we find better ways to refine during preview

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
- **Harder**: Precise input editing, browser compatibility (Web Speech: Chrome/Edge only)

### Revisit Conditions
- If >30% of users disable voice and use text only
- If browser support for Web Speech API declines
- Note: Added Whisper fallback for all browsers

---

## Business Context as Optional Enhancement

**Date**: 2024-01-15
**Status**: Accepted

### Context
Business context (company info) can significantly improve narrative personalization but requires extra input from user.

### Decision
Make business context optional via collapsible URL input. Auto-scrape when URL provided. Add Brandfetch for brand data.

### Rationale
- Doesn't block users who want quick results
- Provides significant value when used
- Auto-scraping reduces manual input
- Collapsible UI keeps main flow clean

### Consequences
- **Easier**: Quick start without setup, better output when context provided
- **Harder**: Users may not discover the feature

### Revisit Conditions
- If personalized narratives have significantly higher completion rates
- If scraping becomes unreliable

---

## Unified Branded Loading Experience

**Date**: 2024-12-14
**Status**: Accepted

### Context
The app had two different loading screen formats that would switch midway through loading. This created a jarring, unprofessional experience.

### Decision
Consolidate to a single, branded loading experience:
1. Use the C logo as the central element
2. Rotate the C logo smoothly
3. Surround with a progress ring
4. Progress only animates forward (never backwards)
5. Use consistent animation throughout

### Rationale
- **Brand consistency**: The C logo is recognizable
- **Visual continuity**: No format switching
- **Premium feel**: Smooth, consistent animation
- **User confidence**: Clear progress indication

### Consequences
- **Easier**: Consistent UX, easier to maintain
- **Harder**: Less visual variety (intentional for premium feel)

### Revisit Conditions
- If users find the animation repetitive for long-running operations

---

## Inline Notifications Over Toasts

**Date**: 2024-12-14
**Status**: Accepted

### Context
Toast notifications were disruptive and inconsistent with the premium feel of the app.

### Decision
Replace all toast popups with inline notifications:
1. NotificationProvider at app root
2. InlineNotification component
3. useNotification hook
4. Bridge legacy toast calls to new system

### Rationale
- **Less disruptive**: Notifications appear in context
- **More professional**: Matches premium aesthetic
- **Better mobile**: Works well on all screen sizes

### Consequences
- **Easier**: Consistent notification UX
- **Harder**: Need to decide where each notification appears

### Revisit Conditions
- If certain notifications need more visibility
- If we add system-level alerts

---

## Mobile-First Haptic Feedback

**Date**: 2024-12-14
**Status**: Accepted

### Context
Mobile interactions felt disconnected. Users couldn't feel the app responding to their touches.

### Decision
Add haptic feedback via `useHaptics` hook:
- light (10ms) for subtle feedback
- medium (25ms) for standard interactions
- heavy (50ms) for significant actions
- success/error patterns for outcomes
- selection (5ms) for tab changes

### Rationale
- **Physical feedback**: Makes app feel more responsive
- **Accessibility**: Helps users know actions registered
- **Premium feel**: High-quality mobile experience

### Consequences
- **Easier**: Better mobile UX
- **Harder**: Need to use appropriately (not overdo it)

### Revisit Conditions
- If users report vibration as annoying
- If battery impact is significant

---

## Presentation Mode Edge Buttons

**Date**: 2024-12-14
**Status**: Accepted

### Context
Users in presentation mode on mobile couldn't easily access navigation or speaker notes.

### Decision
Add always-visible edge buttons on left and right sides:
1. Left: Opens section list panel
2. Right: Opens speaker notes panel
3. Buttons animate in after delay
4. Panels use spring animations

### Rationale
- **Discoverability**: Edge buttons are visible
- **Thumb-friendly**: Easy to reach
- **Non-intrusive**: Small footprint
- **Consistent**: Same pattern as preview mode

### Consequences
- **Easier**: Non-linear navigation, notes access
- **Harder**: Slightly more visual elements on screen

### Revisit Conditions
- If users find edge buttons distracting
- If we add audience-facing mode where controls should be hidden

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

### Consequences
- **Easier**: Secure, centralized logic, can process data
- **Harder**: Cold starts, debugging, deployment step

### Revisit Conditions
- If edge function latency becomes problematic
- If we need persistent connections (websockets)

---

## Lovable AI Gateway Over Direct API

**Date**: 2024-01-15
**Status**: Accepted

### Context
Need LLM access for narrative generation. Options: Direct OpenAI, Direct Anthropic, Lovable AI Gateway.

### Decision
Use Lovable AI Gateway with Gemini 2.5 Flash model.

### Rationale
- No API key management required
- Built-in rate limiting
- Cost included in Lovable platform
- Consistent availability
- Fast model good for interactive use

### Consequences
- **Easier**: No setup, consistent experience, no key management
- **Harder**: Less model choice, dependent on Lovable infrastructure

### Revisit Conditions
- If Lovable AI Gateway has reliability issues
- If specific model capabilities are needed
- If costs become prohibitive

---

## Perplexity for Research

**Date**: 2024-12-20
**Status**: Accepted

### Context
Users wanted AI-powered research capabilities to supplement their content.

### Decision
Integrate Perplexity API for guided research:
1. Formulate research query from structured input
2. Execute research with quick/deep modes
3. Return summary, key findings, citations

### Rationale
- **Research quality**: Perplexity specializes in research
- **Citations**: Provides sources for credibility
- **Speed**: Faster than building custom scraping
- **Reliability**: Maintained by Perplexity team

### Consequences
- **Easier**: High-quality research with citations
- **Harder**: Additional API dependency and costs

### Revisit Conditions
- If Perplexity API becomes too expensive
- If we need custom research capabilities

---

*This log should be updated when significant decisions are made.*

*Last updated: 2025-01-03*
