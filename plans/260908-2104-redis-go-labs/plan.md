---
title: "Redis Go client labs"
description: "Add a cert-less rc-dev-go domain with 8 go-redis v9 practice labs to the Redis pack, in three gated phases."
status: completed
priority: P1
effort: "2d"
tags: [content, feature, redis, go]
blockedBy: []
blocks: []
created: 2026-09-08
---

# Redis Go client labs

## Overview

Add an `rc-dev-go` domain ("Go clients & application patterns") to the Redis pack
with 8 hands-on labs on go-redis v9: structures, cache-aside, locks, rate limiting,
streams, pub/sub, pipelining/transactions, keyspace notifications. Positioning is
honest: the Redis Associate Developer certification is Java-specific, so these labs
are client-engineering practice, not exam prep. That positioning is carried by
every lab's `summary` (rendered at `src/ui/LabIndex.tsx:46`) and the README
clause; the domain `summary` repeats it as metadata only — for a zero-question
domain it renders nowhere (`src/ui/PracticeIndex.tsx:62-63` returns null on
`count === 0`; `src/ui/PracticeIndex.tsx:91` is the sole `domain.summary`
render site).
Contract and decisions: [brainstorm report](../reports/brainstorm-260908-2050-redis-go-labs.md) ·
validated schema/gate/UI facts: [scout report](../reports/scout-260908-2050-redis-go-labs.md) ·
verified go-redis v9 API: [research report](../reports/researcher-260908-2117-go-redis-v9-api.md).

All labs use `domainId: "rc-dev-go"`, append to `content/redis/labs.json` after the
existing 9 entries, and mirror the style of `lab-jedis-cache-aside`
(`content/redis/labs.json:111-169`). All 8 anchor `lessonId` to existing core
lessons (topical anchoring — there are no Go lessons and `lessonId` is optional),
so the Labs-view back-link lands on core-domain material by design; each lab's
summary frames the linked lesson as related core reading so the cross-domain hop
is legible.

| # | id | title | minutes | difficulty | lessonId |
|---|----|-------|---------|------------|----------|
| 1 | `lab-go-structures-tour` | go-redis structures tour | 30 | beginner | `rc-l-01-data-structures` |
| 2 | `lab-go-cache-aside` | Cache-aside in Go with stampede control | 40 | intermediate | `rc-l-03-data-modeling` |
| 3 | `lab-go-distributed-lock` | Distributed locks: SetNX, tokens, safe unlock | 35 | intermediate | `rc-l-01-data-structures` |
| 4 | `lab-go-rate-limiting` | Rate limiting: fixed and sliding windows | 35 | intermediate | `rc-l-04-perf-debugging` |
| 5 | `lab-go-streams-consumer-group` | Streams consumer groups in Go | 45 | advanced | `rc-l-01-data-structures` |
| 6 | `lab-go-pubsub-goroutines` | Pub/Sub with goroutines and clean shutdown | 30 | intermediate | `rc-l-01-data-structures` |
| 7 | `lab-go-pipeline-transactions` | Pipelining and transactions (MULTI/EXEC, WATCH) | 40 | advanced | `rc-l-04-perf-debugging` |
| 8 | `lab-go-keyspace-notifications` | Keyspace notifications: react to expired keys | 35 | advanced | `rc-l-02-keys-expiry` |

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `rc-dev-go` domain (order 20, cert-less) + foundations labs 1-2 | P1 |
| 2 | Application-pattern labs 3-6 (lock, rate limiting, streams, pub/sub) | P1 |
| 3 | Advanced labs 7-8 + README row amendment + closeout gates | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Start — domain + labs 1-2](./phase-01-start.md) | Done |
| 2 | [Application Patterns — labs 3-6](./phase-02-application-patterns.md) | Done |
| 3 | [Advanced + Closeout — labs 7-8 + README](./phase-03-advanced-closeout.md) | Done |

## Cross-Plan Dependencies

- `260821-1457-ui-redesign-brand-conformance` (pending) owns `src/ui/**` +
  `src/styles/**`; its `src/ui/SubjectOverview.tsx` changes are now committed
  (`631dbd9` on `feat/redis-pack`) — the earlier "uncommitted changes" note was
  stale. This plan needs no `src/` edits — the scout confirmed the schema and UI
  are data-driven and a cert-less domain (no `tracks`) renders clean. UI facts
  are time-sensitive: Phase 1 re-verifies the two load-bearing UI behaviors in
  the current tree before authoring (phase-01 pre-flight step).
- `260903-1450-polyglot-languages-subject` (in progress) owns `content/languages/**`
  + `scripts/polyglot-*`. Untouched; Go labs live in `content/redis/` per the
  accepted decision.
- No `blockedBy`: this plan touches only `content/redis/domains.json`,
  `content/redis/labs.json`, and one README row. The README "Installed packs"
  sentence is SHARED SURFACE — plan 260903-1450's phase-2 edits the same sentence
  (pack count 5→6 clause). Coordination rule: whichever plan lands second rebases
  and re-verifies the full packs sentence reads correctly; on conflict, keep both
  clauses.
- Known behavior, accepted: `rc-dev-go` owns zero lessons, and `domainCompletion`
  (`src/engines/progress.ts:40-44`) counts lessons only, so the subject overview
  shows the domain at 0% forever even with all 8 labs done. Pre-decided: accepted
  cosmetic consequence — do NOT edit `src/` for it. At closeout, note the
  lab-aware-completion suggestion for whichever plan owns `src/` (currently
  260821-1457). Routed 2026-09-10 as a handoff note in that plan's plan.md.
- Whole-tree gates: `npm test` / `npm run build` / `npm run lint` cover `src/**`,
  so a gate can redden from a foreign workstream's files. Never edit `src/**` to
  unblock — record an external blocker naming the owning plan (260821-1457 or
  260903-1450) and re-run the gate once that workstream greens (also encoded in
  each phase's risk table).
- Merge hold: `feat/redis-pack` must not merge to `main` until Phase 3 closes —
  phase-1 ships the `rc-dev-go` domain row while only 2 of 8 labs exist. If this
  plan aborts mid-flight, revert the phase-1 domain commit.

## Success Criteria

- [x] 8 labs + `rc-dev-go` domain pass `npm run content:check` (schema + ref graph)
- [x] `npm test`, `npm run build`, `npm run lint` green at every phase end
- [x] The 8 `lab-go-*` labs appear as cards in the Labs view (appended after the
      9 existing — the Labs view is a flat card grid in labs.json array order,
      `src/ui/LabIndex.tsx:33-67`), each with its lesson back-link; `rc-dev-go`
      appears as a domain row in the subject overview
- [x] Every `domainId`/`lessonId` reference resolves (`src/sdk/validate.ts:419-424`)
- [x] README "Installed packs" Redis row extended with one Go-client-practice clause
- [x] All Go code in labs compiles as written against go-redis v9 ≥9.16 on
      Go 1.24 — enforced per lab by building the assembled main.go in a scratch
      module before splitting into steps — no `redis.String()`, no
      `SetExpiration`, no 9.15.0 pins (9.15.0 was a broken, mistaken release —
      avoid it; this pack requires ≥9.16), no unverified or deprecated APIs

## Red Team Review

### Session — 2026-09-08
**Findings:** 15 deduplicated (from 21 raw across Security Adversary, Failure Mode Analyst, Assumption Destroyer) — 15 accepted, 0 rejected; all evidence-backed (file:line), load-bearing claims independently re-verified against source. Applied in this session.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Labs view is a flat grid — "grouped under rc-dev-go" criterion unsatisfiable | Critical | Accept | plan.md, P1, P2, P3, scout erratum |
| 2 | domain.summary renders nowhere for zero-question domain — positioning dead text | High | Accept | plan.md, P1 |
| 3 | Rollback recipe destroyed same-phase labs (phase-end commits) | High | Accept | P1, P2, P3 |
| 4 | "Compiles-as-written" had no enforcement | High | Accept (mod) | plan.md, P1, P2, P3 |
| 5 | Lock-token randomness source unspecified (forgeable math/rand risk) | High | Accept | P1, P2 |
| 6 | rc-dev-go permanent 0% overview row (lesson-only completion) | High | Accept (documented) | plan.md, P1 |
| 7 | README sentence shared with polyglot plan phase-2 | Medium | Accept | plan.md, P3 |
| 8 | UI facts stale (ui-redesign commit 631dbd9 landed mid-planning) | Medium | Accept | plan.md, P1 pre-flight |
| 9 | No gate detects dropped/mutated existing labs | Medium | Accept | P1, P2, P3 |
| 10 | Whole-tree gates can redden from foreign workstream | Medium | Accept | P1, P2, P3 |
| 11 | Phase-1 commit ships domain with 2/8 labs on mergeable branch | Medium | Accept | plan.md merge-hold |
| 12 | Keyspace lab lacked local-only/global/non-persistent CONFIG caveats | Medium | Accept | P3 |
| 13 | Fixed-window INCR+EXPIRE race unnamed (permanent lockout) | Medium | Accept | P2 |
| 14 | "9.15 retracted" overbroad (9.15.0 broken release; 9.15.1 was the patch) | Medium | Accept | plan.md, P1, researcher erratum |
| 15 | Lesson back-links cross-domain unlabeled | Medium | Accept | plan.md, P1 |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02-application-patterns.md, phase-03-advanced-closeout.md
- Decision deltas checked: 9 (grouped→flat grid; positioning moved to lab summaries; per-write commits; crypto/rand tokens; compile-first scratch-module step; 9.15.0-broken/≥9.16 wording; merge hold on feat/redis-pack; known permanent 0% row; README shared-surface coordination)
- Reconciled stale references: 14 (4x "grouped under", 4x "groups by domain"/"domain grouping", 1x "phase commits", 2x "retracted", 1x "uncommitted changes", 1x ":199" miscite, 1x "disjoint/merge-trivial"; lab id/title/minutes/difficulty/lessonId tables verified identical across all four files)
- Unresolved contradictions: 0 (two intentional quoted mentions remain — plan.md Cross-Plan quotes the corrected "uncommitted changes" note, and P2 Architecture says "no domain grouping" as the corrected fact; the scout report's false line is preserved by design under its ERRATUM)

## Validation Log

### Session 1 — 2026-09-09
**Trigger:** Post-red-team validation interview (session config `Validation: mode=prompt, questions=3-8`), run after all 15 red-team findings were applied and the red-team consistency sweep closed with 0 unresolved contradictions. Verification pass (Step 2.5) skipped per guard — `## Red Team Review` carries verification evidence; zero `[UNVERIFIED]` tags found.
**Questions asked:** 4

#### Questions & Answers

1. **[Assumptions]** The 8 labs assume real Go proficiency (goroutines, contexts, modules) — lab 1 is "beginner" in Redis terms, not Go terms. How should the Go prerequisite be signaled to learners?
   - Options: `prerequisites` field + summary clause | summary clause only | leave unstated
   - **Answer:** `prerequisites` field + summary clause
   - **Rationale:** uses the existing optional LabSchema field (`src/sdk/validate.ts:168-189`) to make the audience explicit and machine-readable; lab summaries are the rendered surface.
2. **[Assumptions]** The labs assume a local redis-server; lab 5's `XAutoClaim` requires Redis ≥6.2 (XAUTOCLAIM). State a minimum server version?
   - Options: state ≥6.2 | state ≥7.0 | leave unspecified
   - **Answer:** state ≥6.2
   - **Rationale:** honest floor tied to the one command that needs it, without over-excluding common 6.x installs.
3. **[Tradeoffs]** Red-team finding 6: `rc-dev-go` shows a permanent 0% completion row on the subject overview (lesson-only `domainCompletion`). Handling?
   - Options: accept + route suggestion | accept + README note | block closeout on src fix
   - **Answer:** accept + route suggestion
   - **Rationale:** confirms the plan's pre-decision; no scope growth into off-limits files.
4. **[Risks]** Implementation branch: `feat/redis-pack` already hosts the ui-redesign workstream's commits. Stay or isolate?
   - Options: stay on `feat/redis-pack` | isolate on a fresh branch
   - **Answer:** stay on `feat/redis-pack`
   - **Rationale:** matches the accepted contract; the merge-hold rule and foreign-gate risk rows cover the shared-branch exposure.

#### Confirmed Decisions
- Go prerequisite: `prerequisites[1-2]` field + audience clause in every lab summary — all 8 labs
- Redis floor: ≥6.2 stated in lab 1 setup and restated at lab 5's `XAutoClaim`
- Permanent 0% domain row: accepted; lab-aware-completion suggestion routed at closeout
- Branch: implementation stays on `feat/redis-pack` under the merge-hold rule

#### Action Items
- [x] Propagate prerequisites field + audience clause to phases 1-3 common lab specs
- [x] Propagate Redis ≥6.2 floor to phase 1 (lab 1 setup) and phase 2 (lab 5)

#### Impact on Phases
- Phase 1: R2 common spec + R3 lab-1 setup updated
- Phase 2: R1 common spec + R4 XAutoClaim note updated
- Phase 3: R1 common spec updated

### Whole-Plan Consistency Sweep (post-validation)
- Files reread: plan.md, phase-01-start.md, phase-02-application-patterns.md, phase-03-advanced-closeout.md
- Decision deltas checked: 4 (prerequisites + audience clause; Redis ≥6.2 floor; 0%-row accept; branch/merge-hold)
- Reconciled stale references: 0 — propagation only added requirements; the lab tables are unchanged and identical across all four files
- Unresolved contradictions: 0

<!-- slug: redis-go-labs -->
