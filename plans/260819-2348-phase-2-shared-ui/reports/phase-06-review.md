# Phase 6 Review — Exam engine and review

Reviewer: code-reviewer (staff-engineer lens). Date: 2026-08-20.
Scope verified by direct file reads (no git baseline exists), mtime
evidence for the change surface, and gates run locally.

## Checklist

### (a) Acceptance criteria

1. **Complete fixture sitting records exactly one attempt, lands on review, SRS
   ingest via store — ✓**
   Untimed full sitting: `src/ui/ExamEngine.test.tsx:120-160` (exactly one
   attempt, `scaledScore: 1000`, `perDomain` `d1 2/2 + d2 2/2`, hash lands on
   `#/subject/fixture/exams/exam-practice/review/0`). Timed sitting:
   `src/ui/ExamEngine.test.tsx:187-220` (one attempt, scaled 100, failed,
   duration capped at 600). `recordExam` at `src/engines/subject-store.ts:154`
   calls `ingestResults(data.srs, attempt.results, now())` at line 159 — SRS
   ingest happens inside the store action, exactly as contracted.

2. **Reload resumes; expired sitting auto-submits on mount — ✓**
   Resume test `src/ui/ExamEngine.test.tsx:222-240` restores answers/flags/clock
   straight into the sitting (lazy `useState` init, `src/ui/ExamEngine.tsx:75`).
   Expired-mount auto-submit: `src/ui/ExamEngine.test.tsx:242-261`; the effect
   at `src/ui/ExamEngine.tsx:134-136` fires on mount because `expired`
   (line 133) is computed from `now` initialized to `Date.now()` (line 88).
   Duration reconstructs from the deadline and caps at 600 s (asserted).

3. **Review replays the exact deterministic paper — ✓**
   `src/ui/ExamReview.tsx:59-62` re-derives via `assemblePaper`; determinism
   asserted once in `src/ui/ExamReview.test.tsx:98-105` (fixed order
   `['q-single', 'q-multi']`) and pinned in `src/engines/exam-paper.test.ts:16-26`
   (sampled paper equals the frozen `sampleExam` output, twice).

4. **No scoring math in the engine — ✓**
   `src/ui/ExamEngine.tsx:113` is the only scoring entry: `scoreAttempt`.
   `scaledScore`/`passed`/`perDomain`/`results` all read from the returned
   score. `sittingSeconds` is duration bookkeeping (clamped, tested at
   `src/ui/ExamEngine.test.tsx:288-304`), `answeredCount` is progress display.

5. **Gates green — ✓ (run by this reviewer, not just the tester)**
   `npm test` 41 files / 381 tests pass; `npm run lint` (oxlint) clean;
   `npx tsc --noEmit` exit 0; `npm run content:check` 3/3 pass.

### (b) No regression in touchpoints / blast radius

- **tool-views routing — ✓** `src/shell/tool-views.tsx:108-132`: index when no
  `id`, review when `rest[0] === 'review'`, engine otherwise with
  `key={`${subjectId}:${id}`}` — same fresh-run-on-route-hop law as QuizRunner
  (line 77). Review deliberately has no key (stateless over stored attempts).
  Navigating engine → review → same exam unmounts the engine, so no stale
  sitting state survives a completed submit.
- **recordExam callers — ✓** Production callers grep-verified: ExamEngine only
  (`src/ui/ExamEngine.tsx:68,114`). Store signature and slice shape untouched.
- **content-source totals pin — ✓** `src/sdk/content-source.test.ts:263` pins
  `exams: 2`, matching `content/fixture/exams.json` (2 exams).
  `src/sdk/content-source.ts` itself untouched (mtime Aug 19 23:13).
- **Existing viewer tests — ✓** full suite passes; no viewer file outside the
  declared touch list changed (mtime survey below).

### (c) No breaking changes to public contracts

- **sdk/types.ts unchanged this phase — ✓ (verified)** mtime `Aug 20 09:10`,
  before the Phase 6 write window (`11:04–11:26`); the phase contract's modify
  list excludes it. The mtime cluster inside the window is exactly: `exams.json`,
  `exam-inflight(.test).ts`, `exam-paper(.test).ts`, `tool-views.tsx`,
  `views.css`, `BreakdownBar(.test).tsx`, `ExamEngine(.test).tsx`,
  `ExamIndex(.test).tsx`, `ExamReview(.test).tsx`, `content-source.test.ts`.
  No scope drift.
- `sampling.ts` / `scoring.ts` untouched (Aug 19 mtimes) — `assemblePaper`
  consumes them as-is, including the frozen `sampleExam`.
- New module exports stable: `assemblePaper`; `EXAM_INFLIGHT_KEY`,
  `InflightSitting`, `loadInflight`/`saveInflight`/`clearInflight`,
  `inflightStorage`; `formatClock`/`sittingSeconds` re-used by ExamReview and
  tests. No existing exported signature changed anywhere in the window.

### (d) Codebase patterns

- **Zustand selector law — ✓** `src/ui/ExamIndex.tsx:23` and
  `src/ui/ExamReview.tsx:43` select the stored array itself
  (`s.subjects[subjectId]?.examAttempts`), default applied at the use site
  (`?? []` at ExamIndex:37; `!== undefined` guard at ExamReview:51), with
  comments naming the useSyncExternalStore loop this avoids.
- **Fallback-never-blank — ✓** unknown exam (Engine:138-150, Review:64-76),
  bad/non-numeric/foreign-attempt index (Review:49-90), empty pack
  (Index:25-33) all render EmptyState with a route back to safety.
- **Registry renderQuestion usage — ✓** Engine seeds
  `answers[current.id] ?? initialAnswer(current)` (line 329) exactly like
  `QuizRunner.tsx:85`, `revealed=false`; Review renders `revealed=true` with a
  noop onAnswer (line 204).
- **Styling law — ✓** the exam block (`src/styles/views.css:1478-1809`) uses
  only tokens.css semantic vars plus `color-mix(in srgb, …)`; the dialog
  backdrop `color-mix(in srgb, black 42%, transparent)` (line 1691) copies the
  existing `app.css:431` precedent verbatim. No raw hex.
- **Single href policy — ✓** doc links gated by `isExternalUrl`
  (`src/ui/ExamReview.tsx:177-182`), `target="_blank"
  rel="noopener noreferrer"`; internal links are hash hrefs only.
- Conventional commits: N/A (no git repo).

### (e) No new lint/type/build errors — ✓

See (a)5. All four gates run and green in this session.

## Findings

### F1 — MED: an exclusion-infeasible sampled pack white-screens the whole hub at render

- **Where:** `src/engines/exam-paper.ts:36` → `sampleExam` throws
  (`src/engines/sampling.ts:66-69`) when a domain pool falls below the plan
  *after* exclusion. `src/ui/ExamIndex.tsx:52` calls `assemblePaper`
  unconditionally during render for every card; `src/ui/ExamEngine.tsx:70` and
  `src/ui/ExamReview.tsx:59-62` likewise. No error boundary exists anywhere
  (grep for `componentDidCatch|ErrorBoundary` → none; `src/App.tsx` renders the
  workspace directly).
- **Trigger path:** a pack ships exam B with `domainPlan: { d1: 3 }` and
  `excludeExamIds: ['A']`; domain d1 has 4 questions, exam A fixes 2 of them.
  `content:check` passes because feasibility is only checked in isolation
  (`src/sdk/validate.ts:454-461`) — the NOTE at lines 462-463 explicitly
  delegates exclusion overlap to "sample time … which throws a precise error".
  The learner opens the exams tab → the throw escapes ExamIndex's render →
  React unmounts the tree → the entire hub (all subjects, all modes) blanks,
  not just the offending exam card.
- **Why it matters now:** `excludeExamIds` is live schema surface; donor packs
  get ported in later phases and the crash needs only an authoring mistake the
  gate explicitly does not catch.
- **Suggested fix (pick one, prefer a):**
  a. Extend the sampled-exam loop in `src/sdk/validate.ts` to subtract each
     excluded exam's served questions from the pool before the `pool < count`
     check (recursion already exists in `assemblePaper` to copy the resolution
     order from) — the invariant becomes a pack-contract failure at gate time.
  b. Catch the throw at the `assemblePaper` call sites (or wrap in
     `assemblePaper`) and degrade the card/engine/review to an EmptyState.
- Not a deliberate-plan reversal: the phase file only sanctions silent
  degradation for *fixed*-selection misses; it is silent on sampled
  infeasibility, and the validator comment shows the error was expected to
  surface somewhere — currently it surfaces as an uncaught crash.

### F2 — LOW: a fill answer typed-then-emptied shows "Missed", not "Unanswered"

- **Where:** `src/ui/ExamReview.tsx:175` (`unanswered = answer.length === 0`).
  The fill renderer commits on every keystroke (`questions.tsx:507-511`), so a
  learner who types then deletes persists `['', …]`, which has non-zero length.
  Matching degrades correctly (choosing "Choose…" removes the token,
  `questions.tsx:425-429`).
- **Scenario:** fill question answered then cleared → review pill says
  "Missed"/"Not quite" instead of "Unanswered"/"Left blank". Grading is
  unaffected (`gradeQuestion` treats empty-normalized blanks as wrong), so this
  is label nuance only.
- **Fix if wanted:** treat all-blank answers as unanswered
  (`answer.length === 0 || answer.every((v) => v.trim() === '')`).

### F3 — LOW (informational): existing-but-empty paper reports "No such exam"

- `src/ui/ExamEngine.tsx:138-143` conflates `!exam` and `paper.length === 0`
  under a "we could not find an exam" message. Unreachable for validated packs
  (Zod `min(1)` on `questionIds` at `validate.ts:253`, unresolved refs gated),
  so this is defense-in-depth with a slightly dishonest message. No action
  required.

### F4 — LOW (informational): absolute attempt indexes shift as history grows

- `examAttempts` is capped at 50 and prepended newest-first
  (`subject-store.ts:158`), so a stale review URL can point at a different
  attempt. The safety net holds: ExamReview's examId-ownership guard
  (`ExamReview.tsx:57`) degrades to "No such attempt" instead of fabricating a
  review, tested at `ExamReview.test.tsx:160-165`. Deliberate plan decision
  (`:attemptIndex` route contract) — no change requested.

### F5 — LOW: submit dialog has no focus management

- `src/ui/ExamEngine.tsx:351-381`: `role=dialog` + `aria-modal` + labelled
  title, but focus is not moved into the dialog and Tab can reach the sitting
  behind it. Donor `learn-gh-200` ExamRunner has the same shape, so this is
  parity, not a regression; noting for a future a11y pass.

## Edge Cases Verified (no defect found)

- **StrictMode double-effects** (`src/main.tsx` wraps the app): the mount
  effects are idempotent (`clearInflight`/`saveInflight` re-runs are
  overwrite-safe), and double auto-submit is absorbed by the `submitted` ref
  (`ExamEngine.tsx:89,111-112`). Effect order on mount-with-expired is safe:
  the save effect (line 97) runs before the auto-submit effect (line 134) in
  declaration order, so `clearInflight` wins — asserted by
  `ExamEngine.test.tsx:259`.
- **Timer correctness:** deadline is the single truth; the 500 ms interval only
  sets `now`; `formatClock` clamps negatives to 0:00; `sittingSeconds`
  reconstructs timed start from `deadline - duration` (clock-jump cannot
  fabricate time) and clamps to `[0, duration]`; untimed is raw elapsed — all
  unit-tested including the past-deadline and negative-clock cases.
- **In-flight strict parse:** rejects non-objects, arrays, wrong types, NaN
  timestamps, non-string-array answers/flags, timed-without-finite-deadline;
  untimed saves drop `deadline`; cleared on submit and on foreign sitting;
  single global key is the documented one-learner-one-sitting decision.
- **Answer semantics:** untouched questions have no map entry → graded wrong;
  order questions display the seeded `initialAnswer` but only committed moves
  enter the map (renderer treats given-order display as the answer until a
  move calls `onAnswer`); review distinguishes Unanswered/Left blank from
  Missed (modulo F2).
- **Paper assembly:** fixed order preserved; sampling delegates to the frozen
  `sampleExam`; exclusion resolves recursively with a seen-set cycle guard
  (cycle test passes); fixed-id misses degrade away — acceptable because
  `content:check` flags unresolved refs at gate time (donor parity: gh-200
  behaves the same).
- **Growth/unmount:** answers map bounded by paper size; attempts capped at 50;
  interval cleared on unmount via the effect cleanup; no storage read per tick
  (lazy initializers only).
- **Attempt lookup:** `Number('latest')` → NaN, `Number('')` unreachable
  (filter(Boolean) in `parseHash` drops empty segments), decimal/negative/
  over-range all rejected; guarded by `Number.isInteger` + range + examId
  ownership, each branch tested.

## Patterns Conformance

Conforms to: zustand selector stability law, fallback-never-blank, registry
`renderQuestion` usage (including `initialAnswer` seeding identical to
QuizRunner), plain-CSS + tokens with `color-mix` per `app.css` precedent,
single href policy via `isExternalUrl`, key-on-route-hop in tool-views, a11y
roles (`timer`, `dialog`, `aria-pressed`, `aria-current`, labelled
progressbar). Comments explain invariants, not plan bookkeeping — no phase IDs
or audit labels leaked into code.

## Plan Status

All six Todo items in `phase-06-exam-engine-and-review.md` are implemented with
tests; every requirement bullet in the phase file maps to shipped code plus a
covering test. Plan-file status mutation left to the lead. Recommended
follow-up: F1 option (a) before donor packs with `excludeExamIds` land.

## Verdict

The phase contract is fully met with faithful donor ports (gh-200's
deadline/in-flight model, dp-800's toggle/case studies) and the strongest test
coverage of the plan so far. One medium robustness gap (F1) sits outside the
phase's own gates: a pack configuration the content validator explicitly does
not check crashes the whole app at render. It does not block this phase's
fixture-scoped acceptance, but should be fixed (validator preferred) before
exclusion-bearing packs arrive.

Status: DONE_WITH_CONCERNS
Summary: Phase 6 meets every acceptance criterion with green gates, faithful
pattern conformance, and no contract regressions (types.ts verified untouched
via mtime evidence). One medium finding: exclusion-infeasible sampled packs
pass content:check and crash the app at render with no error boundary.
Concerns/Blockers: F1 (MED) — extend validate.ts to check post-exclusion
sampling feasibility, or degrade the throw to an EmptyState, before packs
using excludeExamIds ship.
