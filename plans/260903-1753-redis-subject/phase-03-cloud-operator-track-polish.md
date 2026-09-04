---
phase: 3
title: "Cloud Operator Track + Polish"
status: done
priority: "P1"
effort: "1d"
dependencies: [2]
---

# Phase 3: Cloud Operator Track + Polish

## Overview

Add the three Cloud Operator domains (subscription/database management,
security/HA, operations), ~3 lessons, ~45 questions, 2-3 labs, the 60q/60min
Cloud Operator mock exam, and the README/docs refresh that closes the contract.

## Requirements

- Functional: Redis Cloud operator content — account/subscription setup,
  database creation & configuration, security (CIDR allowlist, TLS, ACL),
  HA (replication, Active-Active), backup/restore, monitoring/alerts,
  maintenance/upgrades.
- Non-functional: all gates green; README installed-packs row; content original.

## Key Insights

- Cloud exam format unverified as of planning — research step first, then
  author; plan for 60q/60min/70% unless research corrects it.
- Prep path: "Redis Cloud deployment & operations → security, scaling,
  troubleshooting" (Redis University).

## Related Code Files

- Modify: `content/redis/domains.json` (+3 → 13 total), `modules.json` (+~5),
  `docs.json` (+6-8 Redis Cloud docs links), `exams.json` (+1 exam),
  `README.md` (installed-packs row)
- Create: `lessons/lesson-rc-cloud-*.json` (3), `questions/*-cloud-*.json` (~45)

## Implementation Steps

1. Verify Cloud Operator outline (browser fetch Redis University course page +
   study guides); pin exam format + domain names; correct weights.
2. Extend `domains.json` (+3 domains, provisional → confirmed weights):
   - `rc-cloud-subscription` account, subscription & database management
     (plans, database creation, capabilities, sizing, limits)
   - `rc-cloud-security-ha` security & HA (CIDR allowlist/VPC peering, TLS,
     ACL, replication, Active-Active geo-distribution)
   - `rc-cloud-ops` operations (backup/restore, monitoring/alerts, maintenance
     windows, upgrades, scaling, troubleshooting)
3. Extend `docs.json` with Redis Cloud docs pages.
4. Lessons: 3 domain lessons + modules (2 per domain).
5. Questions: ~45 (15 per domain), same kind mix.
6. Labs (2-3): subscription+database creation walkthrough; security config
   (CIDR/TLS/ACL) walkthrough; backup/restore + Active-Active walkthrough.
7. Mock exam `redis-cloud-mock-1`: 60 questions, durationMinutes 60,
   passingScore 700, sampled domainPlan over core + cloud domains, seed recorded.
8. README: add Redis row to the installed-packs sentence/structure (README
   "Unified platform" section lists packs; also mention the three certification
   tracks) — merge-trivial vs in-flight branches.
9. Full gate: content:check + test + lint + build; restart dev server; click
   through all six modes; verify all three mock exams run and scale pass at 700.
10. Conventional commit `feat: add Redis Cloud Operator track + README`; open
    PR to `main` (or merge per user preference).

## Todo

- [x] Verify Cloud Operator outline + finalize weights
- [x] Extend domains/docs/lessons (13 domains, 13 lessons total; 19 delivered — 8 official cloud domains/lessons after the research correction)
- [x] Extend questions (~45) + labs (2-3; 65 questions + 3 labs delivered)
- [x] Cloud mock exam (60q/60min/700; delivered 65q/90min/700 per the verified official format)
- [x] README row + all gates + commit/PR (commit pending)

## Success Criteria

- [x] 13 domains; ~180 questions; 3 mock exams mirroring real formats (19 domains; 201 questions — 65 cloud vs ~45 planned; 3 mock exams)
- [x] All gates green; six modes work; README row present
- [x] Contract acceptance criteria (brainstorm report) all satisfied

## Risk Assessment

- Cloud exam format unverified — research-first ordering (step 1) bounds the
  risk to question/lesson counts, not structure. Signal assumption broke:
  official page shows a different question count/duration → edit one exam
  object + adjust domainPlan totals; domain structure survives.
- README merge conflict with `feat/languages-pack` — one-line row; rebase on
  main before merge resolves it.

## Security Considerations

- No secrets; public docs links only.

## Progress note — 2026-09-04 (phase 3 complete, commit pending)

Research superseded the plan's outline: the official Cloud Operator exam is
65q / 90min / 70% ($175, 2-yr validity) across EIGHT weighted domains
(Architecture 9, Subscription administration 11, Database administration 17,
Security 15, Networking 14, Monitoring 11, Automation 11, Data access 12) —
[research report](../reports/researcher-260904-1609-cloud-operator-exam.md).
User decision: structure the track as the 8 official domains (D12-D19) instead
of the plan's 3 groups — bigger than the plan estimate (~65 questions vs ~45,
8 lessons vs ~3).

Terminology corrections enforced from research: Essentials (Free/Paid) /
Essentials with Redis Flex / Pro tier names; Active-Passive for Cloud geo (not
"Replica Of"); no hibernation (feature does not exist); "Enterprise" never a
Cloud tier.

Delivered on `feat/redis-pack` (uncommitted): domains.json +8 (D12-D19,
weights centered on official %s), modules.json +8 (codes 12-19), docs.json +8
WebFetch-verified rc-* entries, 8 flagship lessons, 65 questions (per-domain
pools 6/7/11/10/9/7/7/8 = exam draws exactly; kind mixes per spec; 24 kc wired
to lessons), labs.json +3 (subscription-db → lesson 13, security → lesson 15,
monitoring → lesson 17), exam redis-cloud-mock-1 (65q/90min/700, domainPlan
mirrors official weights exactly, seed 20260905), README installed-packs row +
three tracks.

Also delivered the two phase-1 deferred minors: rc-q-01-bank-12 renamed
rc-q-07-bank-4 and re-filed to rc-core-security/m-security-config (types pool
18→17, security 6→7; all three exam plans remain feasible); lesson rc-l-08
Jedis 7.2 version note (RedisClient replaces JedisPool/JedisPooled, verified
against the live Jedis docs page).

Authoring: five parallel subagents with per-write jq validation; one agent
(questions 12-14) hit a transient API rate limit mid-run and was resumed from
its transcript with a corrected lesson-14 id (rc-l-14-cloud-db-admin) — no
corrupted content landed.

Review: code-reviewer PASS_WITH_MINORS
([report](../reports/code-reviewer-260904-1606-cloud-track.md)); zero
critical/high; all findings fixed — labs free-plan check reword ("two
free-plan facts"), lesson-08 "Jedis's own RedisClient" disambiguation,
lesson-17 docId rs-monitoring-alerts → rc-active-active, rc-q-14-bank-1
distractor no-eviction → noeviction, rc-q-14-bank-8 snippet # → // comment.
Commit hygiene: the two pre-existing ui-redesign untracked artifacts stay out
of the commit (explicit paths).

Gates after fixes: content:check 5/5 · vitest 613/613 (one transient
unrelated timing flake at the 17:54 run; two consecutive clean full runs
after) · oxlint clean · build OK. Six-mode click-through: 19 domains in Learn
(cloud KC graded Correct), 9 labs, per-domain practice, ALL THREE mock exams
live — dev 65q/90min, swops 60q/60min, cloud 65q/90min with timer.

Reviewer info notes (record, no action): cloud bank pools equal exam draws so
the paper includes the whole cloud bank (seed orders it); passingScore 700 on
the engine's 100+900×scale = 66.7% raw vs official 70% — hub-wide convention,
disclosed in the exam description.

Agent reports:
[manifests/lessons 12-15/exam/README](../reports/agent-260904-1606-cloud-manifests-lessons-12-15.md)
· [lessons 16-19](../reports/agent-260904-1606-cloud-lessons-16-19.md) ·
[questions D12-D14](../reports/agent-260904-1606-cloud-questions-12-14.md) ·
[questions D15-D16 + labs](../reports/agent-260904-1606-cloud-questions-15-16-labs.md)
· [questions D17-D19](../reports/agent-260904-1606-cloud-questions-17-19.md).

Docs impact: README row delivered as part of the phase; no docs/ surface
change.
