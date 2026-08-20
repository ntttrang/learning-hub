---
title: "Phase 1 Content SDK Engines"
description: "Implement roadmap Phase 1 of docs/unified-learning-hub-plan.md: the content SDK (types, registries, Zod validation, FileContentSource) and the deduplicated engines, proven by a fixture pack."
status: completed
priority: P1
effort: "3d"
tags: [sdk, engines, content]
created: 2026-08-19
---

# Phase 1 — Content SDK + Engines

## Overview

Execute **roadmap Phase 1** of the unified hub plan (`docs/unified-learning-hub-plan.md` §7):
author the Content SDK (`src/sdk/`), load packs from `content/` through a
`FileContentSource`, port and deduplicate the engines from `learn-dp-800` and
`learn-gh-200`, and prove everything with engine + Zod-validation tests over a
tiny fixture pack loaded from files.

Phase 0 (shell, theming, storage adapter) is complete — see
`plans/260819-2132-phase-0-foundation-shell/` (3/3 phases done). This plan adds
no UI work: renderers created here are functional and unstyled; Phase 2 (Shared
UI) builds the viewers on top.

## Context

- **Authoritative design:** `docs/unified-learning-hub-plan.md` — decisions in
  §2 are locked; schema generalizations in §5; storage/authoring in §5b;
  platform contracts in §8.
- **Schema sources:** `learn-dp-800/src/lib/types.ts` (richest, base) and
  `learn-gh-200/src/content/types.ts` (block union + question union shapes).
- **Engine sources:** dp-800 `src/lib/{srs,streak,scoring,progress,revision,store}.ts`
  and gh-200 `src/utils/{grade,score,sample}.ts`, each with existing tests.
- **Hub baseline:** `src/engines/{storage,store,theme}.ts`, `src/shell/*` from
  Phase 0. The shell is NOT touched by this plan (acceptance: adding a subject
  needs zero core-code edits).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Unified, subject-agnostic schema in `src/sdk/types.ts` covering both source apps' richness | P1 |
| 2 | Zod validation + platform content-integrity contracts (§8) runnable in tests/CI | P1 |
| 3 | `ContentSource` interface + `FileContentSource` loading `content/**/*.{json,mdx}` via Vite glob | P1 |
| 4 | Engines ported and deduplicated to one implementation each, with ported tests | P1 |
| 5 | Block/question/tool registries as the only extension mechanism for content kinds | P1 |
| 6 | Fixture pack under `content/fixture/` proving the whole pipeline from files | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Start: dependencies, loader/zod spikes, layout decisions](./phase-01-start.md) | Completed |
| 2 | [Unified SDK types](./phase-02-sdk-types.md) | Completed |
| 3 | [Zod validation + integrity contracts](./phase-03-zod-validation.md) | Completed |
| 4 | [ContentSource, FileContentSource, fixture pack](./phase-04-content-source-fixture.md) | Completed |
| 5 | [Engines port + subject-data store](./phase-05-engines-port.md) | Completed |
| 6 | [Registries, grading, scoring](./phase-06-registries-grading-scoring.md) | Completed |

Dependency chain: 1 → 2 → 3 → 4 → 5 → 6 (each builds on the previous; 5 and 6
could swap order but grading (6) needs types only, engines (5) need the content
accessors from 4 — keep the listed order).

## Key Decisions (resolved during planning)

| Decision | Choice | Why |
|---|---|---|
| `content/` location | Repo root, not `src/content/` | §5b's loader glob `import.meta.glob('/content/**')` is root-anchored; data stays out of compiled app code. `src/content/registry.ts` stays code-side as the typed aggregator (§4's registry.ts). |
| MDX handling | `.mdx` loaded **raw** (`?raw`) + frontmatter parsed with `gray-matter`; body becomes one `md` block | Content is data, not code (§5b) — no JSX compilation, no `@mdx-js` pipeline; Phase 2's Markdown renderer handles the prose. |
| Answer encoding | `Answer = string[]` everywhere (option ids, ordered ids, `leftIdx::right` tokens, blank strings, line-index strings) | dp-800's persistence-friendly encoding; one grading contract for all kinds; gh-200's index-based answers convert at pack-migration time (Phase 3+). |
| Question kinds | `single \| multi \| order \| matching \| fill \| codeReading \| bug` (locked §5.3) | `ordering→order`, `debugging→bug`, `sqlFill→fill`. |
| Fill grading normalization | One `normalizeBlank`: trim, collapse whitespace, strip wrapping `[]`, case-fold (dp-800 semantics) | Superset of both apps' acceptance; gh-200's case-sensitive fill becomes case-insensitive. Confirmed in Validation Session 1. Exam scoring math (100–1000, pass 700) is identical in both apps and preserved exactly. |
| Grading dispatch | Per-kind graders registered in `sdk/registry/questions.tsx`; `engines/scoring.ts` consumes `gradeQuestion` from the registry | Keeps §4's "render + grade per kind" registry ownership; scoring stays a generic aggregation engine. |
| User-data store | New persisted `useSubjectDataStore` (key `cc-subject-data`) shaped `{ version, streak, subjects: Record<subjectId, …> }`, using Phase 0's `StorageAdapter` | Keeps Phase 0's theme store untouched; per-subject namespacing (§8) is structural. Streak stays hub-level (one learner, one streak). |
| Engines NOT ported now | `search.ts` (Phase 6 roadmap), achievements (Phase 6 roadmap), dp-800 `asset.ts` (Phase 4 pack work), `useProgress` hook (superseded by store selectors, Phase 2) | Roadmap scope; YAGNI. |

## Success Criteria

- [x] `npm test` green: ported engine tests + Zod/integrity tests + fixture-pack load tests all pass against `content/fixture/`.
- [x] `npm run lint` and `npm run build` green.
- [x] Zero edits under `src/shell/` (the SDK is invisible to the shell until Phase 2).
- [x] One implementation each for: grading, scoring, SRS, streak, sampling, progress stats, revision plan.
- [x] Every question kind and every block kind used by the fixture resolves through a registry; unknown kinds produce a typed error.
- [x] All §8 platform contracts enforced by `validateSubject()` with tests.

## Risk Assessment

See each phase file for specifics. Top risks: Zod v4 API drift (spike in Phase
1), `import.meta.glob` raw-MDX behavior under Vitest (spike in Phase 1), and
grading-semantics unification for `fill` (documented superset decision with a
pre-decided fallback).

## Open Questions

None. The fill-grading question was resolved in Validation Session 1 (see
Validation Log); remaining unknowns are Phase 1 spikes (Zod API, glob-under-Vitest),
not open decisions.

## Validation Log

### Session 1 — 2026-08-19
**Trigger:** Post-plan validation gate (user-selected after plan authoring)
**Questions asked:** 4

#### Verification Results
- **Tier:** Full (6 phases, all 4 roles)
- **Claims checked:** 20 sampled (plan was authored from this session's direct file reads, so the citation base is fresh)
- **Verified:** 20 | **Failed:** 0 | **Unverified:** 0

Key evidence: dp-800 store wiring calls `ingestResults` + `bumpStreak` inside
record paths (`learn-dp-800/src/lib/store.ts:141-154`); gh-200 `score.ts`
imports `gradeQuestion` from `grade.ts`; both apps' scaled-score math is
identical (`Math.round(100 + 900·correct/total)`, pass 700); hub has exactly one
persisted key (`cc-hub-store`) plus raw `cc-theme`, and `HubState` holds only
theme — a new `cc-subject-data` store duplicates nothing; all 7 accent tokens
present in `src/styles/tokens.css` (petal-pink ×3); `zod`/`gray-matter` absent
from `package.json`; root `content/` and `src/content/` do not exist yet
(additive creation). The two framing unknowns (glob-under-Vitest, Zod v4 API)
are Phase 1 spikes by design, not claims.

#### Questions & Answers

1. **[Tradeoffs]** Unified `fill` grading: dp-800 case-folds SQL blanks; gh-200 compares case-sensitively. Which normalization becomes the single platform rule?
   - Options: Case-insensitive superset | Case-sensitive + alternatives
   - **Answer:** Case-insensitive superset
   - **Rationale:** One `normalizeBlank` accepts a superset of both apps' correct answers; exam scaling math untouched (locked non-goal).
2. **[Architecture]** How should `.mdx` lesson files be loaded?
   - Options: Raw + frontmatter split | Compiled MDX pipeline
   - **Answer:** Raw + frontmatter split
   - **Rationale:** Keeps content pure data (§5b), static-hostable, trivially Zod-validated; no JSX escape hatch into content.
3. **[Architecture]** Where does per-subject user data live?
   - Options: Separate `cc-subject-data` store | Extend `cc-hub-store`
   - **Answer:** Separate store
   - **Rationale:** Phase 0's theme store and its FOUC-sensitive merge/rehydrate precedence stay untouched; subject data owns its own persist lifecycle.
4. **[Assumptions]** What is the unified learner-answer shape?
   - Options: `string[]` id-based | Index-based (`number | number[] | string[]`)
   - **Answer:** `string[]` id-based
   - **Rationale:** Stable under option reordering; persisted attempts stay valid; gh-200 indexes convert once at pack migration (roadmap Phase 3+).

#### Confirmed Decisions
- Fill grading: case-insensitive `normalizeBlank` superset — single platform rule.
- MDX: `?raw` glob + `gray-matter`; body → one `md` block; no `@mdx-js`.
- Store: new `useSubjectDataStore` at `cc-subject-data`, subjects namespaced by id.
- Answers: `Answer = string[]` everywhere (ids / ordered ids / `leftIdx::right` / blank strings / index strings).

#### Action Items
- [x] Resolve Open Question 1 in `plan.md` (done — section now reads "None").
- [x] Update phase-06 wording from conditional ("if vetoed") to confirmed decision.
- [x] Mark phases 2/5 contract requirements as validation-confirmed.

#### Impact on Phases
- Phase 2: `Answer = string[]` requirement confirmed (marker added).
- Phase 5: separate-store requirement confirmed (marker added).
- Phase 6: fill-grading architecture note updated from open to confirmed.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-sdk-types.md, phase-03-zod-validation.md, phase-04-content-source-fixture.md, phase-05-engines-port.md, phase-06-registries-grading-scoring.md
- Decision deltas checked: 4 (fill normalization, MDX mechanism, store layout, answer encoding)
- Reconciled stale references: 2 ("Open Question 1" pointer in plan.md Key Decisions + phase-06 conditional fallback phrasing)
- Unresolved contradictions: 0

## Out of Scope (this plan)

- Any UI beyond functional unstyled registry renderers (Phase 2).
- Real content packs GH-200/GH-900 (Phase 3), DP-800 (Phase 4), GH-600 (Phase 5).
- localStorage migration shims for legacy app keys (belong to pack phases).
- CI workflows (Phase 7) — but `npm run content:check` lands here as the hook CI will call.
