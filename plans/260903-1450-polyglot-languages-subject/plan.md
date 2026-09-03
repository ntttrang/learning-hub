---
title: "Polyglot Hub → Languages subject pack"
description: "Move ntttrang/polyglot-hub (Java/Go/Python/Ruby revision site) into Learning Hub as one 'Languages' content pack — vendor the donor, extract the pack, prove parity, import old progress, then archive the source repo."
status: in-progress
priority: P1
effort: "13h"
tags: [content-pack, migration, extraction, progress-migration]
blockedBy: []
blocks: []
created: 2026-09-03
---

# Polyglot Hub → Languages subject pack

## Overview

**Outcome:** the four-language revision content from `ntttrang/polyglot-hub`
(Java, Go, Python, Ruby — learn lessons, labs, practice problems, framework
challenges, 424 quiz questions (109/105/105/105 per language), 9 cross-language compare topics) lives in the
unified hub as **one subject pack**, `content/languages/`, reachable at
`#/subject/languages`, with one-time import of any progress the standalone
polyglot app left in the browser. The source repo is archived after the pack
ships. No core-code changes: the hub's pack model is designed so a new subject
is data only.

**Why one pack, not four:** the user asked for "a Languages subject"
(singular), and the schema forces it — `Comparison` is pack-level, so the
cross-language compare tool (a core polyglot feature, 9 topics × 4 language
columns) has no home in a four-pack split. The four languages become four
**domains** inside one pack; the hub's learn/labs/practice/exams/compare/notes/
revision tools all work unchanged.

**Constraints:** zero edits to `src/sdk/`, `src/engines/` core behavior, or
routing — the only `src/` additions are the new progress-migration engine
(`migrate-polyglot-progress.ts`, same pattern as the three existing migrate
engines) and its wiring in `App.tsx`. Content fidelity: donor values move
verbatim; every authored transformation (renames, derivations, kind remaps) is
marked inline in the extractor and covered by a parity test. The pending
`260821-1457-ui-redesign-brand-conformance` plan restyles existing surfaces and
explicitly touches no schema/engine/content — no blocking relationship either
way; the new pack inherits whatever styles are live when it lands.

## Decisions (locked)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | One pack `content/languages/` (id `languages`, code `LANG`), four language domains | User asked for "a Languages subject"; `Comparison` is pack-level so compare needs one pack |
| 2 | Accent token `captain-red` (unused today; polyglot's Java accent) | Keeps brand-token discipline; no free-form hex |
| 3 | Vendor the source app verbatim as `learn-polyglot/` — exclude all dotfiles (`.git`, `.github`, `.npmrc`, `.env`, editor scratch), `node_modules/`, and the donor's quiz-generator scratch script; record the cloned donor HEAD SHA in the README donor row and the plan journal | Repo convention: donors are vendored build inputs, extractors + parity tests run against them; after the source repo is archived, the SHA is the only provenance tie to donor history |
| 4 | Extraction is a one-off provenance script `scripts/extract-polyglot-pack.ts` (`npm run content:extract-polyglot`, `--dry-run` supported) | Same pattern as `extract-dp800-pack.ts` / `extract-gh600-pack.ts` |
| 5 | Open-ended content that has no gradable question kind becomes labs: practice problems, framework challenges, and `coding` quiz questions | `LabStep` carries `hint`/`solution`/`expectedOutput`/`checks` — the exact shape of polyglot's self-checked exercises (their UI graded coding as self-check `correct = true`) |
| 6 | `output` quiz questions → `fill` questions (plain unfenced code text + one blank — the hub renders fill templates inside `<pre>`, no markdown); `fill` maps via `accept` → `alternatives` | Hub `fill` is the only free-text-answer kind; polyglot graded output as trim-exact free text |
| 7 | One sampled mixed exam (10 questions per language domain, fixed seed, 60 min) — no fabricated exam content | gh-200/gh-900 precedent: engine-sampled exam over the real question pool (gh-600 exams are `fixed`, not the precedent); `sampled` selection exists for exactly this |
| 8 | One-time progress import from polyglot's `prh-progress` localStorage key, following the dp-800 engine's full pattern: sibling guard key (donor key never deleted), pack-installed gate, size bounds, referential-integrity filter, persisted read-back before arming the guard | README documents this pattern for the three retired donors; "move" implies continuity without risking the only copy of donor progress |
| 9 | Archive `ntttrang/polyglot-hub` after the pack is verified live on the hub's Pages deploy (observable signal, not the old site) — user decision, 2026-09-03 | Donors are retired once absorbed; reversible (unarchive). Archived repos' Pages sites stay live frozen with no visitor notice, so the old site cannot serve as a verification signal |
| 10 | Difficulty map: `junior→beginner`, `mid→intermediate`, `senior→advanced` | Closest tiers in the hub's `DifficultyTier`; `challenge` reserved, unused |
| 11 | Donor lesson `tags` and `DocLink.note` strings are dropped as marked extractor derivations (hub `LessonSchema`/`ReferenceSchema` are strict and have no such fields); each drop carries a parity count assertion; lab-doc notes additionally stay visible inlined in lab step instructions | Fidelity constraint is satisfied honestly: losses are named, counted, and tested — never silent |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Vendor donor + scaffold pack](./phase-01-vendor-and-scaffold.md) | Done | 1h |
| 2 | [Extract content pack](./phase-02-extract-content-pack.md) | Done | 6h |
| 3 | [Parity + quality gates](./phase-03-parity-and-gates.md) | Done | 2h |
| 4 | [Progress migration](./phase-04-progress-migration.md) | Done | 3h |
| 5 | [Docs + retire source repo](./phase-05-docs-and-retire-source.md) | In progress | 1h |

Dependencies: 2 needs 1; 3 needs 2; 4 needs 2 (id map); 5 needs 3 + 4.

## Success Criteria

- [ ] `learn-polyglot/` vendored with all dotfiles excluded and the donor HEAD SHA recorded; extractor (lib-split, entry-guarded) + npm script committed; re-running it reproduces `content/languages/` byte-identically with zero scaffold ghost files
- [ ] `content/languages/` passes `npm run content:check` and appears on the home rail with honest modes; every donor entity is present exactly once — 100 learn lessons + 4 framework overviews, 16 labs, 20 practice problems, framework challenges, 424 quiz questions (minus those remapped to labs), 9 compare topics (parity test proves counts + verbatim bodies)
- [ ] Known remaps and drops are lossless in meaning, not just count: `output`→`fill` keeps code + accepted answer in a plain-text template; `_____` markers collapse to `___`; `fill` keeps `accept` as alternatives; coding/practice/framework-challenge land as labs with starter, solution, expected output; dropped lesson `tags` and doc `note` strings are counted in parity assertions, never silent
- [ ] Old polyglot progress imports once from `prh-progress` with the dp-800 hardening: referential filter vs the installed pack (coding-quiz results land in `completedLabs`, not orphan SRS cards), size bounds, sibling guard key — the donor key is never deleted; silent when the key is absent; idempotent
- [ ] Full local gate green: `npm run lint && npm test && npm run content:check && npm run build`; CI green on the PR; entry-chunk size delta recorded; pack verified live on the hub's Pages deploy after merge
- [ ] README layout/unified-platform sections and `docs/unified-learning-hub-plan.md` inventory updated; `ntttrang/polyglot-hub` archived

## Risks & Mitigations

| Risk | Signal it bit | Pre-decided response |
|------|---------------|----------------------|
| Schema validation rejects mass-converted content (strict-schema fields the donor has but the hub lacks — lesson `tags`, `DocLink.note` — and the donor `_____` fill marker vs the hub's `___`) | `content:check` failures in bulk during Phase 2 | Known cases are pre-solved as marked extractor derivations (decision 11, fill-marker rewrite); anything new fails the extractor's in-script `validatePack` with per-file diagnostics; fix in the transform, never by weakening schemas |
| Donor ids collide after normalization | Extractor uniqueness assertion fires | Red-team verified the premise false: donor ids are already globally unique and kebab-clean across all files. The id helper is `plg-` + verbatim id with a uniqueness assertion that fails loudly; no silent suffixing. Parity bijection is computed through the shared helper function, not a prefix-string rule |
| Hub `fill` grader normalization differs from polyglot's | Learner marks correct answers wrong in smoke test | Direction verified: the hub grader (`normalizeBlank`: trim + whitespace-collapse + bracket-strip + case-fold) is a **looser superset** of polyglot's trim-exact (output) and trim+lowercase (fill) grading — nothing polyglot accepted is rejected; the hub additionally accepts case-insensitive matches. The Phase 3 probe documents the superset behavior with real grader calls; the grader is never touched |
| ~0.5 MB of new pack JSON lands in the entry bundle | `vite build` output size delta | Known and accepted (red-team correction): the content glob is `eager: true` — all packs ship in the entry chunk today; there is no lazy path to enable without a core-code change this plan excludes. Phase 3 records the before/after entry-chunk size as an accepted delta; lazy loading stays out of scope |
| Archived repo leaves the standalone site frozen while browsers still write `prh-progress` to it | (Accepted boundary) | The frozen site stays publicly reachable with no notice (archived-repo Pages behavior). The one-time import covers progress existing at import time; post-archive writes on the frozen site are out of reach — the archive was an explicit user decision made knowing this |
| HubHome badge artwork is hardcoded to the four known subjects | Languages card renders the accent+code fallback artwork | Known limitation, verified in `HubHome.tsx` — cosmetic only; artwork conformance belongs to the pending `260821-1457` UI-redesign plan, not this one |

## Open Questions

None.

## Red Team Review

### Session — 2026-09-03
**Reviewers:** Security Adversary (Fact Checker), Failure Mode Analyst (Flow Tracer), Assumption Destroyer (Scope Auditor) — Full tier, 5 phases.
**Raw findings:** 22 → **17 deduplicated**, all with `file:line` or live-donor evidence; **all accepted** and applied. Severity after dedup: 6 High, 7 Medium, 2 Low, 2 verification corrections.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Import engine lacked dp-800 hardening: referential filter, size bounds, pack-installed gate, sibling guard key + persisted read-back ("consume the raw key" would risk destroying the only copy of donor progress) | High | Accept | Phase 4, decision 8 |
| 2 | Coding-quiz progress orphaned: those ids became labs, so quiz→SRS seeding unconditionally creates dead cards | High | Accept | Phase 4 |
| 3 | Donor fill marker is `_____`, hub splits on `___` — 1 hard validation failure, 64 mangled renders | High | Accept | Phase 2 |
| 4 | Lesson `tags` has no field in the strict hub `LessonSchema` — all 100 lessons fail Zod validation | High | Accept | Phase 2, decision 11 |
| 5 | Parity test importing the dp-800-style extractor would execute a full extraction mid-suite (no entry guard) | High | Accept | Phase 2 (lib split + guard), Phase 3 |
| 6 | Scaffold ghost files (`welcome` lesson/question, `d-foundations`) survive the write-only extractor → guaranteed `unresolved-ref` | High | Accept | Phase 2 (extractor prunes pack dir) |
| 7 | Risk-row premise false: content glob is `eager: true`, no lazy path exists | Medium | Accept | plan.md risk row, Phase 3 size gate |
| 8 | Post-archive sanity check can't fail (archived Pages stays live, no notice); archive needs an observable hub-deploy signal | Medium | Accept | Phase 5, decision 9 |
| 9 | rsync excludes don't match the no-dotfile criterion; donor SHA unrecorded | Medium | Accept | Phase 1, decision 3 |
| 10 | Decision 7 cited wrong precedent (gh-600 exams are `fixed`; sampled precedent is gh-200/gh-900) | Medium | Accept | plan.md decision 7 |
| 11 | Collision premise false (donor ids already globally unique + kebab); suffix rule contradicted parity bijection | Medium | Accept | plan.md risk row, Phase 2, Phase 3 |
| 12 | `output→fill` template put markdown fences into a plain-text `<pre>` renderer; stem rendered twice | Medium | Accept | Phase 2, decision 6 |
| 13 | 41 donor `DocLink.note` strings dropped silently; labs have no `docIds` | Medium | Accept | Phase 2, decision 11 |
| 14 | Grader-delta direction inverted (hub grader is the looser superset) | Low | Accept | plan.md risk row, Phase 3 probe |
| 15 | Phase filenames off-by-one vs contents | Low | Accept | all files renamed |
| 16 | Count corrections: 424 questions (not ~436); 16 labs (4/language); 100 lessons + 4 framework overviews | Low | Accept | plan.md, Phase 2/3 criteria |
| 17 | HubHome badge artwork hardcoded to four known subjects — Languages gets the fallback card | Low | Accept (note) | plan.md risk row (owned by pending `260821-1457` UI-redesign plan) |

**Also verified clean:** `prh-progress` key/shape confirmed against the live donor; exam pools feasible after the coding→labs remap (92/89/89/91 per domain ≥ 10 drawn); `captain-red` unused; zero-core-code-edits holds; all 235 mcq/multi questions have 4 options, non-empty explanations, no dangling answers; donor ids 100% kebab-clean.

### Whole-Plan Consistency Sweep

- Files reread: `plan.md`, all five `phase-*.md` (post-apply)
- Decision deltas checked: 17 (one per accepted finding)
- Reconciled stale references: old phase filenames (renamed everywhere, table links updated), "consume the raw key" semantics (now sibling-guard wording in plan.md decision 8 + success criteria + Phase 4; remaining mentions are the correction notes themselves), question count 436→424 (plan overview + Phase 2/3 criteria), id-helper ownership (`src/engines/polyglot-ids.ts` as the single source, extract lib re-exports — Phase 2 + Phase 4 agree), `polyglot-extract-lib.ts` as the only parity-test import path (Phase 2 architecture + Phase 3 step 4)
- Unresolved contradictions: 0

