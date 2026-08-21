---
title: "Phase 3: Review Queue"
status: todo
priority: P1
effort: 6h
dependencies: [phase-02]
---

# Phase 3: Review Queue

## Overview

A hub-level cross-subject SRS review queue at `#/review`: due cards from every
subject's deck interleaved into one practice session, graded through the
existing question registry, and recorded back per-subject so SRS ingest, caps,
and streak ride the existing store actions untouched.

## Context

- SRS decks live per subject at `cc-subject-data → subjects[id].srs`;
  `dueCards(cards, now)` (most-overdue first) already exists in
  `src/engines/srs.ts`.
- `QuizRunner` is coupled to one subject (records one attempt via
  `recordQuiz(subjectId, …)`); refactoring it mid-phase risks a proven loop.
  **Locked decision:** a new hub-level view reuses the registry primitives
  (`renderQuestion`, `gradeQuestion`, `initialAnswer`, `answerReady`,
  `KIND_LABELS` from `src/sdk/registry/questions.tsx`) that QuizRunner itself
  uses.
- Router (`src/shell/router.ts`) currently knows only `home` and `subject`
  routes; `parseHash` falls back to home for anything else, so `#/review` needs
  an explicit arm before the view can exist.
- Rail currently has a single Home link; the mockup's `.ibtn .cnt` badge pattern
  is the reference for a due-count badge.

## Requirements

- [x] `src/engines/review-queue.ts` (pure, tested): given
      `subjects: Record<string, SubjectUserData>` + a per-subject question
      lookup + `now`, return the due queue — interleaved across subjects
      (round-robin by most-overdue per deck), capped (default 20), each item
      `{ subjectId, questionId }`; stable ordering (no `Math.random`).
- [x] `src/shell/ReviewQueue.tsx`: one-question-at-a-time flow mirroring
      QuizRunner's interaction (check → verdict + explanation → next; finish
      screen), with the owning subject's code as a badge on each question;
      question content resolved through the subject's `SubjectIndex`.
- [x] Finishing groups results by subject and calls
      `recordQuiz(subjectId, { scope: 'hub-review', … })` once per touched
      subject — SRS ingest + streak bump ride the existing action; unanswered
      queue items count as wrong (matches QuizRunner semantics).
- [x] Empty state: "Nothing due" with a link back to home (a next-due hint is
      optional; only if cheap from existing card data).
- [x] Router: `HubRoute` gains `{ view: 'review' }`; `parseHash('#/review')`
      resolves it; unknown hashes still fall back to home. `App.tsx` renders
      `ReviewQueue` for that view (with AppShell chrome).
- [x] Rail: "Review" nav item under Home with due-count badge (memoized count
      over the store's decks); badge hidden at zero.
- [x] Keyboard + a11y: the queue is operable keyboard-only; badge is
      `aria-label`-described; focus management matches QuizRunner's behavior.

## Implementation Steps

1. Read `QuizAttempt` in `src/sdk/types.ts` + how `PracticeIndex`/`tool-views`
   invoke QuizRunner (id generation, score fields) — mirror the attempt shape
   for scope `hub-review`.
2. Write `src/engines/review-queue.ts` + unit tests (interleaving fairness,
   cap, empty decks, all-due-one-subject, stability).
3. Extend `src/shell/router.ts` (+ `router.test.ts`) with the `review` view.
4. Write `src/shell/ReviewQueue.tsx` + tests (render first due question with
   subject badge; grading through registry; per-subject recording with
   unanswered-as-wrong; empty state; finish screen shows per-subject score
   split).
5. Wire `App.tsx`, add the rail item + badge in `AppShell.tsx`
   (+ tests: badge count from store, hidden at zero, link navigates).
6. Styles in `src/styles/app.css` for the queue view and rail badge (reuse
   existing practice/quiz classes where possible).

## Todo

- [x] Engine + tests
- [x] Router + view + tests
- [x] Rail badge + App wiring + styles
- [x] `npm test` + `npm run lint` green

## Success Criteria

- With due cards in ≥2 subjects, `#/review` serves a mixed session; finishing
  moves the reviewed cards' boxes via the store (observable in persisted srs
  decks); subjects with nothing due contribute nothing; a fresh store shows the
  empty state; the rail badge equals the total due count.

## Risk Assessment

- **Risk:** question lookup misses (deck references a questionId the pack no
  longer has — e.g. after a pack edit). *Signal:* engine test with an orphan
  card. *Response:* the engine drops unresolvable ids from the queue (and they
  simply never resurface — acceptable; do not silently crash the session).
- **Risk:** recording many per-subject partial attempts distorts per-subject
  stats. *Signal:* review of `PracticeIndex` stats usage. *Response:* scope
  `'hub-review'` lets any consumer filter it out; verify nothing currently
  sums attempts unfiltered.
- **Risk:** badge re-renders on every keystroke of the topbar search.
  *Signal:* React Profiler / test double-count. *Response:* badge derives from
  the store decks via its own selector, never from search state.
