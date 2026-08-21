---
title: plan phase 6 hub polish scoped around in-flight search
date: 2026-08-21
summary: "Phase 6 planned: land in-flight ⌘K search, achievements, cross-subject review queue, dashboard, scaffolder"
---

# plan phase 6 hub polish scoped around in-flight search

## What happened
- Scouted Phase 6 (hub polish) of docs/unified-learning-hub-plan.md: plans 0–5 all completed, five packs installed.
- Found a complete, tested ⌘K search stack uncommitted in the working tree (src/engines/search.ts, src/shell/search-entries.ts, src/shell/TopbarSearch.tsx + tests, AppShell topbar redesign with streak chip; 26/26 focused tests passing) — verified by running them.
- Created plans/260821-1135-phase-6-hub-polish (ak CLI scaffold; valid; set as current plan): 6 execution phases — land search baseline → achievements store → cross-subject review queue (#/review) → dashboard aggregation → content:new scaffolder → end-to-end verification.
- Hydrated 6 tasks with dependency chain (1→2→3→4, 5∥2-4, 6 last).

## Decision
- Land the in-flight search as-is rather than re-plan it; phase 1 verifies + commits it.
- Achievements are hub-level in cc-subject-data, computed from store state alone (donor dp-800's 2 content-dependent defs dropped for 2 volume-based ones); importLegacyData awards achievements but never bumps streak.
- Review queue is a new hub-level ReviewQueue view over question-registry primitives (QuizRunner is single-subject coupled); records per-subject partial attempts with scope 'hub-review'.
- Scaffolder stamps minimal-but-real content (1 domain/lesson/question, enabledModes learn+practice) so the pack is genuinely working and satisfies the modes↔content integrity contract.

## Next steps
- /ak:cook plans/260821-1135-phase-6-hub-polish/plan.md (user-selected handoff).
- Phase 7 (CI/CD + GitHub Pages) remains the final roadmap phase after this.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
