---
phase: 2
title: "Software Operator Track"
status: todo
priority: "P1"
effort: "1d"
dependencies: [1]
---

# Phase 2: Software Operator Track

## Overview

Add the three Software Operator domains (install/upgrade, cluster ops,
monitoring/troubleshooting), ~3 lessons, ~45 questions, 2-3 labs, and the
60-question/60-min Software Operator mock exam sampling core + swops domains.

## Requirements

- Functional: Redis Software (Enterprise) operator content — install, cluster
  lifecycle, database provisioning, backup/restore, monitoring, troubleshooting.
- Non-functional: all gates green; no core-code changes; content original.

## Key Insights

- Real exam: 60 questions / 60 min / passing 70% (= scaled 700) / 2-yr validity;
  prep path "Operate Redis Software" — Redis Software/Enterprise administration.
- Exam samples core domains too — core lessons from Phase 1 are reused as-is
  (DRY); only track deltas authored here.

## Related Code Files

- Modify: `content/redis/domains.json` (+3), `modules.json` (+~5), `docs.json`
  (+6-8 redis.io/Redis Enterprise docs links), `exams.json` (+1 exam)
- Create: `lessons/lesson-rc-swops-*.json` (3), `questions/*-swops-*.json` (~45)

## Implementation Steps

1. (If Phase 1 step 2 deferred) verify Software Operator outline via browser
   fetch of the Redis University course page; refine swops domain defs/weights.
2. Extend `domains.json` (+3 domains, provisional weights):
   - `rc-swops-install` Redis Software install/upgrade (requirements, bootstrap,
     licenses, certificates, upgrades, software security patches)
   - `rc-swops-cluster` cluster & database ops (node add/remove, rack awareness,
     DMC, database provisioning/limits, endpoint, backup/restore, live migration)
   - `rc-swops-ops` monitoring & troubleshooting (metrics, alerts, logs, job
     scheduler, support bundle, common failure playbooks)
3. Extend `docs.json` with Redis Enterprise docs pages (install, cluster
   manager, backup, monitoring).
4. Lessons: 3 domain lessons + modules (2 per domain).
5. Questions: ~45 (15 per domain), same kind mix; every question answerable from
   swops lessons + linked docs.
6. Labs (2-3): install/bootstrap walkthrough; backup & restore; alert/metric
   triage. Written walkthroughs.
7. Mock exam `redis-swops-mock-1`: 60 questions, durationMinutes 60,
   passingScore 700, sampled domainPlan over core + swops domains (core trimmed
   toward persist/ha/security for ops focus), seed recorded.
8. Gates + six-mode click-through; conventional commit
   `feat: add Redis Software Operator track`.

## Todo

- [ ] Verify outline (if deferred) + extend domains/docs/lessons
- [ ] ~45 swops questions
- [ ] 2-3 labs
- [ ] Software Operator mock exam (60q/60min/700)
- [ ] Gates green + click-through + commit

## Success Criteria

- [ ] Gates green; 10 domains total; swops exam samples 60q across core+swops
- [ ] Content original; Redis Enterprise specifics cited via docs.json links

## Risk Assessment

- Redis Software admin UI evolves fast; beta exam format may shift. Mitigation:
  provisional wide weights; content anchored to current official docs, exam
  sampling tolerates drift. Signal assumption broke: official docs contradict
  authored lessons → update lessons before exam publication.
- 60-min/60q format is beta-era; if Redis changes it, edit one exam object.

## Security Considerations

- No secrets; public docs links only.
