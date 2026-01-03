# History

Changelog and version history for conclusiv.

## Format

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features

### Technical
- Internal changes, refactoring
```

---

## [0.6.0] - 2025-01-03

### Added
- **Supabase Migration**: Complete migration to dedicated Supabase project with consolidated schema
- **20 Edge Functions**: Expanded from 3 to 20 edge functions for comprehensive AI capabilities
- **Claim Verification System**: AI-powered fact checking with confidence scores
- **Guided Research**: Structured research flow with formulate → execute phases
- **Brand Data Integration**: Brandfetch integration for logo and brand colors
- **Voice Transcription**: Whisper-based audio transcription via `transcribe-audio` function
- **Document Parsing**: Support for PDF, DOCX, and Google Docs via `parse-document` and `parse-google-doc`
- **Image Search**: Pexels integration for section images via `search-images`
- **Narrative Alternatives**: AI-generated alternative narratives with different goals
- **Tension Detection**: Identify contradictions, blind spots, and hidden risks in content
- **Blog System**: Blog with SEO support and blogData management
- **Share Functionality**: Password-protected shareable narrative links
- **Power User Features**: Advanced features for pro users
- **Playwright E2E Testing**: End-to-end testing infrastructure

### Changed
- **Project Structure**: Reorganized components into feature-based folders
- **Types System**: Expanded types to support audience modes, archetypes, durations, view modes
- **State Management**: Enhanced Zustand store with 7 intelligence phases
- **API Layer**: Comprehensive API module with 15+ typed response interfaces

### Technical
- Created consolidated_schema.sql with 15+ tables
- Added comprehensive environment variable validation
- Implemented structured logging across all edge functions
- Added MIGRATION_SUMMARY.md and NEXT_STEPS_GUIDE.md for deployment
- Full TypeScript coverage with strict types

---

## [0.5.0] - 2025-01-01

### Added
- **Intelligence Phases 1-7**: Complete narrative intelligence system
  - Phase 1: Audience Mode (exec, product, investors, clients, ops, briefing)
  - Phase 2: Tension Detector for contradictions and blind spots
  - Phase 3: Narrative Archetypes (strategy_brief, exec_decision_memo, etc.)
  - Phase 4: Adaptive Compression with duration controls
  - Phase 5: View Modes (present, reader, external)
  - Phase 6: Company Brain for historical context
  - Phase 7: Alternative Narratives generation
- **Presentation Styling**: Logo position, size, colors, fonts customization
- **Key Claims System**: Extract, approve, reject, edit claims from content
- **Claim Alternatives**: AI-generated alternative framings for claims
- **Section Images**: Pexels image search per section
- **Quick Adjustments Change Tracking**: Detect unsaved changes

### Changed
- **4-Step Flow**: Input → Refine → Preview → Present
- **RefineScreen**: Three-tab design with Review, Highlight, Voice options
- **Store Architecture**: Comprehensive state with 7 phase support

### Technical
- Added `QuickAdjustmentSettings` interface for change detection
- Implemented `snapshotSettings()` and `hasUnsavedChanges()` methods
- Extended `NarrativeSchema` with styling options

---

## [0.4.2] - 2024-12-14

### Added
- **Presentation Mode Edge Buttons**: Always-visible edge buttons for section navigation and speaker notes
- **Narrative Section Panel**: Left slide-out panel showing all sections with current position
- **Speaker Notes Panel**: Right slide-out panel for viewing notes during presentation
- **Refine Screen Onboarding Modal**: First-time user onboarding for refinement options

### Changed
- **Loading Screen Stability**: Progress animation only moves forward (never backwards)
- **Loading Screen Consistency**: Unified simple and staged loading with identical visual style
- **AccountMenu z-index**: Fixed layering issues (z-100 backdrop, z-101 menu)
- **AccountMenu Body Scroll Lock**: Prevents background scrolling when menu open
- **RefineScreen Tab Design**: Circular icon containers with improved active state

### Technical
- LoadingStages uses useRef to track progress and prevent backwards animation
- LoadingOverlay matches LoadingStages dimensions (w-24 h-24 ring, w-10 h-10 logo)
- AccountMenu uses AnimatePresence mode="wait" with key props
- Added localStorage persistence for refine screen onboarding state

---

## [0.4.1] - 2024-12-14

### Added
- **Branded Loading Experience**: Unified loading screen with rotating C logo
- **Mobile Sidebar Edge Buttons**: Always-visible arrows for sidebar access
- **Refine Screen Onboarding**: Contextual hints for refinement options

### Changed
- **Loading Screen**: Single branded experience with C logo in progress ring
- **AccountMenu**: Complete UX overhaul on mobile with bottom sheet
- **RefineScreen Tabs**: Redesigned from 4 icons to 3 with vertical layout

### Removed
- **Mapping Tab**: Removed from RefineScreen (non-functional until narrative built)

### Technical
- LoadingStages uses `criticalImages.conclusivIcon` for branded loading
- LoadingOverlay uses same branded spinner for simple loading
- AccountMenu uses separate render paths for mobile vs desktop

---

## [0.4.0] - 2024-12-14

### Added
- **Mobile UX Polish**: Comprehensive mobile-first experience
- **Haptic Feedback System**: `useHaptics` hook for tactile feedback
- **Mobile Animation Library**: PulseRing, CardStackSwipe, ScrollRevealItem, MagneticButton, RadialProgress
- **Inline Notification System**: Professional notifications replacing toasts
- **Start Over Functionality**: Restart from presentation mode
- **Exit Menu in Presentation**: Mobile exit options

### Changed
- **UpgradePrompt**: Full-width bottom sheet on mobile with safe areas
- **RefineScreen**: Removed gap above Continue button
- **AccountMenu**: Solid background on mobile
- **MobilePresentScreen**: Fixed icon/content encroachment on progress bar
- **Toast System**: Replaced with inline notifications

### Removed
- **Toaster Components**: Removed radix-ui toast popup system

### Technical
- Created `useHaptics` hook for cross-browser vibration
- Created `MobileAnimations.tsx` with 5 animation components
- Created `InlineNotification.tsx` with NotificationProvider
- Updated `use-toast.ts` to bridge to new notification system

---

## [0.3.0] - 2024-01-15

### Added
- **Multi-stage loading UI**: Visual progress through build stages
- **Error recovery component**: User-friendly error display with retry
- **Comprehensive logging system**: Structured logging in edge functions
- **Project documentation**: Full documentation system
- **Input validation**: Min/max length checks with feedback
- **Loading progress state**: Track build progress in store

### Changed
- **Loading overlay**: Stage-specific messages and progress
- **Error handling**: Error categorization (rate limit, payment, timeout, parse)
- **Edge functions**: Extensive logging for debugging

### Technical
- Added `loadingStage` and `loadingProgress` to store
- Created `ErrorRecovery` component for consistent error UI
- Created `LoadingStages` component for multi-stage progress
- Enhanced API error typing with `APIError` interface

---

## [0.2.0] - 2024-01-14

### Added
- **Voice-first input**: Pulsing mic button with Web Speech API
- **Business context scraping**: Auto-extract company info from URL
- **Combined build flow**: Single AI call for themes + template + narrative
- **3-step workflow**: Simplified from 5 steps to Input → Preview → Present
- **Template recommendation**: AI selects best template
- **Long document chunking**: Smart processing for 15k+ char inputs

### Changed
- **Store structure**: Simplified state for 3-step flow
- **Preview screen**: Combined review, template, and editor
- **Loading messages**: Context-aware messages based on input size

### Removed
- **ExtractScreen**: Merged into build flow
- **ReviewScreen**: Merged into PreviewScreen
- **TemplateScreen**: Merged into PreviewScreen
- **EditorScreen**: Merged into PreviewScreen

### Technical
- Created `useVoiceRecorder` hook for speech recognition
- Created `build-narrative` edge function
- Created `scrape-business-context` edge function
- Refactored store to use simplified step types

---

## [0.1.0] - 2024-01-10

### Added
- **Initial release**
- **Theme extraction**: AI-powered theme detection
- **5-step workflow**: Input → Extract → Review → Template → Editor → Present
- **Presentation mode**: Fullscreen with keyboard navigation
- **Reader mode**: Scrollable view alternative
- **Template system**: 5 presentation templates
- **Icon picker**: Customize section icons

### Technical
- React 18 + TypeScript + Vite setup
- Tailwind CSS with custom design tokens
- Zustand for state management
- Framer Motion for animations
- Supabase Edge Functions for AI calls

---

## Migration Notes

### 0.4.x → 0.5.x

**Breaking Changes**:
- Store `currentStep` type changed from 3 values to 4 (`refine` added)
- New `keyClaims`, `tensions`, `alternatives` state fields required
- `presentationStyle` object added to store

**Migration Steps**:
1. Update store consumers to handle `refine` step
2. Initialize new state fields with defaults
3. Update components using themes to check for changes

### 0.3.x → 0.4.x

**No Breaking Changes**

New optional features:
- Haptic feedback (automatically enabled on supported devices)
- Mobile animations (automatic on mobile)
- Inline notifications (replaces toasts transparently)

### 0.2.x → 0.3.x

**No Breaking Changes**

New optional features:
- Loading stages (automatically used by InputScreen)
- Error recovery (automatically used by API)

### 0.1.x → 0.2.x

**Breaking Changes**:
- Store `currentStep` type changed from 5 values to 3
- Removed `ExtractScreen`, `ReviewScreen`, `TemplateScreen`, `EditorScreen` components
- `buildNarrative` API replaces separate theme/template/narrative calls

**Migration Steps**:
1. Update any references to old step names
2. Replace individual API calls with `buildNarrative`
3. Update routing logic for 3-step flow

---

## Roadmap

### Recently Completed ✅
- [x] PDF export functionality (jsPDF)
- [x] PowerPoint export (pptxgenjs)
- [x] Shareable links with unique URLs
- [x] Password protection for shares
- [x] File upload (PDF, DOCX, Google Docs)
- [x] Section images via Pexels
- [x] Brand data integration

### Planned
- [ ] Keyboard shortcuts throughout app
- [ ] Custom color themes builder
- [ ] Section reordering via drag and drop
- [ ] Collaboration features
- [ ] Version history per narrative
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

---

*Last updated: 2025-01-03*
