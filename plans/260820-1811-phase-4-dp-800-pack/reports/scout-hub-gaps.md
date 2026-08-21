# Scout report — hub capabilities vs DP-800 pack needs

Hub = `/Users/trang_thi_thuy.n/GIT/learning-hub` (all paths below relative to it unless prefixed `donor:` = `learn-dp-800/`). Read-only scout; file:line citations throughout.

## 1. Block validation — unknown/extension kinds

`src/sdk/validate.ts` verbatim (lines 87–125):

```ts
/** Core block kinds — everything else flows through ExtensionBlock. */
const CORE_BLOCK_KINDS = ['md', 'heading', 'list', 'code', 'tip', 'table'] as const;   // L88

/** Open extension point: registered kinds carry their own payloads. */
export const BlockSchema = z.union([                                                     // L116
  CoreBlockSchema,
  z
    .looseObject({
      kind: z.string().refine((k) => !(CORE_BLOCK_KINDS as readonly string[]).includes(k), {
        message: 'core kinds use their typed shape; pick another kind id for extensions',
      }),
    })
    .describe('extension block'),
]);
```

- Core kinds (typed, `.strict()` each): `md{body}`, `heading{text,level?}`, `list{items,ordered?}`, `code{language,code}`, `tip{text}`, `table{headers,rows}` (`validate.ts:90-113`; `types.ts:103-109`).
- **Extension kinds pass Zod**: any non-core `kind` is a `looseObject` — payload fields are unrestricted (DP-800 `keyTerms`, `mermaid`, `sideBySide`, `sourced` prose, `commonMistakes`, `examTips`, `learningObjectives` all validate as-is). Only constraint: `kind` must NOT collide with a core kind id (`validate.ts:120-122`). Everything else in the lesson schema is `.strict()` (`validate.ts:145-147`).
- Runtime gate: rendering throws `UnknownBlockKindError` for unregistered kinds (`src/sdk/registry/blocks.tsx:45-49`), and `npm run content:check` fails any pack whose used kinds lack a renderer (`src/sdk/registry/coverage.ts:17-33`, `src/content/content-check.test.ts:28-32`). "Extension blocks stay open" is pinned by `src/sdk/validate.test.ts:94`.
- DP-800 placement: extension blocks live inside `lessons/*.json` `blocks` arrays (or `.mdx` frontmatter `blocks`, `validate.ts:150-152`); the donor's typed sections (donor `src/lib/types.ts:116-130`) become block kinds at extraction.

## 2. Where pack renderers can register (no core edits)

- Public APIs: `registerBlockKind` (`src/sdk/registry/blocks.tsx:36-43`) and `registerQuestionKind` (`src/sdk/registry/questions.tsx:147-154`). Both are plain module-level Maps.
- **Nothing registers production extension kinds today.** `grep registerBlockKind|registerQuestionKind` hits only `blocks.tsx`/`questions.tsx` themselves and tests (`src/sdk/registry/blocks.test.tsx:177`, `coverage.test.tsx:47`, `questions.test.tsx:168`). The in-code fixture's `callout` block (`src/sdk/test-fixtures.ts:66`) does NOT exist on disk — `content/fixture/lessons/*` use core kinds only — so `content:check` passes without production extension renderers.
- Wiring point: `src/main.tsx:1-8` imports `App`, theme bootstrap, and four stylesheets — a side-effect import (e.g. `import './content/dp-800/renderers'`) there registers kinds before any route renders. `src/App.tsx` is an equivalent seam (it already imports engine modules, `App.tsx:2-7`).
- **Critical nuance**: `npm run content:check` runs `vitest run src/content/content-check.test.ts` (`package.json:10`), whose module graph does NOT include `main.tsx`. DP-800's renderer module must also be imported by `content-check.test.ts` (or a shared `src/content/pack-modules.ts` both import), or the check fails on `unknown-block-kind` while the dev app works.

## 3. Question kinds + grader semantics

Registered kinds (`questions.tsx:248-526`; labels L31-39):

| Hub kind | Grader | Semantics | Answer encoding |
|---|---|---|---|
| `single` | `gradeSingleLike` (L248, 192-193) | exactly 1 id == correct | `[optionId]` |
| `codeReading` | same (L268) | renders `code` + options; 1 id | `[optionId]` |
| `bug` | `String(buggyLineIndex)` match (L295-296) | one 0-based line index | `['2']` |
| `multi` | `sameSet` (L319, 74-78) | set equality, order-free | `[id,...]` |
| `order` | `sameOrder` (L349, 81-84) | exact sequence | full id sequence |
| `matching` | set of `leftIdx::right` tokens (L413-414, 97-99) | every pair matched | `` `${i}::${right}` `` |
| `fill` | per-blank normalized compare (L470-479) | see below | one string per blank |

- **fill template token: `___` (3 underscores)** — split at `questions.tsx:482` and validated at `validate.ts:547` (`q.template.split('___').length - 1` must equal `blanks.length`). **Donor sqlFill uses `____` (4 underscores)** (donor `src/components/QuestionView.tsx:302`). Donor content must be converted `____`→`___` at extraction (note: donor ships **zero** sqlFill questions today — the kind exists only in types/grader/tests: grep for `sqlFill` in donor `src/content/**` is empty).
- fill normalization: trim → collapse whitespace → strip wrapping `[]` → uppercase (case-**insensitive**) — `normalizeBlank` `questions.tsx:88-94`, identical to donor `normalizeSqlBlank` (donor `src/lib/scoring.ts:17-19`).
- **Alternatives exist**: `blanks[i].alternatives?: string[]` (`validate.ts:227-229`, `types.ts:242`) — donor `blankAliases: string[][]` (donor `types.ts:202`) maps 1:1 to per-blank `alternatives`.
- Empty/missing answers are wrong for every kind (`questions.tsx:185-188`). No partial credit anywhere (module docstring L8-11).
- Donor→hub mapping (donor types `types.ts:170-207`; shipped counts by explicit `type:`: 38 codeReading, 11 debugging, 17 multi, 1 ordering, 17 single, rest default-single; 0 matching, 0 sqlFill shipped):
  - donor `debugging` (code + options + correct id) → hub **`codeReading`** (both grade one correct option over options shown with code; donor grades debugging via sameSet, `scoring.ts:38`; all 11 shipped debugging questions have exactly one correct id).
  - donor `sqlFill` → hub **`fill`** with token conversion + `blankAliases`→`alternatives`.
  - `ordering`→`order`, `multi`→`multi`, `single`→`single`, `matching`→`matching` (same pairs shape).
- Donor grading hub lacks: none material (donor `gradeQuestion` donor `scoring.ts:30-60` is a subset of hub's registry semantics).

## 4. Labs — field coverage today vs DP-800

LabSchema already carries every donor field (`validate.ts:154-187`; `types.ts:160-193`). LabViewer coverage:

| Field | Rendered at | Status |
|---|---|---|
| title/summary/minutes/steps-count/difficulty | `src/ui/LabViewer.tsx:65-83` | yes |
| lesson back-link | `LabViewer.tsx:74-81` | yes |
| scenario / objective / prerequisites (ids→lesson links, else text) / engines | `LabViewer.tsx:85-124` | yes |
| schemaSql / seedSql (CodeBlock, copy button) | `LabViewer.tsx:126-136` | yes |
| steps: title, instructions (md) | `LabViewer.tsx:210-221` | yes |
| step starterSql | `LabViewer.tsx:223-228` | yes |
| step expectedOutput (md) | `LabViewer.tsx:230-235` | yes |
| step validation | `LabViewer.tsx:237-244` | yes |
| step hint / solution (opt-in reveals) | `LabViewer.tsx:246-269` | yes |
| engineNotes ("Other engines" grid) | `LabViewer.tsx:147-159` | yes |
| outcomes / checks / solutionExplanation | `LabViewer.tsx:161-192` | yes |
| complete-lab action | `LabViewer.tsx:194-204` | yes |

**Missing / divergent vs donor (all minor):**
- Engine display names: hub prints raw ids (`postgresql`) at `LabViewer.tsx:121` and `:151`; donor maps via `ENGINE_LABELS` (donor `src/lib/types.ts:8-13`) → pretty labels.
- No per-engine tabs anywhere (neither app has them); donor labels schema as "Schema (SQL Server)" (donor `LabViewer.tsx:76`).
- LabIndex card shows title/summary/minutes/difficulty/lesson link only (`src/ui/LabIndex.tsx:34-67`) — no scenario/objective/engines preview (donor labs page similar scope).
- Copy buttons exist (`src/ui/CodeBlock.tsx:46-54`). Donor `Lab` requires scenario/objective/prereqs/engines/schemaSql/seedSql/solutionExplanation (donor `types.ts:149-166`); hub marks them optional — donor labs port losslessly.

## 5. Compare

`src/ui/Compare.tsx`:
- Generic **N-column** table: `<th>` per `columns`, cell per `row.cells[column.id] ?? '—'` (`Compare.tsx:53-78`) — a 4-engine DP-800 matrix (sqlserver/postgresql/mysql/oracle) is just 4 column entries; nothing engine-coded (docstring L17-21).
- **Samples ARE rendered** (`Compare.tsx:80-86`): per-sample ARIA tabs of columns that carry code (`SampleTabs`, L117-167; `language="sql"` hardcoded at L163). **Migration cards ARE rendered** (`Compare.tsx:88`, six cards L169-192).
- **gh-200's two comparisons carry neither samples nor migration** (`content/gh-200/comparisons.json` — grep `samples|migration` = 0 hits; 2-column `github`/`other`, id `actions-vs-jenkins` at L3, `actions-vs-aws` at L90). The only live exercise of samples+migration is the fixture pack (`src/sdk/test-fixtures.ts:235-262`); DP-800 would be the first production pack to ship them.
- Picker when >1 comparison (`Compare.tsx:94-115`); single comparison auto-opens (L35-37).

## 6. Exams

- **caseStudies: rendered.** Schema `CaseStudySchema` (`validate.ts:245-252`, same shape as donor `types.ts:211-216`); sitting shows the case-study panel above any question whose id is in a study (`src/ui/ExamEngine.tsx:239`, `:305-313`). Integrity rule: fixed exams must list every case-study question id (`validate.ts:450-462`).
- **Fixed selection path exists**: `{kind:'fixed', questionIds}` (`validate.ts:254-255`) keeps authored order (`src/engines/exam-paper.ts:17-25`). Donor's `MOCK_EXAMS.questionIds` arrays (donor `src/content/exams.ts:39-67`: mock-1 = 50 fixed ids incl. 5 case-study questions; mock-2 = 30) map as-is to `selection:{kind:'fixed'}` — **donor fixed exams work unchanged**; no sampling determinism question arises (sampled path exists too: `sampling.ts:53-73`, mulberry32 seed, final shuffle seed `^0x5bd1e995`).
- **Scoring**: `toScaledScore = round(100 + 900*correct/total)` out of 1000 (`src/engines/scoring.ts:57-60`) — identical to donor (`donor src/lib/scoring.ts:94-97`). Pass mark `exam.passingScore ?? 700` (`scoring.ts:94`); shown in intro (`ExamEngine.tsx:178`, `:381`), index (`src/ui/ExamIndex.tsx:83`), review (`src/ui/ExamReview.tsx:110`).
- **perDomain**: `scoreByDomain` first-appearance order (`scoring.ts:63-78`), rendered with official weights in review (`ExamReview.tsx:120-134`, weight caption L18-21).
- **Timed flag**: intro Timed/Untimed toggle (`ExamEngine.tsx:194-212`), wall-clock deadline auto-submit (`:133-136`), persisted attempt field `timed` (`:124`, types `types.ts:347`). In-flight resume under `cc-exam-inflight` (`src/engines/exam-inflight.ts:13`).
- Review re-derives the paper deterministically rather than storing it (`ExamReview.tsx:59-62`) — works for fixed papers too.

## 7. Persistence — keys, shapes, migration surface

| Key | Owner | Shape / source |
|---|---|---|
| `cc-theme` | raw theme string | `src/engines/theme.ts:21`; values auto/light/dark/night (L16) |
| `cc-hub-store` | hub zustand blob | `{theme}` only — `src/engines/store.ts:26`, merge precedence L55-63 |
| `cc-subject-data` | subject zustand blob | `{version, streak:{current,longest,lastActive}, subjects:{[id]:SubjectUserData}}` — `src/engines/subject-store.ts:25-26`, `:38-44`, merge guard L202-210 |
| `cc-exam-inflight` | one sitting | `InflightSitting` — `exam-inflight.ts:13-26` |
| `cc-gh-progress-migrated` | gh migration guard sibling | `migrate-gh-progress.ts:34` |

- `SubjectUserData` fields (`src/sdk/types.ts:380-389`): `lessons, completedLabs, quizAttempts, examAttempts, srs, notes, bookmarks, lastLessonId?`.
- **Streak is hub-global** (top level of `cc-subject-data`, bumped by any subject's activity — `subject-store.ts:42`, `:91`, `:108`, `:129`, `:157`, `:167`), not per-subject. **Achievements do not exist in the hub** — deferred to Phase 6 (`subject-store.ts:18-20` comment; no field in types). Theme is global, "no duplication" (same comment).
- Donor key `dp800-store` (donor `src/lib/store.ts:187`), persisted shape: `theme, lessons, lastLessonId, bookmarks, completedLabs, notes, quizAttempts, examAttempts, srs, streak, achievements` (store state L29-62).
- **What maps cleanly** (donor↔hub shapes are field-identical for `LessonProgress`, `QuizAttempt`, `ExamAttempt`, `SrsCard`, `Note`, bookmarks, lastLessonId — donor `types.ts:230-274` vs hub `types.ts:327-389`): lessons, completedLabs, examAttempts (incl. answers/results — donor stores `answers: Record<string,string[]>` donor `types.ts:254`), notes, bookmarks, quizAttempts, srs, lastLessonId.
- **Blocker in the store action**: `importLegacyData` merges ONLY `lessons`, `completedLabs`, `examAttempts` (`subject-store.ts:170-188`). Notes/bookmarks/quizAttempts/srs/lastLessonId need the action extended (or a new one) for DP-800.
- **Cannot/should-not map**: `theme` (donor `auto|light|dark|night` donor `store.ts:16` matches hub values — mappable to `cc-theme` but it's a global override decision, not per-subject), `achievements` (no hub home until Phase 6), `streak` (donor streak is dp800-scoped; hub streak is global — seeding is possible but a product decision; the gh migration ignores streak entirely).

## 8. Migration shim pattern (reusable for dp-800)

`src/engines/migrate-gh-progress.ts`:
- Structure: donor-shape narrowers (`narrowLegacyProgress` L61-78, `narrowLegacyAttempt` L80-104) → pure per-kind answer translator `mapAnswer` (L114-155) → pure mapper `migrateLegacyProgress(old, current, content)` (L164-214, hub-wins on collisions, drops unreadable attempts with one warn) → orchestration runner `importLegacyGhProgress` (L306-362) that iterates installed packs, skips invalid ones (L330-335), and logs a summary (L353-360).
- Idempotency: sibling guard key outside the persist blob (L29-34 — in-store flags get stripped by the merge whitelist), set only AFTER every merge completes (L349-351) + per-key skip-if-present merge + deterministic attempt ids `legacy-${examId}-${index}` (L237) so re-runs write nothing.
- Wiring: `src/App.tsx:16-25` — one-shot `useEffect` gated on `useSubjectDataStore.persist.hasHydrated()` / `onFinishHydration` (never at store-create time).
- Reusable for DP-800: yes — clone the skeleton with `LEGACY_PROGRESS_KEY='dp800-store'`, a new guard key, narrowers for the donor blob (no prefix partitioning needed: donor data is single-subject), reuse `mapAnswer`-style translation only where encodings differ (they mostly don't — donor answers are already `string[]` option ids), and extend `importLegacyData` for notes/bookmarks/quizAttempts/srs. Test patterns: `src/engines/migrate-gh-progress.test.ts` (mapper purity, per-kind translation L36-45, guard/idempotency).

## 9. Extractor pattern

`scripts/extract-gh-packs.ts` (run: `npm run content:extract-gh -- --cert gh900|gh200|both [--dry-run]`, `package.json:11`):
- Donor import strategy: imports donor TS modules directly (`../learn-gh-200/src/content/*`, L17-32) under `tsx` because donor uses extensionless ESM paths (header L10-13).
- Emit layout: root array files `subject/domains/modules/docs/labs/exams/comparisons` + per-item `lessons/<id>.json`, `questions/<id>.json` (L309-343); `mkdir` collection folders (L335-336); JSON with 2-space indent + trailing newline (L289-291).
- Hand-authored `subject.json` pinned in `PACKS` (L43-68) incl. `enabledModes` and id==dirname assertion (L71-75).
- Ordering pins: domains sorted by `number` (L295); labs/questions filtered by domain/cert; sampling determinism ultimately depends on path-sorted file buckets (`src/sdk/content-source.ts:486-491`) and `q01..qNN`-style filenames (comment L487-489).
- Docs partition: only docIds actually referenced, scanned with the donor's own tokenizer (`referencedDocIds` L250-285; hard-fail on missing registry entries L303-306).
- Provenance record: the script itself is the record ("re-run it manually… one-shot by decision; there is no drift gate", L4-7) — no separate provenance file is written.
- Gates: `npm run content:check` + `src/content/pack-parity.test.ts`.
- DP-800 differences: donor content is richer (lesson `sections` → block mapping needed; `sideBySide` → both an inline comparison block AND a `comparisons.json` entry — donor /compare derives its list from lessons with `sideBySide`, donor `src/app/compare/page.tsx:17-18`; 4 lessons carry one, donor `domain1.ts:198,329`, `domain2.ts:155`, `domain3.ts:230`); questions need `debugging`→`codeReading` mapping and `ordering`→`order` rename; exams need `{kind:'fixed'}` wrapping; `docs` have no donor equivalent — donor references are per-lesson (`SourceReference[]`, donor `types.ts:48-53`), and donor prose links are raw URLs in markdown, not docIds (no `[label](docId)` registry).

## 10. Test patterns to extend

`src/content/pack-parity.test.ts` (per pack, `PACK_IDS` L24):
1. **Golden exam papers** — verbatim donor snapshots `GOLDEN_IDS` (L34-71, "pins, never recomputed") vs `assemblePaper(...).map(id)` (L73-98) + mock A/B disjointness (L85-96). DP-800 equivalent: fixed papers make this a plain id-order snapshot of `questionIds` (still worth pinning).
2. **Extraction counts** — `EXPECTED` inventory table (L103-112) asserting domains/modules/lessons/questions/labs/exams/comparisons/docs lengths (L114-127) + "every domain carries exactly 20 questions" (L129-136 — DP-800 domains are uneven by design; adapt or drop).
3. **Inline doc links resolve** — scans lesson blocks (core kinds only, L150-178), lab prose (L186-192), comparison cells (L194-203) via `extractDocIds` and asserts every link resolves in `docs.json` (L207-223). Note the scan is typed `CoreBlock[]` — DP-800 extension blocks "have no prose contract here" (comment L145-149); extending the scan to new kinds is a decision for the plan.
`src/content/content-check.test.ts`: at-least-one pack (L18-20), every pack loads+validates clean via `loadAllContent()` (L22-26), every used kind has a registered handler (L28-32), plus strict/lenient isolation fixtures (L40-68). DP-800 joins automatically once `content/dp-800/` exists (glob is `/content/**/*.json`, `content-source.ts:459`); the only manual work is the renderer-module import (§2).

## 11. Modes/tools

ToolId list (`src/sdk/types.ts:41-49`) and registry labels (`src/sdk/registry/tools.ts:21-64`):

| ToolId | Label | requiresContentKind |
|---|---|---|
| learn | Learn | lessons |
| labs | Labs | labs |
| practice | Practice | questions |
| exams | Exams | exams |
| compare | Compare | comparisons |
| notes | Notes | null (user data) |
| revision | Revision | null (user data) |

- enabledModes rules: `mode-without-content` issue when a content-backed mode has an empty collection (`validate.ts:571-581`, mapping from `CONTENT_BACKED_TOOLS` `tools.ts:69-71`); notes/revision always allowed.
- Views (`src/shell/tool-views.tsx:135-143`): all modes have real views except **revision = placeholder** (`tool-views.tsx:37-49,142`). Exams route also handles `/exams/:id/review/:attemptIndex` (L109-133).
- Hub tools the donor lacks: `revision` mode (placeholder) and the per-lesson notes panel (`LessonNotes` inside `src/ui/LessonViewer.tsx:156`) + notes tool with bookmarks surfaced inside it (`src/ui/Notes.tsx:19-96` — bookmarks read at L22).
- Donor-only surfaces and their hub disposition:
  - `/bookmarks` page (donor `src/app/bookmarks/page.tsx`) → hub folds bookmarks into the Notes tool (`Notes.tsx:22`) and per-lesson toggle (`LessonViewer.tsx:93-101`); no dedicated page.
  - `/setup` Docker guide (donor `src/app/setup/page.tsx`) → **no hub home** (would need a pack-provided page or docs entry; not a ToolId).
  - `SearchDialog` (donor `src/components/SearchDialog.tsx`) → **no hub search**.
  - Achievements/badges KPI (donor `src/app/page.tsx:35,97`; `ACHIEVEMENTS` donor `store.ts:18-27`) → **no hub home (Phase 6)**.
  - `EXAM_META` (donor `src/content/curriculum.ts:235-247`) → hub has no subject-level exam-meta surface; nearest fields are `subject.subtitle/description/disclaimers` (`validate.ts:45-56`).
  - Lab-coding practice sets (`LAB_CODING_SETS`, donor `src/content/questions/lab-coding/index.ts:11-30`, surfaced in donor practice L162) → hub practice scopes are domain/module/all + weak-domain "Focus" pills only (`src/shell/tool-views.tsx:52-86`, `src/ui/PracticeIndex.tsx:40-80`); 64 lab-coding questions can still ship as plain questions (they carry moduleIds), just without the set grouping/sourceUrl.

## 12. Pack file conventions

- Root array files (one JSON per collection at `content/<subject>/`): `subject.json` (object), `domains.json`, `modules.json`, `docs.json`, `labs.json`, `exams.json`, `comparisons.json` (arrays) — `ROOT_COLLECTIONS` `src/sdk/content-source.ts:108-116`, array schemas L184-190.
- Folder per-item files: `content/<subject>/lessons/<stem>.json|.mdx` and `content/<subject>/questions/<stem>.json` — `FOLDER_COLLECTIONS` L118; `.mdx` lessons carry frontmatter blocks + body appended as one trailing `md` block (L269-283).
- docs.json mechanics: `Record<docId, {title,url,publisher?,accessed?}>` (`DocsSchema` `validate.ts:312`; gh-200 example `content/gh-200/docs.json:1-6`). Prose links are `[label](docId)` **docId-only** — the inline tokenizer rejects raw URLs as links (`src/ui/InlineText.tsx:24`, docstring L10-15); full markdown resolves hrefs against the registry first, then http(s) (`src/ui/Markdown.tsx:25-43`). Declared `docIds` on modules/lessons/questions are graph-checked (`validate.ts:433-442`); inline prose links are only checked by the parity test (§10).
- Lesson blocks shape (gh-200 example): `heading{text,level}` / `md{body}` / `code{language,code}` / `list{items}` / `tip{text}` / `table{headers,rows}` interleaved in one `blocks` array — `content/gh-200/lessons/lesson-gh200-d1.json:7-70`.
- subject.json example: `content/gh-200/subject.json` (id must equal directory name — `content-source.ts:333-339`).

## DP-800 inventory (for planning counts)

3 domains, 11 modules, 46 lessons (18+18+10), 183 questions (15 exam1 + 41 d1 + 40 d2 + 23 d3 + 64 lab-coding), 3 labs, 2 fixed exams (50q with 1 case study; 30q), 4 `sideBySide` comparisons, ~11 donor `LAB_CODING_SETS`. Donor question kinds shipped: single (majority), multi 17, codeReading 38, debugging 11, ordering 1; matching 0, sqlFill 0. Donor lesson sections needing block-kind decisions: `overview, officialConcepts/sqlServerImplementation/postgresComparison/mysqlComparison/oracleComparison/realWorldScenario/performanceSecurity` (sourced `ContentBlock`s — donor `types.ts:46-62`), `visualExplanation{caption,mermaid?}` (donor `src/components/Mermaid.tsx` lazy-loads the `mermaid` npm package — **not in hub `package.json:15-26`**), `sideBySide` (DbComparison), `commonMistakes[{mistake,fix}]`, `examTips[]`, `keyTerms[]`, `learningObjectives[]`, `summary`.
