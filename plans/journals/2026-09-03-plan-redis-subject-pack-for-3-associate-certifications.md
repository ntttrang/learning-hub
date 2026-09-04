---
title: Plan Redis subject pack for 3 Associate certifications
date: 2026-09-03
summary: "Brainstorm + plan: one content/redis pack covering Redis Associate Developer (Java), Software Operator, Cloud Operator exams; phased build approved"
---

# Plan Redis subject pack for 3 Associate certifications

## What happened
- `/ak-brainstorm`: redis.io/certificates is a deprecation page → live program at university.redis.io (JS SPA). Exam formats verified via search: Developer (Java) 65q/90min; Software Operator 60q/60min/70%; Cloud Operator format unverified.
- Contract accepted by user: ONE `content/redis/` subject (not 3 packs — DRY, shared core domains), phased delivery, track order Developer-Java → Software Op → Cloud Op. Report: `plans/reports/brainstorm-260903-1731-redis-subject.md`.
- `/ak-plan` (fast mode — proven 5× pack pattern, no core-code changes): plan at `plans/260903-1753-redis-subject/` (3 phases: scaffold+core+dev, swops, cloud+polish). Schema mapped from `src/sdk/validate.ts` + shipped packs; passingScore scaled /1000, 700 = 70% pass; accent `deep-teal` (captain-red taken); scaffold via `npm run content:new`.
- User selected `/ak:cook` at handoff. Tasks #1-#3 hydrated with sequential deps; `ak plan use` pinned the plan.

## Decision
- One subject, 13-domain union model: 5 shared core domains sampled by all three mock exams + per-track domains; one sampled mock exam per certification mirroring real formats.
- Weights provisional (wide min/max) until official outlines verified in Phase 1 step 2 — Cloud Operator format is the main open fact.

## Next steps
- `/ak:cook plans/260903-1753-redis-subject/plan.md` — Phase 1: branch `feat/redis-pack` from main, verify outlines, scaffold, author ~90q + 7 lessons + labs + 65q dev mock exam.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
