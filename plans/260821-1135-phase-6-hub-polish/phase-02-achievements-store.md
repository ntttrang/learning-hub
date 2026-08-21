---
title: "Phase 2: Achievements Store"
status: todo
priority: P1
effort: 4h
dependencies: [phase-01]
---

# Phase 2: Achievements Store

## Overview

Hub-level achievements: an engine of definitions generalized from
`learn-dp-800/src/lib/store.ts`'s `ACHIEVEMENTS`, evaluated as a pure function
of the `cc-subject-data` state, awarded exactly once, persisted beside the
streak. This phase builds the engine + store wiring only — display lands in
Phase 4.

## Context

- Donor model (8 entries) includes two content-dependent definitions
  (`domain-1` "finish Domain 1", `all-labs` "a lab in every domain"). The hub
  store is deliberately **content-free** (`subject-store.ts` never imports
  packs), so those two do not port; the remaining six are store-computable and
  two volume-based entries replace them (target: 8 total).
- The store comment already reserves this work: "achievements wait for the
  Phase 6 roadmap" (`src/engines/subject-store.ts`).
- Streak already lives hub-level in this store and `bumpStreak` rides the
  recording actions — achievements follow the same call sites.
- **Decision (locked in plan.md):** `importLegacyData` also awards
  achievements (migrated history is real history) but never bumps the streak;
  import skip-if-present semantics keep re-runs idempotent.

## Requirements

- [x] `Achievement` type in `src/sdk/types.ts`: `{ id, title, description, earnedAt }`.
- [x] `src/engines/achievements.ts`: 8 subject-agnostic definitions + pure
      `evaluateAchievements(state)` returning newly-earned ids:
  - `first-lesson` — any lesson marked done (donor "Cast off")
  - `ten-lessons` — 10 done lessons across all subjects ("Making way")
  - `fifty-lessons` — 50 done lessons across all subjects (volume replacement for `domain-1`)
  - `first-lab` — first completed lab ("Hands on deck")
  - `lab-ten` — 10 completed labs across all subjects (volume replacement for `all-labs`)
  - `quiz-ace` — any quiz attempt at 100% ("Sharp shooter")
  - `mock-pass` — any passed mock exam ("Dry run") — reuse the pass field the
    exam flow already computes; check `ExamAttempt` in `src/sdk/types.ts` first
  - `streak-7` — `streak.current >= 7` or `longest >= 7` ("Steady sailing")
- [x] Store: `achievements: Achievement[]` on `SubjectDataState`, persisted in
      `cc-subject-data`; evaluation runs inside `markLesson`, `visitLesson`,
      `completeLab`, `recordQuiz`, `recordExam`, and `importLegacyData`; each
      newly-earned id appends once with `earnedAt`.
- [x] `merge` default-fills `achievements` (old blobs upgrade silently);
      `SUBJECT_DATA_VERSION` stays `1` (locked decision — merge is tolerant).
- [x] `resetSubject` clears only that subject's slice — hub achievements are
      never reset by it.

## Implementation Steps

1. Confirm `QuizAttempt`/`ExamAttempt` shapes in `src/sdk/types.ts` (score,
   passed fields) so `quiz-ace` / `mock-pass` read existing fields, not new ones.
2. Add the `Achievement` type; write `src/engines/achievements.ts` (definitions
   + `evaluateAchievements`, pure, no store import).
3. Wire the store: state field, evaluation call in the six actions above,
   `merge` default-fill.
4. Tests: `src/engines/achievements.test.ts` (each threshold boundary; once-only
   semantics) and extend `src/engines/subject-store.test.ts` (award on action,
   award on import without streak bump, no double-award, rehydrate
   default-fill, `resetSubject` leaves achievements).

## Todo

- [x] Types + engine written and unit-tested
- [x] Store wiring + rehydrate guard tested
- [x] `npm test` green

## Success Criteria

- Earning is deterministic from state, exactly-once, and survives reload; a
  simulated legacy import awards (not re-awards on re-run) without touching the
  streak; all existing store tests still pass.

## Risk Assessment

- **Risk:** `ExamAttempt` has no pass flag, forcing score-threshold logic.
  *Signal:* types.ts inspection in step 1. *Response:* mirror how
  `ExamReview`/`scoring.ts` judge pass (same constant/derivation, imported —
  not duplicated); if genuinely ambiguous, fall back to "score ≥ 70%" matching
  the dp-800 passing bar used by the donor.
- **Risk:** evaluation in `visitLesson` makes mere visits award `first-lesson`.
  *Signal:* test for visit-vs-done distinction. *Response:* `first-lesson`
  counts only `status === 'done'` lessons — pin it in the engine test.
