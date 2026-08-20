---
title: "Phase 5: Learn, labs, compare viewers"
status: done
---

# Phase 5: Learn, labs, compare viewers

## Overview

The content modes: `LearnIndex` + block-registry-driven `LessonViewer` (with
knowledge checks, bookmarks, completion, prev/next), `LabIndex` + rich
`LabViewer`, and the generic N-column `Compare` view. All index-driven and
subject-agnostic, proven on the fixture.

## Requirements

- [x] `ui/LearnIndex.tsx`: domains (weight chips) → modules (official skills) → lesson rows with status ticks, minutes, difficulty, flagship star; "Continue" card when `lastLessonId` exists; lab/question counts per module.
- [x] `ui/LessonViewer.tsx`: breadcrumb (domain/module), title + summary, chips (difficulty, minutes, flagship), bookmark toggle (`aria-pressed`, `toggleBookmark`), block stream via `renderBlock`, knowledge check (`questionIds` → `QuizRunner` scoped to the module), lab link card, references (`references[]` external links + `docIds` chips), `visitLesson` on mount, mark complete/un-complete, prev/next from `adjacentLessons`.
- [x] Lesson lookup by slug **or** id (`getLessonBySlug`/`getLesson`) per the route table.
- [x] `ui/LabIndex.tsx`: lab cards with minutes, difficulty, completion state, lesson back-link.
- [x] `ui/LabViewer.tsx`: renders rich (dp-800) and plain (gh-200-style) labs from the unified schema — render only present fields: scenario/objective/prerequisites/engines, schema+seed CodeBlocks, numbered step cards (Markdown instructions, starterSql, expectedOutput, validation callout, show-hint/reveal-solution toggles, engineNotes grid), outcomes/checks lists, solutionExplanation, `completeLab` button + done state.
- [x] `ui/Compare.tsx`: comparison picker when >1; N-column table (aspect first column, cells as markdown-safe text); `samples` as tabbed side-by-side CodeBlocks keyed by column label; `migration` six-card grid when present.
- [x] All three modes wired into `tool-views.tsx`; navigation round-trips (lesson → lab → back; compare tabs).
- [x] Styling + four-theme + reduced-motion via `views.css` tokens.

## Architecture

Viewers receive `{ subjectId, content, index, route }` and read user data via
`useSubjectDataStore` selectors — no content module imports, no per-subject
branches. The lesson body is registry-driven: `blocks.map(renderBlock)`;
DP-800's specialized sections are **not** special-cased here (they arrive as
registered block kinds in roadmap Phase 4). Knowledge check reuses `QuizRunner`
unchanged (scope = moduleId) — the runner is shared by practice and lessons,
matching dp-800's pattern.

## Related Code Files

- Create: `src/ui/LearnIndex.tsx`, `src/ui/LessonViewer.tsx`,
  `src/ui/LabIndex.tsx`, `src/ui/LabViewer.tsx`, `src/ui/Compare.tsx`
  (+ per-file tests)
- Modify: `src/shell/tool-views.tsx`, `src/styles/views.css`
- Reference donors: `learn-gh-200/src/components/learn/LearnIndex.tsx` +
  `learn/LessonView.tsx`, `learn-dp-800/src/components/{LessonViewer,LabViewer,Comparison}.tsx`,
  `learn-gh-200/src/components/{lab,compare}/*`

## Implementation Steps

1. `LearnIndex` from `index` accessors (`modulesForDomain`, `lessonsForModule`); status from store slice; link rows to `#/subject/:id/learn/:slug`.
2. `LessonViewer`: assemble from lesson + index (prev/next, lab, questions); mount effects for `visitLesson`; completion button toggles `markLesson('completed' | 'in-progress')`.
3. Knowledge check: `<QuizRunner questions={index.getQuestions(lesson.questionIds)} scope={lesson.moduleId ?? 'review'} …>`; omitted when empty.
4. `LabIndex` + `LabViewer` with the reveal toggles as local state per step card (dp-800's `LabStepCard` pattern).
5. `Compare`: table + samples tabs + migration cards; empty collections → `EmptyState`.
6. Wire `learn`/`labs`/`compare` in `tool-views.tsx`; tests: fixture `.mdx` lesson renders headings (proves Phase 3 pipeline), JSON-block lesson renders table/code/tip, knowledge check mounts, bookmark + complete persist (memory adapter), lab reveal toggles + completeLab, compare renders 3 columns + sample tabs.

## Todo

- [x] LearnIndex + tests
- [x] LessonViewer (blocks, knowledge check, bookmark, complete, prev/next, references) + tests
- [x] LabIndex + LabViewer (rich + plain) + tests
- [x] Compare (table, samples, migration) + tests
- [x] tool-views wiring for learn/labs/compare
- [x] views.css additions; four-theme audit

## Success Criteria

- Both fixture lessons render fully through the block registry, including their knowledge checks.
- The fixture lab's steps show hints/solutions on demand and completion persists.
- The fixture comparison renders 3 engine columns + 1 sample tab set.
- Navigation never dead-ends: every rendered link targets a resolvable route.
- `npm test && npm run lint && npm run build && npm run content:check` green.

## Risk Assessment

**Risk:** `LessonViewer` accretes dp-800's fixed sections "temporarily".
**Signal:** any section name from dp-800's 18-section layout appearing in
`ui/LessonViewer.tsx`. **Response:** none needed — schema has only `blocks`;
richness returns as Phase 4 registered kinds. Keeping this file generic is the
acceptance test. **Risk:** lab field optionality renders empty sections.
**Signal:** visibly empty headers on plain labs. **Response:** every section
renders only when its fields exist (asserted for the plain-step shape).

## Close-out notes (2026-08-20)

Delivered: all five viewers + `DocLinkChips`/`resolvableDocLinks` in
`doc-context.tsx`, `tool-views` wiring, phase-5 `views.css` block (tokens
only, zero hex; hovers only, so the global reduced-motion guard covers it).

Verification: tester (DONE) and code-reviewer (DONE_WITH_CONCERNS) ran the
full gates — final state 346/346 tests, oxlint clean, tsc+build clean (known
chunk warning deferred), content:check 3/3. Reports:
`reports/phase-05-tester.md`, `reports/phase-05-review.md`.

Bugs caught and fixed during the phase:
- Unstable zustand selectors (`?.completedLabs ?? []` in LabIndex/LabViewer)
  looped `useSyncExternalStore` for subjects with no store entry yet — select
  the stored array, default at the use site.
- Knowledge check inherited QuizRunner's "← All scopes" link pointing at the
  lesson itself; `backHref` became `string | null` (null hides the link), and
  the finish/empty-state "Back to practice" buttons are now gated on `back`
  so embedded checks never render a dead button.
- `index.getQuestions()` mints a fresh array per render, reshuffling the
  check mid-run on store-driven re-renders; LessonViewer memoizes the bank.
- Lab prerequisites that are lesson ids now resolve to titled lesson links;
  free-text advice stays plain text.
- Empty References header when the single-href policy filters everything —
  the section now gates on surviving links (`resolvableDocLinks`).

Shipped post-review: compare sample tabs follow the ARIA tabs pattern
(arrow keys move selection with DOM focus). Deferred (with reasons, see
reports): orphan lessons stay out of prev/next (the module-ordered sequence
is the design); validator check for comparison sample/cell column keys →
schema-freeze backlog (UI degrades gracefully).
