---
title: "Phase 6: Registries Grading Scoring"
status: completed
priority: P1
effort: "5h"
dependencies: [5]
---

# Phase 6: Registries, Grading, Scoring

## Overview

The extension mechanism and the last engines: the three registries
(`blocks.tsx`, `questions.tsx`, `tools.ts`), the unified per-kind grading with
`gradeQuestion` dispatch, and the merged `scoring.ts`. Closes the plan with the
full gate (lint + test + build) and the registry-coverage check wired into
`content:check`.

## Requirements

- [x] `src/sdk/registry/blocks.tsx`: `registerBlockKind(kind, renderer)` + `renderBlock(block)` / `getBlockRenderer(kind)`; core kinds (`md`, `heading`, `list`, `code`, `tip`, `table`) get functional unstyled renderers (semantic HTML; styling is Phase 2's); unknown kind → typed `UnknownBlockKindError`.
- [x] `src/sdk/registry/questions.tsx`: per-kind `{ render, grade }` registration; graders pure, merged from gh-200's per-kind functions and dp-800's dispatch, on the unified `Answer = string[]` encoding:
  - `single/codeReading/bug`: exact match (`bug` compares index-as-string);
  - `multi`: set equality; `order`: sequence equality;
  - `matching`: `leftIndex::right` token set (dp-800 encoding);
  - `fill`: per-blank compare after `normalizeBlank` (trim, collapse whitespace, strip wrapping `[]`, case-fold) against `answer` + `alternatives`.
- [x] `gradeQuestion(question, answer): boolean` exported for engines; no partial credit anywhere (both legacy apps' frozen rule).
- [x] `src/sdk/registry/tools.ts`: `ToolId` + tool metadata registry (`learn | labs | practice | exams | compare | notes | revision` — id, label, requires-content-kind); Phase 1 registers metadata only, no components; `Subject.enabledModes` validates against it.
- [x] `src/engines/scoring.ts`: merged from dp-800 `scoring.ts` + gh-200 `score.ts` — `scoreQuestions` (accuracy + results), `scoreAttempt` (scaled `100 + 900·correct/total`, pass at `exam.passingScore ?? 700`, per-domain tallies), `toScaledScore`, `scoreByDomain`, plus `sameSet`/`sameOrder` helpers. Math identical in both legacy apps — preserved exactly (locked non-goal).
- [x] `assertKindsRegistered(content)`: every block/question kind used by content has a registered renderer/grader; wired into `content:check` next to `validateSubject`.
- [x] Tests: gh-200 `grade.test.ts` cases re-homed to id-based answers; dp-800 `scoring.test.ts` re-homed (matching tokens, sqlFill aliases → fill alternatives); golden determinism of sampled exams end-to-end through registry + sampling; unknown-kind errors trip.
- [x] Full gate: `npm run lint && npm test && npm run build` green; `npm run content:check` runs validate + registry coverage over the fixture.

## Architecture

Registries own kind-specific behavior; engines stay generic: `scoring.ts`
imports only `gradeQuestion` from the question registry. Renderers are
deliberately minimal — Phase 2's `LessonViewer`/`QuizRunner` supply layout and
branding. The tools registry is metadata now so `enabledModes` in `subject.json`
has something real to validate against; components attach in Phase 2 without
schema changes.

**Confirmed decision** (Validation Session 1): unified `fill` grading case-folds,
so gh-200's case-sensitive fills accept a superset (e.g. `TRUE` matches `true`).
Exam scaling math untouched.

<!-- Updated: Validation Session 1 - fill normalization confirmed as case-insensitive superset; veto-fallback wording removed -->

## Related Code Files

- Create: `src/sdk/registry/blocks.tsx`, `src/sdk/registry/questions.tsx`, `src/sdk/registry/tools.ts`, `src/engines/scoring.ts`, matching `.test.ts(x)`
- Modify: `src/sdk/validate.ts` or `content:check` entry (add `assertKindsRegistered` call)
- Read: `learn-gh-200/src/utils/{grade,score}.ts` + tests, `learn-dp-800/src/lib/scoring.ts` + test

## Implementation Steps

1. `tools.ts` (metadata + validation), then `blocks.tsx` (registry + core renderers + error type).
2. `questions.tsx`: graders first (pure, testable without React), then minimal renderers; export `gradeQuestion`.
3. `scoring.ts` merged; re-home both test files' cases onto unified shapes.
4. `assertKindsRegistered` + `content:check` wiring; end-to-end test: fixture → load → validate → registry coverage → sample an exam → grade it → score it.
5. Run the full gate; fix fallout; update this plan's checkboxes.

## Todo

- [x] tools + blocks registries
- [x] question registry (graders + renderers) + `gradeQuestion`
- [x] scoring engine + merged tests
- [x] registry coverage in `content:check` + end-to-end test
- [x] Full gate green

## Success Criteria

- [x] All tests green (`npm test`), lint and build green, `content:check` exits 0 on fixture and reports unknown kinds on a seeded bad kind.
- [x] Adding a new content kind requires only a `register*Kind` call — proven by a test that registers a custom block kind and renders fixture content using it.
- [x] Roadmap Phase 1 exit condition met: *"engine + Zod-validation tests pass with a tiny fixture pack loaded from files."*

## Risk Assessment

- **Renderer creep into Phase 2 scope**: guard = "functional, unstyled, semantic HTML" acceptance line above; anything visual gets moved to Phase 2's plan, not snuck in here.
- **Grading merge introduces subtle wrongness** (matching token encoding, fill aliases): signal = re-homed golden tests disagree with legacy expectations beyond the documented fill case-fold; response = fix the unified grader against the legacy test's intent, never relax the assertion.
- **Circular import** (`scoring` ↔ registry): pre-decided direction — engines import from `sdk/registry`, never the reverse; `sdk` never imports from `engines`.
