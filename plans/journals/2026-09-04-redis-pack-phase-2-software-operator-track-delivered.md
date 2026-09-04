---
title: "Redis pack phase 2: Software Operator track delivered"
date: 2026-09-04
summary: "D9-D11 swops domains, 3 lessons, 45 questions, 3 labs, 60q mock exam on feat/redis-pack; gates green, review PASS_WITH_MINORS with both minors fixed"
---

# Redis pack phase 2: Software Operator track delivered

## What happened
Phase 2 of the Redis subject pack (plans/260903-1753-redis-subject/) delivered on `feat/redis-pack`, uncommitted: domains.json +3 (rc-swops-install/cluster/ops, D9-D11, provisional wide weights 20-35/30-45/25-40), modules 09-11, docs.json created (8-entry docId registry, all URLs WebFetch-verified on redis.io), 3 flagship JSON lessons, 45 questions (15/domain, kind mix 6/2/2/2/1/1/1), 3 labs (bootstrap, backup-restore, alert-triage), exam redis-swops-mock-1 (60q/60min/700, seed 20260904).

Authoring ran as three parallel subagents with per-write `jq empty` validation — the output-corruption defense from phase 1 — and zero corruption reached disk. Primary-session hand-edits (exam plan, review fixes) were each jq-validated immediately after the edit.

One real defect caught in verification: my exam domainPlan (13/16/16) exceeded the 15-question swops pools; validator would have failed `exam-infeasible`. Fixed to 15/15/15 + core 15 = 60.

Six-mode click-through on :5173 via agent-browser: Learn (lesson + graded KC), Labs, Practice, Exams (60q live, timer ticking), Notes/Revision match existing platform behavior. Hash routing (`#/subject/redis/...`) — nested card links ignore agent-browser coordinate clicks; native `.click()` via eval works.

## Decision
- User chose 3 modules + 3 lessons (1:1 per domain, phase-1 convention) over the plan's literal "2 modules/domain" — the literal reading left 3 empty Learn-UI modules or exceeded "~3 lessons".
- Code review PASS_WITH_MINORS; both minors applied: 7 duplicated inline references deleted from the lessons (docIds chips are canonical per plan success criteria; rc-l-09 references now []), rc-q-09-bank-7 stem now carries "starting with the master node".
- docs.json via lesson docIds is the new citation convention for swops content; phase-1 lessons keep inline references.

## Next steps
- Commit `feat/redis-pack` (phase 2 note records "commit pending") — awaiting user.
- Phase 3: Cloud Operator track + README "Installed packs" row + 2 deferred phase-1 minors (Jedis 7.x note, rc-q-01-bank-12 fill misfiled in data-structures pool).
- Reviewer info note: 15/15/15 + fixed seed makes the swops paper identical every sitting (consistent with exam 1); rc-q-11-bank-5's 32,000-user figure is version-coupled.
- Cosmetic, pre-existing: ak plan index still keys this plan under old id 260903-1053 after the dir rename to 260903-1753-redis-subject; reindex run, files win.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
