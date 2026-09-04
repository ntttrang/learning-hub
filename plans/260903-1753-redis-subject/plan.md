---
title: "Redis Subject Pack"
description: "One content/redis pack preparing all three Redis Associate certifications (Developer Java, Software Operator, Cloud Operator), built in three exam-ready phases."
status: pending
priority: P1
effort: "3.5d"
tags: [content, feature, redis]
blockedBy: []
blocks: []
created: 2026-09-03
---

# Redis Subject Pack

## Overview

Add a `content/redis/` pack to the unified hub covering all three Redis Associate
certifications — Developer (Java), Software Operator, Cloud Operator — as one
subject with shared core domains plus per-track domains. Contract, evidence, and
user decisions: [brainstorm report](../reports/brainstorm-260903-1731-redis-subject.md).

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Pack scaffold + shared core + Developer (Java) track with mock exam | P1 |
| 2 | Software Operator track with mock exam | P1 |
| 3 | Cloud Operator track with mock exam + README/docs refresh | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Scaffold + Core + Developer Java Track](./phase-01-start.md) | Done |
| 2 | [Software Operator Track](./phase-02-software-operator-track.md) | Pending |
| 3 | [Cloud Operator Track + Polish](./phase-03-cloud-operator-track-polish.md) | Pending |

## Cross-Plan Dependencies

None. `260821-1457-ui-redesign-brand-conformance` owns `src/ui`+styles (untouched
here); `260903-1450-polyglot-languages-subject` owns `content/languages`+scripts
(untouched here). Only shared surface is one README row in Phase 3 — merge-trivial.

## Success Criteria

- [ ] `npm run content:check` + `npm test` + `npm run build` green at every phase end
- [ ] Redis subject on home rail; `learn, labs, practice, exams, notes, revision` all work
- [ ] One mock exam per certification (65q/90min dev; 60q/60min operators, 70% pass =
      scaled 700) whose domainPlan mirrors that exam's domain structure
- [ ] Shared core domains sampled by all three mock exams; all content original with
      Redis Ltd. trademark disclaimer
- [ ] README "Installed packs" row added (Phase 3)

<!-- slug: redis-subject -->
