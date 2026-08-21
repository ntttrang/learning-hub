---
title: "Phase 5 GH-600 pack planned, red-teamed, validated"
date: 2026-08-20
summary: Roadmap Phase 5 (learn-gh-600 → content/gh-600) planned as 5 phases; red-team 12/12 findings applied; 4 validation decisions confirmed
---

# Phase 5 GH-600 pack planned, red-teamed, validated

## What happened

- Created `plans/260820-1812-phase-5-gh-600-pack/` (plan.md + 5 phase files) for roadmap
  Phase 5: parse `learn-gh-600` donor HTML/md into a `content/gh-600` pack
  (6 domains, 23 lessons, 390 unique questions, 8 fixed exams, 8 labs) via
  `scripts/extract-gh600-pack.ts` + donor-anchored parity test + one-time progress shim.
- Red team (Security Adversary/Fact Checker, Failure Mode Analyst/Flow Tracer,
  Assumption Destroyer/Scope Auditor): 24 raw findings → 12 accepted (all evidence-backed),
  all applied with user approval. Material corrections: donor labs have 4 section shapes
  (not 1) with 3 unmapped headings and real filenames `lab-00-bootstrap.md`…; bank is
  390 unique (360 exam + 30 quiz, zero overlap), not ~360; md5 literal replaced with
  JSON.stringify-equality pin; parity suite relocated to `scripts/` (node:fs breaks
  `tsc -b` under `tsconfig.app.json`); eval moved to `node:vm` bare sandbox (donor is a
  third-party submodule, not same-repo); shim call must live inside the hydration-gated
  `run()` in `App.tsx` (pre-hydration writes get wiped by persist merge with flag set);
  `src/shell/views.test.tsx` placeholder-count pin flips on install.
- Validation interview (4 questions): full domain bank practice (superset), node:vm bare
  sandbox, mark-all-domain-lessons migration, fail-closed on missing donor. All matched
  the post-red-team plan text — zero propagation edits.
- Tasks hydrated: 5 phase tasks chained 1→5.

## Decision

- Locked 10 decisions recorded in plan.md (mock dedup to one exam, per-domain modules,
  fixed-order exams, per-shape lab mapping, deep-teal accent, no compare mode).
- Verification pass of validate-workflow skipped per guard (Red Team Review carries
  evidence); Failed: 0 → plan eligible for implementation.

## Next steps

- Implement via `/ak:cook /Users/trang_thi_thuy.n/GIT/learning-hub/plans/260820-1812-phase-5-gh-600-pack/plan.md`
  (best practice: /clear first).
- Future CI (roadmap Phase 7) must check out submodules — parity fails closed without donor.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
