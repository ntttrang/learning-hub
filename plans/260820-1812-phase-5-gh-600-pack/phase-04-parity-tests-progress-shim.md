---
phase: 4
title: "Parity tests + progress shim"
status: completed
priority: P1
effort: "1d"
dependencies: [3]
---

# Phase 4: Parity tests + progress shim

## Overview

Pin the extraction with a donor-anchored parity test (the roadmap's "keep originals until
parity verified") and migrate the donor's passed-domain progress into the hub once.

## Requirements

- Functional: a vitest suite re-derives expectations from `learn-gh-600/` at test time and
  proves pack equality; a one-time shim turns `gh600sp_html` /
  `gh600sp_captain_corgi_html` `passed` domains into completed hub lessons.
- Non-functional: donor files are read-only inputs; the shim is idempotent behind a
  migrated-flag and never throws on malformed legacy JSON (log + skip, matching
  `migrate-gh-progress.ts` behavior).

## Architecture

**Parity test** — `scripts/gh600-parity.test.ts` (NOT under `src/`: it imports `node:fs` to
read the donor, and `tsconfig.app.json` has no node types, so an `src/` placement fails
`tsc -b`. The Phase-1 vitest include extension already covers `scripts/**`; typechecking
rides `tsconfig.scripts.json`. This is the repo's first test-time donor read — the
`pack-parity.test.ts` precedent is golden literals, not live donor imports; the new
prerequisite is deliberate). Donor reads fail **closed**: if `learn-gh-600/` is missing, the
suite throws with "donor submodule not checked out — run `git submodule update --init`"
(never a skip, never a green pass without parity). It imports the side-effect-free capture +
`node:vm` eval helpers from `scripts/gh600-extract-lib.ts` (created in Phase 1 — never import
the CLI, which would regenerate `content/` before assertions run and neutralize parity).
It compares donor arrays against the emitted JSON directly (`node:fs` + `JSON.parse`) — no
SDK loader needed; graph/mode integrity stays covered by `content:check`.

1. *Questions:* eval each donor `Q` array with the shared helper. For every exam: donor array
   ↔ `exam.questionIds` ↔ emitted question files — stem, option texts in order, correct
   option id, explanation all equal. Assert per-domain counts (mock `10/14/7/10/10/9`; each
   practice 50; quizzes 5×6) and that all six captured mock Q arrays are
   `JSON.stringify`-equal.
2. *Dedup accounting:* `unique questions == dedup(30 + 60 + 7×50 instances)` computed from
   the donor with the same key — and the total pinned as the literal **390** (360 exam
   uniques — all 50 collapses intra-practice — + 30 quiz, quiz↔exam overlap 0), guarding id
   churn in both directions.
3. *Curriculum:* 6 domains with official titles + `{min,max}` weights; 23 lessons with donor
   topic titles; block-kind sequence pinned for one topic per domain (converter regression net).
4. *Labs:* 8 labs; per-lab step counts equal the Phase-3 donor-derived formula
   (`### ` count + 1 context step + 1 for lab-01's anti-patterns); every validation-checklist
   item present in `checks`.
5. *Practice md cross-check:* each `docs/practice-example-N.md` holds exactly 50 questions
   numbered `**N.**` (bold-wrapped — a bare `^\d+\.` pattern matches zero lines in these
   files); additionally pin each file's `## Domain N: … (min–max%)` headers (official titles
   + weights) against `domains.json` — that is the locked provenance for domain metadata.
6. *Integrity invariants* (§8 of the roadmap): every `exam.questionIds` entry resolves; and
   "orphan" means **not referenced by any `exam.questionIds`** (moduleId is on every question
   by construction, so a module-scope disjunct is vacuous) — compute the orphan set and pin
   its count explicitly (expected: the quiz-only questions not served by exams; drift in
   either direction fails).

**Progress shim** — `src/engines/migrate-gh600-progress.ts` mirroring the established pattern:
read both legacy keys (either may hold the newest state — merge `passed` sets), map each passed
domain number `0..5` → set every lesson of `gh600-dN+1` `status: 'completed'` in
`cc-subject-data`, guard with `localStorage['cc-gh600-progress-migrated']`. The `App.tsx`
call goes **inside the existing hydration-gated `run()`** (the `useEffect` keyed on
`persist.hasHydrated()` with `onFinishHydration` fallback, `src/App.tsx:16-25`) — a bare
sibling `useEffect` can run pre-hydration, and the persist merge then overwrites `subjects`
wholesale while the migrated flag is already set: silent, permanent loss. Pure mapping
function exported for tests.

## Related Code Files

- Create: `scripts/gh600-parity.test.ts` (donor-anchored; under `scripts/` for node types)
- Create: `src/engines/migrate-gh600-progress.ts`, `src/engines/migrate-gh600-progress.test.ts`
- Modify: `src/App.tsx` (one call inside the existing hydration-gated `run()` — not a new
  `useEffect`)
- Reuse: `scripts/gh600-extract-lib.ts` capture/eval helpers (created in Phase 1)

## Implementation Steps

1. Write the parity suite incrementally (questions → dedup → curriculum → labs → md
   cross-check → integrity); fix extraction bugs it surfaces, not the assertions.
2. Pin the literals (unique-question count 390, mock-array stringify equality, orphan count,
   block sequences) after the first fully green run.
3. Implement the shim + unit tests (happy path: 3 passed domains; malformed JSON; already
   migrated; empty legacy) plus one ordering regression test proving the call waits for store
   hydration (pre-hydration writes must not be clobbered by the persist merge).
4. Wire the call in `App.tsx` inside the hydration-gated `run()`; full `npm test` green.

## Success Criteria

- [x] Parity suite green and donor-anchored: deleting or editing any emitted question, exam
      id list, lesson, or lab step fails a named assertion; missing donor submodule fails
      closed with the `git submodule update --init` message.
- [x] Unique-question literal (390) and orphan count pinned; id-churn detector active.
- [x] Shim: legacy `passed:[0,2]` → all lessons of d1+d3 completed; re-boot imports nothing;
      malformed keys never throw; ordering test proves hydration-safety.
- [x] `npm test` fully green including the new suites.

## Risk Assessment

- **Eval-in-test flakiness** (donor script format changes): the capture-anchor failure throws
  before evaluation with the file named; stringify pins catch content drift at the parity
  layer. *Response:* update the capture anchor + re-pin — the failure names the file.
- **Donor submodule absent** (fresh clone, CI): the suite fails closed with the init command
  in the message — never a silent skip. Future CI (roadmap Phase 7) must check out submodules.
- **Dedup overlap between quizzes and exams** shifts the unique literal: measured (zero
  overlap) and pinned at 390; a later change fails loudly and diff-review explains why
  (content, not bug, if donor changed).
- **Shim marking too much** (a domain "passed" ≠ every topic read): the donor's own progress
  model is domain-granular — completing the domain's lessons is the closest honest mapping;
  recorded here as the accepted trade-off.
