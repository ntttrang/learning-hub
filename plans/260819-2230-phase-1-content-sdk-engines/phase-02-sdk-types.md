---
title: "Phase 2: SDK Types"
status: completed
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: SDK Types

## Overview

Author `src/sdk/types.ts` — the unified, subject-agnostic schema that generalizes
`learn-dp-800/src/lib/types.ts` with `learn-gh-200/src/content/types.ts` per the
locked §5 decisions. Pure TypeScript, no runtime, no imports from either legacy
app. Every later phase and every pack compiles against this file.

## Requirements

- [x] `Subject` entity: `{ id, code, title, subtitle?, description?, accent: AccentToken, disclaimers?, enabledModes: ToolId[] }`.
- [x] `AccentToken` union of the 7 locked brand tokens: `sky-cyan | hub-green | corgi-orange | hub-coral | petal-pink | deep-teal | captain-red` (all verified present in `src/styles/tokens.css`).
- [x] `Domain` merges both shapes: `{ id, order, code?, title, weight? (string or {min,max}), summary?, moduleIds? }` — dp-800's `order/code/weight` + gh-200's `weightMin/weightMax` collapse into one field.
- [x] `Module` (dp-800) absorbs gh-200's `SubSkill`: `{ id, domainId, order, title, summary?, officialSkills?, docIds?, lessonIds }`.
- [x] `Lesson`: `{ id, domainId, moduleId?, order?, slug?, title, summary?, minutes, difficulty?, blocks: Block[] , labId?, questionIds[], references?, docIds? }` — **ordered blocks replace dp-800's fixed 18 named sections** (§5.1).
- [x] `Block` discriminated union on `kind` with core kinds: `md {body}`, `heading {text, level?}`, `list {items, ordered?}`, `code {language, code}`, `tip {text}`, `table {headers, rows}` — gh-200's six kinds plus a whole-prose `md` kind. The union stays **open**: `kind: string` extension point resolved through the block registry (dp-800's specialized sections become registered kinds in Phase 4, not schema deletions).
- [x] `Question` union on `kind: single | multi | order | matching | fill | codeReading | bug` (§5.3) with base `{ id, domainId, moduleId?, lessonId?, difficulty?, prompt, code?, explanation, tags?, docIds? }` and per-kind payloads using **id-based options** (`options: {id, text}[]`) and `Answer = string[]` *(confirmed, Validation Session 1)*:
  - `single/codeReading`: `correct: optionId`
  - `multi`: `correct: optionId[]`
  - `order`: `correct: optionId[]` (serving order)
  - `matching`: `pairs: {left, right}[]` (answered as `leftIndex::right` tokens)
  - `fill`: `template` containing `___` blanks + `blanks: {answer, alternatives?[]}[]`
  - `bug`: `codeLines: string[]` + `buggyLineIndex` (answered as the index as string)
- [x] `Lab` unified: gh-200 core (`{id, domainId, lessonId?, title, minutes, summary, outcomes?, checks?}`) + steps as `LabStep {title?, instructions, hint?, solution?, expectedOutput?, validation?}` + dp-800's optional rich fields (`scenario?, objective?, prerequisites?, engines?, schemaSql?, seedSql?, engineNotes?, solutionExplanation?`) as plain optional JSON — Zod validates them, renderers arrive in Phase 2/4.
- [x] `Exam`: `{ id, title, description?, durationMinutes, passingScore? (default 700), caseStudies?[] }` + `selection: {kind:'fixed', questionIds} | {kind:'sampled', domainPlan: Record<domainId, number>, seed, excludeExamIds?}` — unifies dp-800's fixed `questionIds` exams with gh-200's seeded `domainPlan` exams.
- [x] `Comparison` generic N-column (§5.2): `{ id, title, description?, columns: {id, label}[], rows: {aspect, cells: Record<columnId, string>}[], samples?[], migration? }` — dp-800's 4-engine matrix and gh-200's 2-column tables both fit; `samples/migration` optional for Phase 4.
- [x] `DocRef` citation registry type: `Record<docId, {title, url, publisher?, accessed?}>` (unifies gh-200's DOCS registry and dp-800's inline `SourceReference`).
- [x] User-data types ported from dp-800 (`LessonProgress`, `QuizAttempt`, `ExamAttempt`, `SrsCard`, `Note`, `StreakState`) with the **namespacing contract documented**: they live under `subjects[subjectId]` in the store, keys can never collide across subjects.
- [x] No imports from `learn-*` directories; the file compiles standalone.

## Architecture

Types are the contract; Zod schemas (Phase 3) mirror them and a type-level
assertion (`z.infer` equals the declared interface) keeps the pair honest. The
`Block`/`Question` unions are closed in TypeScript for core kinds but the
registries accept additional `kind` strings at runtime — packs from Phase 4+
extend via registration, never by editing this file. Read both source files
before writing: `learn-dp-800/src/lib/types.ts` (287 lines) and
`learn-gh-200/src/content/types.ts` (141 lines); keep dp-800 field names
wherever they win (they become the persistence-facing vocabulary).

## Related Code Files

- Create: `src/sdk/types.ts`
- Read (reference only): `learn-dp-800/src/lib/types.ts`, `learn-gh-200/src/content/types.ts`, `src/styles/tokens.css`, `src/shell/subjects.ts` (accent precedent)

## Implementation Steps

1. Copy dp-800's user-data types verbatim as the base.
2. Author content entities top-down: Subject → Domain → Module → Lesson/Block → Lab → Question union → Exam → Comparison → DocRef.
3. Apply the three §5 generalizations (blocks, generic comparison, unified question kinds) plus the answer-encoding decision from plan.md.
4. Export an `AccentToken` const-array + type pair so Zod (Phase 3) and the shell's `SubjectAccent` can converge later.
5. `npx tsc -b` green; grep confirms no `learn-` imports under `src/sdk/`.

## Todo

- [x] Author `src/sdk/types.ts`
- [x] Typecheck green
- [x] Cross-check every dp-800 field and gh-200 field is either present, mapped, or explicitly listed as dropped (record drops as comments in the phase file)

## Field-Mapping Audit (post-implementation)

Mapped 1:1 unless noted. **Dropped as derivable:** `Domain.moduleIds` (from
`Module.domainId`), `Module.lessonIds` (from `Lesson.moduleId`),
`ExamConfig.totalQuestions` (sum of `domainPlan`), dp-800 `content.ts` id-index
(becomes `ContentSource` accessors, Phase 4). **Deferred by roadmap:**
`Achievement` (Phase 6), `RevisionRecommendation` (engine-local),
`SourceKind`/`ContentBlock`/`learningObjectives`/`keyTerms`/`visualExplanation`
(Phase 4 registered block kinds), `ENGINE_LABELS` (Phase 4 pack data).
**Renamed:** `estimatedMinutes`→`minutes`, `type`→`kind`, `ordering`→`order`,
`debugging`→`bug`, `sqlFill`→`fill`, `stem`→`prompt`, `subSkillId`→`moduleId`,
`weightMin/Max`→`weight{min,max}`, gh-200 `p` block→`md`, string lab steps→
`LabStep{instructions}`, `answerIndex/answerIndexes`→id-based `correct` (Phase 3+
pack conversion), `codeTemplate`→`template`, `blankAliases`→`blanks.alternatives`.
**Late additions from audit:** `Lesson.flagship?`, `LabStep.starterSql?`.

## Success Criteria

- [x] `tsc -b` passes with the new file integrated into the build.
- [x] Both source models are representable: for dp-800 and gh-200, every entity maps to a unified type without lossy coercion of fields Phase 3–5 will migrate.

## Risk Assessment

- **Schema drift from legacy apps** (missed field discovered mid-migration in Phase 3/4): signal = migration step needs a field the SDK lacks; response = add an optional field then — the open-union/optional-fields design makes that additive, not structural.
- **Over-modeling**: guard is the locked decision set; if a field serves no pack, leave it out and note it (YAGNI — `search.ts`, achievements, `asset.ts` are already excluded).
