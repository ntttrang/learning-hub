---
phase: 2
title: "Question bank + exams"
status: completed
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Question bank + exams

## Overview

Extract every donor question — 30 study-plan quizzes, 60 mock, 7×50 practice — into the
deduplicated `questions/` bank, emit 8 fixed-selection exams, and switch on `practice` +
`exams` modes.

## Requirements

- Functional: all 440 question instances extracted as `single`-kind questions
  (`{d, dt, q, opts[4], ans, exp}` → id-based options + `correct: "oN"`); 8 exams emitted
  with donor metadata (mock: 60q/120min; practice 1–7: 50q/90min; all pass 700/1000).
- Non-functional: dedup exact — same normalized stem + options + answer collapses to one id
  referenced by every exam that serves it; near-duplicates stay distinct. Deterministic ids
  across re-runs (first-occurrence order: quizzes → mock → practice 1..7).

## Architecture

Extraction sources (all repo-relative):
`gh600-study-plan-captain-corgi.html` (quiz arrays per domain), `gh600-mock-exam-captain-corgi-1.html`
(the other five mock files are identical copies — extractor reads only `-1` and its
shape-assertion re-verifies that all six captured Q arrays are `JSON.stringify`-equal, so
silent donor divergence fails the run; no bare md5, whose value depends on the capture span),
`gh600-practice-exam-captain-corgi-{1..7}.html`.

- **Ids:** `gh600-d{N}-q{NN}` — per-domain counters in first-occurrence order; quiz questions
  of domain N come first so lesson-domain anchoring is stable.
- **Dedup key:** `JSON.stringify({stem, options, ansIndex})` with collapsed whitespace;
  a repeated key logs `dedup: <exam> → <existing id>` and reuses the id.
- **moduleId:** the question's domain module (`gh600-dN-mod`) for every question — module
  practice therefore serves the domain's full deduplicated bank (donor quiz + that domain's
  exam questions; a superset of the donor's 5-question quiz, per plan Decision 3/5).
- **Exams** (`exams.json`): `gh600-mock-1` ("GH-600 full mock exam", 120 min),
  `gh600-practice-1..7` ("GH-600 practice exam N", 90 min); every one
  `{kind:'fixed', questionIds:[…]}` in donor authored order — deterministic papers, no
  sampling, no ordering coupling to glob file order.
- **subject.json** regenerates with `enabledModes: [learn, labs?]…` → now
  `[learn, practice, exams, notes, revision]` (`labs` joins in Phase 3).
- Explanations like `"Correct answer: B) …"` (practice set) copy verbatim — the option letter
  stays meaningful because option order is preserved.

## Related Code Files

- Modify: `scripts/extract-gh600-pack.ts` (questions + exams parts)
- Create: `content/gh-600/questions/*.json` (390 files — 360 exam-derived + 30 quiz)
- Create: `content/gh-600/exams.json`
- Modify: `content/gh-600/subject.json` (enabledModes)

## Implementation Steps

1. Add question/exam parsing to the extractor with shape assertions: mock = 60 questions
   across `d:1..6` with counts `10/14/7/10/10/9`; each practice file = 50; quizzes = 5/domain.
2. Implement the dedup index; log the instance→unique mapping table on every run
   (provenance for the parity test's expected counts).
3. Emit `--part questions` + `--part exams`; idempotent re-runs.
4. `npm run content:check` green (practice/exams now backed); full `npm test` green.
5. Spot-check in the dev server: practice-by-domain serves the donor quiz with explanations;
   mock exam serves 60 questions, 120-min timer, 700 pass mark.

## Success Criteria

- [x] `questions/` holds exactly the unique set: 390 files (440 instances; all 50 collapses
      are intra-practice sharing; quiz↔exam overlap is zero — count pinned by Phase 4 parity).
- [x] `exams.json` holds 8 fixed exams with donor durations/pass marks and authored-order ids.
- [x] Zero edits outside `content/gh-600/` and `scripts/`.
- [x] `content:check` + `npm test` green.

## Risk Assessment

- **False dedup merge** (same stem, different options/answer): *signal:* parity test count
  mismatch or a lost question vs donor. *Response:* the key already includes options + answer;
  if a collision still merges distinct donor questions, add explanation to the key.
- **Donor mock divergence** (files 2–5 silently changing): *signal:* stringify-equality
  assertion in the extractor fails the run. *Response:* re-pin; if genuinely distinct exams
  appear, extract them as `gh600-mock-2…` and re-run parity.
- **Id churn across regenerations** breaking progress/SRS keys: deterministic processing
  order + a parity pin on the id list make churn observable; fix by restoring order, never by
  hand-editing ids.
