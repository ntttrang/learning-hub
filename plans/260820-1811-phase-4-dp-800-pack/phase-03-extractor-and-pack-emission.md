---
phase: 3
title: "Extractor and pack emission"
status: completed
priority: P1
effort: 1d
dependencies: [2]
---

# Phase 3: Extractor and pack emission

## Overview

`scripts/extract-dp800-pack.ts` (+ `npm run content:extract-dp800`) — a one-off
tsx script mirroring `scripts/extract-gh-packs.ts`: imports the donor's typed TS
modules read-only, transforms them into hub-schema JSON, and writes the complete
pack — 228 files under `content/dp-800/` (subject.json + 5 root arrays + 43
lesson files + 179 question files; the planning session's "229" was an
off-by-one) — plus the donor `docker/` environment under
`public/dp-800/docker/`: 8 files copied verbatim (binary-safe) and 1 authored
safety README (validation session 1). Deterministic output
(2-space JSON + trailing newline, pinned orderings); the script is the
provenance record, re-run manually, no drift gate (phase-3 house decision). The
renderer kinds from phase 2 and the coverage-gate import from phase 1 make
`content:check` pass the moment the pack lands. Donor `learn-dp-800/` is
strictly read-only.

## Requirements

### Functional

- Donor imports (read-only, under tsx — **deep per-file, NOT via
  `src/lib/content.ts`**): the aggregator's value-level `@/` alias imports do
  not resolve under tsx from the hub (empirically verified:
  `Error: Cannot find module '@/content/curriculum'`; donor
  `src/lib/content.ts:1-8` imports everything through `@/`), while the deep
  modules are relative-or-type-only and import clean:
  `src/content/curriculum.ts` (DOMAINS, MODULES, EXAM_META),
  `src/content/lessons/domain1.ts` / `domain2.ts` / `domain3.ts`
  (DOMAIN{1,2,3}_LESSONS — LESSON_SEQUENCE is recomputed from DOMAINS/MODULES
  order, as the donor derives it), `src/content/questions.ts` (QUESTIONS bank —
  all 179), `src/content/labs.ts` (LABS), `src/content/exams.ts` (MOCK_EXAMS),
  `src/content/questions/lab-coding/index.ts` (LAB_CODING_SETS — read only to
  cross-check set↔module alignment; sets are NOT emitted, locked decision 9).
- Startup assertion: subject id `dp-800` === directory basename (gh precedent,
  `extract-gh-packs.ts:71-75`); all 7 extension kind ids assert absent from the
  core-kind list before writing.
- `subject.json` pinned in the script, verbatim from locked decision 8:
  `{id:'dp-800', code:'DP-800', title:'Developing AI-Enabled Database Solutions',
  subtitle:'SQL AI Developer · 3 domains', description:` hub placeholder text
  (copy from donor EXAM_META-derived placeholder), `accent:'sky-cyan',
  disclaimers:[` credential line, `'Skills outline as of March 12, 2026'`,
  platforms line `]`, `enabledModes:['learn','labs','practice','exams','compare','notes','revision']}`.
  No `docs.json`.
- **Domains** (3): `{id, order, code, title, weight: <donor string verbatim
  ("35-40%" etc.), summary}` — donor accent css-var dropped (hub accent lives on
  Subject); moduleIds dropped (membership from Lesson.moduleId).
- **Modules** (11): `{id, domainId, order, title, summary?, officialSkills:
  <verbatim bullets>}` — donor lessonIds dropped; order from donor field with
  array-position fallback.
- **Lessons** (43 files, `lessons/<id>.json`): direct fields
  `{id, domainId, moduleId, order, slug, title, summary, minutes:
  <estimatedMinutes>, difficulty, flagship, labId?, questionIds:
  <knowledgeCheck.questionIds>, references: <donor SourceReference[] verbatim
  → hub Reference>}`; `blocks` from sections in the donor viewer's fixed order
  (`learn-dp-800/src/components/LessonViewer.tsx:120-306`):

| # | donor section (count) | emitted blocks |
| --- | --- | --- |
| 1 | learningObjectives (43) | `{kind:'objectives', items}` |
| 2 | overview (43) | `{kind:'heading', text:'Overview', level:2}` + `{kind:'md', body}` |
| 3 | keyTerms (43) | `{kind:'keyTerms', terms}` |
| 4 | officialConcepts (43) | `{kind:'heading', text:'Official Microsoft concepts', level:2}` + one `{kind:'sourced', source, heading?, body}` per ContentBlock |
| 5 | visualExplanation (5) | `{kind:'figure', caption, mermaid?}` (5 mermaid, 0 image) |
| 6 | sqlServerImplementation (3) | heading `'Microsoft SQL implementation'` + sourced blocks |
| 7 | postgresComparison (3) + mysqlComparison (3) + oracleComparison (3) | ONE heading `'Cross-database comparison'` then sourced blocks of the three arrays concatenated postgres→mysql→oracle (donor renders them under a single section, `LessonViewer.tsx:178-185`) |
| 8 | sideBySide (4) | `{kind:'sideBySide', comparison: <transformed Comparison>}` — the SAME object also lands in comparisons.json (decision 3) |
| 9 | realWorldScenario (7) | heading `'Real-world scenario'` + sourced blocks |
| 10 | commonMistakes (16) | `{kind:'mistakes', items:[{mistake,fix}]}` |
| 11 | performanceSecurity (11) | heading `'Performance & security considerations'` + sourced blocks |
| 12 | examTips (43) | `{kind:'examTips', tips}` |
| 13 | summary (43) | `{kind:'heading', text:'Summary', level:2}` + `{kind:'md', body}` |

  ContentBlock `{kind: official|explanation|recommendation|examTip, heading?,
  body}` maps its kind to `source` verbatim. Donor `s.overview`/`s.summary` are
  plain md strings.

  Emission guards (phase-2 review hand-offs): the block renderers trust these
  payloads blindly — `payloadOf` in `src/content/dp-800/renderers.tsx` is a
  type-level crossing and Zod's open extension union enforces no fields — so
  the extractor is the sole field guarantor; every emitted block carries its
  full field set. Empty arrays (objectives, keyTerms, mistakes, examTips) emit
  NO block: the renderers draw the section title unconditionally while the
  donor gates on `length > 0` (`LessonViewer.tsx:140`), so an empty payload
  would render a titled empty section.
- **Questions** (179 files, `questions/<id>.json`): base `{id, domainId,
  moduleId, lessonId, difficulty, prompt, explanation, tags?}` (tags verbatim —
  the 60 lab-coding carry `["lab-coding","lab-NN"]`). Options
  `[["a","text"],…]` → `[{id:'a',text:'text'},…]` (donor ids verbatim). Kind
  map (locked decision 1; rule re-verified against the donor at implementation
  time, 2026-08-21): the hub kind derives from `code` PRESENCE for every
  one-correct option question, not from the donor type name — the hub
  `codeReading` schema requires `code` (min 1), while 16 donor-typed
  `codeReading` and 3 donor-typed `debugging` questions carry no snippet at
  all (authoring variance: q-lab04-2 is typed codeReading yet is a plain
  scenario question). Runtime `question.code` is the authority; text greps for
  `code:` overcount (they match "error code:" inside prompt prose), so the
  exact with-code total is whatever the dry-run echoes (dry-run 2026-08-21:
  single 129, codeReading 32, multi 17, order 1 — the planning-session "33
  with code" was one such grep artifact; 32 is the runtime truth).

| donor shape (count) | hub kind | correct transform |
| --- | --- | --- |
| any one-correct option type (single/codeReading/debugging) WITHOUT `code` (129) | `single` | `correct[0]` → `correct: string` |
| any one-correct option type WITH `code` (32) | `codeReading` | `code` verbatim; `correct[0]` → `correct: string` |
| multi (17) | `multi` | id set verbatim |
| ordering (1: q-l1101-3) | `order` | ordered id array verbatim |
| matching (0) | `matching` | pairs verbatim — 0 authored items, no extractor branch (validation session 1) |
| sqlFill (0) | `fill` | not implemented — 0 authored items, no branch and no synthetic fixture (validation session 1); if a donor sqlFill ever appears, add the `____`→`___` template + blanks mapping then (~5 lines) |

  The with/without-code branch is real, not theoretical — both sides occur.
- **Labs** (3, `labs.json`): donor fields verbatim — `{id, domainId, lessonId,
  title, summary, minutes: <estimatedMinutes>, difficulty, scenario, objective,
  prerequisites, engines, schemaSql, seedSql, steps:[{title, instructions,
  starterSql?, hint?, solution?, expectedOutput?, validation?}], engineNotes,
  solutionExplanation}` — `summary` has no donor counterpart (the donor Lab
  type carries none and its lab page opens straight into "Scenario &
  objective"); the hub schema requires it, so it is copied verbatim from
  `objective`, the donor's one-line purpose (implementation-time decision,
  2026-08-21). Hub optional `outcomes`/`checks` omitted (donor has
  none); all rich fields present on all 3 labs; 12 steps total. One documented
  verbatim exception (validation session 1): the "(see the Setup page)" string
  inside `prerequisites` (`labs.ts:17`) is amended during extraction to point at
  the bundled `public/dp-800/docker/` environment.
- **Exams** (2, `exams.json`): `{id, title, durationMinutes, passingScore: 700,
  selection:{kind:'fixed', questionIds: <donor array verbatim — mock-1: 50 ids,
  mock-2: 30 ids>}}`; mock-1 additionally `caseStudies:[{id:'cs-1', title,
  background, questionIds: <5 case ids>}]` — donor objects verbatim.
- **Comparisons** (4, `comparisons.json` + the inline sideBySide blocks —
  decision 3 identity): `{id, title: <concept>, description: <summary>,
  columns: [{id:'sqlserver',label:ENGINE_LABELS.sqlserver}, postgresql, mysql,
  oracle]` (labels from `src/ui/engine-labels.ts`, imported by the script),
  `rows: [{aspect, cells:{sqlserver, postgresql, mysql, oracle}}]` (key
  transposition from donor row shape), `samples: [{label, code:
  Record<columnId,string>}]` (donor Partial → full, enforced by an in-script
  per-engine guard; 3 of the 4 comparisons carry 1 sample each covering all 4
  engines — donor cmp-identity has no samples and the emitted file faithfully
  carries none), `migration: <all 6 fields verbatim>}`.
- **Docker copy** (decision 12): copy `learn-dp-800/docker/` →
  `public/dp-800/docker/` verbatim, binary-safe (fs cp recursive): compose
  (5 services), `dab-config.json`, `seed/mssql/01-init.sql`,
  `seed/mssql/AdventureWorksLT2025.bak` (1.7 MB), `seed/mssql/product-reviews-insert.sql`,
  `seed/postgres/01-init.sql`, `seed/mysql/01-init.sql`, `seed/oracle/01-init.sql`
  — all 8 byte-identical to the donor. Plus one **authored** safety README in
  the same directory, written by the script from text pinned in-script (re-runs
  stay deterministic; validation session 1, decision 12): the copied files bake
  in lab-local dev credentials (public by design in the donor), an
  anonymous-wildcard DAB API, and all-interface port bindings — the README says
  so and advises 127.0.0.1 bindings for local use. No /setup page (roadmap
  candidate); discoverability is the amended prerequisites string above.
- `src/shell/views.test.tsx` updates (the emitted pack replaces the dp-800
  placeholder subject, `src/shell/subjects.ts:38-46`, filtered at `:113`):
  the installed/not-installed count assertions flip to 0/5
  (`views.test.tsx:33-37` — gh-600 landed between planning and execution, so
  the flip is to zero placeholders / five installed packs, not the 1/4 this
  plan originally projected; the in-file comment records the five); the two
  dp-800 placeholder-workspace tests
  (`:51-56` "This pack is not in the hub yet", `:295-301` Overview-only tab)
  flip to assert the real 7-mode workspace — gh-900/gh-200 tests in the same
  file are the template. This is a planned behavior change for 3 known
  assertions, made in the same phase as the pack landing.
- Ordering pins: domains/modules by donor order; lessons sorted
  (module order, lesson order); questions written pool-grouped (domain1 41 →
  domain2 40 → domain3 23 → exam1 15 (standalone then case) → lab-coding 60 by
  lab number then id). File-bucket path sort governs hub pool order — fine here
  because both exams are `fixed` (authored order preserved in `questionIds`);
  no sampling determinism is load-bearing for this pack.
- `--dry-run` echoes counts (3 domains, 11 modules, 43 lessons, 179 questions,
  3 labs, 2 exams, 4 comparisons, 8 copied docker files + 1 authored safety
  README) and writes nothing.

### Non-functional

- Script under tsc + oxlint gates (`npm run lint` covers `scripts/`).
- Re-run produces byte-identical output (deterministic transforms, no
  timestamps); committed generated files are never hand-edited.
- Donor tree never written to.

## Architecture

```
scripts/extract-dp800-pack.ts (tsx, one-shot provenance record)
  imports (read-only, deep): learn-dp-800/src/content/{curriculum,questions,labs,exams}.ts
  + lessons/domain{1,2,3}.ts + questions/lab-coding/index.ts
  + src/ui/engine-labels.ts (labels baked into comparison columns)
  emits:  content/dp-800/{subject,domains,modules,labs,exams,comparisons}.json
        + content/dp-800/lessons/<43 ids>.json
        + content/dp-800/questions/<179 ids>.json
  copies: learn-dp-800/docker/** → public/dp-800/docker/** (verbatim, binary-safe)
        + authors: public/dp-800/docker/README.md (safety note, text pinned in-script)
gates: npm run content:check (kinds registered in phase 2, seam imported in phase 1)
```

## Related Code Files

### Create

- `scripts/extract-dp800-pack.ts`
- `content/dp-800/**` — 229 generated files (committed)
- `public/dp-800/docker/**` — 8 copied files byte-identical + 1 authored safety
  README (all committed)

### Modify

- `package.json` — `"content:extract-dp800": "tsx scripts/extract-dp800-pack.ts"`
- `src/shell/views.test.tsx` — dp-800 placeholder assertions flip to
  installed-pack assertions (3 sites: `:33-37`, `:51-56`, `:295-301`)

### Delete

- (none)

## Implementation Steps

1. Re-verify donor anchors before coding (grep, don't trust the report):
   43 `defineLesson({`, 179 `q({ id:`, section counts (43/43/43/43/43 for the
   required sections; 16/11/7/5/4/3/3/3/3 optional), 3 labs, exam id arrays
   (50 + 30), EXAM_META strings, `dp800-store` shape. Any drift → update this
   plan's tables first.
2. Write the script skeleton: imports, startup assertions, writeJson (2-space +
   newline), dry-run flag, docker cp.
3. Implement transforms in order: domains → modules → lessons/sections (the
   table above) → questions (kind map incl. the with/without-code branch; no
   branches for the empty sqlFill/matching kinds, validation session 1) → labs
   (incl. the one-string prerequisites amendment) → exams (fixed wrap + case
   study) → comparisons (transposition + ENGINE_LABELS columns + samples +
   migration) → subject.json pinned.
4. In-script sanity checks that throw before writing: lesson ids unique, slugs
   unique, every knowledgeCheck id ∈ question bank, exam ids ⊆ bank, case ids ⊆
   exam ids, extension kinds ∉ core kinds (sideBySide↔comparisons consistency is
   owned by the phase-4 identity test, not re-checked here — one guard, stated
   as the guard).
5. Run `--dry-run` → verify echoed counts; run for real → `content:check`
   green; update `src/shell/views.test.tsx` placeholder assertions to the
   installed-pack expectations → `npm test` green (5 packs now installed —
   gh-600 interleaved after this plan was written).
6. Spot-check emitted files against donor: one flagship lesson (l0103 — figure +
   sideBySide + labId), one debugging question (q-lab11-6), mock-1 exam JSON,
   cmp-json comparison, lab-rls JSON.

## Success Criteria

- [x] `npm run content:extract-dp800 -- --dry-run` echoes the exact inventory:
      3/11/43/179 (41+40+23+15+60)/3/2/4 + 8 copied docker files + 1 authored
      safety README
- [x] `content/dp-800/` validates: `npm run content:check` green with 5 packs;
      every used kind has a registered handler (kinds from phase 2)
- [x] Second extractor run is byte-identical (`git status` clean after re-run)
- [x] `public/dp-800/docker/` copied files match donor contents byte-for-byte
      (incl. the .bak; the authored safety README is the one deliberate extra
      file); donor `learn-dp-800/` git-clean
- [x] `npm test` green — including the `views.test.tsx` assertions flipped from
      placeholder to installed-pack expectations in this phase (a planned
      3-assertion behavior change, not collateral damage)

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| Donor shape drifted since the scout (counts or section fields) | step 1 greps disagree with this file's tables | Update the plan tables + transforms together in this phase; do not code around unexplained drift silently |
| A section type this table misses exists on some lesson | in-script unknown-section throw (add one: any `sections` key not in the table aborts) | Add the mapping row here first (locked decision 2 governs), then extend the extractor |
| questionIds/knowledge-check mismatch or exam id typo | step 4 sanity throws, or content:check graph validation fails | Fix the extractor transform; never hand-patch emitted JSON (regenerated files would silently revert it) |
| tsx cannot resolve a donor import (donor `@/` aliases, unlike the gh donor's relative imports) | script fails at import time | The import list is already the fix — deep per-file modules whose own imports are relative-or-type-only; the aggregator `src/lib/content.ts` is the one entry that CANNOT resolve. If a deep module still fails, run with `TSX_TSCONFIG_PATH` pointing at a tsconfig mapping `@/*` → `./learn-dp-800/src/*` — never edit donor files |
| .bak copy corrupts via text-mode write | byte-diff donor vs emitted | Docker copy uses `cp`/binary copy only — JSON writer never touches docker files |
| subject description/disclaimer strings paraphrased instead of verbatim | phase 4/6 pin mismatch or manual review | Copy-paste from donor EXAM_META + hub placeholder at implementation time; pinned in-script once, never retyped |
