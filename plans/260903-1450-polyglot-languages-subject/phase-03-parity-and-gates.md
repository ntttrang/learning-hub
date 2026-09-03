---
phase: 3
title: "Parity + quality gates"
status: completed
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Parity + quality gates

## Overview

Prove the extraction preserved the donor content — counts and verbatim bodies —
with a donor-backed parity suite, then run the full repo gate so CI can't
disagree later.

## Requirements

- Functional: a parity test reads `learn-polyglot/data/**` and `content/languages/` and fails if any entity is missing, duplicated, or mutated in meaning.
- Non-functional: parity failures name the donor path + id that broke, not just an assertion error.

## Architecture

Modeled on `scripts/gh600-parity.test.ts` (391 lines, donor-backed parity for
the GH-600 pack): the test imports donor JSON directly from `learn-polyglot/data/`
and walks the pack. Unlike the dp-800 extractor's "one-shot by decision" (no
drift gate), polyglot gets a parity gate because the donor is vendored and
static — the test is cheap and permanent.

## Related Code Files

- Create: `scripts/polyglot-parity.test.ts`
- Modify: nothing else — CI already runs `npm test` over `scripts/`

## Implementation Steps

1. **Count parity** — per language and per section: donor lessons/labs/practice
   problems/quiz questions/compare topics vs pack lessons/labs/questions/
   comparisons, including remap bookkeeping (each `coding` quiz question
   surfaces as a lab whose id contains its donor id).
2. **Id bijection** — every donor id appears exactly once in the pack, and
   every pack id (except authored domains/modules/exam) is the image of
   exactly one donor id **under the shared helper function imported from
   `polyglot-extract-lib.ts`** (finding 11: a prefix-string rule can't see
   through derivations; the function can).
3. **Body fidelity** — verbatim comparison for meaning-bearing text: lesson
   body, question prompt/explanation, lab goal/steps/solution/expectedOutput,
   comparison summary/snippet, framework tagline/overview. The only allowed
   differences are the Phase 2 marked derivations (summary = goal/prompt,
   plain-text `Predicted output: ___` tail, ordered-list wrapper around lab
   steps, self-check `checks` lines, `_____`→`___` marker collapse, blank
   replication on the two-marker fill, inline lab doc links + notes). The
   assertion is "matches verbatim or matches the extractor's own derivation
   output" — never free-text similarity.
4. **Derivations from one source:** the parity test imports the derivation
   helpers from `scripts/polyglot-extract-lib.ts` — never the entry script
   (finding 5: the entry executes the extraction; the lib is side-effect-free).
   Tag/note drops are asserted as counts (`donorCount === droppedCount`), so
   the fidelity test sees them too.
4b. **Bundle-size gate** (finding 7): record the `vite build` entry-chunk bytes
   before and after the pack lands; commit both numbers in the phase journal
   as the accepted delta (~0.5 MB JSON — the glob is `eager: true`; lazy
   loading is out of scope for this plan).
5. **Grader-delta probe:** a small test verifies — by calling the hub's real
   fill grader on migrated questions — that the hub grader (`normalizeBlank`)
   accepts everything polyglot accepted (finding 14: the hub is the **looser
   superset**, so the assertion direction is "every donor-correct answer still
   grades correct", including the 12 multiline output answers, whose newlines
   collapse to single-line-typable form) — documenting the delta with a test
   instead of a claim.
6. **Manual smoke (dev server, restarted):** home rail card (expect the
   accent+code fallback artwork — `HubHome` hardcodes badge art to the four
   known subjects; cosmetic, owned by the pending UI-redesign plan); learn →
   lesson renders md + code blocks; labs render starter/solution/expected
   output; practice shuffles + grades all four question kinds; a sampled exam
   runs end-to-end; compare renders 4-column tables + snippets; notes/revision
   tools present.
7. Full local gate: `npm run lint && npm test && npm run content:check && npm run build`;
   PR → CI green → merge to main → Pages deploy → confirm
   https://ntttrang.github.io/learning-hub/ shows Languages.

## Success Criteria

- [x] Parity suite green: counts, id bijection, body fidelity (verbatim-or-derived) all hold
- [x] Grader-delta probe passes — hub fill grader accepts trim-exact answers on migrated output questions
- [ ] Full gate green locally; CI green + Languages live on GitHub Pages after merge (pending — bundle delta recorded: 2,249,590 → 2,852,035 entry-chunk bytes, +602 KB accepted)

## Risk Assessment

Risk: parity churn — whitelist maintenance dominating the diff. **Signal:**
repeated parity failures that are derivation-bookkeeping noise, not real drift.
**Response:** derivations live only in the extractor module (Phase 3 imports
them; the parity test asserts against the extractor's own functions), so a
derivation change can never desync the two files.
