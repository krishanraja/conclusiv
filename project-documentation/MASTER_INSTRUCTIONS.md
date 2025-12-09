# Master Instructions: Vibe-Coded Projects

## 0. Purpose

This project must behave like a world-class engineer, UX designer, and operator in one:

- Fix issues first time, not via endless trial-and-error
- Model the entire pipeline, not single functions
- Produce 10/10 diagnostics and logging before edits
- Never break working flows or overwrite real assets
- Stay general enough to work for any codebase in Lovable

---

## 1. Global Rules of Engagement

### No Edits Before Scope
- Always do a scope pass first: map the pipeline, list all related files, and call sites
- Output a short plan before changing code

### No Unverified Assumptions
- If something is unclear, log it, inspect it, or surface it to the user instead of guessing

### No Silent Breakages
- Any failure must be visible in logs, UI, or both
- Never swallow errors. Wrap them with context and rethrow or return a safe, flagged result

### No Asset Vandalism
- Never overwrite real images, logos, fonts or brand files with generated ones
- Never resize or crop assets unless explicitly instructed. If you must, preserve aspect ratio

### No "Probably Fixed" Outcomes
Every fix must be proven through:
- Logs
- Screenshots / screen recordings
- Clearly verifiable behavior in the UI

---

## 2. Think in Systems, Not Single Bugs

### 2.1 Model the Pipeline End-to-End

For any feature or error, always map:

| Layer | Description |
|-------|-------------|
| **Trigger** | What starts the flow (click, route change, cron, webhook, etc) |
| **Frontend path(s)** | Components, hooks, global state, routing |
| **Network layer** | Edge functions / APIs, request/response shapes |
| **Business logic** | Orchestrators, helpers, compute_ functions, branching logic |
| **Data** | DB queries, inserts, updates, external APIs |
| **Aggregation & UI** | How everything is stitched together and rendered |

**Deliverable:** A short call graph:
```
Trigger → Component → Hook/Util → API → Orchestrator → DB/External → Aggregator → UI
```

### 2.2 Enumerate All Failure Points

For each step in the flow, enumerate:
- What can be null, undefined, empty array, or empty object?
- What can throw? (network, schema mismatch, parsing, LLM failure, rate limit, missing env)
- What can be out of date vs deployed code?

Guard all of these:
- Strong type checks where possible
- Runtime defensive checks where necessary
- Default values and fallbacks for every branch

### 2.3 Anti-Fragile Design Rules

Every function that participates in a user-facing flow must:

1. **Accept defined, well-typed inputs** (or validate and fail fast with clear errors)
2. **Return a predictable shape, even on failure:**
   ```typescript
   { success: false, error: "...", fallbackUsed: true }
   ```
   Instead of just throwing or returning null
3. **Have safe defaults for:**
   - Empty lists
   - Missing sub-fields
   - Partial records

Never assume downstream objects are populated. Always use safe access and guard clauses.

---

## 3. Data & Context Principles

### 3.1 Profiles as the Anchor

Anchor all meaningful data off stable IDs:
- `profile_id` (user, leader, partner, etc)
- Optional `organization_id`
- `session_id` for a visit / workflow run

Any event, insight, or output should link back to at least:
- `profile_id`
- `session_id`
- `tool_name` / `flow_name`

**Rules:**
- Never create duplicate profiles if you can match on stable keys (e.g. email + name)
- Prefer "lookup then upsert", not blind insert

### 3.2 Events, Not Blobs

For any interaction (assessment, intake, form, simulation, chatbot step), store a raw event row with at minimum:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `profile_id` | If known |
| `session_id` | Current session |
| `question_id` or `prompt_key` | If applicable |
| `raw_input` | Full text / payload |
| `structured_values` | JSON / JSONB |
| `created_at` | Timestamp |
| `tool_name` / `flow_name` | Source context |

**Critical:** LLM summaries are never the source of truth. Raw input and structured fields are the primary record.

### 3.3 Meaning Layer (Insights & Scores)

For any analysis flow, add an "insights/scores" layer:

| Field | Example |
|-------|---------|
| `profile_id` | UUID |
| `source_event_id` | UUID |
| `dimension_name` | risk_appetite, momentum, learning_style |
| `score` | 0–100 or 1–5 |
| `label` | Short classifier |
| `llm_summary` | 1–3 sentences |
| `context_snapshot` | JSON with key inputs |

Decide core dimensions per project upfront and reuse them everywhere. Consistency matters more than variety.

### 3.4 Context Linking Across Tools

Whenever you store something, ask: "How do we reuse this later?"

Always link:
- `tool_name` (which tool)
- `question_block` or `section` (e.g. pre_workshop, demo_flow, bootcamp_simulation)

Store question metadata in a separate questions table or config:
- `id`, `tool_name`, `dimension`, `prompt_text`, `weight`

### 3.5 Persistence & Safety

**DB changes:**
- Use proper migrations
- Avoid ad-hoc shape changes that silently break existing code

**Validate writes:**
- If an insert or update fails, log and surface an error; don't ignore

**Integrity:**
- Use foreign keys and constraints where the platform allows
- Prefer soft deletes / archival flags over hard deletes for anything user-facing

---

## 4. LLM Behavior: Data → Insight → Action

LLMs are not parrots. Treat them as analysts with teeth and guardrails.

### 4.1 Always Read Before You Think

Any function that calls an LLM should:
1. Read relevant data first:
   - Recent events for `profile_id`
   - Current insights/scores
   - Current tool context and goals
2. Build a structured context object:
   ```typescript
   {
     profileSnapshot,
     recentEvents,
     existingScores,
     toolContext,
     constraints // what must not be broken
   }
   ```

### 4.2 Standard Output Schema

LLM responses for analytical flows should stick to a small, reusable schema:

| Field | Purpose |
|-------|---------|
| `summary` | Synthesis, not just recap |
| `key_actions` | Explicit actions tied to specific inputs or scores |
| `surprise_or_tension` | Contradictions, blind spots, or non-obvious links |
| `scores` | Structured array of `{ dimension, score, label }` |
| `data_updates` | Suggestions for DB changes, never direct SQL |

### 4.3 "10/10" Quality Checks Inside Prompts

Prompt LLMs to self-check before "final":

- **Grounding:** Is the answer clearly tied to provided data? If crucial data is missing, ask for it instead of inventing.
- **Clear next move:** At least one concrete "do this next" step, no vague coaching.
- **Useful surprise:** `surprise_or_tension` must say something non-trivial.
- **Reusability:** Output must be easy to write back into existing tables or state.

### 4.4 Reuse Modes, Don't Reinvent Prompts

Define a small set of LLM "modes" and reuse them:
- `assessment_analyzer`: profile + answers → scores, labels, actions, tension
- `portfolio_analyzer`: list of entities → rankings, flags, route recommendations
- `session_synthesizer`: events → executive summary + short-term path

Keep these as central templates / edge functions, not scattered strings in components.

### 4.5 Guardrails Against Fluff

**Hard rules in prompts:**
- No generic "communicate more" or "be open to change" style advice
- Tie every recommendation to:
  - A specific answer or event
  - A specific dimension/score
  - A specific tension in the data

When uncertain, prefer:
> "Here are two scenarios and what you'd see in each"

Over hand-wavy guesses.

---

## 5. Failure Patterns & How to Treat Them

### 5.1 Deployment Desync

**Problem:** Dev, preview, and production are not aligned.

**Approach:**
- Log live runtime values in the deployed environment
- Compare local code vs deployed behavior carefully
- Maintain backward-compatible payloads during transitions
- Never assume hot reload is serving the latest bundle

### 5.2 Shallow Error Diagnosis

**Problem:** Taking "400", "undefined", "invalid argument", etc. at face value.

**Approach:**
- Log expected vs actual payload at each hop: UI → network → edge function → external API → DB → back
- Log config and env values before using them
- Reproduce with minimal payloads
- Fix root cause, not symptoms

### 5.3 Partial Logic Updates

**Problem:** Fixing one path (e.g. PDF generation) but breaking or ignoring others (email, UI, logging).

**Approach:**
- Build a small input→output matrix for the feature
- Verify each output path before calling the fix done
- Keep all branches in sync

### 5.4 UX / Business Intent Blindspots

**Problem:** Technically correct fix that ruins user experience or business logic.

**Approach:**
- Ask: "What is the real outcome we want?"
- Walk the flow like a real user: click, scroll, read, try mobile
- Flag mismatches between business intent and current interaction

### 5.5 Structural Layout Failures

**Problem:** Tweaking padding and margins when the container structure is wrong.

**Approach:**
- Think in layers: page frame → section wrapper → content container → elements
- Use consistent spacing systems, not random values
- Verify at both desktop and mobile widths

### 5.6 Asset Mismanagement

**Problem:** Random logos, stretched images, broken branding.

**Approach:**
- Always treat uploaded assets as the single source of truth
- Preserve aspect ratio at all times
- If an asset is missing or unreadable, stop and request guidance; do not invent

---

## 6. Master Diagnostic Protocol

Use this sequence every time you change code for a non-trivial issue.

### Phase 1: Scope & Mapping

**Goal:** Understand exactly what's broken and where.

**Checklist:**
- [ ] Search for all related: functions, hooks, classNames, env vars, error messages
- [ ] Map architecture: trigger → component → util → API → orchestrator → DB/external → UI
- [ ] Capture: console errors, network traces, screenshots
- [ ] Identify all conditional branches

**Deliverable:** DIAGNOSIS summary with call graph, file + line references, architecture sketch, observed errors.

### Phase 2: Root Cause Confirmation

**Goal:** Confirm real cause, not just the visible complaint.

**Functional flows:**
- Trace payloads at each step
- Log runtime env vars used
- Compare expected schema vs actual payloads

**Layout flows:**
- Inspect container hierarchy
- Check for conflicting CSS / utility classes
- Inspect responsiveness

**Assets:**
- Validate file paths, imports, actual files
- Check dimensions and types

**Deliverable:** ROOT_CAUSE summary: what it is, why it happens, what it affects.

### Phase 3: Implementation Plan with Checkpoints

**Goal:** Write the diffs before touching code.

**Checkpoints:**

| Checkpoint | Purpose |
|------------|---------|
| **CP0: Plan sanity** | Check that changes won't break unrelated flows |
| **CP1: Environment & config** | Clean build, no type errors, env vars present |
| **CP2: Core fix** | Primary flow works and is reproducible |
| **CP3: Secondary impacts** | Dependent features and branches still work |
| **CP4: Regression pass** | Run the whole path multiple times |

Each checkpoint must state: action, expected outcome, how you'll verify.

### Phase 4: Implementation

- Apply changes exactly as per the plan
- After each checkpoint, verify and log
- If any checkpoint fails: stop, update ROOT_CAUSE / DIAGNOSIS, adjust plan

### Phase 5: Handover

- Keep basic docs current (README, env notes, CHANGELOG)
- If painful bug: add notes to COMMON_ISSUES.md

---

## 7. Prevention Checklists

### 7.1 Before UI/Layout Changes
- [ ] Audit existing styles for conflicts
- [ ] Use existing design tokens / semantic classes
- [ ] Validate on both desktop and mobile sizes
- [ ] Check interactive elements after layout changes

### 7.2 Before Data/LLM Changes
- [ ] Confirm DB schema and table existence
- [ ] Check that new fields fit the data model
- [ ] Confirm downstream consumers can handle changes

### 7.3 Before Touching Edge Functions / APIs
- [ ] Verify all required secrets/env vars exist
- [ ] Confirm CORS headers and OPTIONS handler
- [ ] Add logging for: incoming payload, outbound requests, key branches, errors

---

## 8. Iteration Guidelines

### Prefer Incremental Changes
"Add the new card first and test it. Only then wire up the modal" is better than a huge diff.

### Ask for Explicit Verification Points
Always include console logs or clear UI states that prove a feature is wired correctly.

### Define Observable Success
"When I click X, I should see Y and the network tab should show Z" is the target standard.

### Reset HMR Properly
If behavior is weird: hard refresh, dev server restart, clear cache.

### Default Dev States
In dev, make components visible by default via safe flags so they are easier to test.

### Use Error Boundaries
Wrap risky components so one failure doesn't crash the whole page.

---

## 9. Immediate Actions When "It Should Work"

If something "should work" but doesn't:

1. Hard refresh
2. Clear local cache / storage if relevant
3. Check console for errors or warnings
4. Confirm feature flags / state toggles
5. Restart the dev server if needed
6. Re-run the trigger a few times to check for intermittent issues

If still broken: return to the diagnostic protocol. No more speculative edits.

---

## 10. Universal Safety Clause

### Do Not:
- Enforce project-specific values unless they already exist
- Rename or delete existing tables, env vars, or core components without explicit instruction
- Switch technology stack decisions already in place

### Always:
- Respect the existing design system and architecture
- Extend instead of rewrite whenever possible
- Make new behavior opt-in and backward-compatible by default

---

## Architecture Foundations

### Clear Folder Structure
```
/src
  /components    # UI components
  /lib           # Utilities and helpers
  /hooks         # React hooks
  /services      # API and external service clients
  /types         # TypeScript types
  /pages         # Route pages
  /store         # State management
/supabase
  /functions     # Edge functions
  /migrations    # Database migrations
/public          # Static assets
```

### Code Architecture Rules
- Every component pure unless there's a reason not to
- State lives in as few places as possible
- One data source of truth per feature
- All async functions return a predictable shape: `{ data, error }`
- No untyped returns
- All config goes in one place

### UI Architecture Rules
- Component library mapped and reused
- Design tokens defined: spacing scale, colour palette, border radius, typography
- Shared animations extracted into utilities
- No inline arbitrary styling unless temporary

### API Layer
- All API calls go through one client with interceptors, errors, retries, timeouts
- API responses normalised to the same shape regardless of source

### Database Layer
- Define schema versioning
- Constraints on every table
- Default values everywhere to avoid null cascades
- Migrations documented and reversible

---

## Documentation Standards

- Each file has a header block: what it does, what it depends on, what returns look like
- Every function gets: purpose in one line, inputs, outputs, edge cases
- A global README covering: Features, Architecture, Tech stack, API endpoints, DB schema, Local dev commands, Deployment steps
- A CHANGELOG for every push
- Inline comments only where context is missing from naming

---

## Logging and Diagnostics

### Standard Log Format
```typescript
{ level, message, context, timestamp }
```

### Levels
- debug, info, warn, error, critical

### Requirements
- All LLM interactions logged with inputs and outputs (safely)
- Every error thrown must have: human readable message, error code, context snapshot
- Add tracing ID per user session so chains can be followed

### Performance Logging
- Render times
- API latency
- DB latency

---

## Quality Rules for Output

Never output code without:
- [ ] Imports checked
- [ ] Component and function naming clean
- [ ] No dead branches
- [ ] No unused variables
- [ ] No implicit any

All code must be:
- Runnable without guessing missing pieces
- Responsive
- Tested with edge cases

---

## Testing Rules

- Unit tests for utilities and helpers
- Smoke test for each major flow
- Snapshot tests for key components
- API mocks for all external calls
- Regenerate fixtures when schema changes

---

## Deployment Hygiene

### Pre-Deploy Checklist
- [ ] Build passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Environment variables validated

### Post-Deploy
- [ ] Health check
- [ ] Regression check
- [ ] Log scan for anomalies

---

*Last updated: 2025-12-09*
