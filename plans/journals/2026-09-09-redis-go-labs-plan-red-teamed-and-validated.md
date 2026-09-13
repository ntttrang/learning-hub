---
title: "Redis Go labs plan: brainstormed, red-teamed, validated"
date: 2026-09-09
summary: "Plan 260908-2104-redis-go-labs (rc-dev-go domain + 8 go-redis v9 labs, 3 phases) written via planner subagent, red-teamed by 3 hostile reviewers (15/15 findings applied incl. 1 Critical), validated by 4-question interview; sweeps clean, tasks hydrated, awaiting cook on feat/redis-pack"
---

# Redis Go labs plan: brainstormed, red-teamed, validated

## What happened
Full ak:brainstorm → ak:plan cycle for 8 Go client labs in the Redis pack
(plans/260908-2104-redis-go-labs/). Brainstorm settled placement (new cert-less
`rc-dev-go` domain, order 20, no weight/tracks) and scope (8 labs) via 2 user
questions. Researcher verified go-redis v9.22.0 API against tagged source (key
corrections: no `redis.String()` helper, TTL `-1ns`/`-2ns` sentinels,
`Channel()` goroutine needs `Close()`, unlock via `NewScript` compare-and-del).
Planner subagent wrote plan.md + 3 phase files from the scout/researcher reports.

Hard-mode red team: 3 hostile reviewers (Security Adversary, Failure Mode
Analyst, Assumption Destroyer) returned 21 raw findings → 15 deduped, all
accepted, all applied by a delegated editor. Biggest catch: **the Labs view is a
flat grid — `LabIndex.tsx:33-67` never groups by domain — and my scout report
claimed it did**. The plan's headline success criterion was unsatisfiable as
written; reworded to array-order cards + domain row on the overview. Other
high-severity applies: positioning moved into lab summaries (`domain.summary`
renders nowhere for a zero-question domain), per-write commits (phase-end
commits made the `git checkout` rollback recipe destroy same-phase labs),
compile-first Go enforcement (scratch-module `go build` before splitting into
step fences — Go 1.24.2 present, proxy default), `crypto/rand` lock tokens,
merge-hold on `feat/redis-pack` until phase 3 closes. Errata appended to the
scout and researcher reports (9.15: only 9.15.0 was broken/mistaken; 9.15.1 was
the working patch).

Validation interview (mode=prompt) — 4 decisions, all recommended options:
prerequisites field + audience clause on all 8 labs; Redis ≥6.2 floor stated in
lab 1 and lab 5; permanent 0% domain row accepted with lab-aware-completion
suggestion routed to the src-owning plan; stay on `feat/redis-pack`. Both
consistency sweeps (post-red-team, post-validation): 0 unresolved contradictions.
`ak plan validate` exit 0. Tasks 1-3 hydrated with blockedBy chain.

## Decision
- Delegated all plan/report authoring to subagents per the output-corruption
  memory; the only primary-session writes were small surgical Edits with exact
  anchors (validation propagation) — none corrupted.
- Verification-pass guard honored: red-team evidence already in plan.md, so the
  validate workflow skipped re-verification (0 `[UNVERIFIED]` tags).
- 9.15 wording fixed everywhere to "9.15.0 broken release — require ≥9.16"; pin
  rule itself unchanged.

## Next steps
- `/ak:cook /Users/trang_thi_thuy.n/GIT/learning-hub/plans/260908-2104-redis-go-labs/plan.md`
  (user choice pending at handoff).
- Cook must follow phase pre-flight (re-verify the two UI behaviors in the
  current tree) and per-write commits; merge-hold: no merge to `main` until
  phase 3 closes.
- At closeout: route the lab-aware `domainCompletion` suggestion to whichever
  plan owns `src/` (currently 260821-1457).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
