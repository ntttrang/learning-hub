---
title: "Phase 4 DP-800 Pack"
description: "Roadmap Phase 4 of docs/unified-learning-hub-plan.md: port learn-dp-800's typed Next.js content (3 domains, 11 modules, 43 lessons, 179 questions, 3 rich labs, 2 fixed mock exams, 4 engine comparisons, 5 mermaid figures) into a validated content/dp-800 pack via a script extractor, register the seven DB-specific extension block kinds plus lazy mermaid rendering in a pack-owned renderer module, re-point the Docker lab environment under public/dp-800/docker/, prove parity with fixed-paper snapshots and lab-coding hygiene pins, and migrate dp800-store progress into cc-subject-data once and idempotently."
status: completed
priority: P1
effort: "4d"
tags: [content, migration, feature]
blockedBy: []
blocks: []
created: 2026-08-20
---

# Phase 4 — DP-800 Pack

## Overview

Execute **roadmap Phase 4** of the unified hub plan (`docs/unified-learning-hub-plan.md:173-176`):
transform `learn-dp-800`'s typed content into a pack; register DB-specific block +
comparison renderers; re-point Docker/lab assets; drop Next-only APIs (`next/image`,
App Router, `next/link` — none enter the hub; the hash router and shared UI replace
them). *Done when:* DP-800 parity, incl. labs, compare matrix, 2 mock exams. The
donor inventory: **3 domains, 11 modules, 43 lessons** (all authored, 0 placeholders),
**179 questions** (104 knowledge-check + 15 exam-only + 60 lab-coding), **3 labs**
(rich fields, 12 steps), **2 fixed exams** (mock-1: 50 ids incl. one case study,
70 min; mock-2: 30 ids, 45 min; both pass 700), **4 comparisons** (each with samples
+ full 6-field migration), **5 mermaid figures, 0 images**. Plus the enabling
changes the migration surfaces: an extension-renderer registration seam (module
graph trap documented below), pretty engine labels in shared UI, a full-field
extension of `importLegacyData`, and a one-time `dp800-store` → `cc-subject-data`
progress shim. No Next-only APIs enter the hub — donor content arrives as data.

Evidence base: [reports/scout-dp800-donor.md](./reports/scout-dp800-donor.md)
(full donor inventory with file:line citations, engine drift table, persistence
shapes, docker/ contents) and [reports/scout-hub-gaps.md](./reports/scout-hub-gaps.md)
(hub block/question registries, LabViewer/Compare/ExamEngine coverage tables,
persistence keys, the phase-3 extractor + migration-shim + parity-test patterns).
Phase-3 precedent (`plans/260820-1311-phase-3-gh-200-gh-900-packs/`) set the house
style for extractor, parity tests, and progress shim; this plan clones those
patterns with the DP-800 deltas the reports pin.

## Scope Challenge

- Existing code: Phases 0–3 complete — shell, SDK, engines, shared UI live;
  `content/` holds `fixture/`, `gh-900/`, `gh-200/`; block extension point is open
  (`src/sdk/validate.ts:116-125`) but **no production extension kind is registered
  today**; `Compare.tsx` already renders samples tabs + migration cards (first
  production exercise is this pack); LabViewer renders every donor lab field
  except pretty engine labels.
- Requested scope: roadmap Phase 4 in full — DP-800 pack with parity incl. labs,
  compare matrix, 2 mock exams; DB-specific block + comparison renderers;
  Docker/lab assets re-pointed; plus the enabling changes (renderer seam, engine
  labels, `importLegacyData` full-field extension, progress migration).
- Complexity: ~237 generated/copied/authored files (229 pack JSON under
  `content/dp-800/` = 6 root files + 43 lessons + 179 questions, plus 8 docker
  files copied verbatim + 1 authored safety README under
  `public/dp-800/docker/`); 1 new npm dependency (`mermaid`); ~13 hand-written
  source/test files; beyond the pack renderer module, 3 new shared-ui surfaces:
  `src/ui/Mermaid.tsx`, the `ComparisonBody` export carved from `Compare.tsx`,
  and `src/ui/engine-labels.ts` (each with its own tests and 4-theme
  obligation — counted, not hidden).
- Selected mode: **HOLD SCOPE** — full roadmap Phase 4 plus enabling changes, no
  cuts, no additions.

## Locked Decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Question mapping | donor single→hub `single`; multi→`multi`; ordering→`order`; codeReading→`codeReading`; debugging→`codeReading`; matching→`matching` (0 shipped); sqlFill→`fill` (0 shipped, no branch). RULE: any options-based donor question (single/debugging) that carries `code` maps to hub `codeReading` (renders snippet + options; grader identical one-correct-id); without code → `single`. Donor `correct: string[]` unwraps to `correct: string` for single/codeReading. `____`→`___` blank-token conversion + blankAliases mapping **cut** — 0 authored items, no synthetic fixture for empty kinds (validation session 1; if a donor sqlFill ever appears, add the conversion then, ~5 lines). Donor option ids (`"a".."d"`) are kept verbatim — hub `Answer = string[]` needs no translation |
| 2 | Lesson sections → blocks | ordered `blocks[]` in the donor viewer's fixed section order (`learn-dp-800/src/components/LessonViewer.tsx:120-306`): learningObjectives→`{kind:'objectives',items}` (donor renders objectives first, `:123`); overview→heading+md; keyTerms→`{kind:'keyTerms',terms}`; officialConcepts/sqlServerImplementation/postgres\|mysql\|oracleComparison/realWorldScenario/performanceSecurity → core heading (donor section label) + one `{kind:'sourced', source:'official'\|'explanation'\|'recommendation'\|'examTip', heading?, body}` per ContentBlock; visualExplanation→`{kind:'figure',caption,mermaid?}` (5 mermaid, 0 image); sideBySide→`{kind:'sideBySide',comparison:<full inline Comparison payload>}`; commonMistakes→`{kind:'mistakes',items:[{mistake,fix}]}`; examTips→`{kind:'examTips',tips}`; summary→heading+md. Extension kind ids (`objectives`,`keyTerms`,`sourced`,`figure`,`sideBySide`,`mistakes`,`examTips`) must not collide with core kinds (`src/sdk/validate.ts:88`) |
| 3 | sideBySide duplication | extractor emits BOTH the inline block payload AND a deduped `comparisons.json` entry from the donor's single object; the parity test asserts payload === collection entry (identity) |
| 4 | Comparison transform | donor rows `{aspect,sqlserver,postgresql,mysql,oracle}` → hub `columns: [{id,label}=ENGINE_LABELS]` + `rows[].cells`; `concept`→`title`; `summary`→`description`; samples `code: Partial<Record<engine,string>>`→`Record<columnId,string>`; `migration` verbatim (all 6 fields; all 4 comparisons carry it) |
| 5 | Mermaid | hub dependency `mermaid ^11.16.0`; figure renderer lazy dynamic-imports it (async chunk, not initial bundle), initialize `{startOnLoad:false, theme:'neutral', securityLevel:'strict'}`, render via `mermaid.render` + `dangerouslySetInnerHTML`, fallback `<pre>` of chart source on failure (mirror donor `src/components/Mermaid.tsx`). Render ids must be unique per invocation (module counter or `useId`, donor `Mermaid.tsx:19-21`) — StrictMode double-invokes effects (`src/main.tsx:15-19`) and a static id collides on the second render, silently degrading every figure to the fallback. Trust boundary: `securityLevel:'strict'` is the sanitizer (escaped labels, click callbacks disabled); the hub carries no CSP today, so chart strings are trusted exactly as far as content authoring is PR-gated (roadmap §2) |
| 6 | Engine labels | LabViewer + wherever engine ids display get a small `ENGINE_LABELS` map (sqlserver→Microsoft SQL, postgresql→PostgreSQL, mysql→MySQL, oracle→Oracle Database) with raw-id fallback — presentation-only, shared-UI edit, no schema change. The module lives in shared `ui/` (not the pack dir) because shared LabViewer must not import pack code; it holds DP-800 engine ids only — non-DP-800 labels never enter it. Labels are also baked into emitted comparison columns; the parity suite pins `column.label === engineLabel(column.id)` so module and generated JSON cannot drift silently |
| 7 | Renderer seam | new module `src/content/dp-800/renderers.tsx` registering ALL DP-800 block kinds via `registerBlockKind`; side-effect imported by BOTH `src/App.tsx` AND `src/content/content-check.test.ts`. Anchoring in App.tsx (which `main.tsx` renders) covers the dev app AND every App-rendering test's module graph (`views.test.tsx:6`, `app-flow.test.tsx:10`, `App.test.tsx:4`) with one site — `main.tsx` sits in no test graph; the test-file import covers the content-check coverage gate, whose graph excludes the app entry (trap documented in scout-hub-gaps §2). `registerBlockKind` overwrites silently (`blocks.tsx:36-43`), so the module asserts each kind is unregistered before registering |
| 8 | subject.json | `{id:'dp-800', code:'DP-800', title` from donor EXAM_META `'Developing AI-Enabled Database Solutions'`, `subtitle:'SQL AI Developer · 3 domains', description` = hub placeholder text, `accent:'sky-cyan', disclaimers` = [credential line, 'Skills outline as of March 12, 2026', platforms line], `enabledModes:['learn','labs','practice','exams','compare','notes','revision']}`. NO docs.json — donor prose uses raw URLs; hub full Markdown resolves http(s) (`src/ui/Markdown.tsx:25-43`); per-lesson `references` map verbatim to `Lesson.references` |
| 9 | Lab-coding sets | 60 questions ship as plain questions with donor tags preserved (`["lab-coding","lab-NN"]`); set cards/sourceUrl grouping NOT ported — module-scoped practice covers the drill path (11 sets ↔ 11 modules, `src/shell/tool-views.tsx:54-67`); documented as accepted parity delta |
| 10 | Exams | 2 fixed selections verbatim — mock-1: 50 ids (45 standalone + 5 case), 70 min, 1 case study `cs-1`, pass 700; mock-2: 30 ids, 45 min, pass 700. Hub case-study rendering (`src/ui/ExamEngine.tsx:305-313`) + fixed-paper path (`src/engines/exam-paper.ts:17-25`) already exist |
| 11 | Labs | 3 verbatim (lab-json/lab-rls/lab-vector, all rich fields; `estimatedMinutes`→`minutes`; lessonId back-links l0103/l0503/l1002). LabViewer already renders everything except pretty engine labels (decision 6) |
| 12 | Docker assets | copy donor `docker/` (1.8 MB incl. AdventureWorksLT2025.bak 1.7 MB) verbatim → `public/dp-800/docker/` (compose 5 services, dab-config, seeds); vite copies `public/**` into every static deploy — recorded as accepted deploy weight. NO in-app /setup page (no pack-page mechanism in hub — Phase 6-roadmap candidate). Threat model (recorded): the environment bakes in lab-local dev credentials (incl. the mssql sa password, embedded in both compose and the dab-config connection string), a DAB API configured anonymous-wildcard in development mode, and ports published on all interfaces — throwaway lab-local values already public in the donor repo, not hub secrets; users on untrusted networks should bind `127.0.0.1`. User guidance (validation session 1): an **authored safety README** ships inside `public/dp-800/docker/` (credentials public by design; services bind all interfaces; 127.0.0.1 advice) — compose + seeds stay byte-identical to the donor. Known dangling ref (validation session 1): donor prerequisite prose says "(see the Setup page)" (`learn-dp-800/src/content/labs.ts:17`), a page the hub does not ship — that **one prerequisite string is amended during extraction** to point at the bundled docker environment, a documented exception to verbatim. Labs stay self-contained via inline schemaSql/seedSql |
| 13 | Progress migration | new `src/engines/migrate-dp800-progress.ts` cloning the migrate-gh-progress skeleton: read localStorage `dp800-store` (zustand persist envelope `{state,version}`), narrow+map into `subjects['dp-800']` of `cc-subject-data`; EXTEND store action `importLegacyData` (currently merges only lessons/completedLabs/examAttempts, `src/engines/subject-store.ts:170-188`) to full SubjectUserData merge incl. notes/bookmarks/quizAttempts/srs/lastLessonId, hub-wins on collision. Dropped with logged note: theme (global, not per-subject), achievements (no hub home until Phase 6; donor has 8 defs, 3 unreachable), streak (hub-global; gh shim precedent ignores it). Idempotency: sibling guard key `cc-dp800-progress-migrated` set only after the merge is **verified persisted** — the storage adapter swallows quota errors (`src/engines/storage.ts:61-67`), so the runner re-reads `cc-subject-data` and confirms a known imported marker id is present before setting the guard; on mismatch warn + leave the guard unset so the next start retries. Import hardening (gh-shim guards reused): examAttempts filtered to pack exam ids; answer/quiz/srs entries whose question ids are outside the 179-id pack dropped; notes filtered to resolvable lessonIds (drop count logged); `quizAttempts` narrowed per-attempt, not `unknown[]`; bounds — entries beyond the donor's own caps (quiz 200 / exam 50, donor `store.ts:140,152`) skipped, oversized note bodies dropped, raw key over a few hundred KB aborts the import. Inter-tab concurrent-start window (two tabs both pass the guard check before either writes) is accepted and documented — the gh shim has the same window. Wired in App.tsx gated on persist hydration (mirror gh wiring, `src/App.tsx:16-25`) |
| 14 | Parity/integrity tests | extend `src/content/pack-parity.test.ts` + keep content-check auto-coverage: inventory counts 3 domains/11 modules/43 lessons/179 questions/3 labs/2 exams/4 comparisons; pool counts 41+40+23 knowledge-check (104 ids each referenced exactly once) + 15 exam1 (10 standalone `q-ex1-*`, 5 case `q-cs1-*`) + 60 lab-coding; fixed paper id-order snapshots for mock-1/mock-2; sideBySide payload identity; flagship coverage (≥1 true per domain; donor: l0103, l0503, l1002); lab-coding hygiene ports (options exactly a/b/c/d, difficulty ∈ {advanced,challenge}, ≥1 multi per module-set, prompt length, no Microsoft lab identifiers EcommerceDB/AdventureWorksLT/AddOrderLineItem/SecurityLabDB — scan prompts+options+code+explanations); donor content.test.ts contracts already inherent to hub validateSubject get listed as "inherent" not re-tested; block-order pin (flagship lesson's emitted kind sequence matches the donor section order); comparison column labels === `engineLabel(column.id)`; a real-lesson render test (LessonViewer on l0103 through `renderBlock`) pins the extractor↔renderer payload contract for all 7 kinds. pack-parity restructure: the golden-papers loop (`GOLDEN_IDS` keys + hardcoded `endsWith('-mock-a')`, `pack-parity.test.ts:87,91-93`) and the doc-links loop (`links > 0`, `:220`) stay gh-scoped (`GH_PACK_IDS`) — dp-800 snapshots live in the dp-800 section; gh assertions semantically unchanged, not textually untouched. Test files named by behavior (dp-800 parity), NEVER by plan/phase numbers |
| 15 | Extractor | `scripts/extract-dp800-pack.ts` + `npm run content:extract-dp800` script (tsx; mirrors `scripts/extract-gh-packs.ts`): imports donor modules read-only, emits 2-space JSON + trailing newline, per-item `content/dp-800/lessons/<id>.json` + `questions/<id>.json`, root arrays domains/modules/labs/exams/comparisons + subject.json pinned in script, deterministic ordering — lessons by module/order, questions by pool then id. Donor modules are imported **deep, not via `src/lib/content.ts`**: the aggregator's value-level `@/` alias imports do not resolve under tsx from the hub (empirically verified: `Cannot find module '@/content/curriculum'`), while `lessons/domain{1,2,3}.ts`, `curriculum.ts`, `questions.ts`, `labs.ts`, `exams.ts`, `questions/lab-coding/index.ts` are relative-or-type-only and import clean; the lesson sequence is computed from `DOMAINS`/`MODULES` order. Script-as-provenance-record like phase 3 (re-run manually; no drift gate). Donor `learn-dp-800/` strictly read-only |
| 16 | Core-edit reconciliation | The roadmap acceptance clause "adding a subject needs zero core-code edits" (`docs/unified-learning-hub-plan.md:20`) holds for content-only packs. Renderer-carrying packs additionally need the two registration imports (`App.tsx` + `content-check.test.ts`, decision 7) and the shared-UI seams this plan lands (LabViewer labels, `importLegacyData` extension, `package.json` dep + script) — classified as **pack-enabling seams**, following the phase-3 precedent that framed its own shared edit as "zero core-code registration" (`plans/260820-1311-phase-3-gh-200-gh-900-packs/plan.md:21-23`). A self-discovering seam (glob-import of `src/content/*/renderers.tsx` consumed by both entries) is a Phase-6-roadmap candidate, out of scope here |

Note: the two scout reports disagree on totals (46 vs 43 lessons, 183 vs 179
questions) and on the debugging mapping; the donor report's grep-verified counts
(43/179) and the debugging→codeReading rule win throughout.

## Goals

| # | Goal | Priority |
| --- | --- | --- |
| 1 | `content/dp-800/` loads, validates, and renders through the 6 content-backed modes + Notes; `revision` renders the house placeholder until the roadmap view lands (gh-200 precedent); gh packs + fixture keep passing (gh parity assertions semantically unchanged — decision 14) | P1 |
| 2 | Parity proven: inventory + pool counts, fixed-paper id-order snapshots (mock-1/mock-2), sideBySide payload identity, flagship coverage + block-order pin, comparison label pin, lab-coding hygiene ports | P1 |
| 3 | The 7 DP-800 extension block kinds render via the pack renderer module; mermaid lazy-loads as an async chunk | P1 |
| 4 | Docker/lab environment re-pointed verbatim under `public/dp-800/docker/`; labs self-contained via inline SQL | P2 |
| 5 | Old `dp800-store` progress imported once into `subjects['dp-800']` (full SubjectUserData, hub-wins, idempotent) | P1 |

## Phases

| # | Phase | Status |
| --- | --- | --- |
| 1 | [Enabling seams](./phase-01-start.md) | Done |
| 2 | [DP-800 block renderers](./phase-02-dp-800-block-renderers.md) | Done |
| 3 | [Extractor and pack emission](./phase-03-extractor-and-pack-emission.md) | Done |
| 4 | [Parity and integrity tests](./phase-04-parity-and-integrity-tests.md) | Done |
| 5 | [Progress migration](./phase-05-progress-migration.md) | Done |
| 6 | [End-to-end verification](./phase-06-end-to-end-verification.md) | Done |

Each phase leaves `npm test`, `npm run content:check`, `npm run lint`, and
`npm run build` green.

## Success Criteria

- [ ] `npm run content:check` green with `fixture` + `gh-900` + `gh-200` + `dp-800` installed
- [ ] DP-800 usable in every enabled mode: Learn (43 lessons, prev/next, knowledge
      checks), Labs (3 rich labs w/ hint + solution reveals), Practice (domain /
      module / all scopes incl. the lab-coding drill path), Exams (2 fixed papers,
      case study cs-1, timed + review), Compare (4 entries w/ sample tabs +
      migration cards), Notes (the `revision` tab renders the house placeholder
      by design — not a DP-800 deliverable)
- [ ] Parity tests green: counts (3/11/43/179/3/2/4), pools (104/15/60 with
      104-each-referenced-once), fixed-paper snapshots, sideBySide identity,
      flagship coverage + l0103 block-order pin, comparison column-label pin,
      LessonViewer payload-contract render (l0103, all 7 kinds), lab-coding
      hygiene (incl. Microsoft-identifier scan)
- [ ] Mermaid renders the 5 figures and lands in an async chunk — initial bundle
      does not include it (verified in the phase 6 build output)
- [ ] `public/dp-800/docker/` holds the donor environment verbatim (compose +
      dab-config + 6 seed files incl. the .bak) plus the authored safety
      README; no in-app /setup page; the "(see the Setup page)" prerequisite is
      amended to point at the bundled environment
- [ ] Seeded realistic `dp800-store` payload → hub store holds lessons,
      completed labs, quiz + exam history, notes, bookmarks, SRS cards
      (verified via store/devtools assertion — no hub surface renders SRS
      yet), lastLessonId; second load mutates nothing; unknown exam/question/
      lesson ids are dropped with a logged count; theme/achievements/streak
      dropped with one logged note
- [ ] Full `npm test` / `npm run lint` / `npm run build` green; donor
      `learn-dp-800/` untouched (`git status` clean)
- [ ] README "Installed packs" line names DP-800 (phase 6, smallest owning surface)

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
 | content:check fails on unknown block kinds although the dev app works (module-graph trap: `content-check.test.ts` never imports `main.tsx`) | High if unnoticed | Blocks CI | Decision 7: renderer module side-effect imported by BOTH entry points; phase 1 lands the seam empty, phase 3's first extraction run proves the gate |
| Extension kind id collides with a core kind (Zod rejects core-kind ids on extension blocks, `validate.ts:120-122`) | Low | Pack invalid | Decision 2 pins the 7 ids; extractor asserts none is in `CORE_BLOCK_KINDS` before writing |
| Mermaid inflates the initial bundle | Medium | Perf regression | Decision 5: lazy dynamic import inside the figure renderer; phase 6 build output must show mermaid in an async chunk — if it lands in the entry chunk, fix the import site before shipping |
| Donor drift between scout and execution (counts, section labels, store shape) | Medium | Wrong parity pins | Phase 3 step 1 and phase 5 step 1 re-verify against donor source before coding; all pins carry file:line citations |
| `importLegacyData` extension breaks the gh shim or its tests | Low | Suite red | Extension is additive per-key (absent keys spread as no-op); existing gh migration tests are the regression gate in phase 1 |
| 1.7 MB .bak bloats the repo / build | Low | Repo size | Verbatim copy is the locked scope (donor parity); copied under `public/` once, excluded from any minification pipeline; noted, accepted |
| jsdom cannot execute real mermaid rendering in tests | High | Test flake | Mermaid tests assert the fallback `<pre>` path with the real import mocked to fail; real SVG rendering is a phase 6 manual walkthrough item |

## Red Team Review

### Session — 2026-08-20
**Reviewers:** 4 (Security Adversary · Failure Mode Analyst · Assumption Destroyer · Scope & Complexity Critic), Full tier — each lens paired with its verification role (Fact Checker / Flow Tracer / Scope Auditor / Contract Verifier)
**Findings:** 28 raw → 18 unique after cross-reviewer merges → 15 accepted (applied), 3 deferred to validation as scope questions, 0 evidence-backed rejections
**Severity breakdown (accepted):** 2 Critical, 5 High, 7 Medium, 1 Low

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Donor `@/` alias imports — `src/lib/content.ts` unimportable under tsx (empirically reproduced); deep per-file imports verified working; risk remedy pointed the wrong way | Critical | Accept | Phase 3, decision 15 |
| 2 | `views.test.tsx` dp-800 placeholder assertions (3 sites) break the moment the pack lands; phase-3 Modify list + "existing suites unaffected" claims false | Critical | Accept | Phase 3 |
| 3 | "PACK_IDS is additive / gh sections untouched" structurally false — golden-papers loop (`endsWith('-mock-a')` → TypeError) and doc-links loop (`links > 0`, no docs.json) need gh-scoping | High | Accept | Phase 4, decision 14 |
| 4 | No automated gate renders a real dp-800 lesson — extractor↔renderer payload contract unenforced; phase-4 figure-caption claim self-contradictory | High | Accept | Phase 4, decision 14 |
| 5 | Migration hardening: guard set without verified persist (storage adapter swallows quota errors); no referential-integrity filters (`quizAttempts` as `unknown[]`); no size/count bounds; inter-tab window undocumented | High | Accept | Phase 5, decision 13 |
| 6 | Decision 12 rationale refuted by source: prerequisite prose says "(see the Setup page)" (`labs.ts:17`); docker env discoverable by nothing | High | Accept | Decision 12, phase 6 |
| 7 | §1 "zero core-code edits" acceptance clause eroded by 5 shared-file edits, never reconciled (phase-3 precedent framed the same honestly) | High | Accept | Decision 16 (new) |
| 8 | Decision 2's section-order enumeration wrong (overview listed before learningObjectives; donor renders objectives first); no block-order parity pin | Medium | Accept | Decision 2, phase 4 |
| 9 | Renderer seam anchored to `main.tsx` (in no test graph) — `App.tsx` covers dev app + every App-rendering test with one site; `registerBlockKind` overwrites silently (no assert-not-present) | Medium | Accept | Decision 7, phases 1–2 |
| 10 | Mermaid spec gaps: per-render unique ids omitted (StrictMode double-invoke silently degrades all figures to fallback); trust boundary unstated ('strict' is the only barrier; no CSP exists) | Medium | Accept | Decision 5, phase 2 |
| 11 | Docker copy ships baked-in lab-local dev credentials + anonymous-wildcard DAB API + all-interface ports with no threat-model note (values redacted from this plan) | Medium | Accept | Decision 12 |
| 12 | `ENGINE_LABELS` baked into generated JSON and live in module — no drift gate; ui/-layering rationale undocumented | Medium | Accept | Decision 6, phase 4 |
| 13 | Success criteria unmeetable: Revision renders house placeholder, no view reads `.srs` | Medium | Accept | plan.md criteria, phases 5–6 |
| 14 | Honesty fixes: compare→lesson "Full lesson" link drop missing from deltas; mock-1 pin is a 45+5 concat (no 50-id literal); "0 new abstractions" undercounts 3 shared-ui surfaces | Medium | Accept | Scope Challenge, phases 4 + 6 |
| 15 | sideBySide triple bookkeeping — extractor count check redundant given the identity test | Low | Accept | Phase 3 |

**Deferred to validation (user scope decisions, not auto-applied):** sqlFill dead branch + synthetic fixture (decision 1); docker assets published under `public/` vs. repo-presence-only (decision 12); live mermaid vs. pre-rendered SVG for 5 static flowcharts (decision 5); decision-12 discoverability route (README pointer vs. amending one prerequisite string); docker threat-model route (README note vs. loopback bindings). **All five resolved in validation session 1** (see Validation Log): sqlFill branch cut; `public/` publication kept; live mermaid kept; prerequisite string amended at extraction; safety README inside the docker dir.

**Verification evidence:** all four reviewers returned grep/traced citations (e.g. `views.test.tsx:33-37,51-56,295-301`; `pack-parity.test.ts:73-98,207-223`; `storage.ts:61-67`; donor `content.ts:1-8`; empirical tsx probe `Cannot find module '@/content/curriculum'`); Fact Checker pass 31/34 claims verified, 3 failed (all three failures became accepted findings 1, 6, 8).

### Whole-Plan Consistency Sweep
Re-read `plan.md` + all six `phase-*.md` after applying the 15 findings. Deltas reconciled in the same pass:

- Seam anchor renamed everywhere (`main.tsx` → `App.tsx`): decision 7, phase-01 Overview/requirements/architecture/Modify/steps/success criteria — no `main.tsx`-as-import-site claim remains (phase-01 keeps `main.tsx → App.tsx` in the diagram as the render chain, which is correct).
- Extractor import list: decision 15 and phase-03 (imports bullet, architecture block, risk-row remedy) now all state deep-per-file imports; the inverted gh-era remedy is gone.
- Decision 2's section order (objectives first) now matches phase-03's table rows 1–2, which always had it right; block-order pin added in decision 14 / phase-04 / plan.md goals + criteria.
- "PACK_IDS is additive / gh sections untouched" replaced by the `GH_PACK_IDS` restructure in decision 14, phase-04 overview/requirements/steps/criteria, and plan.md goal 2.
- Migration hardening appears consistently in decision 13 and phase-05 (narrowers, filters, bounds, verified-persist guard, tests, risk rows incl. the accepted inter-tab window).
- Docker claims: the false "prerequisite prose points at the bundled environment" rationale removed from decision 12 and phase-06 deltas; threat-model note + two validation-pending routes recorded in decision 12, phase-03 docker bullet, phase-06 docs bullet.
- Placeholder honesty: Revision/SRS wording aligned across plan.md (goals, success criteria, verification "7 tabs"), phase-05 (step 5, criteria), phase-06 (round-trip).
- New shared-surface count (3) and decision 16 reconcile the Scope Challenge with the §1 acceptance clause; phase-06 delta list now includes the compare→lesson link drop.
- plan.md frontmatter description unchanged — still accurate (it never carried the corrected claims).

Unresolved contradictions: **none**. Open questions outstanding by design: the 5 deferred scope decisions listed above (validation interview).

## Validation Log

### Session 1 — 2026-08-20
**Trigger:** post-red-team validation interview (mode=prompt); verification pass satisfied by the `## Red Team Review` evidence (31/34 claims verified by reviewers, no `[UNVERIFIED]` tags in plan files)
**Questions asked:** 5

#### Questions & Answers

1. **[Scope]** The extractor implements a sqlFill→fill conversion branch + synthetic fixture test, but the donor ships 0 sqlFill questions (and the also-empty matching kind gets no such fixture). Keep or cut?
   - Options: Cut the dead branch | Keep capability branch
   - **Answer:** Cut the dead branch
   - **Rationale:** the extractor is a provenance record of what was actually extracted; a vacuous branch + fixture testing synthetic input is the phantom-test pattern; re-add is ~5 lines if a donor sqlFill ever appears.
2. **[Scope]** Does "re-point Docker/lab assets" require web publication (public/ → every static deploy, currently linked from nothing), or only repo presence?
   - Options: Keep public/ publication | Repo-presence only
   - **Answer:** Keep public/ publication
   - **Rationale:** donor parity; ~1.8 MB on a static host is negligible; stays fetchable for the future setup page.
3. **[Tradeoffs]** The 5 figures are static 4–6-line flowcharts that will never change. Live mermaid dependency or pre-rendered SVG baked into the emitted JSON?
   - Options: Live mermaid | Pre-rendered SVG in JSON
   - **Answer:** Live mermaid
   - **Rationale:** donor-identical behavior is the plan's charter; the dependency is lazy-loaded (async chunk, verified in phase 6) and the spec is already red-teamed (unique render ids, strict security, fallback).
4. **[Scope]** Donor prerequisite prose says "(see the Setup page)" — a page the hub does not ship. How should the bundled docker environment become discoverable?
   - Options: Amend the one string | Verbatim + README pointer | Verbatim, accepted delta
   - **Answer:** Amend the one string
   - **Rationale:** fixes the dangling user-visible reference exactly where a learner hits it; a single documented exception to verbatim.
5. **[Risks]** The copied docker environment bakes in lab-local dev credentials, an anonymous-wildcard DAB API, and ports on all interfaces. How should the exposure guidance reach the user?
   - Options: Safety README in docker dir | Loopback bindings in compose | Note only, no artifact
   - **Answer:** Safety README in docker dir
   - **Rationale:** compose stays byte-identical to donor (preserves the verbatim verification); guidance lands where the user runs compose.

#### Confirmed Decisions
- Decision 1: sqlFill branch + synthetic fixture cut; no extractor branches for empty kinds.
- Decision 12 (location): docker environment stays under `public/dp-800/docker/` — deploy weight accepted.
- Decision 5: live mermaid unchanged.
- Decision 12 (discoverability): the "(see the Setup page)" prerequisite string (`learn-dp-800/src/content/labs.ts:17`) is amended during extraction to point at the bundled docker environment — documented verbatim exception.
- Decision 12 (guidance): authored safety README inside `public/dp-800/docker/` (credentials public by design; all-interface bindings; 127.0.0.1 advice); copied files remain byte-identical.

#### Action Items
- [x] Decision 1 + phase-03 kind table/steps: cut the sqlFill branch and fixture
- [x] Decision 12 + phase-03 (labs bullet, docker bullet, dry-run counts, Create list, success criteria) + phase-06 (deltas, docs bullet, walkthrough): propagate the string amendment + safety README
- [x] plan.md Overview/Verification/Success Criteria: file counts 236→237, "8 docker files + 1 authored safety README"

#### Impact on Phases
- Phase 3: question kind table loses the sqlFill implementation row; labs emission gains one documented string amendment; docker copy gains the authored README (counts updated everywhere); success criteria updated.
- Phase 6: parity-delta record rewritten for the now-AMENDED (not dangling) setup reference and the shipped README; docs bullet no longer conditions on a README.md pointer.

### Whole-Plan Consistency Sweep (validation session 1)
Re-read `plan.md` + all six `phase-*.md` after propagation. Checks: no remaining "pinned in validation" hedges in decisions 1/5/12; no remaining `____`→`___` references outside the cut-note in decision 1; docker file counts consistent (plan.md Overview/Verification/criteria ↔ phase-03 overview/bullet/Create/criteria ↔ phase-06 deltas); the red-team deferred list annotated as resolved; decision 2 order, decision 7 anchor, decision 13 hardening, decision 14 restructure untouched by this session. Unresolved contradictions: **none**.

## Verification

- `npm test` — full suite (parity, renderers, migration, existing gh/fixture tests)
- `npm run content:check` — all 4 packs validate; every used kind has a handler
- `npm run content:extract-dp800 -- --dry-run` — counts echo: 3 domains, 11 modules,
  43 lessons, 179 questions (104/15/60 pools), 3 labs, 2 exams, 4 comparisons,
  8 docker files + 1 authored safety README; re-run without `--dry-run` is
  deterministic (byte-identical JSON)
- `npm run build` — green; mermaid in an async chunk, not the entry bundle
- `npm run lint` — oxlint over `src` + `scripts`
- Manual (phase 6): hub home card, 7 tabs (revision renders the house
  placeholder), 4 themes, keyboard/reduced-motion
  a11y pass, compare sample tabs, case-study exam sitting, lab reveal toggles,
  migration devtools round-trip
