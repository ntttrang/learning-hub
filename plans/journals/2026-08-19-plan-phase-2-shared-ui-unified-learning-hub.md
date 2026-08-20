---
title: "Plan: Phase 2 Shared UI (unified learning hub)"
date: 2026-08-19
summary: Created plans/260819-2348-phase-2-shared-ui — 7-phase plan reconciling donor UIs into src/ui/; validation passed; hydration done
---

# Plan: Phase 2 Shared UI (unified learning hub)

## What happened

Planned roadmap Phase 2 (Shared UI) of docs/unified-learning-hub-plan.md via
/ak:plan (fast mode — architecture already locked in the roadmap §2; no
external unknowns). Deliverable: plans/260819-2348-phase-2-shared-ui/ with
plan.md + phase-01…phase-07 (deps/spikes → routing+workspace → markdown+blocks
→ question renderers+practice → learn/labs/compare → exam engine+review →
notes+e2e polish). `ak plan validate` passed. Runtime tasks #1–#7 mirror the
phases with a sequential blockedBy chain.

## Decision

10 key decisions recorded in plan.md, the load-bearing ones:
- react-markdown + remark-gfm + rehype-highlight (dp-800 stack) for markdown
  bodies; gh-200's InlineText tokenizer ported for structured string fields;
  docId-only link convention preserved against the pack docs registry.
- Question registry renderers upgraded in-place with an additive
  `revealed?: boolean` param; graders and scoring stay frozen.
- Exam runner = gh-200 wall-clock deadline + in-flight resume + auto-submit,
  plus dp-800 timed/untimed toggle and case-study cards; in-flight sitting
  persisted as `cc-exam-inflight` through StorageAdapter.
- subjects.ts merges installed packs over placeholders by id; hash routes
  extended to `#/subject/:id/:mode[/:id[/…rest]]`.

## Next steps

- Folded 4 renderer-relevant findings from the stale Phase-6 background review
  into the plan (CRLF normalization, matching keys by leftIndex, defensive
  table rows, multi.correct duplicate-id validation).
- Infrastructure notes: scripts/set-active-plan.cjs is missing (MODULE_NOT_FOUND),
  and `ak plan use` fails because the workspace is not a git repository —
  reported to the user, not fixed (git init is a user decision).
- Handoff: validate already green; next is red-team (optional) or
  /ak:cook plans/260819-2348-phase-2-shared-ui/plan.md.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
