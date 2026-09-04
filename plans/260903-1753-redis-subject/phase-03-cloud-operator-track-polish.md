---
phase: 3
title: "Cloud Operator Track + Polish"
status: todo
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

- [ ] Verify Cloud Operator outline + finalize weights
- [ ] Extend domains/docs/lessons (13 domains, 13 lessons total)
- [ ] Extend questions (~45) + labs (2-3)
- [ ] Cloud mock exam (60q/60min/700)
- [ ] README row + all gates + commit/PR

## Success Criteria

- [ ] 13 domains; ~180 questions; 3 mock exams mirroring real formats
- [ ] All gates green; six modes work; README row present
- [ ] Contract acceptance criteria (brainstorm report) all satisfied

## Risk Assessment

- Cloud exam format unverified — research-first ordering (step 1) bounds the
  risk to question/lesson counts, not structure. Signal assumption broke:
  official page shows a different question count/duration → edit one exam
  object + adjust domainPlan totals; domain structure survives.
- README merge conflict with `feat/languages-pack` — one-line row; rebase on
  main before merge resolves it.

## Security Considerations

- No secrets; public docs links only.
