---
title: "Plan: Phase 4 DP-800 pack migration"
date: 2026-08-20
summary: "Full ak-plan cycle for roadmap Phase 4: red-teamed, validated 6-phase plan to port learn-dp-800 into content/dp-800"
---

# Plan: Phase 4 DP-800 pack migration

## What happened
Ran the full ak-plan cycle (scope challenge -> research/planner -> red team -> validation -> hydration -> set active) for roadmap Phase 4 of docs/unified-learning-hub-plan.md: migrate the learn-dp-800 Next.js donor into a hub content pack. Deliverable: plans/260820-1811-phase-4-dp-800-pack/ (plan.md + 6 phase files, 28 checklist tasks) — `ak plan parse`/`validate` clean, set as active plan.

Red team (4 reviewers, 15 accepted findings, all applied): renderer registration re-anchored to src/App.tsx (main.tsx anchor was in no test graph); extractor pinned to deep per-file donor imports (the src/lib/content.ts aggregator's `@/` aliases fail under tsx — empirically proven); pack-parity.test.ts restructured with GH_PACK_IDS scoping (golden-papers loop TypeErrors on dp-800's mock-1, doc-links loop asserts links>0); progress migration hardened with a verify-persisted guard before the one-shot flag (storage adapter swallows setItem quota errors); mermaid render ids made per-render unique (StrictMode double-invoke otherwise degrades figures to <pre>).

## Decision
5 scope questions resolved in the validation interview (Validation Log, session 1):
- sqlFill->fill conversion branch CUT (0 authored donor items; re-add ~5 lines if one ever appears).
- Docker environment stays published under public/dp-800/docker/ (donor parity, ~1.8 MB accepted).
- Live mermaid kept (lazy chunk, verified in phase 6); no pre-rendered SVG baking.
- The one "(see the Setup page)" prerequisite string (donor labs.ts:17) is amended at extraction to point at the bundled docker env — the single documented exception to verbatim.
- Authored safety README ships inside public/dp-800/docker/ (lab-local dev credentials public by design, all-interface bindings, 127.0.0.1 advice); the 8 copied files stay byte-identical.

Also recorded: "zero core-code edits" reconciled — renderer-carrying packs need 2 registration imports + 3 shared-ui surfaces (Mermaid.tsx, ComparisonBody, engine-labels.ts) as pack-enabling seams.

## Next steps
Handoff chosen: cook now -> /ak:cook plans/260820-1811-phase-4-dp-800-pack/plan.md (task list hydrated: phases 1-6, deps 1->2->3->{4,5}->6). Donor learn-dp-800/ stays read-only throughout.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
