---
phase: 4
title: "Parity and integrity tests"
status: completed
priority: P1
effort: 0.5d
dependencies: [3]
---

# Phase 4: Parity and integrity tests

## Overview

Prove DP-800 parity the way phase 3 proved the gh packs: extend
`src/content/pack-parity.test.ts` — scoping its three shared loops gh-only
(`GH_PACK_IDS`) and adding the dp-800 section (inventory + pool counts,
fixed-paper id-order snapshots, sideBySide payload identity, flagship coverage
+ block-order pin, comparison column-label pin, lab-coding hygiene ports) —
and add one behavior-named render smoke file for the dp-800 surfaces,
led by a real-lesson LessonViewer render that pins the extractor↔renderer
payload contract (practice incl. module-scope drill path, compare matrix with
samples + migration, fixed exams with the case study, rich labs with reveal
toggles). Contracts the hub validator already enforces
(`validateSubject` via content:check) are listed as inherent and deliberately
NOT re-tested — the phase-3 red-team precedent (finding G) that keeps this file
about cross-repo parity, not schema re-assertion. No test name mentions plans
or phase numbers.

## Requirements

### Functional

- Extend `src/content/pack-parity.test.ts` — a **restructure, not an additive
  append**: introduce a `GH_PACK_IDS` constant (or equivalent per-loop filter)
  so the three shared `for (const packId of PACK_IDS)` loops stay gh-scoped —
  the golden-papers loop (`GOLDEN_IDS` keys are gh exam ids and the loop
  hardcodes `endsWith('-mock-a')` with a non-null assertion at
  `pack-parity.test.ts:87,91-93`, which TypeErrors on dp-800's `mock-1`), the
  doc-links loop (asserts `links > 0` at `:220` — dp-800 has no docs.json, so
  the scan yields 0), and the domain-20-questions loop (DP-800 domains are
  uneven by design: 41/40/23). dp-800 assertions live in their own section;
  gh assertions are semantically unchanged (loop scoping edited, expectations
  identical). The dp-800 section carries:
  - **Inventory counts**: domains 3, modules 11, lessons 43, questions 179,
    labs 3, exams 2, comparisons 4 (docs: none — dp-800 sits outside the
    gh-scoped doc-links loop by construction).
  - **Pool counts**: knowledge-check bank 41 (d1) + 40 (d2) + 23 (d3) = 104,
    and each of the 104 ids is referenced by exactly one lesson's
    `questionIds`; exam1 pool 15 (10 `q-ex1-*` standalone + 5 `q-cs1-*` case);
    lab-coding 60 (every one tagged `lab-coding`, grouped 11 module-sets by
    `lab-NN` tag).
  - **Fixed-paper snapshots**: mock-1's 50 ids and mock-2's 30 ids in exact
    authored order (pins, never recomputed) compared against
    `assemblePaper(content, exam).map(q => q.id)`. No 50-id literal exists in
    the donor — mock-1's pin is `EXAM1_STANDALONE` (45 ids, `exams.ts:8-23`)
    concatenated with `EXAM1_CASE` (5 ids, `:25`) in the `:47` spread order;
    mock-2's pin is the `EXAM2` array verbatim.
  - **sideBySide identity**: for each lesson carrying a `sideBySide` block
    (exactly 4), `block.comparison` deep-equals the `comparisons.json` entry
    with the same id (decision 3).
  - **Flagship coverage**: ≥1 `flagship: true` lesson per domain; exact donor
    set l0103, l0503, l1002 pinned (l0403's explicit false stays false).
  - **Block-order pin**: a flagship lesson's emitted `blocks` kind sequence
    matches the donor section order (decision 2 — learningObjectives first,
    donor `LessonViewer.tsx:123`); pin l0103's full kind sequence verbatim.
    Counts and identity tests cannot see an order regression; this can.
  - **Comparison label pin**: every `comparisons.json` column label equals
    `engineLabel(column.id)` (decision 6 — the labels live in the module AND
    baked into generated JSON; this assertion is the drift gate between them).
  - **Lab-coding hygiene ports** (from donor `content.test.ts:136-165`),
    scanning prompt + options text + code + explanation of the 60 tagged
    questions: options exactly ids a/b/c/d (4 options); difficulty ∈
    {advanced, challenge}; ≥1 multi per module-set; prompt length > 120 chars;
    no Microsoft lab identifiers `EcommerceDB`, `AdventureWorksLT`,
    `AddOrderLineItem`, `SecurityLabDB` anywhere in the scanned text.
  - **Inherent (documented in a comment block, not asserted)**: id resolution,
    self-gradeability, case ids ⊆ exam ids (`validate.ts:450-462`), ≥2
    knowledge-check questions per lesson, mode-content backing, exam
    feasibility — all owned by `content:check`.
  - The gh sections keep passing untouched (PACK_IDS is additive; the
    "every domain carries exactly 20 questions" loop stays gh-only — DP-800
    domains are uneven by design: 41/40/23).
- New `src/content/dp-800-modes.test.tsx` (jsdom + RTL; name = behavior):
  - `PracticeIndex` with dp-800 content renders the 179-question lead and
    domain cards; `index.questionsForModule('m01')` is non-empty and every
    module m01–m11 resolves questions (the lab-coding drill path, decision 9).
  - `Compare` with dp-800 content: 4-entry picker; a detail view renders the
    4 engine columns, sample tabs, and all 6 migration cards.
  - `ExamEngine` (or the narrowest existing entry point per
    `ExamEngine.test.tsx` conventions) on mock-1: fixed 50-question paper,
    case-study panel visible for a `q-cs1-*` question.
  - `LabViewer` on a dp-800 rich lab (lab-rls): scenario/objective/prereqs,
    schema + seed code, 4 steps, "Show hint" and "Reveal solution" toggles
    disclose content, engineNotes with pretty labels, solutionExplanation.
- `LessonViewer` on l0103 — **the extractor↔renderer payload contract** and
  the only automated gate that renders a real dp-800 lesson (Zod is
  payload-blind for extension kinds, `validate.ts:116-125`, and the coverage
  gate resolves kind strings only, `coverage.ts:17-33` — nothing else would
  catch a one-word field-name slip between extractor and renderer): side-effect
  import the renderers module, render the lesson, assert each section title
  ("Learning objectives", "Overview", "Key terminology", "Official Microsoft
  concepts", the figure caption, the sideBySide table header) plus one content
  probe per extension kind. Mermaid itself stays mocked here (phase 2 owns the
  library tests; real SVG is the phase-6 visual check).

### Non-functional

- Parity assertions read the pack through `contentSource.loadSubject('dp-800')`
  exactly like the gh sections — no test-local file parsing.
- Smoke tests assert presence/content, not styling (no snapshot churn).
- Suite runtime stays modest: reuse loaded content across the file (load once,
  assert many — the existing parity pattern).

## Architecture

```
src/content/pack-parity.test.ts   (extend; GH_PACK_IDS scoping + dp-800 section)
  └─ dp-800: counts → pools → fixed papers → sideBySide identity → flagship →
     block order → column labels → hygiene
src/content/dp-800-modes.test.tsx (new; jsdom)
  └─ LessonViewer(l0103, payload contract) · PracticeIndex/module-scope · Compare ·
     ExamEngine(case study) · LabViewer(reveals)
gates: npm test · npm run content:check
```

## Related Code Files

### Create

- `src/content/dp-800-modes.test.tsx`

### Modify

- `src/content/pack-parity.test.ts` — dp-800 PACK_IDS entry + section
  (incl. the two verbatim snapshot arrays, ~80 ids total)

### Delete

- (none)

## Implementation Steps

1. Scope the three shared parity loops to `GH_PACK_IDS` first (golden-papers,
   doc-links, domain-20) and run the gh sections — they must stay green with
   identical expectations before any dp-800 assertion exists.
2. Copy mock-1/mock-2 id arrays verbatim from donor `exams.ts` into the test
   as `DP800_GOLDEN_IDS` (pins; never recompute from the pack — mock-1 is the
   `EXAM1_STANDALONE` ++ `EXAM1_CASE` concatenation per `exams.ts:47`).
3. Add the dp-800 parity section per the requirements list; run it — counts
   failures mean an extractor bug (phase 3), fix there, never in the pins.
4. Write the modes smoke file, LessonViewer payload-contract test first;
   bootstrap content via `contentSource.loadSubject('dp-800')` and mirror the
   render-setup conventions of `src/ui/PracticeIndex.test.tsx` /
   `LabViewer.test.tsx`.
5. Gates: `npm test` (full), `npm run content:check`, `npm run lint`.

## Success Criteria

- [x] Inventory assertion passes: 3/11/43/179/3/2/4; pools 104 (each referenced
      exactly once) + 15 (10 + 5) + 60 (11 sets)
- [x] mock-1 (50) and mock-2 (30) paper ids match the verbatim donor snapshots
      in order
- [x] sideBySide payload === comparisons entry for all 4; flagship set is
      exactly {l0103, l0503, l1002}; l0103 block kind sequence matches the
      pinned donor order; every comparison column label === `engineLabel(id)`;
      lab-coding hygiene green incl. the
      Microsoft-identifier scan over prompts/options/code/explanations
- [x] Modes smokes green: LessonViewer renders l0103 with all section titles
      + one probe per extension kind (payload contract), module-scope drill
      resolution m01–m11, compare columns/tabs/migration, case-study panel,
      lab reveal toggles
- [x] gh parity assertions semantically unchanged (GH_PACK_IDS-scoped loops)
      and green; `npm test` / `npm run content:check` / `npm run lint` green

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| Count/paper pins disagree with the emitted pack | dp-800 parity test red after phase 3 | The pin is the donor source by definition — fix the extractor transform; only if donor source itself changed (re-grep `exams.ts`, `q({ id:`) do the pins move, and then only via a deliberate plan edit |
| sideBySide identity fails (extractor built the two objects divergently) | identity assertion red | Fix the extractor to emit from the single transformed object twice — never relax the test to deep-subset |
| Hygiene scan hits a false positive (e.g. "AdventureWorksLT" inside an innocent explanation) | hygiene test red | The identifier list is the donor's own contract (`content.test.ts:136-143`); donor content passes it today, so a hit means extraction introduced the string — fix the transform, do not add exceptions |
| ExamEngine smoke is flaky (timers, routing mocks) | intermittent red in CI | Follow the existing `ExamEngine.test.tsx` setup verbatim (untimed sitting); if still flaky, narrow to the intro + case-panel assertions and leave the full sitting to phase 6 manual |
| Modes smoke grows into a duplicate of per-component tests | review smell | One render + presence assertions per surface only; generic behavior stays covered by the fixture-based component tests |
