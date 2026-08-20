---
title: Phase 1 Content SDK plan authored
date: 2026-08-19
summary: "6-phase plan for roadmap Phase 1 (SDK, engines, fixture pack); validate gate next"
---

# Phase 1 Content SDK plan authored

## What happened
- Executed /ak:plan for roadmap Phase 1 of docs/unified-learning-hub-plan.md (Phase 0 shell already 100% complete).
- Scouted both donor apps: dp-800 src/lib (types 287L + srs/streak/scoring/progress/revision/store) and gh-200 content/types + utils (grade/score/sample). Confirmed both apps already share identical exam math (100–1000 scale, pass 700) — merge is safe.
- Scaffolded plans/260819-2230-phase-1-content-sdk-engines via ak CLI: 6 phases, 82 tracked tasks, validated OK.
- Mirrored phases into session task list with dependency chain.

## Decision
- content/ at repo root (per §5b glob path), src/content/registry.ts stays the typed aggregator.
- .mdx loaded raw (?raw + gray-matter), body → one md block; no @mdx-js pipeline (content is data, not code).
- Unified Answer = string[] (dp-800 encoding); question kinds single|multi|order|matching|fill|codeReading|bug.
- New persisted useSubjectDataStore key cc-subject-data, namespaced subjects[subjectId]; theme stays in Phase 0 store.
- Grading dispatch lives in sdk/registry/questions; engines/scoring consumes gradeQuestion (engines → sdk, never reverse).
- Open question flagged: unified fill grading case-folds (superset of gh-200 case-sensitive behavior); fallback pre-decided.

## Next steps
- /ak:plan validate on the new plan dir (user-selected).
- ak plan use failed: workspace not a git repo — plan pointer is files-only until git init.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
