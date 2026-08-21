---
title: "Phase 5 GH-600 Pack"
description: "Roadmap Phase 5 of docs/unified-learning-hub-plan.md: port learn-gh-600's static HTML + markdown content — 6 domains, 23 study-plan topics, 390 unique questions (360 exam + 30 quiz, zero overlap), 8 fixed exams, 8 labs — into a validated content/gh-600 pack via a script extractor, prove question-for-question parity against the donor arrays, and migrate the donor's passed-domain progress once."
status: completed
priority: P1
effort: "3d"
tags: [content, migration, extraction]
blockedBy: []
blocks: []
created: 2026-08-20
---

# Phase 5 — GH-600 Pack (HTML → data)

## Overview

Execute **roadmap Phase 5** of the unified hub plan (`docs/unified-learning-hub-plan.md` §7):
port `learn-gh-600` — the "Agentic AI Developer" static-HTML study companion — into a
validated `content/gh-600/` pack with **zero core-code registration** (discovery stays glob +
validation). Unlike Phase 3's typed-TS donor, this donor is plain HTML with embedded JS data
arrays plus markdown lab files, so the phase adds a **script extractor** that parses the donor
files and a **parity test** that pins the extraction against the donor arrays
question-for-question. Roadmap acceptance: *GH-600 exams + study plan + labs run through the
shared engines.*

Phases 0–3 are complete (platform, SDK, engines, UI, gh-200/gh-900 packs). Roadmap Phase 4
(DP-800) is **not planned yet** — this plan neither blocks on nor blocks it; GH-600 needs only
the Phase 0–2 platform.

## Scope Challenge

- **Existing code:** full SDK + engines + UI (Phases 0–2 ✅); `content:check` integrity gate;
  tolerant pack loading; Phase-3 precedents for script extraction (`scripts/extract-gh-packs.ts`),
  parity testing (`src/content/pack-parity.test.ts`), and one-time progress migration
  (`src/engines/migrate-gh-progress.ts` + `App.tsx` call). All reused; no new abstractions.
- **Requested scope:** roadmap Phase 5 in full — GH-600 usable in the hub: study plan (learn +
  practice), 8 exams, 8 labs through the shared engines.
- **Complexity:** ~418 generated content files (script-assisted, not hand-authored);
  1 extractor script + shared capture lib + converter/parity tests; 1 small progress shim; no
  SDK/UI/engine edits (sole `src/shell` touch: the installed-pack count pin in
  `views.test.tsx`, which must flip when `gh-600` installs).
- **Selected mode:** **HOLD SCOPE** (hard-equivalent: scout ✅, no external research; red-team +
  validation gates run).

## Evidence Base (scout findings, all paths repo-relative)

### Donor inventory (`learn-gh-600/`)

| Donor file | Contents | Extraction role |
| --- | --- | --- |
| `gh600-study-plan-captain-corgi.html` | `const DOMAINS=[…]`: 6 domains `{id, icon, name, weight, desc, topics[], quiz[]}` — **23 topics** (5+4+3+3+4+4) with HTML bodies, **30 quiz questions** (5/domain) | Curriculum: domains, modules, lessons, quiz questions |
| `gh600-mock-exam-captain-corgi-{1..5}.html` + unnumbered twin | `const Q=[…]`: **60 single-choice questions** (`{d, dt, q, opts[4], ans, exp}`), 120 min, pass 700/1000. **All six files carry an identical Q array** (verified: captured arrays are `JSON.stringify`-equal across all six — the pin the extractor/parity re-asserts; no bare md5, whose value depends on the capture span) | ONE mock exam (see Locked Decisions) |
| `gh600-practice-exam-captain-corgi-{1..7}.html` | Same shape: **50 questions each**, 90 min, pass 700/1000 — 7 distinct sets | 7 practice exams |
| `docs/practice-example-{1..7}.md` | Markdown sources of the 7 practice exams (official domain titles live here) | Cross-check + domain titles |
| `docs/labs/lab-00-bootstrap.md` … `lab-07-capstone.md` (descriptive names, no bare `lab-NN.md`) + `README.md` + `scaffold/` | 8 labs across **four section shapes** — lab-00 (no Domain objectives/Self-check/Anti-patterns; has `Exam practice connection`), lab-01 (the only lab with `Common anti-patterns to avoid`), labs 02–06 (common template), lab-07 (has `Required artifacts` + `Completion criteria`; no product path/Self-check). Shared core: Objective / Scenario / `### N.` steps / Validation checklist | 8 labs |
| `gh600-labs-captain-corgi.html` | Index page only (card one-liners per lab) | Lab summaries |
| `index.html`, `gh600-mock-exams-index.html` | Navigation shells (iframes) | Not extracted — hub navigation replaces them |
| `gh600-mock-exam.html`, `gh600-study-plan.html` | Unbranded older twins | Not extracted (branded set is canonical) |

**Question volume (computed with the locked dedup key):** 30 quiz + 60 mock + 7×50 practice =
440 instances → **390 unique questions** (360 unique across the exam HTMLs — the 50 collapses
are all intra-practice sharing, none between mock↔practice; 30 quiz with **zero** quiz↔exam
overlap). All questions are `single` kind with 4 options, an answer index, and an explanation.

**Donor progress keys:** `gh600sp_html` and `gh600sp_captain_corgi_html` hold
`{cur, tab, passed: [0..5]}` — passed-domain numbers only; exams persist nothing.

### Hub contract (phases 0–2, verified)

- Pack layout: `content/<id>/subject.json`, `domains.json`, `modules.json`, `labs.json`,
  `exams.json`, optional `comparisons.json`/`docs.json`; per-item `lessons/*.json`,
  `questions/*.json` (`src/sdk/content-source.ts`).
- Question ids `o1..oN`, `Answer = string[]`; `single` correct = one option id
  (`src/sdk/types.ts`).
- Validator enforces graph refs, answerable questions, and mode backing
  (`enabledModes` entries need non-empty backing collections, `src/sdk/validate.ts:572-581`).
- Vitest include is `src/**` only (`vite.config.ts`); scripts are typechecked by
  `tsconfig.scripts.json` (node types). Tests under `src/` compile against
  `tsconfig.app.json` (`types: ["vite/client"]`, **no node types**) — so any test importing
  `node:fs` (donor reads) must live under `scripts/`, not `src/`.
- Donor parsing trust: `learn-gh-600` is a **third-party submodule** (captain-corgi repo,
  pinned by commit in git). Captured `const X=[…]` segments evaluate via `node:vm`
  `runInNewContext` with a bare sandbox — no `require`/`process`/globals reachable — in both
  the extractor and the parity suite; content is data-to-validate, never trusted code.
- ID conventions from Phase 3: `gh200-d1`, `gh200-d1-q01`, `lesson-gh200-d1`, `gh200-lab-01`.

## Locked Decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Mock exams | The five numbered mock files are **identical copies of one 60-question exam**, not five distinct sets (verified: `JSON.stringify`-equal captured arrays across all six files). Extract **one** `gh600-mock-1`. If the donor later diverges them, re-run and re-pin. |
| 2 | Domain metadata | Titles use the **official names** from `docs/practice-example-*.md` headers (e.g. "Prepare Agent Architecture and SDLC Processes"); weights parse from "15–20%" (en-dash) into `{min,max}`. |
| 3 | Modules | GH-600 has no sub-skill layer: **one module per domain** (`gh600-d1-mod`…), holding that domain's topic lessons; all questions carry that domain's moduleId, so module practice serves the domain's **full deduplicated bank** (donor quiz + exam questions, ~14–29 per domain — a superset of the donor's 5-question quiz, not an equivalence). |
| 4 | Lessons | 23 topics → 23 lessons (`lesson-gh600-d1t1`…), donor topic ids preserved. `minutes: 8` uniform (estimated — donor has none). Body HTML → core blocks per the mapping table in Phase 1. |
| 5 | Domain quizzes | The donor's per-domain quiz becomes **module-scoped practice questions**, not lesson knowledge-checks (`lesson.questionIds` stays empty). The donor's quiz questions are fully contained in module practice; exam questions join the same scope by design (recorded trade-off: a larger practice pool than the donor's quiz). |
| 6 | Question dedup | Dedup key = normalized stem + options + correct answer. First occurrence wins in processing order **quizzes → mock → practice 1..7** (quiz-derived ids anchor lessons' domain). Near-duplicates stay distinct. |
| 7 | Exam selection | All 8 exams use **`{kind:'fixed'}`** preserving donor authored order — the donor shuffles at runtime, the hub serves deterministic papers; parity pins the authored array. |
| 8 | Labs | 8 labs (`gh600-lab-00..07`) from `lab-00-bootstrap.md`…`lab-07-capstone.md`; domain pinning: 00→d1 (prereq), 01→d1, 02→d2, … 06→d6, 07→d6 (capstone). `minutes` estimated (30–60). Per-shape mapping (Phase 3 table): product-path/alternative-tools/required-artifacts → leading context step; anti-patterns (lab-01 only) → trailing step; self-check (labs 01–06) and `Exam practice connection` (lab-00) → appended `checks` entries; `Completion criteria` (lab-07) → `checks`; `scaffold/…` links → inline code (donor-repo paths, not hub URLs). |
| 9 | Subject metadata | `id: gh-600`, `code: GH-600`, title "Agentic AI Developer", accent **`deep-teal`** (free token; gh-900=corgi-orange, gh-200=hub-green, fixture=sky-cyan), disclaimer carrying the donor's "GH-600 beta" note, `enabledModes: [learn, labs, practice, exams, notes, revision]` (no `compare` — no standalone comparison data). |
| 10 | Old progress | One-time shim `gh600sp_html`/`gh600sp_captain_corgi_html` → mark all lessons of each passed domain completed, following the `migrate-gh-progress` pattern (own module + migrated-flag + `App.tsx` call **inside the existing hydration-gated `run()`** — a bare `useEffect` would write pre-hydration and be wiped by the persist merge while the flag is already set). |

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `content/gh-600` pack loads clean through the existing glob discovery + Zod + graph validation — zero SDK/engine/UI code edits (sole shell touch: the placeholder-count test pin) | P1 |
| 2 | Study plan: 6 domains / 6 modules / 23 lessons render in `learn` with fidelity-preserving block conversion | P1 |
| 3 | 390 unique questions (360 exam + 30 quiz) power `practice` (per-domain banks) and 8 fixed exams (1×60q/120min + 7×50q/90min, pass 700) in `exams` | P1 |
| 4 | 8 labs render in `labs` with steps, checks, outcomes | P1 |
| 5 | Parity test pins donor↔pack equality (questions, exams, labs, curriculum) — the roadmap's "keep originals until parity verified" | P1 |
| 6 | Donor passed-domain progress migrates once into hub progress | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Extractor + curriculum](./phase-01-extractor-curriculum.md) | Completed |
| 2 | [Phase 2: Question bank + exams](./phase-02-question-bank-exams.md) | Completed |
| 3 | [Phase 3: Labs](./phase-03-labs.md) | Completed |
| 4 | [Phase 4: Parity tests + progress shim](./phase-04-parity-tests-progress-shim.md) | Completed |
| 5 | [Phase 5: End-to-end verification](./phase-05-end-to-end-verification.md) | Completed |

## Success Criteria

- [x] `npm run content:check` passes with `gh-600` among installed packs (schema + graph + mode backing).
- [x] Parity test proves: 6 domains / 23 lessons / 30 quiz + 60 mock + 350 practice question instances map to exactly **390 unique questions**; each of the 8 exams serves exactly its donor questions (stem, options, correct answer, explanation) in authored order; 8 labs match the donor-derived step formula (`###` step count + 1 context step where product-path/required-artifacts exists + 1 anti-patterns step in lab-01).
- [x] `learn` renders 23 lessons across 6 domains; blocks faithfully carry the donor's tables, callouts, code, and anti-pattern pairs.
- [x] `practice` serves per-domain banks (donor quiz fully contained); `exams` lists 8 exams with correct durations/pass marks; `labs` lists 8 labs.
- [x] Donor `passed` domains appear as completed lessons after the one-time migration.
- [x] Full `npm test`, `npm run lint`, `npm run build` green (gh-600 changeset: 0 failures; the two failing tests observed during delegation were the concurrent DP-800 session's in-flight `src/ui/Mermaid*` files); GH-600 renders under Auto/Light/Dark/Night (shared theme machinery, `deep-teal` token validated).
- [x] No edits under `src/sdk`, `src/engines`, `src/ui`, `src/shell` except the progress shim + its call + the `src/shell/views.test.tsx` installed-pack count pin (flips when `gh-600` installs) + vite test-include extension for `scripts/`. Donor-reading tests live under `scripts/` (node types), never `src/`.

## Out of Scope

- Donor index/mock-exams-index navigation pages (hub navigation replaces them).
- Copying `docs/labs/scaffold/` into the hub (paths stay donor-repo references).
- New question kinds, block kinds, or engine behavior — donor content fits existing kinds.
- Roadmap Phase 4 (DP-800) — separate plan, no dependency either way.

## References

- Roadmap: `docs/unified-learning-hub-plan.md` §7 Phase 5, §8 integrity contracts.
- Phase-3 precedent: `plans/260820-1311-phase-3-gh-200-gh-900-packs/plan.md`.
- Extractor pattern: `scripts/extract-gh-packs.ts`; parity pattern: `src/content/pack-parity.test.ts`;
  migration pattern: `src/engines/migrate-gh-progress.ts`.

## Red Team Review

Three hostile reviewers (Security Adversary + Fact Checker, Failure Mode Analyst + Flow Tracer,
Assumption Destroyer + Scope Auditor; Full tier) reviewed the plan against the live repo.
24 raw findings → **12 accepted after dedup + evidence filter** (all had `file:line` backing;
none rejected for lack of evidence); all 12 applied with user approval on 2026-08-20.

| # | Sev | Finding (confirmed by) | Applied fix |
|---|-----|------------------------|-------------|
| 1 | High | Lab "same template" false — 4 section shapes, 3 unmapped headings, wrong filenames (all 3 reviewers) | Per-shape mapping table + real filenames in Decision 8 + Phase 3 |
| 2 | High | `src/shell/views.test.tsx:33-36` hardcodes placeholder counts that break on install | Count-pin exception added to Scope + Success Criteria + Phase 1 file list |
| 3 | High | `node:fs` in `src/` test fails `tsc -b` (no node types in `tsconfig.app.json`); cited `pack-parity.test.ts` precedent is false; new hard submodule dependency unguarded | Parity suite relocated to `scripts/gh600-parity.test.ts`; fail-closed donor-existence guard |
| 4 | High | Eval justification false — donor is a third-party submodule; `new Function` has full scope access; plan moved eval into `npm test` | `node:vm` bare-sandbox eval in extractor + tests; trust model documented |
| 5 | High | Shim wired as its own `useEffect` would write pre-hydration and be wiped by persist merge with the flag already set — silent permanent loss | Call goes inside the existing hydration-gated `run()`; ordering regression test |
| 6 | High | `scripts/gh600-extract-lib.ts` referenced by Phase 4 but never created; precedent CLI runs at import top level — test import would regenerate content before asserting | Phase 1 creates the side-effect-free capture lib; CLI thin-wraps it |
| 7 | Med | Phase 4 step-count pin (`== donor ### count`) contradicts Phase 3's added context/anti-pattern steps | Explicit donor-derived step formula in both phases |
| 8 | Med | Bank is 390 (360 exam + 30 quiz, overlap 0), not ~360; plan self-contradicted in 4 places | 390 pinned everywhere; intra-practice-only dedup stated |
| 9 | Med | md5 literal `1e418759…` not reproducible without a capture-span definition (3 reviewers, 3 spans) | Replaced with `JSON.stringify`-equality pin (stronger, span-free) |
| 10 | Med | md cross-check pattern wrong: donor numbers questions `**1.**`, not `1.` | Real pattern + domain-header title/weight pins in Phase 4 |
| 11 | Med | 3 of 5 phase-table links broken (post-rename) | Links corrected |
| 12 | Low | "practice-by-module == donor quiz" overstates — module practice serves the full domain bank (superset) | Decisions 3/5 and Goal 3 reworded honestly |

Verified-true claims that survived attack: byte-identical mock Q arrays (stringify-equal ×6);
DOMAINS shape 6/23/30; mock per-domain counts 10/14/7/10/10/9; practice 7×50; PASS/MINS
metadata; fixed-exam authored order via `assemblePaper`; mode-backing staging; `deep-teal`
free; legacy progress keys + 0-based domain ids; block-pattern inventory fully covered by the
converter table; topic-body markup census clean.

## Validation Log

### Session 1 — 2026-08-20
**Trigger:** Plan Context `mode=prompt` validation gate after the red-team review
**Questions asked:** 4
**Verification pass:** skipped per guard — `## Red Team Review` carries the verification
evidence (Fact Checker 26 claims, Flow Tracer, Scope Auditor); no `[UNVERIFIED]` tags.

#### Questions & Answers

1. **[Tradeoffs]** Module practice for GH-600 serves a superset of the donor's 5-question
   per-domain quiz. Keep that, or scope practice to quiz questions only?
   - Options: Full domain bank | Quiz-only scope
   - **Answer:** Full domain bank
   - **Rationale:** No question is practice-invisible; recorded as a deliberate superset in
     Locked Decisions 3/5.
2. **[Risks]** Donor embedded-JS evaluation containment for extractor + parity test?
   - Options: node:vm bare sandbox | vm + data-shape allowlist | new Function + commit pin
   - **Answer:** node:vm bare sandbox
   - **Rationale:** Proportionate containment for commit-pinned third-party submodule content.
3. **[Assumptions]** How does the one-time migration map donor passed-domain numbers onto hub
   lesson progress?
   - Options: Mark all domain lessons | No progress writes | No migration
   - **Answer:** Mark all domain lessons
   - **Rationale:** Matches the donor's domain-granular model; one-time, flagged, hydration-safe.
4. **[Risks]** Behavior when the `learn-gh-600` submodule is not checked out and `npm test`
   runs (first test-time donor read in this repo)?
   - Options: Fail closed | Skip with warning
   - **Answer:** Fail closed
   - **Rationale:** Parity must never silently evaporate on a green build.

#### Confirmed Decisions
- Practice scope: full domain bank (superset) — matches applied plan text.
- Eval containment: `node:vm` bare sandbox — matches applied plan text.
- Shim semantics: mark all lessons of each passed domain — matches applied plan text.
- Missing donor: fail closed with `git submodule update --init` message — matches applied
  plan text.

#### Action Items
- None — all four answers confirm the post-red-team plan state; no edits required.

#### Impact on Phases
- None. Every validated decision was already applied during red-team finding fixes
  (Decisions 3/5/10, phase-01/04 eval + fail-closed text); validation confirmed them.

### Whole-Plan Consistency Sweep
Swept all six files (plan.md + phases 01–05) after the red-team fixes and this session:
- Phase-table links resolve to actual filenames (5/5).
- Volume figures consistent: 440 instances → 390 unique everywhere (frontmatter, Evidence
  Base, Goal 3, phase-02, phase-04 literal, phase-05 perf note ~418 new files).
- Step-count formula identical in plan.md Success Criteria, phase-03 Architecture, phase-04
  item 4.
- No remaining "same template", "~360", md5-literal, `src/content/gh600-parity`, or
  "practice == quiz" claims; Goal 1/Scope/Success Criteria exceptions all name the
  `views.test.tsx` count pin consistently.
- Unresolved contradictions: **none**.
