---
phase: 2
title: "Software Operator Track"
status: done
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

- [x] Verify outline (if deferred) + extend domains/docs/lessons
- [x] ~45 swops questions
- [x] 2-3 labs
- [x] Software Operator mock exam (60q/60min/700)
- [x] Gates green + click-through + commit (commit pending)

## Success Criteria

- [x] Gates green; 10 domains total (11 delivered: 8 + 3 swops); swops exam samples 60q across core+swops
- [x] Content original; Redis Enterprise specifics cited via docs.json links

## Risk Assessment

- Redis Software admin UI evolves fast; beta exam format may shift. Mitigation:
  provisional wide weights; content anchored to current official docs, exam
  sampling tolerates drift. Signal assumption broke: official docs contradict
  authored lessons → update lessons before exam publication.
- 60-min/60q format is beta-era; if Redis changes it, edit one exam object.

## Security Considerations

- No secrets; public docs links only.

## Progress note — 2026-09-04 (phase 2 complete, commit pending)

Structure decision: user chose 3 modules + 3 lessons (1:1 per domain, phase-1
convention) over the plan's literal "2 modules/domain" — 6-module variants
either left empty Learn-UI modules or exceeded "~3 lessons".

Authoring delegated to three parallel subagents with per-write jq validation
(phase-1 output-corruption defense); zero corruption events reached disk.
Primary-session hand-edits (exam domainPlan, review fixes) were each
jq-validated immediately.

Delivered on `feat/redis-pack` (uncommitted): domains.json +3 (D9
rc-swops-install 20-35%, D10 rc-swops-cluster 30-45%, D11 rc-swops-ops 25-40% —
weights provisional, beta exam weights unpublished), modules.json +3 (codes
09-11), docs.json created (8-entry docId registry, every URL WebFetch-verified
on redis.io), 3 flagship JSON lessons, 45 questions (15/domain; kind mix 6
single/2 multi/2 fill/2 codeReading/1 matching/1 order/1 bug each), labs.json
+3 (bootstrap, backup-restore, alert-triage), exam redis-swops-mock-1
(60q/60min/700, seed 20260904).

Exam domainPlan fix: the split authored in the primary session (13/16/16)
exceeded the 15-question swops pools (content:check exam-infeasible); corrected
to 15/15/15 + core 15 (types 3, keys 1, model 1, perf 2, cluster 3, persist 2,
security 3) = 60, every count ≤ its pool.

Review: code-reviewer PASS_WITH_MINORS
([report](../reports/code-reviewer-260904-0854-swops-track.md)); both minors
fixed post-review — 7 duplicated inline reference entries removed from the 3
lessons (docIds chips canonical per success criteria; rc-l-09 references now
[], rc-l-10 keeps create-db + recover, rc-l-11 keeps
logging/support-package/test-client), and rc-q-09-bank-7's stem now carries
"starting with the master node" with option b reworded.

Gates after fixes: content:check 5/5 · vitest 613/613 · oxlint clean · build
(tsc+vite) OK. Six-mode click-through passed on localhost:5173 (Learn lesson +
graded KC, Labs walkthrough, Practice run, 60q swops exam live with timer,
Notes/Revision match existing platform behavior). Reviewer info notes (no
action): 15/15/15 + fixed seed = identical paper every sitting (by design,
consistent with exam 1); rc-q-11-bank-5's "32,000-user" figure is
version-coupled.

Agent reports: [manifests/lessons/exam](../reports/agent-260904-0854-swops-manifests-lessons.md)
· [questions D9-D10](../reports/agent-260904-0854-swops-questions-09-10.md) ·
[questions D11 + labs](../reports/agent-260904-0854-swops-questions-11-labs.md).

Docs impact: none — content-only addition; README "Installed packs" row is
Phase 3 scope per plan.
