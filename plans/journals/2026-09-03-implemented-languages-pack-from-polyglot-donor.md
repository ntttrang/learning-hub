---
title: Implemented Languages pack from polyglot donor
date: 2026-09-03
summary: "Cooked plans/260903-1450-polyglot-languages-subject end to end: vendored donor, 472-file pack via guarded extractor, parity suite, prh-progress import engine, docs; gates green, review fixed, PR opened"
---

# Implemented Languages pack from polyglot donor

## What happened
- Phase 1: vendored ntttrang/polyglot-hub@fa0019eb as learn-polyglot/ (all dotfiles excluded), scaffolded content/languages, README donor row.
- Phase 2: scripts/polyglot-extract-lib.ts (pure builders + derivation log) + guarded extract-polyglot-pack.ts entry (validateSubject pre-write, prune+write). 472 files: 104 lessons, 361 questions, 123 labs, 9 comparisons, 1 sampled exam. Derivations counted: 209 tags, 19 doc notes, 66 fill-marker rewrites, 1 blank replication, 63 coding→labs.
- Phase 3: donor-backed parity suite (12 tests: counts, id bijection via shared helper, verbatim-or-derived fidelity, grader superset probe). Bundle: 2,249,590 → 2,852,035 entry bytes (accepted, eager glob).
- Phase 4: migrate-polyglot-progress.ts — sibling guard cc-polyglot-progress-migrated, donor key never deleted, pack gate, size bounds, referential filter, persisted read-back. Coding quiz results route to completedLabs; SRS counters max-not-accumulate (found via browser smoke: StrictMode double-effect exposed accumulating counters).
- Code review (blocker + 4 minors): tsc -b was red from a test-only type error my own edit introduced post-gate (fixed `?? {}`); parity now asserts the extractor's derivation log deep-equals donor recomputes; per-entry lab caps; param order aligned to (store, source).

## Decision
- Engine derives quiz-id destinations from the loaded pack's id sets instead of importing the extractor's remap map — same referential guarantee, no scripts→engines dependency.

## Next steps
- PR opened; after merge + Pages deploy: verify Languages live on the hub, then archive ntttrang/polyglot-hub (user-sequenced decision).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
