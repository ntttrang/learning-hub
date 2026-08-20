---
title: "Phase 3 GH-200 GH-900 Packs"
description: "Roadmap Phase 3 of docs/unified-learning-hub-plan.md: port learn-gh-200's two subjects into content/gh-200 + content/gh-900 packs via a script extractor, prove parity with golden exam papers, isolate per-pack load failures, and migrate old-app progress once."
status: completed
priority: P1
effort: "3d"
tags: [content, migration, feature]
blockedBy: []
blocks: []
created: 2026-08-20
---

# Phase 3 — GH-200 + GH-900 Packs

## Overview

Execute **roadmap Phase 3** of the unified hub plan (`docs/unified-learning-hub-plan.md` §7):
port `learn-gh-200`'s two subjects — GH-900 (7 domains, 34 subSkills, 140 questions,
7 labs, 2 exams) and GH-200 (5 domains, 41 subSkills, 100 questions, 6 labs, 2 exams,
2 comparisons) — into validated packs under `content/gh-900/` and `content/gh-200/`,
with **zero core-code registration** (discovery is glob + validation). Plus the three
enabling code changes the migration surfaces: per-pack fault tolerance in the content
seam (the code comment at `src/shell/subjects.ts:87-93` defers it to "the second real
pack"), parity tests anchored on the donor's golden exam-paper snapshots, and a
one-time `gh-site-progress-v1` → `cc-subject-data` migration shim.

Phases 0–2 are complete — platform, SDK, engines, UI all live; `content/` holds only
`fixture/`. Evidence base: [reports/scout-report.md](./reports/scout-report.md)
(exact SDK contract, donor inventory, field-by-field delta, traps).

## Scope Challenge

- Existing code: full SDK + shell + UI (Phases 0–2 ✅); fixture pack as format
  reference; hub `engines/sampling.ts` is a **verbatim port** of the donor's sampler
  → golden papers byte-for-byte reproducible; donor ships its own parity tests.
- Requested scope: roadmap Phase 3 in full — both subjects usable, parity with old app.
- Complexity: ~265 generated content files (153 gh-900 + 112 gh-200,
  script-assisted, not hand-authored); 4 focused code changes; 0 new abstractions.
- Selected mode: **HOLD SCOPE** (auto-detected hard-equivalent: scout ✅, no external
  research; red-team + validation gates run).

## Locked Decisions

| Topic | Decision |
| --- | --- |
| Modules | SubSkills → modules (75 total); `question.moduleId` = subSkillId; each domain's lesson attaches to the domain's first module so prev/next nav works (user-confirmed) |
| Old progress | One-time shim `gh-site-progress-v1` → `cc-subject-data` in this phase (user-confirmed) |
| Modes | Both packs enable `notes` + `revision` alongside parity modes (user-confirmed; no content backing needed) |
| Lesson format | `.json` blocks (`h3`→`heading` level 3, `p`→`md`) — exact fidelity + scriptable; `.mdx` stays available for hand-authored packs |
| Option ids | Deterministic `o1..oN` per question — stable grading, enables the progress shim |
| Question files | `<domainId>-q<NN>.json` (zero-padded, authored order); pool order is pinned by an **explicit file-bucket path sort** in `createFileContentSource` (vite glob order is not a contract) → golden papers hold; `domainPlan` JSON key order preserved |
| Extractor | One-off `scripts/extract-gh-packs.ts` run via tsx — the donor's extensionless relative imports defeat Node-native type stripping, so the planned fallback became the path; imports donor `extractDocIds` (`learn-gh-200/src/utils/inline.ts`) so the docs partition uses the donor's own link semantics (code-span labels ARE links — a strip-spans-first scan missed `repo-deploy-workflow`; gh-200 docs 48→49 after the fix); provenance record for ~265 generated files + staged per-cert landing (no GH-600 reuse); under tsc + lint gates |
| Fault tolerance | Strict/lenient split: `listSubjects()`/`loadAllContent()` stay strict (content:check CI gate); shell enumerates ids and try/catches per pack — invalid pack skipped with console error, valid packs still listed |
| Metadata | Titles explicit ('GitHub Foundations' / 'GitHub Actions' — placeholders have none); subtitles **corrected** to real counts (7 / 5 domains — placeholder text wrongly says 4); descriptions verbatim; accents `corgi-orange` (gh-900) / `hub-green` (gh-200) |
| Donors | `learn-gh-200/` read-only — never mutated |
| Fill grading | Hub case-insensitive superset accepted (documented at `src/sdk/registry/questions.tsx:86-94`) |
| Legacy exam attempts | Answer-less donor attempts migrate **score-only** (empty answers/results, no SRS contribution); answered attempts get one bounded import-time grading pass; `practiceStats` aggregates dropped with a logged note (user-confirmed 2026-08-20) |
| Shim write path | Dedicated bulk-merge action (no recordQuiz/recordExam caps/streak/SRS side effects); idempotency via sibling localStorage key `cc-gh-progress-migrated` + deterministic legacy attempt ids; wired in App.tsx gated on persist hydration |

## Goals

| # | Goal | Priority |
| --- | --- | --- |
| 1 | `content/gh-900/` + `content/gh-200/` load, validate, and render through every enabled mode | P1 |
| 2 | Byte-identical exam papers (4 golden snapshots) + extraction-fidelity counts + inline doc-link scan as hub parity tests | P1 |
| 3 | Hub home survives an invalid pack (per-pack isolation) | P1 |
| 4 | Old-app progress carries over once, idempotently | P1 |

## Phases

| # | Phase | Status |
| --- | --- | --- |
| 1 | [Content-seam fault tolerance + extractor](./phase-01-start.md) | Done |
| 2 | [GH-900 pack](./phase-02-gh-900-pack.md) | Done |
| 3 | [GH-200 pack](./phase-03-gh-200-pack.md) | Done |
| 4 | [Parity tests](./phase-04-parity-tests.md) | Done |
| 5 | [Progress migration shim](./phase-05-progress-migration-shim.md) | Done |
| 6 | [End-to-end verification](./phase-06-end-to-end-verification.md) | Done |

## Success Criteria

- [x] `npm run content:check` green with `fixture` + `gh-900` + `gh-200` installed
- [x] Both subjects usable: Learn (prev/next nav), Labs, Practice (domain/subSkill/all),
      Exams (2 per subject, resume + review), Compare (gh-200), Notes, Revision
- [x] 4 golden papers match donor snapshots exactly; mock A/B disjoint
- [x] Parity tests green: extraction-fidelity counts per pack + every inline
      `[label](docId)` link resolves (schema invariants stay owned by
      `content:check` — the authoritative content gate)
- [x] Full `npm test` / `npm run lint` / `npm run build` green; bundle growth
      from eager-globbed packs recorded (Phase 2/3 checkpoints)
- [x] Old `gh-site-progress-v1` imported once (idempotent; absent key = no-op;
      answer-less exam attempts score-only)
- [x] An invalid pack no longer hides valid packs, and `content:check` still
      fails on it (unit-tested with ≥2 packs)

## Dependencies

- Completed upstream: `plans/260819-2132-phase-0-foundation-shell/` (3/3),
  `plans/260819-2230-phase-1-content-sdk-engines/` (6/6),
  `plans/260819-2348-phase-2-shared-ui/` (7/7). No open cross-plan dependencies.
- Read-only donor: `learn-gh-200/src/content/**` — plus `exams.test.ts` (golden
  lists, copied verbatim), `content.test.ts` (extractDocIds approach ported in
  Phase 4), `hooks/useProgress.ts` + `utils/grade.ts` (payload + answer
  semantics for the Phase 5 shim).

## Red Team Review

**Session — 2026-08-20.** Four reviewers (Fact Checker, Flow Tracer, Scope
Auditor, Contract Verifier) at Full tier over the drafted plan + scout report.
30 raw findings → deduplicated to 14 unique, all evidence-verified
(file:line or auto-reject). User disposition: **apply all** (13 Accept +
1 Accept-modified); two product questions resolved during disposition —
answer-less donor exam attempts migrate **score-only**, `practiceStats` dropped
with a logged note.

| # | Finding | Severity | Disposition | Applied to |
| --- | --- | --- | --- | --- |
| A | Lenient `listSubjects()` would disable the content:check CI gate (loadAllContent derives from it) — needed strict/lenient split + ≥2-pack strictness test | Critical | Accept | Phase 1, plan.md |
| B | Phase 5 mapping table invented payload fields; real shape is `lessonsRead` by domainId / `labsDone` / `practiceStats` / `examAttempts` only; order answers are numeric indexes | High | Accept | Phase 5 |
| C | Shim must not write via recordQuiz/recordExam (caps/streak/SRS side effects) — dedicated bulk-merge action; grading pass allowed at import | High | Accept | Phase 5 |
| D | In-store guard flag stripped by persist whitelist — sibling localStorage key `cc-gh-progress-migrated`; rehydration-path test | High | Accept | Phase 5 |
| E | Store-init wiring hits the create()-time rehydration trap — App.tsx effect gated on `persist.hasHydrated()` | Medium | Accept | Phase 5 |
| F | Golden papers rested on undocumented vite glob ordering — explicit file-bucket path sort in `createFileContentSource` | High | Accept | Phase 1, Phase 4 |
| G | Phase 4 re-asserted validator-enforced invariants + donor style pins — cut to goldens + counts + inline doc-link scan | Medium | Accept | Phase 4, plan.md |
| H | Phase 6 duplicated per-phase smokes and gates — slimmed to net-new only (build, theme, docs staleness, donor-untouched) | Medium | Accept-modified (keep phase, slim scope) | Phase 6 |
| I | Extractor justification cited GH-600 reuse that doesn't hold; tsx unneeded on Node ≥22.6; wrong test-file reference | Medium | Accept | Phase 1 |
| J | Placeholder subtitles say "4 domains" for both subjects (real: 7 and 5) and placeholders have no `title` — explicit corrected metadata | Medium | Accept | Phase 1, Phases 2–3 |
| K | `scripts/` outside tsc + lint gates | Medium | Accept | Phase 1 |
| L | Eager-glob bundle growth unmeasured — record build size at Phase 2/3 checkpoints as lazy-glob decision data | Medium | Accept | Phases 2–3, 6 |
| M | Extractor flag→directory mapping implicit; subject.id===dirName not asserted at startup | Medium | Accept | Phase 1, Phases 2–3 |
| N | Overstated "CI cannot pass with stale expectations" — only `views.test.tsx:35` hard-breaks; `:51-63` rots silently | Low | Accept | Phases 2–3 |

### Whole-Plan Consistency Sweep

After applying, reread all seven plan files end to end: decision deltas
propagated (strict/lenient split → Phase 1 architecture + plan.md fault-tolerance
row + success criteria; score-only migration → Phase 5 mapping + plan.md rows;
explicit sort → Phase 1 requirement + Phase 4 ordering note + question-files
decision row; corrected metadata → SUBJECT_META in Phase 1 + both pack phases;
bundle checkpoints → Phases 2, 3, 6). Stale references reconciled: GH-600
extractor-reuse claim (removed), `subjects.test.ts` reference (removed — file
doesn't exist), phantom Phase 5 payload rows (removed), Phase 6 duplicated
smoke checklist (removed), "invariants ported from questions.test.ts"
dependency line (removed). Unresolved contradictions remaining: **0**.

## Validation Interview

Session — 2026-08-20 (post red-team apply). Four critical questions, all
resolved by the user; no open questions remain.

| Question | Resolution |
| --- | --- |
| Donor drift after extraction (packs silently stale if learn-gh-200 edits content) | **One-shot, manual re-run** — extractor is the provenance record; no drift-check CI gate added |
| Donor per-domain exam counts vs hub's richer `ExamAttempt.perDomain` shape | **Drop, log once** — no approximate conversion (matches the Phase 5 mapping) |
| Eager-glob bundle growth exceeding the ~2× threshold | **Measure now, redesign later** — lazy-glob redesign becomes a follow-up plan, not in-plan scope creep |
| Implementation checkpointing | **Checkpoint after Phase 2** (GH-900 usable + verified) before continuing to Phase 3 |
