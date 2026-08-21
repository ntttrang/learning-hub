# scout: dp-800 donor migration inventory

Donor: `learn-dp-800/` (Next.js 15, App Router, static export). Hub schema read first:
`src/sdk/types.ts`. All donor paths below are relative to `learn-dp-800/`. Counts are
grep-verified unless noted.

## 1. curriculum

- Domains: **3** (`d1`,`d2`,`d3`) — `src/content/curriculum.ts:10-44`. Fields: id, order,
  code ("D1"), title, weight ("35-40%" string), summary, accent (`--sky-cyan` css var name),
  moduleIds. Hub delta: hub `Domain.weight` is `string | {min,max}` and `accent` is a locked
  `AccentToken` on `Subject`, not per-domain (`src/sdk/types.ts:73-81`).
- Modules: **11** (`m01`-`m11`) — `curriculum.ts:46-233`. Fields include `officialSkills`
  (verbatim outline bullets) and `lessonIds`. Hub `Module` keeps `officialSkills` but drops
  `lessonIds` (membership inferred from `Lesson.moduleId`), adds `docIds` (`types.ts:84-94`).
- Lessons: **43 real `defineLesson` objects** (grep `defineLesson({` = 43) — domain1.ts 17
  (l0101-l0403), domain2.ts 17 (l0501-l0804), domain3.ts 9 (l0901-l1102). Curriculum
  `lessonIds` arrays total 43 and every id resolves — **all 43 authored, 0 placeholders**
  (enforced by `src/content/content.test.ts:29-36`).
- Lesson id format: `l` + 2-digit module + 2-digit order, e.g. `l0103`, `l1102`. Slug format:
  kebab-case, e.g. `tables-data-types-indexes` (`lessons/domain1.ts:10`). Route is
  `/learn/[slug]` via `generateStaticParams` (`src/app/learn/[slug]/page.tsx:5-14`).
- Aggregator: `src/lib/content.ts:11-17` concatenates the 3 domain arrays; lookups by id and
  slug; `LESSON_SEQUENCE` + `adjacentLessons` for prev/next (`content.ts:73-84`).

### per-lesson field usage (n = 43)

| field | lessons using |
|---|---|
| learningObjectives | 43 (required by type) |
| keyTerms | 43 |
| sections.overview | 43 |
| sections.officialConcepts | 43 |
| sections.examTips | 43 |
| sections.summary | 43 |
| sections.commonMistakes | 16 |
| sections.performanceSecurity | 11 |
| sections.realWorldScenario | 7 |
| sections.visualExplanation | 5 |
| sections.sideBySide | 4 |
| sections.sqlServerImplementation | 3 |
| sections.postgresComparison | 3 |
| sections.mysqlComparison | 3 |
| sections.oracleComparison | 3 |
| labId | 3 (l0103→lab-json, l0503→lab-rls, l1002→lab-vector) |
| flagship (key present) | 4 — true: l0103, l0503, l1002; explicit false: l0403 (`domain1.ts:659`) |
| difficulty | 43 (required) |
| estimatedMinutes | 43 (required; hub renames to `minutes`) |
| knowledgeCheck.questionIds | 43, all non-empty |
| references | 43 (defaulted to studyGuide+sqlDocs by `lessons/_shared.ts:34` when omitted; every lesson passes explicit refs) |

`ContentBlock` = `{kind: official|explanation|recommendation|examTip, heading?, body}` and
`commonMistakes` = `{mistake, fix}[]` — both need new hub block kinds (hub `CoreBlock` covers
md/heading/list/code/tip/table only, `src/sdk/types.ts:103-109`).

## 2. visual-explanation

- **5 lessons** have `visualExplanation`; **5 use `mermaid`**, **0 use `image`** (grep
  `mermaid:` = 5, `image:` = 0). Lessons: l0103 (`domain1.ts:152-159`), l0503
  (`domain2.ts:110-116`), l0903 (`domain3.ts:96-103`), l1002 (`domain3.ts:184-191`), l1101
  (`domain3.ts:376-384`). All are small `flowchart LR/TB` sources (6-8 lines). No image
  paths exist anywhere in lesson content; the only `<img>` refs are brand assets
  (`src/app/page.tsx:61`, `src/components/Sidebar.tsx:53`).

## 3. questions

Total **179** (`q({ id:` grep). Pools: domain1.ts 41, domain2.ts 40, domain3.ts 23 (these 104
are exactly the knowledge-check bank — 104 distinct ids referenced from lessons' `knowledgeCheck`,
each once), exam1.ts 15 (10 standalone + 5 case), lab-coding 60.

| donor type | count | correct shape |
|---|---|---|
| single (default + explicit) | 112 | length-1 id array, e.g. `correct: ["b"]` (`questions/domain1.ts:8`) |
| codeReading | 38 | length-1 id array |
| multi | 17 | id set, 2-3 ids: `["a","b"]` (`lab-coding/01-database-objects.ts:36`), `["a","b","d"]` (`questions/exam1.ts:42`) |
| debugging | 11 | length-1 id array (option-based, same UI as single) |
| ordering | 1 (`q-l1101-3`, `questions/domain3.ts:121`) | ordered id array |
| matching | **0** | — (would use `pairs`) |
| sqlFill | **0** | — (would use code `____` + correct tokens + blankAliases) |

- id formats: knowledge checks `q-l{moduleOrder}-{n}` (`q-l0101-1`); exam1 standalone
  `q-ex1-{1..10}`; case study `q-cs1-{1..5}`; lab coding `q-lab{NN}-{M}`.
- option id format: lowercase letters `"a".."d"` via tuple pairs `options: [["a","text"],…]`
  (`questions/_build.ts:13,32`); lab-coding test enforces exactly `["a","b","c","d"]`
  (`content.test.ts:155`).
- blankAliases usage: **0 authored** (builder + grader + UI support only:
  `_build.ts:15,34`, `src/lib/scoring.ts:47-56`, `QuestionView.tsx:329`).
- `code` field: **33 questions** — 30 in lab-coding, 2 in domain1 (q-l0103-3 codeReading,
  q-l0302-1 single), 1 in exam1 (q-ex1-2 single). All non-sqlFill types render it via
  `SqlBlock` (`QuestionView.tsx:36-40`).
- moduleId/lessonId coverage: **179/179 have both** — `QInput` requires them
  (`_build.ts:6-7`) and passes them through (`_build.ts:26-27`).
- tags: **60/60 lab-coding** questions carry `tags: ["lab-coding","lab-NN"]` (e.g.
  `lab-coding/11-rag.ts:3`); **0** in domain/exam pools.
- difficulty (explicit): advanced 97, challenge 21, beginner 12, intermediate 3; remaining 46
  default to `"intermediate"` via the builder (`_build.ts:29`).

### verbatim debugging question (`lab-coding/11-rag.ts:70-85`)

```ts
q({ id: "q-lab11-6", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "challenge", type: "debugging",
  tags: T,
  prompt: "A developer implemented retrieve as dynamic SQL so users can 'search anything'. The rest of the RAG pipeline (JSON + REST) is parameterized.\n\nWhy is this still unsafe, and what should retrieve be?",
  code: `DECLARE @sql nvarchar(max) =\n  N'SELECT ReviewText FROM dbo.GearReview\n    WHERE ReviewText LIKE ''%' + @UserQuestion + N'%'';';\nEXEC (@sql);\n-- then FOR JSON and sp_invoke_external_rest_endpoint`,
  options: [
    ["a", "Concatenating user text into SQL is injection. Use parameterized `CONTAINS` / `VECTOR_DISTANCE` (and keep RLS). Prompt injection into the **model** is a separate later control"],
    ["b", "`LIKE` cannot be used on nvarchar, so the batch cannot have run"],
    ["c", "RAG forbids reading the source table; you must only call the model"],
    ["d", "`EXEC` of a string is deprecated and fails on SQL Server 2025"],
  ],
  correct: ["a"],
  explanation: "DP-800 production concern: AI-generated or user-tainted SQL. Retrieval must be parameterized (FT/vector). Parameterizing the REST payload does not retroactively fix a concatenated SELECT. LIKE on nvarchar is legal. EXEC(@sql) still exists — that is the problem." }),
```

### verbatim sqlFill question

**None exists — 0 authored sqlFill questions** (grep `type: "sqlFill"` = 0 across
`src/content/questions/`). The type, grader, and renderer are dead code paths today
(`src/lib/types.ts:177`, `src/lib/scoring.ts:47-56`, `QuestionView.tsx:289-368`,
`content.test.ts:88-92`). Migration only needs to preserve the capability, not convert data.

## 4. question pools

- `questions.ts:8-15` assembles `QUESTIONS = D1 + D2 + D3 + EXAM1 + EXAM1_CASE +
  LAB_CODING` (all 179 in one bank; `getQuestions` resolves any mix).
- domain1/2/3 files = the lesson knowledge-check bank (104), also the default practice pool.
- `questions/exam1.ts` = **15 original questions written only for Mock Exam 1** (10
  standalone + 5 case-study); header comment: "not knowledge checks" (`exam1.ts:3-6`).
- `questions/lab-coding/index.ts:47-73` = 11 `LabCodingSet`s (`lab-01`..`lab-11`), one per
  module, each with `moduleId`, `domainId`, `labNumber`, `title`, `sourceUrl` (Microsoft
  Learn lab md), `questionIds`. Consumed only by the Practice page: sets listed as drill
  cards (`src/app/practice/page.tsx:162`), questions fetched via
  `questionsForLabCodingSet` (`practice/page.tsx:51`, `src/lib/content.ts:67-70`), with an
  external link to `sourceUrl` (`practice/page.tsx:63-73`). Scope string recorded on the quiz
  attempt is the set id (`practice/page.tsx:76-84`).
- `q()` builder (`questions/_build.ts:22-39`) normalizes tuple options and defaults
  type/difficulty — the pack's data files are builder-shaped, not raw JSON.

## 5. labs

**3 labs** (`src/content/labs.ts`):

| id | domainId | lessonId | engines | minutes |
|---|---|---|---|---|
| lab-json | d1 | l0103 | sqlserver, postgresql, mysql, oracle (`labs.ts:20`) | 40 |
| lab-rls | d2 | l0503 | sqlserver, postgresql, oracle (`labs.ts:120`) | 45 |
| lab-vector | d3 | l1002 | sqlserver, postgresql, oracle (`labs.ts:226`) | 50 |

- Rich fields: **all 3 labs use** `schemaSql`, `seedSql`, `engineNotes`, `solutionExplanation`,
  plus scenario/objective/prerequisites/difficulty (required by type, `src/lib/types.ts:149-166`).
- 4 steps per lab (12 total), tiered Beginner/Intermediate/Advanced/Challenge. Step subfield
  counts across all 12 steps: `starterSql` **6**, `hint` **9**, `solution` **9**,
  `expectedOutput` **11**, `validation` **12** (grep `labs.ts`). Challenge steps have
  solution+hint but no starterSql.
- Hub delta: hub `LabStep.title` optional and adds `outcomes`/`checks` on `Lab`
  (`src/sdk/types.ts:161-193`); donor `estimatedMinutes`→hub `minutes`.

## 6. exams

- `src/content/exams.ts:39-67`: **2 MockExams**, both **fixed `questionIds`** (no sampling).
  - `mock-1`: 50 ids = 45 standalone (`EXAM1_STANDALONE`, `exams.ts:8-23`) + 5 case ids;
    duration 70 min, pass 700; **1 caseStudy** `cs-1` "Contoso Support semantic search"
    (`exams.ts:48-56`) whose `questionIds` = `EXAM1_CASE` (`exams.ts:25`).
  - `mock-2`: 30 ids (`EXAM2`, `exams.ts:27-37`), duration 45 min, pass 700, no case studies.
- `exam1.ts` role: separate pool feeding mock-1's 15 non-knowledge-check questions.
- Exam runtime resolves ids via `getQuestions(exam.questionIds)` (`ExamEngine.tsx:25`), finds
  the owning case study per question (`ExamEngine.tsx:125`), navigates to
  `/exam/{id}/results?attempt={id}` on submit (`ExamEngine.tsx:56`).
- `EXAM_META` (`curriculum.ts:235-247`: code, title, credential, durationMinutes 120,
  passingScore 700, skillsAsOf, platforms, study/cert URLs) consumed only by the dashboard
  (`src/app/page.tsx:23,72,74`) — maps to hub `Subject` metadata.
- Hub delta: hub `Exam.selection` is `{kind:'fixed'} | {kind:'sampled', domainPlan, seed,
  excludeExamIds}` (`src/sdk/types.ts:268-277`) — donor maps to `fixed` only.

## 7. comparisons

- **No shared compare collection.** `DbComparison` data lives only inline in lessons'
  `sections.sideBySide`; the `/compare` page derives its entries at module load:
  `LESSONS.filter((l) => l.sections.sideBySide)` (`src/app/compare/page.tsx:17-21`).
- **4 distinct comparisons**: `cmp-json` (`domain1.ts:199`), `cmp-identity`
  (`domain1.ts:330`), `cmp-rls` (`domain2.ts:156`), `cmp-vector` (`domain3.ts:231`).
- Shape (`src/lib/types.ts:65-90`): `id`, `concept` (label), `summary`, `rows[]` with fixed
  keys `aspect`/`sqlserver`/`postgresql`/`mysql`/`oracle` (3-5 rows each), optional
  `samples[]` `{label, code: Partial<Record<engine,string>>}` (1 sample each, all 4 engines),
  required `migration` with all 6 fields (equivalent, different, directMigration,
  syntaxChanges, limitations, whenToUse).
- Hub delta: hub `Comparison` is generic N-column `columns[]/rows[].cells` + optional
  `migration` (`src/sdk/types.ts:287-304`) — donor rows need key transposition
  (`r.sqlserver` → `cells.sqlserver`), `concept`→`title`.

## 8. content-test-contracts (`src/content/content.test.ts`)

- 3 domains and 11 modules exist (`:16-19`).
- >= 40 lessons; slugs unique; ids unique (`:21-27`).
- Every module's domainId resolves; every module lessonId resolves to a lesson (`:29-36`).
- >= 1 flagship lesson per domain (`:38-43`).
- Every lesson knowledgeCheck questionId resolves (`:47-51`).
- Every lesson has >= 2 knowledge-check questions (`:55-59`).
- Every exam questionId resolves (`:61-67`).
- Case-study questionIds are a subset of the exam's questionIds (`:69-77`).
- Every question is answerable with its own key (self-grade true); sqlFill blank count ==
  correct length and >= 1; choice correct ids exist among options (`:80-101`).
- 11 lab-coding sets, one per module (module id sets equal) (`:119-122`).
- Each set meets min count (4-6 per `minCount` table `:105-117`); ids resolve; tagged
  `lab-coding`; lessonId resolves (`:124-134`).
- Lab-coding text contains no Microsoft lab identifiers (`EcommerceDB`, `AdventureWorksLT`,
  `AddOrderLineItem`, `SecurityLabDB`) (`:136-143`).
- Lab-coding questions: type in {single, codeReading, debugging, multi}; difficulty in
  {advanced, challenge}; options exactly `a/b/c/d`; prompt > 120 chars; multi correct length
  2 else 1; every set has >= 1 multi (`:145-165`).
- >= 1 lab per domain; lab.lessonId resolves; >= 3 steps per lab (`:168-177`).

## 9. persistence

- Single zustand persist key **`dp800-store`**, `createJSONStorage(localStorage)`,
  `version: 1` (`src/lib/store.ts:186-190`). JSON shape:
  `{ state: { theme, lessons, lastLessonId, bookmarks, completedLabs, notes, quizAttempts,
  examAttempts, srs, streak, achievements }, version: 1 }`.
- Theme: `"auto" | "light" | "dark" | "night"` (`store.ts:16`); applied to
  `<html data-theme>` (`src/components/Theme.tsx:9-17`); no-flash inline script reads
  `localStorage['dp800-store'].state.theme` (`Theme.tsx:64-67`).
- Achievements: **8 defs** (`store.ts:18-27`): first-lesson, domain-1, ten-lessons, first-lab,
  quiz-ace, mock-pass, streak-7, all-labs. Only 5 are ever granted (grant calls at
  `store.ts:88-89,122,145-146,156`); `domain-1`, `streak-7`, `all-labs` are unreachable dead
  defs. Hub has no achievements yet ("achievements wait for the Phase 6 roadmap",
  `src/engines/subject-store.ts:15`).
- Streak shape: `{current, longest, lastActive?}` (`src/lib/streak.ts:16-20`), bumped on
  markLesson/visitLesson/completeLab/recordQuiz/recordExam. Hub keeps streak at hub level in
  `cc-subject-data`, not per subject (`subject-store.ts:34-36`).
- Notes shape: `{id, lessonId?, title, body, updated}` (`src/lib/types.ts:268-274`) —
  identical in hub (`src/sdk/types.ts:365-371`).
- QuizAttempt: `{id, scope (moduleId | domainId | lab-set id | "review"), date, total,
  correct, questionResults[]}`, capped at 200 (`store.ts:140`, `QuizRunner.tsx:54-60`).
- ExamAttempt: `{id, examId, date, durationSeconds, timed, scaledScore, passed, perDomain[],
  answers: Record<qid,string[]>, results[]}`, capped at 50 (`store.ts:152`,
  `ExamEngine.tsx:43-54`).
- Hub stores: `cc-hub-store` (theme, `src/engines/store.ts:26,50`) and `cc-subject-data`
  (version 1; `streak` + `subjects[subjectId]` = SubjectUserData `{lessons, completedLabs,
  quizAttempts, examAttempts, srs, notes, bookmarks, lastLessonId?}`,
  `src/engines/subject-store.ts:29-46,197-199`). Migration must re-key `dp800-store` into
  `subjects['dp-800']` (hub already has `importLegacyData`, `subject-store.ts:60-62`).

## 10. nextjs-specific apis and hub mapping

- App Router with static export: `output: "export"`, `trailingSlash: true`, optional
  `basePath` from `BASE_PATH` env exposed as `NEXT_PUBLIC_BASE_PATH`, `images.unoptimized`
  (`next.config.mjs:10-21`). 13 `page.tsx` routes: `/`, `/learn`, `/learn/[slug]`, `/labs`,
  `/labs/[id]`, `/practice`, `/exam`, `/exam/[id]`, `/exam/[id]/results`, `/compare`,
  `/notes`, `/bookmarks`, `/setup`.
- `generateStaticParams` on `/learn/[slug]` (all 43 slugs), `/exam/[id]`, `/exam/[id]/results`
  (`src/app/learn/[slug]/page.tsx:5-7`, `src/app/exam/[id]/page.tsx:5-7`).
- `next/link` wrapped by `src/components/Link.tsx`: under a `BASE_PATH` deploy it renders a
  plain `<a href={route(path)}>` to skip RSC prefetch (`?_rsc=` 503s on GitHub Pages);
  otherwise real NextLink (`Link.tsx:27-38`). `resolveRoute` adds base path + trailing slash
  and passes through `http(s):|mailto:|tel:|#` (`src/lib/asset.ts:23-35`).
- `next/navigation`: `usePathname` (Sidebar active states, `Sidebar.tsx:4,126,164`),
  `useRouter` (ExamEngine post-submit push, `ExamEngine.tsx:4,56`).
- No `next/image` anywhere — plain `<img src={asset(...)}>` (favicon `src/app/layout.tsx:18`,
  hero `src/app/page.tsx:61`, sidebar avatar `Sidebar.tsx:53`); `asset()` prefixes
  `NEXT_PUBLIC_BASE_PATH` (`src/lib/asset.ts:3,11-14`).
- `"use client"` on 25 files (all components + client pages); only the three dynamic param
  pages + results are server components.
- Hub mapping: hash-router `parseHash`/`navigate` (`src/shell/router.ts:26-64`) replaces
  file routes — `/learn/x` → `#/subject/dp-800/learn/x`; external reference links policy via
  `isExternalUrl` (`src/ui/external-url.ts:7-9`) replaces `resolveRoute`'s protocol pass-through;
  `asset()`/basePath handling is unnecessary (hub serves from root); `/setup` becomes static
  pack content (no hub route equivalent today).

## 11. mermaid

- Package: `mermaid ^11.16.0` (`package.json:19`). **Hub package.json has no mermaid** —
  adding it is a new hub dependency.
- `src/components/Mermaid.tsx`: dynamic `import("mermaid")` inside `useEffect`
  (`Mermaid.tsx:17`) — the library lands in a lazy async chunk, not the initial bundle;
  `mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" })`
  (`:18`); renders `mermaid.render(id, chart)` SVG via `dangerouslySetInnerHTML` (`:20,44`);
  on failure falls back to a `<pre>` of the chart source (`:31-37`). Fixed `theme: "neutral"`
  — no light/dark switching. Only 5 charts exist (sec. 2).

## 12. sqlblock

- `src/components/SqlBlock.tsx`: registers only the SQL grammar from
  `highlight.js/lib/core` (`:5-9`), always highlights as SQL (`:28`), copy-to-clipboard
  button (`:30-38`), optional engine color dot + `ENGINE_LABELS` tag chip (`:40-52`).
- Hub `src/ui/CodeBlock.tsx` delta: uses `highlight.js/lib/common` (broader, heavier
  import), generic `language` param with plain fallback (`:14-21`), copy button and label
  chip (`:43-54`) — **no engine dot / engine label concept and no SQL-by-default**. Pack
  work either extends CodeBlock with an accent/label convention or registers an sql block
  kind.

## 13. labviewer

`src/components/LabViewer.tsx` renders, in order: back link, title, difficulty badge,
minutes chip, link to owning lesson (`:34-50`); Scenario & objective card with scenario,
objective, prerequisites list, "Runs on:" engine labels (`:53-69`); Schema & sample data =
`schemaSql` + `seedSql` via SqlBlock (`:71-79`); Steps (`:81-88`) — per step `LabStepCard`
(`:126-190`): numbered title, instructions markdown, `starterSql` SqlBlock, `expectedOutput`
markdown box, `validation` callout, **"Show hint" toggle** and **"Reveal solution" toggle**
(state per step, `:127-128,165-176`), solution rendered as SqlBlock (`:183-187`);
engineNotes grid under "Other databases" (`:90-102`); solutionExplanation markdown
(`:104-109`); "Mark lab complete" → `completeLab(lab.id, lab.domainId)` (`:111-121`).
**No engine tabs, no execution, no copy beyond SqlBlock's** — engine-specific SQL lives in
the Challenge step's `solution` and `engineNotes` text.

## 14. comparison page + component

- `/compare` (`src/app/compare/page.tsx`): concept pill selector from the 4 entries
  (`:38-56`); selected card shows concept, summary, "Full lesson" link (`:58-66`); then
  `ComparisonTable`.
- `src/components/Comparison.tsx`: aspect x 4-engine matrix table with engine color dots
  (`:16-46`); `samples` rendered by `SideBySideSql` — **engine tab buttons** switching the
  SqlBlock (`:77-113`); 6 migration cards in a 2-col grid (equivalent/different/
  directMigration/syntaxChanges/limitations/whenToUse, `:52-59`). Engine set is hardcoded to
  the 4 DBs (`:8`) — hub's generic N-column `Comparison` + `src/ui/Compare.tsx` replace this.

## 15. docker dir

`docker/` holds (no README):
- `docker-compose.yml` — 5 services: `mssql` (mcr.microsoft.com/mssql/server:2025-latest,
  baked-in lab-local sa password (redacted — value lives only in the donor compose file),
  port 1433, seed mount), `dab`
  (azure-databases/data-api-builder, port 5001, depends on mssql), `postgres:17` (5432),
  `mysql:9` (3306), `oracle-free:23` (1521) + named volumes; postgres/mysql/oracle
  auto-seed from `./seed/*` init dirs.
- `dab-config.json` — DAB config pointing at `AdventureWorksLT2025` on the mssql service
  with one anonymous `Product` entity.
- `seed/` — `mssql/01-init.sql`, `mssql/AdventureWorksLT2025.bak`,
  `mssql/product-reviews-insert.sql`, `postgres/01-init.sql`, `mysql/01-init.sql`,
  `oracle/01-init.sql`.
- `/setup` page renders the how-to (compose up, connection cards per engine incl. the sa
  password, sqlcmd init for mssql, sample query, teardown; note that AI features need an
  external model endpoint) — `src/app/setup/page.tsx:31-96`. Roadmap "re-point Docker/lab
  assets" means moving `docker/` (or links to it) into the pack and keeping `/setup` content.

## 16. donor vs hub engine drift

Hub engines were ported from this donor; donor is the parity source. Verdicts:

| engine | donor | hub | verdict |
|---|---|---|---|
| srs | `src/lib/srs.ts` | `src/engines/srs.ts` | **identical semantics** (intervals `[0,1,2,4,7,15]`, MAX_BOX 5, only-track-after-first-miss); line-for-line same, only the type import moved |
| streak | `src/lib/streak.ts` | `src/engines/streak.ts` | **verbatim identical** (bumpStreak/dayKey/daysBetween) |
| progress | `src/lib/progress.ts` | `src/engines/progress.ts` | **identical logic**; donor closes over static LESSONS/DOMAINS/LABS, hub takes `SubjectContent` param (`progress.ts:26-34`) |
| revision | `src/lib/revision.ts` | `src/engines/revision.ts` | **identical logic**; hub passes content maps, uses `lesson.slug ?? lesson.id` (`revision.ts:46`) |
| scoring | `src/lib/scoring.ts` | `src/engines/scoring.ts` + `src/sdk/registry/questions.tsx` | **same math, reshaped API**: hub `toScaledScore(correct,total)` (`scoring.ts:57-60`) vs donor `toScaledScore(accuracy)` with `[0,1000]` clamp (`scoring.ts:94-97`) — same `100+900*ratio`; hub adds `scoreAttempt` w/ `passingScore ?? 700` default (`scoring.ts:84-97`), donor checks pass inline in ExamEngine |
| grading | `scoring.ts:30-60` | `registry/questions.tsx:185-196,470-478` | per-kind: hub `single` requires `answer.length===1 && answer[0]===correct` vs donor `sameSet` (equivalent for length-1 keys); `multi` sameSet, `order` sameOrder, matching `${i}::${right}` token sameSet — all equivalent; hub `fill` normalizer `normalizeBlank` is char-identical to donor `normalizeSqlBlank` (`questions.tsx:88-94` vs `scoring.ts:17-19`); hub `bug` grades `String(buggyLineIndex)` — donor has no such question shape (donor debugging is option-based → maps to hub `single`) |

Kind mapping for the pack: single→single (`correct[0]` becomes hub's `correct: string`),
multi→multi, ordering→order, codeReading→codeReading, debugging→**single** (option-based;
hub `bug` expects `codeLines[]`+`buggyLineIndex` which donor never authored), matching→matching
(0 items), sqlFill→fill (0 items; `code`+`correct`+`blankAliases` → `template`+`blanks[].answer/alternatives`).

## migration deltas worth flagging

- Question `correct` reshaping: donor stores `string[]` for every kind; hub `single`/
  `codeReading` use `correct: string`.
- Lesson `estimatedMinutes`→`minutes`; `sections.*` → ordered `blocks[]` with new registered
  kinds (officialConcepts/sqlServerImplementation/comparisons/sideBySide/commonMistakes/
  performanceSecurity/examTips/visualExplanation); `keyTerms`/`learningObjectives` have no hub
  block equivalent yet (only `flagship`, `labId`, `questionIds`, `references` map directly,
  `src/sdk/types.ts:122-142`).
- Donor `Question.id` prefixes (`q-ex1-*`, `q-cs1-*`, `q-lab*`) collide with nothing in hub
  (namespaced per subject), safe to keep verbatim.
- `flexsearch` is declared in donor `package.json:16` but imported nowhere — do not port it
  (SearchDialog uses hand-rolled scoring, `SearchDialog.tsx:35-50`).
- `completeLab(labId, domainId)` ignores its second arg (`store.ts:115`); hub signature is
  `(subjectId, labId)`.
