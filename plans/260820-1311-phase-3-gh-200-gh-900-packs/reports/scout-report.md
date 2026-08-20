# Phase 3 Migration Scout Report — GH-200 + GH-900 into `content/`

Scouted 2026-08-20 (Explore agent, read-only). Evidence base for this plan and
for `/ak:cook` execution. All paths repo-relative to `/Users/trang_thi_thuy.n/GIT/learning-hub`.

## Relevant Files

Hub (target):
- `src/sdk/types.ts` — the entire pack type contract
- `src/sdk/validate.ts` — Zod shapes + graph/integrity checks
- `src/sdk/content-source.ts` — path classifier, loader, `SubjectIndex`
- `src/content/registry.ts` — the only app-facing content module (injects `assemblePaper` into validation)
- `src/sdk/registry/{blocks,questions,tools,coverage}.ts(x)` — renderers/graders/tool metadata/registry coverage
- `src/shell/{subjects,router,SubjectWorkspace,HubHome}.ts(x)`, `src/App.tsx`
- `content/fixture/**` — the reference pack (15 files)
- `src/sdk/test-fixtures.ts` — in-memory mirror of the fixture pack

Source (donor):
- `learn-gh-200/src/content/types.ts` — all source types
- `learn-gh-200/src/content/domains/*.ts` (12), `questions/*.questions.ts` (12), `labs/{gh900,gh200}-labs.ts`, `exams.ts`, `compare.ts`, `docs.ts`, `questions/index.ts`, `labs/index.ts`, `domains/index.ts`

---

## 1. TARGET SDK CONTRACT

### 1.1 Exact TypeScript shapes (`src/sdk/types.ts`)

Brand accents — locked enum, never hex (`types.ts:23-33`):
```ts
ACCENT_TOKENS = ['sky-cyan','hub-green','corgi-orange','hub-coral','petal-pink','deep-teal','captain-red']
```
All 7 exist as CSS vars in `src/styles/tokens.css` (`--sky-cyan: #51BBD7`, `--hub-green: #3BB283`, `--corgi-orange: #FC8903`, `--hub-coral: #DD5D5D`, `--petal-pink: #F2A8BC`, `--deep-teal: #3D768E`, `--captain-red: #E13429`).

Tool ids (`types.ts:41-49`): `TOOL_IDS = ['learn','labs','practice','exams','compare','notes','revision']`.

```ts
interface Subject {
  id: string;            // kebab-case, also the storage namespace; MUST equal directory name
  code: string;          // "DP-800", "GH-200"
  title: string;
  subtitle?: string; description?: string;
  accent: AccentToken;
  disclaimers?: string[];
  enabledModes: ToolId[];  // min 1; validator enforces content backing
}

type DifficultyTier = 'beginner' | 'intermediate' | 'advanced' | 'challenge';

interface Domain { id: string; order: number; code?: string; title: string;
  weight?: string | { min: number; max: number }; summary?: string; }

interface Module { id: string; domainId: string; order: number; code?: string; title: string;
  summary?: string; officialSkills?: string[]; docIds?: string[]; }
```

Blocks (`types.ts:103-120`):
```ts
type CoreBlock =
  | { kind: 'md'; body: string }                       // whole-markdown prose (the .mdx body)
  | { kind: 'heading'; text: string; level?: number }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'tip'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };
interface ExtensionBlock { kind: string; [field: string]: unknown; }  // registry-resolved
type Block = CoreBlock | ExtensionBlock;
```

```ts
interface Lesson {
  id: string; domainId: string; moduleId?: string; order?: number; slug?: string;
  title: string; summary?: string; minutes: number; difficulty?: DifficultyTier;
  flagship?: boolean; blocks: Block[];            // .mdx body arrives as ONE trailing `md` block
  labId?: string; questionIds?: string[];         // knowledge-check ids at lesson end
  references?: Reference[]; docIds?: string[];
}
interface Reference { title: string; url: string; publisher?: string; accessed?: string; }
type DocRegistry = Record<string, Reference>;     // docs.json
```

Labs (`types.ts:160-193`): `LabStep { title?; instructions: string /*required,min1*/; starterSql?; hint?; solution?; expectedOutput?; validation? }`; `Lab { id; domainId; lessonId?; title; minutes; summary /*required,min1*/; steps: LabStep[] /*min1*/; outcomes?: string[]; checks?: string[]; difficulty?; scenario?; objective?; prerequisites?; engines?; schemaSql?; seedSql?; engineNotes?; solutionExplanation? }`. Doc comment: "GH-200's plain-string steps normalize to `{ instructions }`".

Questions (`types.ts:196-249`) — `QuestionKind = 'single'|'multi'|'order'|'matching'|'fill'|'codeReading'|'bug'` (`multi`, NOT `multiSelect`; `codeReading` camelCase). Base: `{ id, domainId, moduleId?, lessonId?, difficulty?, prompt, explanation /*markdown, min 1*/, tags?, docIds? }`. Variants:
```ts
| { kind: 'single';      options: QuestionOption[]; correct: string }         // option id
| { kind: 'multi';       options: QuestionOption[]; correct: string[] }       // option ids
| { kind: 'order';       options: QuestionOption[]; correct: string[] }       // full id sequence
| { kind: 'matching';    pairs: { left: string; right: string }[] }
| { kind: 'fill';        template: string /* ___ placeholders */;
                          blanks: { answer: string; alternatives?: string[] }[] }
| { kind: 'codeReading'; code: string; options: QuestionOption[]; correct: string }
| { kind: 'bug';         codeLines: string[]; buggyLineIndex: number }
interface QuestionOption { id: string; text: string; }   // ids kebab, schema-validated
type Answer = string[];  // single/codeReading/bug: id or index-as-string; matching: `${leftIdx}::${right}`; fill: one string per blank
```

Exams (`types.ts:251-279`):
```ts
interface CaseStudy { id; title; background; questionIds: string[]; }
interface Exam { id; title; description?; durationMinutes: number; passingScore?: number /*default 700*/;
  selection:
    | { kind: 'fixed'; questionIds: string[] }
    | { kind: 'sampled'; domainPlan: Record<string, number>; seed: number; excludeExamIds?: string[] };
  caseStudies?: CaseStudy[]; }
```

Comparison (`types.ts:287-304`): N-column — `columns: {id,label}[]` (min 2), `rows: {aspect, cells: Record<colId,string>}[]` (min 1), optional `samples`, optional `migration`.

Assembled pack (`SubjectContent`): `{ subject, docs, domains, modules, lessons, questions, labs, exams, comparisons }`. User data per subject (`LessonProgress`, `QuizAttempt`, `ExamAttempt`, `SrsCard`, `Note`, `StreakState`, `SubjectUserData`) — namespaced under `subjects[subjectId]` in the `cc-subject-data` localStorage store (`src/engines/subject-store.ts:25`, `patchSubject` at :59).

### 1.2 Registered kinds

Block kinds (`src/sdk/registry/blocks.tsx:72-106`, core only): `md` (via `Markdown`, resolves `[label](docId)` links), `heading` (h1-h6, default h2, slug anchor), `list` (`InlineText` items), `code` (`CodeBlock`), `tip` (`Callout`), `table` (`DataTable`). No app extension kinds yet. `registerBlockKind()` is the seam.

Question kinds (`src/sdk/registry/questions.tsx:248-526`): `single`, `codeReading`, `bug`, `multi`, `order`, `matching`, `fill` — each `{ render, grade }`, no partial credit, empty answer = wrong (`gradeQuestion` :185).

Tools (`src/sdk/registry/tools.ts`): `learn`→lessons, `labs`→labs, `practice`→questions, `exams`→exams, `compare`→comparisons, `notes`/`revision`→null (user-data only). `CONTENT_BACKED_TOOLS` drives mode/content validation.

### 1.3 Validation rules — every check

Zod shape (`validate.ts`, all `.strict()` — unknown keys fail):
- `idSchema`: `^[a-z0-9]+(?:[-.][a-z0-9]+)*$` (kebab; dots allowed). Applied to subject, domain, module, lesson, lab, question, option ids, exam case-study ids, comparison column ids.
- `LessonSchema`: blocks min 1 (json lessons); `LessonFrontmatterSchema`: blocks optional (mdx; loader appends body as trailing `md` block). `minutes` positive.
- Questions: options min 2 per option-bearing kind; `order.correct` min 2; `matching.pairs` min 2; `bug.codeLines` min 2; `fill.blanks` answers min 1 each.
- Comparison: columns min 2, rows min 1. Exam: `durationMinutes` positive; fixed min 1 question; sampled `domainPlan` non-negative ints, `seed` int.

Graph/integrity (`validateSubject`, `validate.ts:340-584`):
1. `duplicate-id` within each collection; `cross-collection-id`.
2. `unresolved-ref`: module→domain; lesson→domain/module/labId/questionIds; lab→domain/lessonId; question→domain/module/lessonId; exam fixed→questionIds; sampled→domainPlan keys and excludeExamIds; docIds (module/lesson/question) must exist in docs.json.
3. `graph-mismatch`: lesson domain ≠ module's domain; question in lesson.questionIds whose `lessonId` points elsewhere; case-study question outside fixed list.
4. `exam-infeasible`: sampled plan count > domain pool; deep check with injected `assemblePaper` — `excludeExamIds` starvation fails at load time.
5. Per-kind answerability: duplicate option ids; single/codeReading correct must be an option id; multi ≥2 correct, no dupes, ≥1 distractor; order correct = exact permutation of all option ids; matching lefts unique; fill `___` count == blanks count and ≥1 blank; bug index within codeLines.
6. `mode-without-content`: every enabledMode with a `CONTENT_BACKED_TOOLS` entry needs a non-empty collection.
7. `missing-file` subject.json; subject `id` must equal directory name.

Registry coverage (`src/sdk/registry/coverage.ts`): every used block/question kind must have a registered handler (`unknown-block-kind` / `unknown-question-kind`), run by `content:check`.

### 1.4 Content/ file layout & discovery

Discovery is **pure glob** (`content-source.ts:429-475`): `import.meta.glob('/content/**/*.json', {eager, import:'default'})` + `/content/**/*.mdx` raw. No registry.json, no manual registration — **a pack appears by existing on disk and passing validation**. `src/content/registry.ts` wraps as `contentSource` with `assemblePaper` injected.

Path rules (`parseContentPath`, :106-143):
- Root collection files `content/<subject>/{subject,domains,modules,docs,labs,exams,comparisons}.json` — arrays (except `subject.json` object, `docs.json` Record).
- Folder collections `content/<subject>/lessons/*.{json,mdx}` and `content/<subject>/questions/*.json` — one item per file, file stem = entryKey (cosmetic; ids from content). No nesting; anything else throws.
- `.mdx`: gray-matter frontmatter, body trimmed, appended as `{kind:'md', body}` **after** frontmatter-declared blocks.
- **One invalid pack breaks `listSubjects()` for all packs** (all-or-nothing; `subjects.ts:96-105` catches → placeholders-only — code comment defers the fix to "the content-seam work that ships with the second real pack").

### 1.5 Phase 1/2 fixture pack — file list + worked examples

`content/fixture/`:
```
subject.json  domains.json  modules.json  docs.json  labs.json  exams.json  comparisons.json
lessons/storage-models.mdx   lessons/query-shapes.json
questions/{q-single,q-multi,q-order,q-matching,q-fill,q-code-reading,q-bug}.json
```
2 domains (string weight / `{min,max}` weight), 2 modules, 2 lessons (1 mdx + 1 json with all 6 core block kinds), 7 questions (one per kind), 1 rich lab, 2 exams (1 sampled seed 42 + 1 fixed with case study), 1 three-column comparison with samples, 2 docs entries.

`content/fixture/lessons/storage-models.mdx` (verbatim, lines 1-37):
```mdx
---
id: lesson-storage-models
domainId: d1
moduleId: m-storage
order: 1
slug: storage-models
title: Storage models
summary: When to store data as files, tables, or both in a lakehouse.
minutes: 12
difficulty: beginner
flagship: true
labId: lab-explore
questionIds:
  - q-single
  - q-multi
  - q-order
references:
  - title: Lakehouse docs
    url: https://example.com/docs/lakehouse
docIds:
  - ms-lakehouse-doc
---

Every analytical platform answers the same question first: **where do the bytes live?**
...
## Why it matters

When storage and compute are decoupled, one copy of data can serve many engines.
```

`content/fixture/questions/q-single.json` (verbatim):
```json
{
  "id": "q-single",
  "kind": "single",
  "domainId": "d1",
  "moduleId": "m-storage",
  "lessonId": "lesson-storage-models",
  "difficulty": "beginner",
  "prompt": "In a lakehouse, what physically stores the data?",
  "explanation": "The physical layer is files in object storage; tables are metadata layered on top.",
  "options": [
    { "id": "files", "text": "Files in object storage" },
    { "id": "rowstore", "text": "A rowstore heap" },
    { "id": "memory", "text": "Engine memory only" }
  ],
  "correct": "files",
  "tags": ["storage"],
  "docIds": ["ms-lakehouse-doc"]
}
```

## 2. SHELL CONSUMPTION

- **Discovery**: `src/shell/subjects.ts` merges installed packs (`contentSource.listSubjects()`, memoized, try/catch → `[]` on ANY failure) over `PLACEHOLDER_SUBJECTS` by id. Placeholders exist for `gh-200` (accent `hub-green`, modes Learn/Labs/Practice/Exams/Compare) and `gh-900` (accent `corgi-orange`, modes Learn/Practice/Exams) at :46-61. **A new pack must: (1) live at `content/gh-200/` / `content/gh-900/`, (2) have `subject.id` equal the dir name, (3) pass validation. Zero code registration.** Pack metadata overrides the placeholder card.
- **enabledModes → tabs**: `SubjectWorkspace.tsx:65-73` builds `Overview` + `TOOL_LIST.filter(enabled)` in registry order. Route: `#/subject/:subjectId/:mode[/:id[/…rest]]`; learn `/:slugOrId`; labs `/labId`; practice `/:scopeId` (domainId | moduleId | `all`); exams `/:examId` + `/:examId/review/:attemptIndex`.
- **Progress/SRS namespacing**: zustand, localStorage `cc-subject-data` (`subject-store.ts:25`), user data under `subjects[subjectId].{lessons, completedLabs, quizAttempts, examAttempts, srs, notes, bookmarks, lastLessonId}` — cross-pack collisions impossible by construction.
- **Trap**: `lessonSequence()` (`content-source.ts:378-382`) walks lessons **through modules only** — a lesson without `moduleId` never appears → LessonViewer prev/next (`LessonViewer.tsx:66`) disappears. LearnIndex renders module-less lessons as domain "orphans".
- Old-app progress: `gh-site-progress-v1` (`learn-gh-200/src/hooks/useProgress.ts:15`) — no migration shim exists (plan §9 lists one as mitigation).

## 3. SOURCE INVENTORY (learn-gh-200)

### 3.1 Subjects & metadata
Both certs in one app, `CertId = 'gh900' | 'gh200'` (`content/types.ts:11`). **No per-subject metadata object** — branding hardcoded in `sections/Home.tsx` + `components/shell/*`. Phase 3 authors `subject.json` per pack (Phase 0 placeholders already carry code/subtitle/description/accent to reuse).

### 3.2 Counts (exact)

| | GH-900 | GH-200 | total |
|---|---|---|---|
| Domains | 7 (`gh900-d1..d7`) | 5 (`gh200-d1..d5`) | 12 |
| SubSkills | 34 (7,5,4,4,4,5,5) | 41 (12,7,6,7,9) | 75 |
| Lessons | 7 (1/domain) | 5 (1/domain) | 12 |
| Questions | 140 (20/domain) | 100 (20/domain) | 240 |
| — single | 91 | 64 | 155 |
| — multi | 28 | 15 | 43 |
| — fill | 2 | 8 | 10 |
| — bug | 9 | 8 | 17 |
| — order | 10 | 5 | 15 |
| Labs | 7 (`gh900-lab-01..07`) | 6 (`gh200-lab-01..06`) | 13 |
| Exams | 2 (mock-a/b) | 2 (mock-a/b) | 4 |
| Comparisons | — | 2 (`actions-vs-jenkins`, `actions-vs-aws`, 10 rows each) | 2 |
| Docs registry | shared `DOCS` — **111 entries** (`content/docs.ts`) | shared | 111 |

Domain weights (`weightMin/weightMax`): gh900 d1 25-30, d2-d4 10-15, d5 5-10, d6 10-15, d7 5-10; gh200 d1 20-25, d2 15-20, d3 15-20, d4 20-25, d5 10-15. Lesson minutes: gh900 12,11,11,11,10,12,10; gh200 22,18,16,20,18. Lesson block-kind totals (12 lessons): **h3 65, p 72, code 22, list 18, table 12, tip 9** (198 blocks).

Exams (`content/exams.ts`): all four `durationMin: 100`, `totalQuestions: 35`. GH-900 domainPlan `{d1:10, d2:5, d3:5, d4:5, d5:3, d6:5, d7:2}`, seeds 9001 (mock-a) / 9002 (mock-b). GH-200 domainPlan `{d1:8, d2:7, d3:7, d4:8, d5:5}`, seeds 2001/2002. **mock-b excludes mock-a's sampled ids via `examQuestions()` partner logic (`exams.ts:88-105`) — SDK equivalent: `selection.excludeExamIds: ['<cert>-mock-a']`.**

### 3.3 Source types verbatim (`learn-gh-200/src/content/types.ts`)

```ts
export type CertId = 'gh900' | 'gh200';

export interface SubSkill { id: string; title: string; docIds: string[]; }

export interface Domain {
  id: string; cert: CertId; number: number; title: string;
  weightMin: number; weightMax: number; summary: string;
  subSkills: SubSkill[];
  lesson: Lesson;                      // exactly ONE lesson nested per domain
}

export type LessonBlock =
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'tip'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface Lesson { id: string; domainId: string; title: string; minutes: number; blocks: LessonBlock[]; }

export interface Lab {
  id: string; domainId: string; title: string; minutes: number; summary: string;
  steps: string[];          // plain numbered strings (NOT LabStep objects)
  outcomes: string[]; checks: string[];
}

interface QuestionBase {
  id: string; cert: CertId; domainId: string; subSkillId: string;
  stem: string; explanation: string; docId: string;   // singular docId
}

export interface FillBlank { answer: string; alternatives: string[]; }  // alternatives REQUIRED (may be [])

export type Question = QuestionBase &
  (
    | { kind: 'single'; options: string[]; answerIndex: number }
    | { kind: 'multi'; options: string[]; answerIndexes: number[] }
    | { kind: 'fill'; codeTemplate: string; blanks: FillBlank[] }
    | { kind: 'bug'; codeLines: string[]; buggyLineIndex: number }
    | { kind: 'order'; items: string[] }          // items authored IN correct order; no ids
  );

export interface ExamConfig {
  id: string; cert: CertId; title: string; durationMin: number; totalQuestions: number;
  domainPlan: Record<string, number>; seed: number;
}

export interface ComparisonRow { dimension: string; github: string; other: string; }
export interface CompareData { id: string; title: string; counterpart: string; description: string; rows: ComparisonRow[]; }
```

### 3.4 How prose is authored
All content is **TS arrays/objects with template-literal strings** in `src/content/`, aggregated by hand-written index files. No mdx. Representative lesson (`domains/gh200-d1-author-and-manage-workflows.ts:82-171`): `lesson: { id: 'lesson-gh200-d1', domainId: 'gh200-d1', title, minutes: 22, blocks: [ {kind:'h3'...}, {kind:'p', text:'...[syntax](workflow-syntax)...'}, {kind:'code', language:'yaml', code:'...'}, ... {kind:'list', items:[...]} ] }` — h3/p interleaved with yaml fences, closing "Before you move on" list in every domain. Inline constructs used: exactly `code`, **bold**, `[label](docId)` — identical to hub `InlineText`. Question stems/options contain NO inline doc links (0 `](` hits in all 12 question files); labs/comparisons/lessons do.

## 4. DELTA ANALYSIS source → sdk

### 4.1 Field-by-field mapping

| Source | SDK | Transform |
|---|---|---|
| `Domain.cert` | — | dropped; pack membership (split into 2 packs) |
| `Domain.number` | `Domain.order` | rename (1-based already) |
| `Domain.weightMin/weightMax` | `Domain.weight` | `{min, max}` |
| `Domain.subSkills[]` | `modules.json` Module[] | `{id, domainId, order: <synthesize>, title, docIds}` |
| `Domain.lesson` | `lessons[]` entry | unnest; one lesson per domain |
| `LessonBlock h3` | `{kind:'heading', text, level:3}` | rename kind + level |
| `LessonBlock p` | `{kind:'md', body: text}` | rename; inline constructs preserved |
| `list/code/tip/table` | same kinds | identical shapes |
| `Lab.steps: string[]` | `steps: [{instructions}]` | wrap each string |
| `Lab.outcomes/checks` | same | direct |
| `QuestionBase.stem` | `prompt` | rename |
| `QuestionBase.docId` | `docIds: [docId]` | singular → array |
| `QuestionBase.cert` | — | dropped |
| `QuestionBase.subSkillId` | `moduleId` | rename (subskills → modules) |
| `single.options + answerIndex` | `options: [{id,text}] + correct: id` | synthesize ids `o1..oN` (passes kebab idSchema) |
| `multi.options/answerIndexes` | options + `correct: id[]` | same; ≥2 correct + ≥1 distractor guaranteed by source tests |
| `order.items` | options + `correct` (authored order) | items ARE the correct order in source |
| `fill.codeTemplate` | `template` | rename; empty `alternatives` arrays omitted |
| `bug` | `bug` | identical |
| `ExamConfig` | `Exam.selection sampled` | `durationMin`→`durationMinutes`; `totalQuestions` dropped (derived); `passingScore: 700` (matches source `score.ts` hard-coded 700); mock-b `excludeExamIds: ['<cert>-mock-a']` |
| `CompareData` | `columns: [{id:'github',label:'GitHub Actions'},{id:'other',label:counterpart}]`, `rows: [{aspect: dimension, cells:{github, other}}]` | 2 fixed cols → N-column |
| `DOCS: Record<id,{title,url}>` | `docs.json` | same keys; publisher/accessed absent |

**Exam parity is byte-for-byte achievable**: hub `engines/sampling.ts` is a verbatim port of donor `utils/sample.ts` (same mulberry32, Fisher-Yates, `Object.entries(domainPlan)` iteration, final `seed ^ 0x5bd1e995` shuffle); hub `engines/exam-paper.ts` resolves `excludeExamIds` recursively. Golden papers reproduce iff (a) question ids unchanged, (b) **within-domain pool order in the loaded pack equals source authored order** (pool = `content.questions.filter(...)` array order), (c) domainPlan key order preserved (JSON objects keep insertion order). Name question files so glob order = authored order (`<domainId>-q<NN>.json`, zero-padded).

### 4.2 Gaps — source features with no direct SDK equivalent
1. **One lesson per domain vs Module-grouped lessons** — `lessonSequence()`/prev-next nav requires every lesson to hang off a module (`content-source.ts:378-382`). Decision (locked): subskills→modules; lesson attaches to domain's first module.
2. **SubSkill drill-down** — preserved via subskills→modules + `question.moduleId`.
3. **`cert` filtering** — solved by splitting into two packs. Splits the 111-entry DOCS registry — each pack's `docs.json` must contain every docId referenced by fields AND inline prose links (hub validates `docIds` fields only; **inline `[label](docId)` links are NOT validated** — silently degrade to text).
4. **Living lab external links** — `gh200-lab-06` links `repo-deploy-workflow` and `repo-actions-runs` docIds (this repo's pipeline); must be in gh-200's docs.json.
5. **Fill grading strictness**: source `gradeFill` case-SENSITIVE; hub `normalizeBlank` (`questions.tsx:88-94`) case-INSENSITIVE + strips wrapping `[]` — deliberate documented superset ("Confirmed" comment at :86-87). All 10 fill items grade identically on authored answers.
6. Not needed from source: `matching`, `codeReading`, case studies, fixed exams, `flagship`, `slug`, `difficulty`, `references`, `questionIds`, lab rich fields — optional, absent.
7. `Subject.disclaimers` — schema-valid but no hub UI renders it; source has none.

### 4.3 GitHub-specific rendering survival
All survives via existing kinds: yaml/bash fences → `code`; inline `code`/bold/`[label](docId)` in p/list/table/tip/lab/compare → `md` bodies + `LabStep.instructions` through `Markdown`/`InlineText`, resolved against docs.json via `DocResolverProvider`; tables → `table`. Compare cells render via `InlineText` (`Compare.tsx:71`) so doc links in cells keep working.

## 5. TESTS & PARITY

Hub tests a real pack must pass:
- `src/content/content-check.test.ts` (`npm run content:check`) — every installed pack loads + validates clean; every used kind registered. **The gate the packs land in.**
- `src/sdk/content-source.test.ts` — path classification incl. `content/fixture/...` literals; unaffected.
- `src/sdk/validate.test.ts`, registry tests — run against `test-fixtures.ts`, unaffected.
- `src/app-flow.test.tsx`, `src/shell/views.test.tsx` — drive the fixture pack. **Trap**: `views.test.tsx:35` asserts `getAllByText('Pack not installed')).toHaveLength(4)` → drops to 3 with gh-900, 2 with gh-200 (must be updated in the same change as each pack lands). `views.test.tsx:51-63` renders dp-800/gh-900 workspaces — gh-900 placeholder chrome assertions need review once gh-900 installs.

Donor parity checklist (its own tests):
- `src/content/content.test.ts` — every docId resolves (incl. inline in lesson/lab/compare prose); labs→domains; 1 lesson per domain matching ids; exactly 7 GH-900 + 5 GH-200 domains in order; subSkills 1-3 docIds; block budgets (GH-900 ≤16, GH-200 14-22); labs 4-8 steps / 2-4 outcomes / 2-4 checks; unique doc URLs; living-lab repo links.
- `src/content/exams.test.ts` — 4 exams, 100min/35q, domainPlan covers cert within weight range; **golden paper snapshots for all 4 seeds (exact 35-id lists in-file — reusable verbatim as hub parity fixtures)**; mock A/B disjoint.
- `src/content/questions/questions.test.ts` — 240 total (140/100), 20/domain, unique ids, kind minimums per domain, every question anchored to domain+cert+subskill+doc, explanation ≥60 chars ending in sentence, single=4 options, multi 4-5 opts/2-3 correct + "choose all that apply" stem, fill placeholder count == blanks, bug ≥3 lines in-range, order ≥3 distinct items.

Commands (hub root `package.json`): `npm test` (vitest run), `npm run content:check`, `npm run lint` (oxlint src), `npm run build` (tsc -b && vite build). Vitest 4 + jsdom + @testing-library/react; `vite.config.ts` includes only `src/**/*.test.{ts,tsx}`.

## 6. MISC

- Accents: exactly the 7 `ACCENT_TOKENS`, all in `src/styles/tokens.css:15-31`. Placeholder plan: gh-200 → `hub-green`, gh-900 → `corgi-orange` (`subjects.ts`).
- Brand assets (hub `public/brand/`): `captain-corgi-avatar.png`, `captain-corgi-hub-avatar.png`, `icons/logo-wordmark.svg`, `icons/star.svg`. Donor mirrors them under `public/mascot/`. Hub home uses hub avatar; disclaimers/mascot are hub-level.
- No `content/gh-200` / `content/gh-900` remnants — `content/` holds `.gitkeep` + `fixture/`.
- Theme: hub shares the donor's localStorage theme key (`engines/theme.ts:18-20`) — theme carries over.
- Roadmap Phase 3 definition (`docs/unified-learning-hub-plan.md:168-171`): "Adapt existing learn-gh-200 content to the unified schema… Done when: both GitHub subjects fully usable in the hub; parity with the old app."

## Migration risks (concrete traps)
1. **Sequence/nav trap**: lessons without `moduleId` vanish from `lessonSequence()` → no prev/next. Every lesson needs a module.
2. **Golden-paper parity depends on file ordering**: glob is alphabetical; `<domainId>-q<NN>.json` zero-padded per domain + domainPlan JSON key order preserved, or all four golden papers silently change (donor `exams.test.ts` has expected id lists).
3. **Cross-exam exclusion validated at load time**: `excludeExamIds` starvation = load-time `exam-infeasible` that bricks the pack listing (see 4).
4. **One bad pack bricks the hub home**: `listSubjects()` all-or-nothing (`subjects.ts:96-105`); code comment defers the fix to "the second real pack" — Phase 3 owes it.
5. **Docs registry split**: inline prose doc links are NOT hub-validated — a misspelled split silently degrades links to text. Port donor's inline-scan as a pack parity test. Include `repo-deploy-workflow`/`repo-actions-runs` in gh-200 docs.
6. **SubSkill ids only domain-unique** (`d1-triggers` gh200 vs `d1-version-control` gh900) — safe after the 2-pack split; cheap collision check anyway.
7. **Option ids must be synthesized** (`o1..oN`; kebab schema — avoid uppercase). Must stay stable for persisted-attempt replay and the progress shim.
8. **Answer-encoding change**: source `number | number[] | string[]` → hub `Answer = string[]`. Old `gh-site-progress-v1` doesn't map without a shim (deterministic `oN` ids make mapping possible).
9. **Test-count assertions** (`views.test.tsx:35` ×4 "Pack not installed") must be updated in the same phase as each pack lands or CI fails.
10. **Fill grading drift** (case-insensitive `[]`-stripping superset) — accepted, documented.
