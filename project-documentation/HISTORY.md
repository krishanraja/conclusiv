# History

Changelog and version history for Narrative Builder.

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

## [0.3.0] - 2024-01-15

### Added
- **Multi-stage loading UI**: Visual progress through build stages
- **Error recovery component**: User-friendly error display with retry options
- **Comprehensive logging system**: Structured logging in edge functions
- **Project documentation**: Full documentation system (PURPOSE, ARCHITECTURE, FEATURES, etc.)
- **Input validation**: Min/max length checks with helpful feedback
- **Loading progress state**: Track build progress in store

### Changed
- **Loading overlay**: Now shows stage-specific messages and progress
- **Error handling**: Improved error categorization (rate limit, payment, timeout, parse)
- **Edge functions**: Added extensive logging for debugging

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
- **Template recommendation**: AI selects best template for content
- **Long document chunking**: Smart processing for 15k+ char inputs

### Changed
- **Store structure**: Simplified state for 3-step flow
- **Preview screen**: Combined review, template, and editor into unified view
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

### 0.1.x → 0.2.x

**Breaking Changes**:
- Store `currentStep` type changed from 5 values to 3
- Removed `ExtractScreen`, `ReviewScreen`, `TemplateScreen`, `EditorScreen` components
- `buildNarrative` API replaces separate theme/template/narrative calls

**Migration Steps**:
1. Update any references to old step names
2. Replace individual API calls with `buildNarrative`
3. Update routing logic for 3-step flow

### 0.2.x → 0.3.x

**No Breaking Changes**

New optional features:
- Loading stages (automatically used by InputScreen)
- Error recovery (automatically used by API)
- Documentation (no code impact)

---

## Roadmap

### Planned for 0.4.0
- [ ] PDF export functionality
- [ ] Shareable links with unique URLs
- [ ] Keyboard shortcuts throughout app

### Planned for 0.5.0
- [ ] File upload (PDF, DOCX)
- [ ] Custom color themes
- [ ] Section reordering via drag and drop

### Future Considerations
- Collaboration features
- Version history per narrative
- Analytics dashboard
- Mobile app
