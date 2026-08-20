---
title: "Phase 4: Question renderers and practice"
status: done
---

# Phase 4: Question renderers and practice

## Overview

Upgrade the question registry renderers from functional to dp-800-grade,
reveal-aware styled controls (graders frozen), then build the shared
`QuizRunner` loop and the `PracticeIndex` — the practice mode for every
subject, proven on the fixture's seven question kinds.

## Requirements

- [x] Renderer signature gains `revealed?: boolean` (additive; graders and grading semantics untouched).
- [x] `single`/`codeReading`/`bug`/`multi`: option buttons with letter chips, `aria-pressed`, selected state, and reveal states (correct → success tokens + Check, selected-wrong → danger + X).
- [x] `order`: dp-800 model — full list initialized to option order, move up/down buttons (aria-labels, keyboard-operable), reveal shows right/wrong placement.
- [x] `matching`: select per left item; reveal shows the correct right when missed; React keys by left index (duplicate or `::`-containing right values must not break rendering).
- [x] `fill`: inline inputs inside the code template (monospace container, spellcheck off, per-blank aria-label); reveal shows expected answers.
- [x] `KIND_LABELS` for all 7 unified kinds.
- [x] `ui/QuizRunner.tsx`: one question at a time → check answer → verdict banner (correct/incorrect) + Markdown explanation + doc links → next; finish screen with score and missed-question → lesson links; restart reshuffles; records a `QuizAttempt` via `recordQuiz` on finish (SRS ingest rides the store).
- [x] `ui/PracticeIndex.tsx`: domain (and module) cards with question counts + weak-domain signal from `computeStats`; starts `#/subject/:id/practice/:scopeId` runs.
- [x] Close the Phase 1 review's validation gap: `validate.ts` rejects duplicate ids inside `multi.correct` (unanswerable questions can no longer ship) + test.
- [x] All styling in `views.css` via tokens; works across the four themes.

## Architecture

Split of concerns (locked): the **registry renderer** owns the answering
controls and their selected/revealed visual states; the **viewer** (QuizRunner /
ExamEngine / lesson knowledge check) owns the stem (`Markdown`), kind chip,
feedback banner, explanation, doc links, progress, and actions. Answers stay
`Answer = string[]` end to end — the runner passes `answer[id] ?? []` and never
rewrites encodings. Practice shuffling is per-run `Math.random` (gh-200
behavior; deterministic sampling is exams-only via `sampling.ts`).

## Related Code Files

- Modify: `src/sdk/registry/questions.tsx` (renderers + `KIND_LABELS`
  export), `src/sdk/registry/questions.test.tsx`, `src/sdk/validate.ts`
  (+ `validate.test.ts`) for the multi-correct duplicate check,
  `src/shell/tool-views.tsx` (practice → real views)
- Create: `src/ui/QuizRunner.tsx`, `src/ui/PracticeIndex.tsx` (+ tests)
- Reference donors: `learn-dp-800/src/components/QuestionView.tsx` (primary),
  `learn-gh-200/src/components/practice/{QuizRunner,QuestionCard,*Card}.tsx`
  (loop + finish screen), `learn-gh-200/src/components/practice/PracticeIndex.tsx`

## Implementation Steps

1. Add `revealed?: boolean` to `QuestionRenderer`/`QuestionHandler.render`; thread through `renderQuestion`; keep all graders byte-identical.
2. Port dp-800's `ChoiceList`/`OrderingList`/`MatchingList`/`SqlFillBlock` interaction models into the registry renderers, re-keyed to the unified schema and token-based classes (`q-opt`, `q-opt selected/correct/wrong`, etc.).
3. Update `questions.test.tsx`: rendering per kind (selected + revealed states, aria), matching keys by index, fill aria-labels; grading tests stay as-is.
4. Add the `multi.correct` duplicate-id rejection in `validate.ts`'s answerable branch + test case.
5. Build `QuizRunner` (props: `questions`, `scope`, `subjectId`, optional `title` for knowledge checks): gh-200's loop with dp-800's feedback; submit disabled until `answerReady`-equivalent per kind (non-empty for single-like, ≥1 for multi, full length for order/fill); records attempt once on finish.
6. Build `PracticeIndex` (props: `content`, `index`): per-domain cards → run links; empty bank → honest `EmptyState`.
7. Wire both into `tool-views.tsx` for `practice`; add workspace-route test navigating index → run → finish.

## Todo

- [x] `revealed` param threaded; graders untouched (diff-verified)
- [x] 7 styled reveal-aware renderers + KIND_LABELS + updated tests
- [x] multi.correct duplicate-id validation + test
- [x] QuizRunner (loop, feedback, finish, recordQuiz) + tests
- [x] PracticeIndex + tests
- [x] tool-views wiring for practice; full gates green

## Success Criteria

- The fixture's seven questions each render, answer, reveal, and grade correctly through the registry in a practice run.
- An unanswered question cannot be submitted; unanswered counts as wrong in results.
- `recordQuiz` fires exactly once per completed run (memory-adapter store assertion), feeding SRS ingest.
- `npm test && npm run lint && npm run build && npm run content:check` green.

## Risk Assessment

**Risk:** renderer rewrite silently changes an answer encoding (e.g. order
appending vs moving). **Signal:** fixture run-through or `questions.test.tsx`
grading cases fail. **Response:** graders are the contract — fix renderers, not
graders; keep `sameOrder`/`matchingTokens` semantics pinned by existing tests.
**Risk:** reveal styling leaks into exam mode (no feedback until submit).
**Signal:** exam run shows verdict colors. **Response:** `revealed` defaults to
false and only practice/knowledge-check/review set it — asserted in phase tests.

## Close-out notes

- Gates: vitest 315/315, tsc clean, oxlint clean, build ok (chunk-size
  warning stands, phase 5/7 lazy-load candidate), content:check 3/3.
- Tester gate found a real defect: verdict vs recorded-result divergence for
  a no-move `order` question (seeded answer never emitted `onAnswer`; verdict
  graded the seed, finish graded `[]`). Fixed with one shared `answerFor`
  source; regression test pins the no-move run at 1/1 recorded.
- Reviewer gate findings fixed in-session: doc-link hrefs now filtered
  through `isExternalUrl` (registry urls could bypass the single-href
  policy), matching rights containing `::` no longer truncate on redisplay
  (prefix-slice instead of split-index), `QuizRunner` keyed by
  `${subjectId}:${id}` so scope hops start fresh runs (was a reachable
  blank-page crash), correct-answer reveal gained `role="note"`, KIND_LABELS
  falls back to the raw kind for extension kinds. Reports:
  `reports/phase-04-tester.md`, `reports/phase-04-review.md`.
- Deferred with the standing schema freeze (real-pack phase): reserving the
  `all` domain id; Zod url tightening. Grader "byte-identical" freeze has no
  VCS baseline — pinned by the grading test suite instead.
- Reviewer's B1 (failing scratch file in tree) was a review/tester race: the
  tester had already deleted its probe; suite was 313/313 on re-check. The
  two useful probes live on as permanent regression tests.
