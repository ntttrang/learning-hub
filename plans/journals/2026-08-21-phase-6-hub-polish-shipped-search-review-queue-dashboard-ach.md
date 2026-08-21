---
title: "Phase 6 hub polish shipped: search, review queue, dashboard, achievements, scaffolder"
date: 2026-08-21
summary: "All five roadmap Phase 6 deliverables landed, verified, and committed; plan closed 6/6."
---

# Phase 6 hub polish shipped: search, review queue, dashboard, achievements, scaffolder

## What happened
Executed plans/260821-1135-phase-6-hub-polish end to end (6 commits, 60cfe88..6d6dcda):
- 6.1 landed the in-flight topbar + global ⌘K search baseline as-is (engines/search.ts, TopbarSearch, search-entries).
- 6.2 added hub-level achievements: 8 definitions in engines/achievements.ts, awarded inside subject-store actions via withNewAchievements; importLegacyData awards but never bumps streak; SUBJECT_DATA_VERSION stays 1 with a tolerant merge.
- 6.3 added the cross-subject SRS review queue at #/review (engines/review-queue.ts, ReviewQueue reusing question-registry primitives, scope 'hub-review'), with a due-count badge on the rail.
- 6.4 added dashboard aggregation (engines/hub-stats.ts): stats band, per-card progress rows, due chips, achievements strip, continue links on HubHome.
- 6.5 added the add-subject scaffolder: npm run content:new (scripts/scaffold-subject.ts, pure buildStarterPack) stamps a minimal-but-real pack (1 domain, module, lesson, question; learn+practice) — the roadmap's done-when, verified end to end on a scratch id then removed.
- 6.6 ran all four gates green (583 tests, lint, tsc build, content:check), proved the pre-achievements profile upgrade as a permanent rehydrate test, and closed the plan.

## Decision
Code review (mandatory pass) flagged one High latent defect: ReviewQueue keyed session answers and checks by bare question.id while interleaving subjects, and the scaffolder stamps the same q-welcome into every new pack — two scaffolded packs would pre-lock and mis-grade each other's cards and persist wrong attempts. Fixed by keying state on subjectId:questionId, pinned by a new two-subject finish test that also asserts per-subject attempt recording; pack contexts now memoize at module scope like HubHome. Kept from the plan: achievements hub-level not per-pack; QuizRunner untouched (queue reuses registry primitives); placeholder cards stay stat-free.

## Next steps
- Phase 7 (CI/CD + deploy): static export + GitHub Pages workflow running the build, lint, tests, and content-integrity validation in CI.
- Optional follow-up flagged by review: align TopbarSearch pack loading with the module-scope memo pattern; due counts refresh on navigation but not on pure clock passage.
- Manual browser pass still open (automated coverage stands in): visual theme matrix (auto, light, dark, night) over search popover, review queue, dashboard band, rail badge.
- A vite dev server (PID 54591, port 5173) is running in a terminal tab from 11:28 — not started by this session, left untouched.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
