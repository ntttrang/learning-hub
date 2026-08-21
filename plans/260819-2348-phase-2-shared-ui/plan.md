---
title: "Phase 2 Shared UI"
description: "Implement roadmap Phase 2 of docs/unified-learning-hub-plan.md: reconcile the donor apps' viewers into src/ui/, wire the shell to the Content SDK, and prove the fixture pack end-to-end through every enabled mode."
status: completed
priority: P1
effort: "4d"
tags: [ui, shell, routing, markdown, exams]
created: 2026-08-19
---

# Phase 2 — Shared UI

## Overview

Execute **roadmap Phase 2** of the unified hub plan (`docs/unified-learning-hub-plan.md`
§7): reconcile the viewers from `learn-gh-200` and `learn-dp-800` into `src/ui/`
(`LessonViewer`, `QuizRunner`, `ExamEngine`, `LabViewer`, `Compare`, `Markdown`,
`Notes`, `Bookmarks`), upgrade the Phase 1 registry renderers from functional to
brand-styled, wire the shell (routing, subject list, workspace tabs) to the Content
SDK, and prove the fixture pack renders end-to-end through every mode it enables.

Phase 0 (shell, theming, storage adapter) and Phase 1 (SDK, registries, engines,
fixture pack) are complete — see `plans/260819-2132-phase-0-foundation-shell/`
(3/3) and `plans/260819-2230-phase-1-content-sdk-engines/` (6/6). This plan is
the first to connect the two: shell ⇄ SDK ⇄ ui.

## Context

- **Authoritative design:** `docs/unified-learning-hub-plan.md` — §4 target tree,
  §5 schema, §5b storage, §6 extension points, §7 Phase 2, §8 platform contracts.
- **Hub baseline (build on, do not rewrite):**
  - `src/sdk/` — `types.ts` (unified schema), `content-source.ts`
    (`ContentSource` + `SubjectIndex`), `validate.ts`, registries
    (`blocks.tsx`, `questions.tsx`, `tools.ts`).
  - `src/engines/` — `subject-store.ts` (`useSubjectDataStore` with all user-data
    actions), `progress.ts`, `srs.ts`, `scoring.ts`, `streak.ts`, `revision.ts`,
    `sampling.ts`, `theme.ts`, `storage.ts` (`StorageAdapter`).
  - `src/shell/` — `AppShell`, `HubHome`, `SubjectWorkspace`, `router.ts`,
    `subjects.ts` (placeholders), `ThemeToggle`.
  - `src/content/registry.ts` — the ONLY app-facing content module.
  - `content/fixture/` — 2 domains, 2 modules, 2 lessons (`.mdx` + JSON blocks),
    all 7 question kinds, 1 rich lab, 1 sampled exam, 1 three-column comparison.
- **Donor UIs (port behaviors, not files):**
  - `learn-gh-200/src/components/` — LessonView, QuizRunner + per-kind cards,
    ExamRunner (wall-clock deadline, in-flight resume, flags, navigator,
    confirm dialog, auto-submit), ExamReview (verdict + per-domain bars +
    replay), LabView, CompareIndex, ui primitives, `utils/inline.ts`.
  - `learn-dp-800/src/components/` — LessonViewer (generic chrome only; its
    fixed 18-section layout becomes Phase 4 block kinds), QuestionView
    (`value: string[]` + `reveal` per-option verdict styling, move-up/down
    ordering, SQL fill inputs — matches the hub answer encoding exactly),
    ExamEngine (timed/untimed toggle, case-study backgrounds), LabViewer (rich
    steps with hint/solution reveal), Comparison (N-column + samples +
    migration cards), NotesPanel, Markdown (react-markdown stack).
- **Styling law:** plain CSS + `src/styles/tokens.css` brand tokens (no Tailwind,
  no hex); Lucide icons at 1.75 px stroke; subject accent via `accentVar()`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Subject workspace routes `#/subject/:id/:mode[/:id[/…]]` with live tabs driven by `enabledModes` + tool registry | P1 |
| 2 | `Markdown` viewer rendering `.mdx` prose, stems, and explanations (GFM + code highlighting + docId links) | P1 |
| 3 | Reveal-aware, brand-styled question renderers in the registry (graders untouched) | P1 |
| 4 | `QuizRunner`, `LessonViewer`, `LabViewer`, `Compare`, `ExamEngine` + review reconciled from both donors | P1 |
| 5 | `Notes` (tab + lesson-embedded) and `Bookmarks` working through `useSubjectDataStore` | P1 |
| 6 | Fixture pack renders end-to-end through every enabled mode with themes + a11y intact | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Start: dependencies, spikes, route design](./phase-01-start.md) | Done |
| 2 | [Routing, subjects, workspace wiring](./phase-02-routing-subjects-workspace-wiring.md) | Done |
| 3 | [Markdown, blocks, shared primitives](./phase-03-markdown-blocks-shared-primitives.md) | Done |
| 4 | [Question renderers and practice](./phase-04-question-renderers-and-practice.md) | Done |
| 5 | [Learn, labs, compare viewers](./phase-05-learn-labs-compare-viewers.md) | Done |
| 6 | [Exam engine and review](./phase-06-exam-engine-and-review.md) | Done |
| 7 | [Notes, bookmarks, end-to-end polish](./phase-07-notes-bookmarks-end-to-end-polish.md) | Done |

Dependency chain: 1 → 2 → 3 → 4 → 5 → 6 → 7. Phase 2 makes the shell honest
about modes before any viewer exists (placeholder tool views); 3–6 land viewers in
dependency order (prose → questions → lesson/lab/compare → exams); 7 closes user
data + the acceptance sweep.

## Key Decisions (resolved during planning)

| Decision | Choice | Why |
|---|---|---|
| Markdown stack | `react-markdown` + `remark-gfm` + `rehype-highlight` + `highlight.js` (dp-800's proven stack) | `.mdx` bodies are full markdown (headings, lists, bold, fenced code); a hand-rolled parser is scope creep. Static-hostable, client-only. |
| docId links | gh-200's `[label](docId)` convention preserved: custom link component resolves docIds against the pack's `docs` registry; unresolved docIds render as plain text | Links resolve in exactly one place; keeps the §8 integrity posture. |
| Registry renderer styling | Core block/question renderers upgraded **in place** in the registry to styled, reveal-aware versions; viewers own chrome (stems, feedback banners, progress, actions) | Per-option verdict styling cannot be applied outside the renderer. Registry stays the single dispatch point; signature change is additive (`revealed?: boolean`). Graders stay frozen. |
| Ordering UX | dp-800's move-up/down over the full option list (initialized to option order) replaces Phase 1's click-to-append | Better revealed-state UX; grades identically through `sameOrder`; no grader change. |
| Exam runner | gh-200's wall-clock deadline + in-flight localStorage resume + confirm dialog + auto-submit, merged with dp-800's timed/untimed toggle and case-study background cards | Wall-clock is throttle-proof; untimed mode counts up with no auto-submit; both donors' proven behaviors kept. |
| In-flight persistence | Single key `cc-exam-inflight` via the `StorageAdapter` seam (`{subjectId, examId, …}` inside), strict shape check like gh-200's loader | Testable with the memory adapter; one sitting at a time across subjects. |
| Subject list | `shell/subjects.ts` becomes an aggregator: real packs from `contentSource.listSubjects()` merge over `PLACEHOLDER_SUBJECTS` by id; placeholders stay honest ("Pack not installed") until Phases 3–5 replace them | Home keeps showing the roadmap subjects while the fixture (and later packs) light up for real. |
| Routing | Extend the hash router: `#/subject/:subjectId/:mode[/:id[/…rest]]`; unknown/missing mode falls back to the workspace overview state, never a blank page | Follows Phase 0's "a bad link never blanks the page" law. |
| Notes + Bookmarks | Both live under the `notes` tool (Notes tab shows notes list + bookmarked lessons); lesson pages embed per-lesson notes | `TOOL_IDS` (Phase 1, locked) has no `bookmarks` id; a schema change for a second tab is not worth it. |
| Overview tab | Light stats panel from `computeStats` + streak + "continue" link | Tabs must be honest on landing; full dashboards are roadmap Phase 6. |
| New styles location | `src/styles/views.css` (imported after `app.css`), tokens only | Keeps shell chrome CSS and viewer CSS in clear files; same pattern as `theme-toggle.css`. |

## Success Criteria

- [ ] The fixture pack renders end-to-end through every enabled mode (`learn`, `labs`, `practice`, `exams`, `compare`, `notes`) via the shared shell.
- [ ] `npm test`, `npm run lint`, `npm run build`, `npm run content:check` all green.
- [ ] Zero edits to engine semantics: grading, scoring, SRS, sampling, streak functions untouched (renderer signature change is additive; graders frozen).
- [ ] No per-subject branches in `ui/` — viewers are registry- and index-driven; a pack with only some modes still works.
- [ ] User data flows exclusively through `useSubjectDataStore` actions.
- [ ] Themes (Auto/Light/Dark/Night) plus keyboard nav, visible focus, and reduced-motion hold across all new views (§8).
- [ ] A broken pack renders an error state in its workspace/home card, never a crashed app.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `react-markdown` v10 API drift vs dp-800's v9 usage | Spike in Phase 1 before any viewer work; fall back to v9-compatible patterns if needed. |
| Renderer signature change breaks Phase 1 tests | Additive optional parameter; update render assertions in the same phase; graders and `content:check` untouched. |
| Timer-dependent exam tests flaky under jsdom | Test the untimed path and a pre-expired deadline for auto-submit; avoid real-time waits. |
| `loadSubject` throws on an invalid pack mid-render | Workspace and home wrap loads in try/catch → error `EmptyState` (Phase 2 requirement). |
| Scope creep into Phase 6 (dashboards, search, achievements, revision queue) | Explicit non-goals below; tool registry stays metadata + components. |

## Open Questions

None. The markdown dependency, registry-styling, routing shape, and
notes/bookmarks placement decisions above are all repo-derivable with locked
Phase 0/1 contracts as constraints.

## Out of Scope (this plan)

- Real content packs: GH-200/GH-900 (roadmap Phase 3), DP-800 incl. its
  specialized block kinds and Mermaid (Phase 4), GH-600 (Phase 5).
- `revision` tool surface and cross-subject SRS review queue (roadmap Phase 6).
- Global search, achievements, dashboard aggregation (roadmap Phase 6).
- Legacy localStorage migration shims (belong to pack phases).
- CI/CD + deploy (roadmap Phase 7) — gates stay `npm` scripts.

## Validation Log

### Session 1 — 2026-08-20
**Trigger:** Post-plan validation handoff — user selected `/ak:plan validate` after fast-mode plan creation.
**Questions asked:** 3

#### Verification Results
- **Tier:** Full (7 phases → Fact Checker, Flow Tracer, Scope Auditor, Contract Verifier)
- **Claims checked:** 68
- **Verified:** 68 | **Failed:** 0 | **Unverified:** 0
- Sample: all `SubjectIndex` accessors (`src/sdk/content-source.ts:343-394`); all 9
  `useSubjectDataStore` actions (`src/engines/subject-store.ts:45-53`);
  `LessonProgress.status` includes `'completed' | 'in-progress'`
  (`src/sdk/types.ts:328`); `renderQuestion` has exactly 1 external caller
  (`questions.test.tsx:179`); `renderBlock` callers are test-only
  (`blocks.test.tsx`, `coverage.test.tsx:50` — covered by the phase-3 `npm test`
  gate); no pre-existing `inflight`/`cc-exam` key anywhere in `src/` (the new
  `cc-exam-inflight` state duplicates nothing); `bumpStreak` applied in all five
  record paths (`subject-store.ts:85,102,123,151,161`); gh-200 exam mechanics
  verified at `ExamRunner.tsx:26` (`INFLIGHT_KEY`), `:92` (`formatClock`),
  `:111` (deadline state), `:170` (auto-submit); dp-800 pins
  `react-markdown@^9.0.3` (the plan's v10-drift risk row is factually grounded);
  fixture `enabledModes` lacks `notes` (phase 7 adds it, as planned); all cited
  donor files exist, incl. `learn-dp-800/src/app/{notes,bookmarks}/`.

#### Questions & Answers

1. **[Architecture]** Where should the styled, reveal-aware block/question renderers live?
   - Options: In-place in sdk/registry | Styled wrappers in ui/ | Relocate registries to ui/
   - **Answer:** In-place in sdk/registry
   - **Rationale:** Registry stays the single dispatch point; per-option verdict styling cannot be applied outside the renderer; signature change stays additive and graders stay frozen.
2. **[Assumptions]** Exam in-flight persistence: one global sitting (subjectId inside the `cc-exam-inflight` payload), so starting an exam in another subject discards the previous sitting?
   - Options: One global sitting | Per-subject sittings
   - **Answer:** One global sitting
   - **Rationale:** One learner, one sitting at a time; simplest resume semantics and matches gh-200's single-key pattern.
3. **[Scope]** Notes and bookmarks share the `notes` tool tab (`TOOL_IDS`, locked in Phase 1, has no `bookmarks` id)?
   - Options: One Notes tab | Separate Bookmarks tab (schema change)
   - **Answer:** One Notes tab
   - **Rationale:** Keeps the locked Phase 1 `TOOL_IDS` frozen; a dedicated tab is not worth registry + schema churn.

#### Confirmed Decisions
- Renderer styling home: in-place in `sdk/registry/*.tsx` — matches Key Decisions row 3; no text change needed.
- In-flight sitting: single global `cc-exam-inflight` — matches Key Decisions row 6; no text change needed.
- Notes/bookmarks placement: one Notes tab — matches Key Decisions row 9; no text change needed.

#### Action Items
- None — all three answers confirm the plan as written.

#### Impact on Phases
- None. Zero decisions changed plan text; no propagation markers required.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-routing-subjects-workspace-wiring.md, phase-03-markdown-blocks-shared-primitives.md, phase-04-question-renderers-and-practice.md, phase-05-learn-labs-compare-viewers.md, phase-06-exam-engine-and-review.md, phase-07-notes-bookmarks-end-to-end-polish.md
- Decision deltas checked: 3 (renderer home → phase-03 Architecture + phase-04 modify list; global sitting → phase-06 Architecture + requirements; one Notes tab → phase-07 requirements)
- Reconciled stale references: 0
- Unresolved contradictions: 0
