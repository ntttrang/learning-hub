# Plan authored: Phase 3 — GH-200 + GH-900 packs (unified learning hub)

**Date:** 2026-08-20
**Plan:** `plans/260820-1311-phase-3-gh-200-gh-900-packs/`
**Mode:** auto → hard-equivalent (internal scout, no external research)
**Outcome:** validated, red-teamed, active for implementation

## What was decided

Roadmap Phase 3 of `docs/unified-learning-hub-plan.md`: port learn-gh-200's two
subjects into `content/gh-900/` (153 files) and `content/gh-200/` (112 files)
via `scripts/extract-gh-packs.mts`, with four enabling code changes — content-seam
fault tolerance, deterministic file ordering, golden-paper parity tests, and a
one-time progress migration shim. Six phases, ~3d effort, HOLD SCOPE.

Key forks resolved with the user: subSkills → modules; migration shim in-phase;
notes + revision enabled for both packs; answer-less donor exam attempts
migrate score-only; `practiceStats` and per-domain exam counts dropped with a
logged note.

## What the red team caught (worth remembering)

30 raw findings → 14 unique, all applied. The three that would have hurt:

1. **The lenient `listSubjects()` cut disabled the CI gate it was meant to
   serve.** `loadAllContent()` derives from `listSubjects()`, so making it
   fault-tolerant would have made `content:check` structurally unable to fail.
   Fix: strict source, tolerant shell (per-pack try/catch over enumerated ids).
   Lesson: when a load path doubles as a CI oracle, fault tolerance must be a
   separate path, not a relaxation of the oracle.
2. **The Phase 5 mapping table described a payload that doesn't exist.** The
   plan had pinned the storage key but invented field names (per-question
   attempts, streaks, text-based order answers). Real payload:
   `lessonsRead` keyed by *domain* id, `labsDone`, aggregate `practiceStats`,
   exam attempts whose answers are numeric indexes. Lesson: a storage key is
   not a shape — pin shapes from source before writing mapping tables.
3. **Golden papers rested on undocumented behavior.** Vite's glob emission
   order isn't a contract in v8; parity snapshots would have been pinned to an
   implementation accident. Fix: explicit path sort in the file source.

## Validation interview

Four questions post-apply: donor drift → one-shot manual re-run (no drift CI);
per-domain exam counts → drop, don't approximate; bundle growth over ~2× →
measure now, redesign later as a follow-up plan; sequencing → checkpoint after
Phase 2 (GH-900 usable) before Phase 3.

## Next

`/ak:cook` on the plan, Phase 1 first (fault tolerance + extractor). Donor
stays read-only throughout.
