---
title: "Phase 6: Exam engine and review"
status: done
---

# Phase 6: Exam engine and review

## Overview

The exams mode: `ExamIndex` with attempt history, the merged `ExamEngine`
sitting (gh-200's wall-clock deadline + in-flight resume + confirm + auto-submit;
dp-800's timed/untimed toggle + case-study backgrounds), and `ExamReview`
replaying the exact paper with per-domain breakdowns.

## Requirements

- [x] `ui/ExamIndex.tsx`: exam cards (duration, question count, pass mark, selection kind), attempt history per exam with score chips, links to run + review.
- [x] Paper assembly: `selection.kind === 'sampled'` → `sampleExam(exam, content.questions, excludeIds)`; `'fixed'` → `getQuestions(questionIds)`; deterministic so review replays the same paper.
- [x] Intro screen: exam contract (wall-clock behavior, no feedback, unanswered = wrong, auto-submit), timed/untimed toggle, Begin.
- [x] Sitting: wall-clock deadline when timed (`setInterval` re-render only; deadline is the truth); count-up elapsed when untimed (no auto-submit); question navigator grid (answered/flagged/current states + aria labels); flag toggle; prev/next; case-study background card when the current question belongs to one; per-question registry render with `revealed=false`.
- [x] Submit: confirm dialog with unanswered count → `scoreAttempt` → `recordExam` (full `ExamAttempt` incl. `answers`, `results`, `perDomain`, `durationSeconds`, `timed`) → navigate to review.
- [x] Auto-submit at deadline (mount with an expired sitting also submits).
- [x] In-flight persistence: `cc-exam-inflight` via the `StorageAdapter` — `{ subjectId, examId, timed, startedAt, deadline?, answers, flags }`, strict shape check on load (gh-200's defensive parse), saved on every change, cleared on submit, other-exam sittings discarded on visit, reload resumes exactly.
- [x] `ui/ExamReview.tsx`: verdict card (scaled score /1000, pass/fail, correct count, duration, date), per-domain `BreakdownBar`s vs official domain weights, question-by-question replay (registry render with `revealed=true`, learner answer, Markdown explanation, doc links, link to owning lesson via `question.lessonId`, unanswered marked).
- [x] Review route `#/subject/:id/exams/:examId/review/:attemptIndex`; attempt lookup guarded (bad index → honest empty state).

## Architecture

The engine owns only sitting state; persistence goes through the store
(`recordExam`) and the storage adapter (in-flight). Scoring stays in
`engines/scoring.ts` — the engine calls `scoreAttempt` and never recomputes.
Case studies attach by `questionIds` membership (dp-800's lookup). One in-flight
sitting globally (single key) is intentional: one learner, one sitting at a
time, any subject.

## Related Code Files

- Create: `src/ui/ExamIndex.tsx`, `src/ui/ExamEngine.tsx`, `src/ui/ExamReview.tsx`,
  `src/ui/BreakdownBar.tsx` (+ tests)
- Modify: `src/shell/tool-views.tsx`, `src/styles/views.css`
- Reference donors: `learn-gh-200/src/components/exams/{ExamRunner,ExamReview,ExamIndex,BreakdownBar}.tsx`
  (primary), `learn-dp-800/src/components/ExamEngine.tsx` (timed toggle,
  case studies)

## Implementation Steps

1. `ExamIndex` from `content.exams` + store `examAttempts` (filter by examId, newest first).
2. Engine state machine intro → running → submitted; deadline/startedAt refs; the half-second tick; `formatClock` (mm:ss, minutes over 60 as-is) ported from gh-200.
3. In-flight load/save/clear via the adapter with the strict shape check; resume path in state initializers (lazy `useState` init like gh-200 — no storage reads per tick).
4. Navigator + flag + case-study card + confirm dialog; submit wiring with the attempt payload; `navigate` to the review route.
5. `ExamReview` + `BreakdownBar`: re-derive the paper deterministically, replay each question with revealed renderers, per-domain tallies from `attempt.perDomain`.
6. Wire `exams` in `tool-views.tsx`; tests: full untimed submit flow (fixture exam, 4 questions) recording one attempt; expired-deadline mount auto-submits; in-flight save → reload state resumes; review renders verdict + replay of the stored answers; bad attempt index → empty state. Use the memory adapter store pattern from the engine tests.

## Todo

- [x] ExamIndex + history + tests
- [x] ExamEngine: intro/timed toggle, deadline clock, navigator, flags, case studies + tests
- [x] In-flight persistence (adapter-backed, strict parse, resume) + tests
- [x] Confirm dialog + auto-submit + submit → recordExam → navigate + tests
- [x] ExamReview + BreakdownBar (verdict, domains, replay) + tests
- [x] tool-views wiring; full gates green

## Success Criteria

- A complete fixture sitting (timed and untimed) records exactly one `ExamAttempt` and lands on its review; SRS ingest receives the results via the store.
- A reload mid-sitting resumes the same paper, answers, flags, and clock; an expired sitting auto-submits on return.
- Review replays the exact deterministic paper with the learner's answers marked.
- No scoring math in the engine — all verdicts come from `scoreAttempt`.
- `npm test && npm run lint && npm run build && npm run content:check` green.

## Risk Assessment

**Risk:** timer tests flake under jsdom/CI. **Signal:** intermittent
auto-submit test failures. **Response:** pre-decided patterns only — untimed
flow for the happy path, mount-with-past-deadline for auto-submit, no
real-time waits; if a tick test is still flaky, drop it and assert the deadline
math as a pure function. **Risk:** sampled paper differs between sitting and
review (nondeterminism). **Signal:** review shows different questions.
**Response:** impossible by construction (`seed` fixed) — but assert it once in
the review test; if it ever fails, the bug is in paper assembly, not the
review.

## Close-out notes (2026-08-20)

Delivered: `ExamIndex` (cards + per-exam history with absolute review
indexes), `ExamEngine` (intro/timed-toggle → sitting → confirm → submit, with
wall-clock deadline, navigator, flags, case studies, in-flight resume,
mount-expired auto-submit), `ExamReview` (verdict, per-domain `BreakdownBar`s
vs official weights, deterministic replay with doc/lesson trails), plus
`tool-views` wiring and the phase-6 `views.css` block (tokens + `color-mix`
only, zero hex).

Beyond the plan's Create list, two pure engine modules landed because the
plan's Architecture section places paper derivation and in-flight persistence
outside components: `engines/exam-paper.ts` (deterministic assembly, recursive
`excludeExamIds` resolution with a cycle guard) and `engines/exam-inflight.ts`
(`cc-exam-inflight` adapter with the strict shape check). Also modified:
`content/fixture/exams.json` (1 → 2 exams) and the `content-source.test.ts`
totals pin.

Verification: tester (DONE) and code-reviewer (DONE_WITH_CONCERNS) ran the
full gates — final state 383/383 tests, oxlint clean, tsc+build clean, 
content:check 3/3. Reports: `reports/phase-06-tester.md`,
`reports/phase-06-review.md`. Both risks held: no timer flakiness (untimed
happy path, mount-with-expired auto-submit, pure `sittingSeconds` math) and
paper determinism asserted once in the review test.

Shipped post-review (reviewer F1, MED): an exclusion-starved sampled pack
passed `content:check` and then threw inside `ExamIndex`'s render
(white screen, no error boundary). Fix: `validateSubject` accepts an optional
`assemblePaper` hook (new `ValidateOptions`); when present, sampled exams
declaring `excludeExamIds` are deep-checked by running the real deterministic
assembly and reporting the sampling engine's precise message as
`exam-infeasible`. `createFileContentSource`/`assembleSubject` pass it
through, and `content/registry.ts` injects `engines/exam-paper`'s
`assemblePaper` — the app layer sits above SDK and engines, so layering stays
clean. Gate-green now implies sitting-time-safe. Also shipped: jsdom hash
reset added to `ExamIndex`/`ExamReview` test cleanup (tester hygiene note).

Deferred (with reasons, see reports): resume restores answers/flags/clock but
not navigator position — the plan's in-flight shape and Success Criterion 2
deliberately omit `position`; candidate for the real-pack phase (pinning
snippet in the tester report). Fill answers typed-then-emptied show "Missed"
rather than "Unanswered" — label nuance only, grading and engine/review agree;
would need kind-specific answer semantics the plan never drew. Confirm-dialog
focus management (donor parity gap) → Phase 7's a11y sweep. Stale review links
shifting as history grows — deliberate absolute-index route design, guarded by
the examId-ownership check.
