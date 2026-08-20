---
title: "Phase 3 complete: GH-200 + GH-900 packs live in the hub"
date: 2026-08-20
summary: "Execution of plans/260820-1311-phase-3-gh-200-gh-900-packs: 265 content files extracted, golden-paper parity proven, fault-tolerant content seam, one-time progress migration shim; code review fixed and all gates green."
---

# Phase 3 complete: GH-200 + GH-900 packs live in the hub

**Date:** 2026-08-20
**Plan:** `plans/260820-1311-phase-3-gh-200-gh-900-packs/` (6/6 phases, closed)
**Outcome:** both GitHub subjects usable in the hub; parity with the old app proven by goldens

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.

## What shipped

- `content/gh-900/` (153 files: 7 domains, 34 modules, 140 questions, 7 labs,
  2 exams, 60 docs) and `content/gh-200/` (112 files: 5/41/100/6/2 + 2
  comparisons, 49 docs) — extracted by `scripts/extract-gh-packs.ts`, zero
  core-code registration (glob discovery + strict validation).
- Content-seam fault tolerance: strict source kept for the `content:check`
  oracle; the shell tolerates per-pack failures (invalid pack skipped, valid
  packs still listed). Question pool order pinned by explicit file-bucket path
  sort — vite glob order is not a contract.
- Parity tests (`src/content/pack-parity.test.ts`): the four donor golden
  exam papers reproduced byte-identically by the hub's `assemblePaper`,
  extraction-count pins, and an inline doc-link scan run through the donor's
  own tokenizer semantics.
- One-time progress migration (`src/engines/migrate-gh-progress.ts`):
  `gh-site-progress-v1` → `cc-subject-data` on first hub load — lessons,
  labs, exam attempts with donor index-based answers translated to option-id
  answers and graded; idempotent via sibling guard key + deterministic ids;
  hub data wins; no streak/SRS/caps on import.

## What actually bit (worth remembering)

1. **A code-span link label hid a doc reference.** The extractor's first
   strip-spans-then-regex scan missed `` [`.github/workflows/deploy.yml`](repo-deploy-workflow) ``
   — under the donor's tokenizer, code/bold win at the position they open and
   the `[` still matches a link with a code-span label. Fix: the extractor now
   imports the donor's `extractDocIds` directly, so link semantics cannot
   drift between the two apps (gh-200 docs 48→49). Lesson: when porting
   content, port the parser, don't approximate it.
2. **Vitest green ≠ tsc green.** All 432 tests passed while `tsc -b` failed —
   vitest transpiles without type-checking, and the SDK's open
   `ExtensionBlock`/intersection `Question` shapes defeat switch narrowing.
   The full `npm run build` stays in every gate chain.
3. **The plan's payload table was wrong and the code was right to deviate.**
   Re-verified donor `useProgress.ts` showed `perDomain` carries
   {correct,total} and maps cleanly; hub lessons use `lastVisited` (no
   `completedAt`). Plan corrected at implementation time, not after.
4. **Review caught the runner bypassing this phase's own fault isolation.**
   The migration looped strict `loadSubject()` bare — one invalid pack plus an
   unmigrated payload would have white-screened every load. Also: the donor
   records `[]` when a learner untoggles their last multi option; the shim now
   grades that wrong instead of dropping the whole attempt.

## Numbers (bundle decision data, red-team finding L)

Fixture-only baseline 1,098.83 kB / gzip 317.87 kB (pre-pack, measured
2026-08-20) → +gh-900 1,297.11/372.36 → +gh-200 1,477.36/425.14 → final with
shim 1,482.53/426.06. Pack JSON payloads 660/508 kB. Per-pack growth
≈0.30×/0.35× — far under the ~2× threshold, so the eager glob stands and the
lazy-glob redesign stays deferred.

## Final gates

`npm test` 434/434 (46 files) · `npm run build` (tsc -b + vite) green ·
`npm run lint` clean · `npm run content:check` 5/5. Donor `learn-gh-200/`
verified untouched. Remaining by user choice: the final manual end smoke
(both workspaces, exams end-to-end, compare links, legacy-import devtools
round-trip, pixel-level theme pass) at http://localhost:5173.
