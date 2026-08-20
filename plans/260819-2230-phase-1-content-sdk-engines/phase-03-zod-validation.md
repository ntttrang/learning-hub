---
title: "Phase 3: Zod Validation"
status: completed
priority: P1
effort: "4h"
dependencies: [2]
---

# Phase 3: Zod Validation

## Overview

Author `src/sdk/validate.ts`: Zod schemas mirroring `sdk/types.ts` plus
`validateSubject()` — the pure function enforcing the §8 platform
content-integrity contracts. This replaces the compile-time safety content lost
when it moved out of `.ts` files, and becomes the hook CI calls (Phase 7).

## Requirements

- [x] Zod schema per file type: `SubjectSchema` (subject.json), `LessonFrontmatterSchema` (mdx frontmatter), `QuestionSchema` (discriminated union on `kind`), `LabSchema`, `ExamSchema` (union on `selection.kind`), `ComparisonSchema`, `DocsSchema`.
- [x] Type/schema agreement test: `z.infer<typeof XSchema>` equals the `types.ts` interface for every entity (compile-time `Expect<Equal<…>>` helper).
- [x] `validateSubject(content: SubjectContent): ValidationIssue[]` where `ValidationIssue = { code, path, message }` — issues, not throws, so one run reports everything.
- [x] §8 contracts enforced:
  - every referenced lesson/question/lab/exam/compare/doc id resolves;
  - each question is answerable with its own key (per-kind structural rules — see Architecture);
  - each subject exposes only modes it has content for (`enabledModes` ⊆ tools with backing content);
  - ids unique within each entity collection and across entity kinds.
- [x] Exam feasibility check: sampled exams' `domainPlan` counts ≤ available pool per domain; fixed exams' `questionIds` all resolve and belong to the subject.
- [x] `fill` placeholder/count check: number of `___` in `template` equals `blanks.length`.
- [x] `npm run content:check` script wired to run validation over every installed pack (fixture only for now) — the same entry CI will call.
- [x] Unit tests: valid fixture-shaped objects pass; each contract has a test that trips it (dangling id, empty options, mismatched blanks, unknown mode…).

## Architecture

Two layers, both pure:
1. **Shape** — Zod parses each file (the discriminated unions carry the
   per-kind refinements Zod can express natively).
2. **Graph** — `validateSubject` runs cross-reference checks over the parsed
   whole. "Answerable with its own key" per kind (promoted from dp-800's
   `content.test.ts` "each question is answerable" and gh-200's
   `questions.test.ts` shape checks, made generic):
   - `single/codeReading`: ≥2 options, `correct` ∈ option ids, has `code` for `codeReading`;
   - `multi`: ≥2 correct ids, all ∈ options, ≥1 distractor;
   - `order`: `correct` is a permutation of all option ids, no duplicates;
   - `matching`: ≥2 pairs, lefts unique;
   - `fill`: blanks non-empty, count matches template;
   - `bug`: `0 ≤ buggyLineIndex < codeLines.length`.

Pack-specific tests (question-bank counts, kind mixes, per-domain drills from
the legacy apps) intentionally stay OUT — they migrate with the packs
(Phases 3–5 of the roadmap), not into the platform.

## Related Code Files

- Create: `src/sdk/validate.ts`, `src/sdk/validate.test.ts`
- Modify: `package.json` (add `content:check` script)
- Read (port references): `learn-dp-800/src/content/content.test.ts`, `learn-gh-200/src/content/content.test.ts`, `learn-gh-200/src/content/questions/questions.test.ts`

## Implementation Steps

1. Write schemas bottom-up (options → question union → lesson → lab → exam → comparison → subject), reusing the Phase 1 spike's verified zod idioms.
2. Add the `Expect<Equal<…>>` agreement tests.
3. Implement `validateSubject` contract by contract, one commit each.
4. Wire `content:check` (imports the registry's `loadAll()` once Phase 4 exists; until then it validates inline fixture objects from tests — swap the entry point in Phase 4).
5. Port/re-home the generic integrity assertions from the two legacy test files, deleting app-specific count/mix checks from the port set.

## Todo

- [x] Schemas + agreement tests
- [x] `validateSubject` + per-contract tests
- [x] `content:check` script

## Success Criteria

- [x] `npm test` green; `npm run content:check` exits 0 on valid data and non-zero with issue output on each seeded fault.
- [x] Every §8 contract has a failing-case test proving it can trip.

## Risk Assessment

- **Zod error ergonomics** (messages unusable for authors): signal = test assertions on `message` strings get brittle; response = assert on `code`/`path`, keep messages human but untested verbatim.
- **Registry-coupled checks** (unknown block kind can't be validated here because registries are Phase 6): pre-decided split — `validateSubject` checks ids/shape/graph only; `assertKindsRegistered()` lands in Phase 6 and both run under `content:check`.
