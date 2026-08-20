# Phase 4 test report — question renderers + practice mode

Date: 2026-08-20. Verifier: tester agent. Scope: phase-04 acceptance list
(`phase-04-question-renderers-and-practice.md` §Requirements + §Success Criteria).

## Test Results Overview

| Gate | Result | Notes |
|---|---|---|
| `npx vitest run` | 313/313 pass (30 files) | ~3.6s; deterministic across repeat runs |
| `npx tsc -b` | clean | |
| `npm run lint` (oxlint) | clean | |
| `npm run build` | success | known >500kB chunk warning (deferred to phase 5/7); also a `gray-matter` direct-eval rolldown warning from node_modules — pre-existing, not phase-4 code |
| `npm run content:check` | 3/3 pass | |

No flaky tests found; no test files needed fixing. No source files touched.
Probe tests I wrote for investigation were deleted; suite re-run green after deletion.

## Acceptance criteria verification (all from source, file:line cited)

1. **`revealed?: boolean`; graders untouched** — PASS.
   `src/sdk/registry/questions.tsx:105-112` (`QuestionRenderer`), `:118-127`
   (`QuestionHandler.render`), `:171-179` (`renderQuestion` threads it).
   Graders byte-identity NOT verifiable (workspace is not a git repo — no diff
   baseline exists). Semantics verified instead: pinned grading tests all pass
   (`gradeQuestion` :185, `gradeSingleLike` :192, `gradeOptionSet` :195,
   `gradeSequence` :196, `matchingTokens` :97, `normalizeBlank` :88 match the
   documented contracts in `questions.test.tsx:91-151`).
2. **single/codeReading/bug/multi option buttons** — PASS. `OptionRow`
   (`questions.tsx:223-244`): `<button>` + letter chip
   (`String.fromCharCode(65+index)`), `aria-pressed` (:228), reveal states via
   `optionState` (:204-212) — correct → `q-opt-correct` + Check icon,
   selected-wrong → `q-opt-wrong` + X (:233-239). Revealed controls disabled
   (:258, :284, :309, :333). Tested: `questions.test.tsx:189-238`.
3. **order** — PASS. Full list initialized to option order (:356-357; runner
   seeds via `initialAnswer` :42-51), move up/down native buttons with
   `Move ${label} up/down` aria-labels (:389, :397; keyboard-operable by
   construction), reveal shows placement (:371-375). Tested: :240-265.
4. **matching** — PASS. Select per left item (:441-453), reveal shows correct
   right when missed (:454-458), React keys by left/right index (:431, :449) —
   duplicate-rights test passes (:267-279). Minor display quirk below.
5. **fill** — PASS. Inline inputs in template (:492-513), monospace container
   (`views.css:635-643` `.q-fill-pre` → `var(--font-mono)`), `spellCheck={false}`
   (:501), per-blank `Blank i of n` aria-label (:500), reveal lists expected
   (:516-520). Tested: :289-302.
6. **KIND_LABELS covers 7 kinds** — PASS (:31-39; test :313-317).
7. **QuizRunner loop** — PASS with one source bug (below). Loop + verdict
   banner + Markdown explanation + doc links (`QuizRunner.tsx:206-221`), finish
   screen with score + missed→lesson links (:119-168), restart reshuffles
   (Fisher–Yates keyed on `[bank, runId]`, :57 + :106-112), records exactly one
   attempt on finish (:95-102; asserted `QuizRunner.test.tsx:99,125`). Check
   gated by `answerReady` (:229) — unanswered un-submittable.
8. **PracticeIndex** — PASS. Domain cards with counts + module chips
   (:61-96), Focus pill from `computeStats().weakDomains` (:67,77-79; exam
   accuracy worst-first, `engines/progress.ts:70-72`), run hrefs
   `#/subject/:id/practice/:scopeId` (:40). Tested: `PracticeIndex.test.tsx`.
9. **validate.ts multi.correct duplicate rejection** — PASS
   (`validate.ts:486-487`; test `validate.test.ts:206-211`).
10. **Styling tokens-only** — PASS. Zero hex values in the whole of
    `views.css` (two grep patterns, 0 matches); phase-4 section (:426+)
    uses `var(--*)` exclusively.

Route wiring verified: `tool-views.tsx:43-76` (index at tab root, run at
`/:scopeId`, honest empty states for unknown scope + empty bank);
`views.test.tsx:130-160`. `SubjectWorkspace.tsx:166` mounts
`DocResolverProvider`.

## Fixture run-through (success criterion 1)

Drove the real `QuizRunner` over the fixture's 7 questions, answering each kind
through its real controls (probe test, since deleted): all 7 kinds render,
answer, check ("Correct" verdict each), and the attempt records — but the run
scored 6/7 with exactly `q-order` wrong, which exposed the bug below. Registry
level (render idle/revealed + grade correct/wrong/empty for all 7 fixture
questions): all pass.

## Critical issue (source bug — reported, NOT patched per constraints)

**Untouched order question: verdict says Correct, recorded result says wrong.**

- Evidence: `src/ui/QuizRunner.tsx:79` display/verdict path uses
  `answers[current.id] ?? initialAnswer(current)`, but the finish/record path
  (:91-94, :120-123) re-grades `answers[question.id] ?? []`.
- Repro (verified via scratch test, since deleted): one order question with
  `correct` equal to option order (fixture `q-order` qualifies). Learner clicks
  Check without moving anything — Check is enabled because the seeded full list
  satisfies `answerReady`. Verdict banner shows "Correct"; finish screen shows
  "0 of 1 correct (0%)" with the question under "To revisit";
  `recordQuiz` stores `correct: false`.
- Impact: practice results + SRS ingest record a wrong answer the app itself
  graded correct; realistic trigger (given order already correct → no move).
- Fix direction (for implementer): finish/record path should fall back to
  `initialAnswer(question)` like the display path, or `check()` should persist
  the seeded answer into `answers`.
- Why the suite missed it: `QuizRunner.test.tsx` always emits an answer before
  checking; `questions.test.tsx` tests renderers in isolation.
- Suggested test once fixed: single-order-question run, Check with no moves →
  finish shows 1/1 and `questionResults[0].correct === true`.

## Minor findings (non-blocking)

- `chosen()` parses the stored `leftIndex::right` token with `split('::')[1]`
  (`questions.tsx:421`): a right value containing `::` redisplays
  truncated/blank after picking (verified: stored token `"0::a::b"` redisplays
  as `"a"`, matching no `<option>`). Grading and React keys unaffected;
  `validate.ts` does not reject `::` in rights. Cosmetic; unlikely content.
- On reveal, `aria-pressed` drops to `false` for a selected-correct option
  (state becomes `correct`, :228 only maps `selected`/`wrong`). Design choice,
  not a criterion violation.
- `views.test.tsx` covers index → run mount; full index → run → **finish**
  navigation lives at component level (`QuizRunner.test.tsx`) — acceptable
  split, noting the phase file's step 7 wording.

## Performance

Suite 3.6s (no slow tests); build 188ms transform; nothing to optimize.

## Recommendations (priority order)

1. Fix the QuizRunner order-answer persistence bug; add the no-move regression
   test above.
2. Optionally make `chosen()` split with a limit (`split('::').slice(1).join('::')`)
   or reject `::`-bearing rights in `validate.ts`.
3. (Carried, not phase 4) chunk-size + gray-matter eval warnings — phase 5/7.

## Unresolved questions

- Grader "byte-identical" freeze is unverifiable without VCS. If a diff
  baseline matters, snapshot `src/sdk/registry/questions.tsx` grader section
  now for future phases (this workspace has no git).

Status: DONE_WITH_CONCERNS
Summary: All five gates green (313/313 tests, tsc, lint, build, content:check) and all 10 acceptance criteria verified against source; one source bug found in QuizRunner — an order question checked without moving anything shows verdict "Correct" but is recorded wrong at finish (repro in report).
Concerns/Blockers: src/ui/QuizRunner.tsx finish path (:91-94, :120-123) grades `answers[id] ?? []` while the verdict path (:79) uses `initialAnswer` fallback — needs an implementer fix + regression test; grader byte-freeze unverifiable (no git repo).
