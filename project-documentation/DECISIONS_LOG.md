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

---

## Unified Branded Loading Experience

**Date**: 2024-12-14
**Status**: Accepted

### Context
The app had two different loading screen formats that would switch midway through the loading process. This created a jarring, unprofessional experience. The loading stages showed different icons for each stage (Search, Sparkles, Layout, FileText, Loader2) which caused visual discontinuity.

### Decision
Consolidate to a single, branded loading experience:
1. Use the C logo (conclusiv icon) as the central element
2. Rotate the C logo smoothly at 3s intervals
3. Surround with a progress ring that fills based on actual progress
4. Show stage text below (label + description)
5. Use consistent animation throughout - no switching formats

### Rationale
- **Brand consistency**: The C logo is recognizable and reinforces brand identity
- **Visual continuity**: Single animation style prevents jarring transitions
- **Premium feel**: Smooth, consistent animation conveys quality
- **User confidence**: Clear progress indication without format changes

**Alternatives Considered**:
- Multiple icons per stage (rejected: too distracting, causes visual discontinuity)
- Simple spinner only (rejected: less branded, no progress indication)
- Percentage text (rejected: can feel slow when percentage updates slowly)

### Consequences
- **Easier**: Consistent UX, easier to maintain single loading component
- **Harder**: Less visual variety (but this is intentional for premium feel)

### Revisit Conditions
- If users find the animation repetitive for long-running operations
- If we need to convey more specific stage information visually

---

## Mobile Sidebar Edge Buttons

**Date**: 2024-12-14
**Status**: Accepted

### Context
On mobile preview screen, users couldn't easily discover or access the sidebar panels for narrative analysis and quick adjustments. The header icons (BarChart3, Sliders) were small and not immediately obvious.

### Decision
Add always-visible edge buttons on left and right sides of the screen:
1. Left edge: PanelLeftOpen icon → Opens analysis panel (score, summary, improvements)
2. Right edge: PanelRightOpen icon → Opens adjustments panel (themes, template)
3. Buttons animate in after 0.5s delay
4. Buttons have subtle card styling with blur backdrop
5. Both header icons AND edge buttons work (multiple access points)

### Rationale
- **Discoverability**: Edge buttons are visible even during content navigation
- **Thumb-friendly**: Position at vertical center is easy to reach
- **Non-intrusive**: Small footprint doesn't block content
- **Consistent with patterns**: Similar to slide-out drawer hints in Google apps

### Consequences
- **Easier**: Users can always see and access sidebar controls
- **Harder**: Slightly more visual elements on screen

### Revisit Conditions
- If users find edge buttons distracting during content review
- If we add more sidebar panels that need access

---

## RefineScreen Three-Tab Design

**Date**: 2024-12-14
**Status**: Accepted

### Context
The RefineScreen had 4 tabs: Claims, Highlight, Voice, and Mapping. The Mapping tab was always disabled until a narrative was built, which confused users about its purpose. Users also weren't clear about what each tab offered.

### Decision
1. Remove the Mapping tab entirely (it's not useful pre-build)
2. Redesign remaining 3 tabs with vertical icon+label layout
3. Add animated contextual hint: "Choose how you'd like to refine your content"
4. Show dynamic description below tabs based on active selection
5. Use haptic feedback on tab changes

### Rationale
- **Clarity**: 3 functional options is clearer than 3 + 1 disabled
- **Better affordance**: Vertical layout with labels explains each option
- **Guided experience**: Hint and descriptions reduce cognitive load
- **Mobile-optimized**: Vertical tabs work better on narrow screens

### Consequences
- **Easier**: Users understand their options immediately
- **Harder**: Mapping functionality needs alternate access point post-build (if needed)

### Revisit Conditions
- If Mapping becomes essential pre-build
- If users want more than 3 refinement methods

---

## Presentation Mode Sidebar Access

**Date**: 2024-12-14
**Status**: Accepted

### Context
Users in presentation mode on mobile couldn't easily access the narrative overview or speaker notes. The only way to navigate was linear swiping or using the bottom dots. Users requested the same sidebar accessibility that exists in preview mode.

### Decision
1. Add edge buttons (PanelLeftOpen, PanelRightOpen) to MobilePresentScreen
2. Left button opens narrative section list (all sections with current position indicator)
3. Right button opens speaker notes panel for current section
4. Buttons animate in after 1 second delay to not distract from initial presentation
5. Panels use same spring animation style as preview mode

### Rationale
- **Consistency**: Same interaction pattern as preview mode
- **Non-linear navigation**: Presenters can jump to any section during Q&A
- **Notes access**: Speaker notes always accessible without disrupting presentation flow
- **Discoverability**: Edge buttons are visible but non-intrusive

**Alternatives Considered**:
- Header buttons only (rejected: too small, not obvious during presentation)
- Gesture-only navigation (rejected: not discoverable for new users)
- Always-visible section list (rejected: too distracting during presentation)

### Consequences
- **Easier**: Presenters can navigate freely during Q&A, access notes anytime
- **Harder**: Slightly more visual elements on screen

### Revisit Conditions
- If users find edge buttons distracting during presentation
- If we add audience-facing presentation mode where controls should be hidden

---

## Loading Screen Forward-Only Progress

**Date**: 2024-12-14
**Status**: Accepted

### Context
The loading progress bar would sometimes appear to go backwards or glitch when stage transitions occurred, creating an unprofessional appearance and reducing user confidence.

### Decision
1. Track last progress value using useRef
2. Only update displayed progress when new value is >= previous value
3. Use smooth CSS transitions for progress bar movement
4. Never animate backwards - only forward progression

### Rationale
- **Visual stability**: Progress bar only moves forward, never backwards
- **User confidence**: Consistent forward movement feels like steady progress
- **Premium feel**: No jarring visual glitches or resets

### Consequences
- **Easier**: Smoother, more professional loading experience
- **Harder**: None significant

### Revisit Conditions
- If accurate progress is critical and we need to show actual stage progress even if it means occasional backwards movement

---

## RefineScreen First-Time User Onboarding

**Date**: 2024-12-14
**Status**: Accepted

### Context
Users landing on the RefineScreen weren't immediately clear about what the three tab options (Review, Highlight, Voice) did or why they might use each one.

### Decision
1. Add first-time user onboarding card with clear explanation of all 3 options
2. Card appears above tabs with Info icon and dismissible button
3. Store dismissal state in localStorage to not show again
4. Keep brief animated hint for returning users

### Rationale
- **Immediate clarity**: New users understand all options at once
- **Respectful of time**: One-time display, dismissible, doesn't block workflow
- **Builds confidence**: Users know what to expect from each option

**Alternatives Considered**:
- Tooltip on hover (rejected: doesn't work well on mobile)
- Forced tutorial (rejected: too intrusive for experienced users)
- Help icon with modal (rejected: hidden, users might not click)

### Consequences
- **Easier**: Users understand the refinement options immediately
- **Harder**: Additional localStorage state to manage

### Revisit Conditions
- If user feedback indicates onboarding is redundant
- If we change the refinement options
