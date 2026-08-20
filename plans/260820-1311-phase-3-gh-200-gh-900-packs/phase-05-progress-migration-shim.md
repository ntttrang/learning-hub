---
title: "Phase 5: Progress migration shim"
status: done
---

# Phase 5: Progress migration shim

## Overview

One-time import of old-app user data from localStorage `gh-site-progress-v1`
(learn-gh-200, key at `useProgress.ts:13`) into the hub store `cc-subject-data`,
partitioned to `gh-900` / `gh-200` by id prefix. User-confirmed scope. The
mapping is trustworthy because question identities are stable and exam papers
reproduce identically — but the old payload is **not** a superset of hub data:
most of it is coarse aggregates, so the shim maps what maps cleanly, migrates
exam attempts score-only when answers are absent, and drops the rest with one
warning.

## The actual donor payload (read from source, `useProgress.ts:42-51`)

```ts
interface ProgressState {
  version: number;                                  // donor schema version
  lessonsRead: Record<domainId, ISO-datestring>;    // keyed by DOMAIN id, not lesson id
  labsDone: Record<labId, date-string>;
  practiceStats: Record<domainId, { seen: number; correct: number }>;  // aggregates only
  examAttempts: Array<{
    examId: string;
    date: string;                                   // required (re-verified)
    scaledScore: number;                            // required (re-verified)
    passed: boolean;                                // required (re-verified)
    durationSec?: number;
    perDomain?: Record<domainId, {correct: number; total: number}>;  // maps cleanly (re-verified)
    answers?: Record<questionId, QuestionAnswer>;   // ABSENT on pre-phase-6 attempts
  }>;
}
// QuestionAnswer = number | number[] | string[]      (grade.ts:14)
// - single: number (option index)   - multi: number[] (indexes)
// - order: number[] (indexes into authored items)   - fill: string[]
// NO per-question attempt log, NO streak, NO lastLesson — don't invent them.
```

Re-verified against donor `useProgress.ts` at implementation time (2026-08-20):
`perDomain` carries `{correct, total}` per domain and maps cleanly (not
dropped); `date` / `scaledScore` / `passed` are required; hub `LessonProgress`
has no `completedAt`, so lessons map to `{status: 'completed', lastVisited}`.
The shape above and the mapping rows below reflect that verified state.

## Requirements

- [x] `src/engines/migrate-gh-progress.ts`: pure function
      `(old: unknown, current: SubjectUserData, content: SubjectContent) => Partial<SubjectUserData> | null`
      per subject — needs `content` to resolve `domainId → lessonId` (each
      domain has exactly one lesson) and to grade mapped answers; plus a thin
      runner
- [x] Mapping table (this is the whole transform, nothing else exists):
      - `lessonsRead[domainId]` → find the domain's single lesson →
        `lessons[lessonId] = { status: 'completed', lastVisited: <the ISO date> }`
        (hub `LessonProgress` has no `completedAt` — re-verified)
      - `labsDone[labId]` → `completedLabs[labId] = true` (date not stored in
        hub shape — dropped)
      - `examAttempts[]` → hub `ExamAttempt[]` (all four required fields
        synthesized, `types.ts:342-352`): `id: 'legacy-<examId>-<index>'`
        (deterministic → re-runs can't duplicate), `timed: true`,
        `durationSeconds: durationSec ?? 100*60`, `perDomain`: donor's
        `{correct, total}` per domain maps cleanly into the hub's per-domain
        score array (re-verified — not dropped), `date` from the donor field
      - **Answers when present**: map `QuestionAnswer` → hub answers:
        `number i → 'o'+(i+1)` and `number[] → ids` — donor order answers are
        authored-item **indexes** (grade.ts:70-80), a pure index→id transform,
        no text lookup; `fill` strings verbatim. Then **one bounded grading
        pass at import** synthesizes `results` (per-question correct flags) —
        grading is required here, not test-only, because `recordExam`'s SRS
        feed reads `attempt.results` (`subject-store.ts:158-159`) and history
        screens show it
      - **Answer-less attempts** (pre-phase-6 donor builds): migrate
        **score-only** — empty `answers`/`results`, keeps `score` + `date` in
        history, contributes nothing to SRS (user decision 2026-08-20)
      - `practiceStats` → **dropped**: `{seen, correct}` per domain is an
        aggregate the hub has no home for; one `console.info` at import naming
        what was dropped. Similarly dropped: donor `version`
- [x] **Dedicated write path** (finding C): the runner writes via one bulk
      merge — e.g. a new `importLegacyData(subjectId, partial)` action or a
      direct `setState` patch on `state.subjects[subjectId]` — **not**
      `recordQuiz`/`recordExam`/`markLesson` (those cap history at 200/50,
      bump streaks, and feed SRS; a legacy import must not synthesize
      activity). Merge semantics: per-key skip-if-already-present (existing
      lesson entries, lab ids, attempt ids win); legacy attempts' deterministic
      ids make re-runs idempotent
- [x] **Idempotency guard** (finding D): sibling localStorage key
      `cc-gh-progress-migrated` (precedent: `cc-exam-inflight`), set only after
      a successful merge completes — NOT a flag inside `cc-subject-data`, which
      the persist merge whitelist strips on rehydrate (`subject-store.ts:175-183`
      only merges `streak`/`subjects`/`version`)
- [x] Corrupt/partial old payload: skip the unreadable entry, keep the rest,
      `console.warn` once — never throws, never blocks app start
- [x] **Wiring** (finding E): a one-shot effect in `src/App.tsx` gated on
      `useSubjectDataStore.persist.hasHydrated()` (or awaiting
      `persist.rehydrate()`); **never** store-init-time wiring — the
      create()-time rehydration trap is documented at `store.ts:43-46` and
      pinned by `store.rehydrate.test.ts:5-7`
- [x] Unit tests: happy path per answer kind; answer-less attempt → score-only
      row, empty results; out-of-range index → that attempt dropped not crash;
      double-run → second run writes nothing (guard + idempotent ids);
      already-present hub key → old value loses; absent old key → no-op;
      rehydration-path test (persist → reload → run → no writes)

## Architecture

Read-transform-merge on plain objects, outside engine business logic. The
runner reads `gh-site-progress-v1`, splits by id prefix (`gh900-`/`gh200-`),
loads each pack's content, calls the pure mapper, and bulk-merges via the
dedicated action. Flow:

```
App.tsx effect (hasHydrated) → guard key? → read old payload
  → per cert: mapper(old, current.subjects[id], content[id]) → importLegacyData
  → set cc-gh-progress-migrated → console.info summary (incl. dropped practiceStats)
```

Grading lives inside the mapper (pure — takes content, returns results), so the
one bounded grading pass is itself unit-testable against question keys.

## Related Code Files

- Create: `src/engines/migrate-gh-progress.ts`, `src/engines/migrate-gh-progress.test.ts`
- Modify: `src/engines/subject-store.ts` (the `importLegacyData` bulk-merge
  action — small, no caps/streak/SRS side effects)
- Modify: `src/App.tsx` (hydration-gated one-shot effect)
- Read-only: `learn-gh-200/src/hooks/useProgress.ts`,
  `learn-gh-200/src/utils/grade.ts`

## Implementation Steps

1. Re-read `useProgress.ts` + every write site; diff the payload shape above
   against current source — if the donor changed since this plan was written,
   update the mapping table before coding.
2. Add `importLegacyData` to `subject-store.ts` with per-key skip-if-present
   merge; unit-test the merge alone.
3. Implement the pure mapper per the mapping table (incl. grading pass +
   score-only branch); unit tests per the requirements list.
4. Wire the App.tsx effect behind `hasHydrated()` + sibling guard key.
5. `npm test`, `npm run lint`; manual devtools round-trip: seed a realistic old
   payload → refresh → progress visible once → refresh → unchanged.

## Todo

- [x] Payload shape re-verified against source (step 1 gate)
- [x] `importLegacyData` bulk-merge action + tests
- [x] Pure mapper (incl. grading pass, score-only branch) + tests
- [x] App.tsx hydration-gated wiring + sibling guard key
- [x] Rehydration-path idempotency test
- [x] Manual devtools round-trip
- [x] Gates green

## Success Criteria

- Seeded realistic old payload → hub shows completed lessons (via
  domain→lesson resolution), completed labs, exam history with scores/dates;
  answered attempts show graded results; answer-less attempts show score-only.
- Second load mutates nothing (guard + deterministic ids both hold).
- No old key / corrupt key → clean no-op with at most one warn/info.
- `npm test` + `npm run lint` green.

## Risk Assessment

- **Donor payload drift** → step 1 hard gate re-reads source; the shape above
  is pinned to `useProgress.ts:42-51` as of this plan.
- **Grading at import diverges from donor grading** → the donor grade logic
  (`grade.ts`) is index-based identical semantics; mapper tests grade a
  mapped round and compare against donor-correct flags.
- **User already used the hub before the shim lands** → per-key
  skip-if-present protects new data; worst case old data ignored, never
  clobbers.
- **Old app and hub used in parallel after migration** → documented: one-way,
  one-time import; donor stays deployed and untouched.
