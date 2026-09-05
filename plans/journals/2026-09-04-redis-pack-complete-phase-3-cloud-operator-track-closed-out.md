---
title: "Redis pack complete: phase 3 Cloud Operator track closed out all three certifications"
date: 2026-09-04
summary: "Verified official 65q/90min 8-domain outline reshaped phase 3; delivered 8 domains/lessons, 65 questions, 3 labs, third mock exam, README row; plan done"
---

# Redis pack complete: phase 3 Cloud Operator track closed out all three certifications

## What happened
Phase 3 of the Redis pack (plans/260903-1753-redis-subject/) delivered on `feat/redis-pack`, uncommitted: the research step superseded the plan's assumptions — the real Redis Certified: Associate Cloud Operator exam is 65q/90min/70% with EIGHT weighted domains (Architecture 9% … Data access 12%), not 60q/60min/3-groups. User picked the faithful structure: 8 domains D12-D19, 8 modules+lessons (1:1), 65 questions whose per-domain pools equal the exam's official-weight draws (6/7/11/10/9/7/7/8), 3 labs, exam redis-cloud-mock-1 (65q/90min/700, seed 20260905), README installed-packs row. Plus the two phase-1 deferred minors: rc-q-01-bank-12 renamed/moved to rc-q-07-bank-4 (security), and a Jedis 7.2 RedisClient version note in lesson 08.

Authoring ran as five parallel subagents (per-write jq validation). One agent died mid-run on an API 429; resuming it from its transcript with SendMessage preserved its context and cost nothing — the corrected lesson-14 id went into the resume message. Cloud terminology guardrails held throughout: Essentials/Pro tier names, Active-Passive (not "Replica Of"), no hibernation (doesn't exist), "Enterprise" never a Cloud tier.

Code review PASS_WITH_MINORS, zero critical/high; all five findings fixed inline (labs check reword, Jedis RedisClient disambiguation, lesson-17 docId swap rs→rc, no-eviction → noeviction, JS snippet comment). Post-fix gates: content:check 5/5, vitest 613/613 (one transient timing flake, two consecutive clean runs), oxlint clean, build OK. Click-through: 19 domains in Learn, 9 labs, per-domain practice, ALL THREE mock exams live.

## Decision
- Research-over-plan when a phase's own step 1 orders verification: the exam outline research was authoritative, and the user approved the 8-domain restructure at the gate (bigger scope: ~65q/8 lessons vs ~45q/3).
- Lesson-vs-question fact divergence (Datadog/New Relic monitoring integrations): verified against live docs rather than trusting either agent — lesson was right, questions were conservatively silent; no change.
- Unverifiable-but-sourced facts ("free 30MB DB deleted after 14 days idle", from a support article): kept in lessons with attribution, kept out of questions. Reviewer endorsed.
- ak plan index: `--status done` is not in the CLI's vocabulary; files carry `status: done` (canonical), index gets `ak plan close` post-commit per the files-first model.

## Next steps
- Commit phase 3 as `feat: add Redis Cloud Operator track + README` with explicit paths (exclude the pre-existing ui-redesign untracked artifacts), then `ak plan close learning-hub/260903-1053`.
- PR feat/redis-pack → main (holds phases 1-3) per user's preference — merge vs PR is the user's call at commit time.
- Known accepted quirks: passingScore 700 on the hub's 100+900× scale = 66.7% raw vs official 70% (hub-wide convention, disclosed); cloud bank pools equal exam draws so the seed only orders the paper.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
