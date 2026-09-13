---
phase: 3
title: "Advanced + Closeout"
status: done
priority: P1
effort: 4h
dependencies: ["phase-02-application-patterns.md"]
---

# Phase 3: Advanced + Closeout

## Overview

Author the final two labs — pipelining/transactions and keyspace notifications —
amend the root README "Installed packs" Redis row with one clause, and run the
full closeout gates over the complete pack (17 labs: 9 existing + 8 Go). API
facts: [research report](../reports/researcher-260908-2117-go-redis-v9-api.md).

## Requirements

### Functional

- **R1 — Labs 7-8** appended to `content/redis/labs.json` (after labs 1-6):

  | # | id | title | minutes | difficulty | lessonId |
  |---|----|-------|---------|------------|----------|
  | 7 | `lab-go-pipeline-transactions` | Pipelining and transactions (MULTI/EXEC, WATCH) | 40 | advanced | `rc-l-04-perf-debugging` |
  | 8 | `lab-go-keyspace-notifications` | Keyspace notifications: react to expired keys | 35 | advanced | `rc-l-02-keys-expiry` |

  Both `domainId: "rc-dev-go"`; same field set and voice as Phases 1-2 (mirror
  `lab-jedis-cache-aside`, `content/redis/labs.json:111-169`), including
  `prerequisites[1-2]` naming the Go fluency assumed (Validation Session 1).

  <!-- Updated: Validation Session 1 - prerequisites field added to common lab spec (R1) -->

- **R2 — Lab 7 `lab-go-pipeline-transactions`.** Three execution modes compared on
  one workload: `Pipeline()`/`Pipelined(ctx, fn)` (batched, one round-trip, no
  atomicity), `TxPipeline()`/`TxPipelined(ctx, fn)` (wrapped in MULTI/EXEC), and
  `Watch(ctx, fn, keys...)` with `tx.TxPipelined` inside for an optimistic retry
  loop on a contested key. Per-command errors surface via `cmds[i].Err()`
  (`Pipelined` returns `[]Cmder`); EXEC aborts land there too. Explicitly avoids
  the newer helpers `Pipeliner.Cmds()` (9.13) and `BatchProcess` (9.14) — the
  research report says they are not needed. Verified from redis-cli: MONITOR
  shows one MULTI/EXEC burst versus N round-trips.

- **R3 — Lab 8 `lab-go-keyspace-notifications`.** Enable events with
  `ConfigSet(ctx, "notify-keyspace-events", "Ex")` (and read back via
  `ConfigGet(ctx, param)` — exactly one param, returns a map); subscribe to
  `__keyevent@0__:expired` (DB index embedded in the channel name;
  `PSubscribe("__keyevent@0__:*")` for all events); set short-TTL keys from Go and
  receive the expiry events. Pins a standalone client and states the caveat:
  CONFIG is not routed across cluster nodes. The lab assumes a LOCAL STANDALONE
  instance — never run CONFIG SET against shared/managed Redis.
  `notify-keyspace-events` is server-global (affects all clients/DBs) and
  non-persistent (reverts on restart); the lab reads the prior value via
  `ConfigGet` first and restores it via `ConfigSet` in a final cleanup step.
  House precedent: the Jedis lab's MONITOR production caveat
  (`content/redis/labs.json:163`). TTL reads use the `ttl < 0` sentinel
  branch. Directives 3 + 6.

- **R4 — README row amendment.** Root `README.md:39-44` lists the installed packs;
  the Redis clause at `README.md:42-43` reads "Redis (Developer, Software
  Operator, and Cloud Operator tracks)". Extend it with exactly one clause
  mentioning the Go client practice labs, e.g. "Redis (Developer, Software
  Operator, and Cloud Operator tracks, plus Go client practice labs)". No other
  README edits. This is a direct prose edit — not delegated structured authoring.
  The installed-packs sentence is SHARED SURFACE — plan 260903-1450's phase-2
  edits the same sentence (pack count 5→6 clause). Whichever plan lands second
  rebases and re-verifies the full packs sentence reads correctly; on conflict,
  keep both clauses.

- **R5 — Closeout.** All 8 Go labs present as cards in the Labs view's flat grid
  (`src/ui/LabIndex.tsx:33-67`); full gates green; plan-level success criteria
  verified.

### Non-functional

- Strict LabSchema — fields exactly the allowed set
  (`src/sdk/validate.ts:156-189`); no extra keys.
- Every Go snippet compiles as written against go-redis v9 ≥9.16 on Go 1.24.
- Lab writes delegated to subagents, one lab per write, validated and committed
  after each; README edited directly by the controlling session.
- This phase touches only `content/redis/labs.json` and `README.md` (one clause).

### Research directives embedded in this phase

(from the research report's "Authoring directives" and pipelining section)

- Pipelining/transactions (lab 7): `Pipelined` vs `TxPipelined` vs
  `Watch` + `tx.TxPipelined`; per-command errors via `cmds[i].Err()`; do not use
  `Pipeliner.Cmds()` (9.13) or `BatchProcess` (9.14).
- Directive 3 — TTL reads branch on `ttl < 0` (`-1ns`/`-2ns` sentinels): lab 8.
- Directive 6 — keyspace lab pins a standalone client and notes the cluster
  caveat: lab 8.

## Architecture

Same data flow as Phases 1-2 (`labs.json` → strict validation → ref checks →
Labs view flat card grid in labs.json array order, `src/ui/LabIndex.tsx:33-67`;
no `src/` changes). After this phase the Labs view shows the 8 `lab-go-*` cards
appended after the 9 existing; a running dev server may need a restart/reload
to pick up the globbed content (README.md:49-50 documents the Vite glob
discovery behavior).

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Modify | `content/redis/labs.json` | append labs 7-8 |
| Modify | `README.md` | extend the Redis clause in "Installed packs" (`:42-43`) by one clause |
| Create | — | none |
| Delete | — | none |

Off-limits: unchanged from Phase 1 (`src/ui/**`, `src/styles/**`,
`content/languages/**`, `scripts/polyglot-*`; `content/redis/domains.json` final
after Phase 1).

## Implementation Steps

1. Delegate: author lab 7 `lab-go-pipeline-transactions` (spec R2) and append to
   `content/redis/labs.json`. One lab per write; JSON self-check before
   reporting. Compile-first: before splitting the lab into step snippets, the
   subagent assembles the lab's Go code as one runnable `main.go` in a scratch
   module (`go mod init scratch && go get github.com/redis/go-redis/v9@v9.22.0 &&
   go build ./... && go vet ./...`) and reports the green output; only then
   split into the lab's `instructions`/`solution` fences.
2. Validate: `npm run content:check`, then assert count/ids —
   `node -e "const l=require('./content/redis/labs.json'); console.log(l.length, l.map(x=>x.id).join(','))"`
   must show 16 labs with all 9 original ids plus labs 1-7; glance at
   `git diff --stat content/redis/labs.json` before committing.
3. Commit (conventional, no AI references):
   `feat: add go-redis pipeline-transactions lab`.
4. Delegate: author lab 8 `lab-go-keyspace-notifications` (spec R3, directives
   3/6); compile-first rule applies. Append.
5. Validate: `npm run content:check` + the count/id assertion — 17 labs, all 9
   original ids plus labs 1-8; `git diff --stat` glance.
6. Commit: `feat: add go-redis keyspace-notifications lab`.
7. Direct edit: extend the README Redis clause per R4 (single clause, exact
   wording or equivalent).
8. Full closeout gate — all four green:
   `npm run content:check && npm test && npm run build && npm run lint`
9. Verify plan-level criteria: `content/redis/labs.json` holds 17 labs total
   (9 existing + 8 `lab-go-*`); the 8 `lab-go-*` labs appear as cards in the
   Labs view, appended after the 9 existing (flat grid in labs.json array
   order, `src/ui/LabIndex.tsx:33-67`), each with its lesson back-link;
   `rc-dev-go` appears as a domain row in the subject overview (spot-check
   after a dev-server restart if one is running); README row updated.

## Success Criteria

- [x] Labs 7-8 appended with exactly the R1 ids/titles/minutes/difficulties/lessonIds
- [x] README Redis row extended by exactly one Go-client-practice clause
- [x] `npm run content:check` green after each lab write (steps 2/5); count/id
      assertion: 16 labs after lab 7, 17 after lab 8, all 9 original ids still
      present; full gate (step 8) green
- [x] Each validated lab write committed separately (per-write commits; no
      phase-end bulk commit)
- [x] Lab 7 shows all three modes (`Pipelined`, `TxPipelined`, `Watch` +
      `tx.TxPipelined`) and reads per-command errors via `cmds[i].Err()`
- [x] Lab 8 uses `ConfigSet("notify-keyspace-events", "Ex")`, subscribes to
      `__keyevent@0__:expired`, and states the standalone-client caveat
- [x] Lab 8 assumes a local standalone instance and restores the prior
      `notify-keyspace-events` value via `ConfigGet`/`ConfigSet` cleanup, with
      the server-global/non-persistent caveats stated
- [x] The 8 `lab-go-*` labs appear as cards in the Labs view (appended after the
      9 existing — flat grid in labs.json array order, `src/ui/LabIndex.tsx:33-67`),
      each with its lesson back-link; `rc-dev-go` appears as a domain row in the
      subject overview; 17 labs total in the pack; every domainId/lessonId
      resolves
- [x] Only `content/redis/labs.json` + `README.md` modified this phase

## Risk Assessment

| Risk | Observable signal | Pre-decided response |
|------|-------------------|----------------------|
| WATCH retry loop too dense for an advanced-but-followable walkthrough | Reviewer or learner cannot tell when the optimistic loop retries | Keep the contested-key example minimal (one counter, one forced retry); show the retry happening once in `expectedOutput` |
| README merge conflict with parallel plans (the installed-packs sentence is SHARED SURFACE — 260903-1450 phase-2 edits the same sentence, pack count 5→6 clause) | Merge conflict on `README.md:42-43` when 260903-1450 or 260821-1457 lands | Whichever plan lands second rebases and re-verifies the full packs sentence reads correctly; keep both clauses on conflict |
| Structured-write corruption late in the file (labs.json now 17 entries) | Parse/Zod errors after a delegated write | Same as prior phases: one lab per write, validated and committed after each; `git checkout -- content/redis/labs.json` restores the last committed state — with per-write commits that is always the previous validated write, so re-delegating that single write is safe |
| Gate red from files this plan does not own (gates are whole-tree: vitest/tsc/vite/oxlint cover `src/**`) | Failing check involving no `content/redis/**` or README change | Record an external blocker naming the owning plan (260821-1457 or 260903-1450); never edit `src/**` to unblock; re-run the gate once the foreign workstream greens |
| Expiry events look missing (`Ex` events fire on actual eviction, and the events channel is DB-specific) | Learner sees no `__keyevent@0__:expired` message during the lab's wait step | Lab wording must already cover it (per R3): short TTLs, explicit DB 0 in the channel name, and a stated wait; if the walkthrough still proves confusing, extend the wait/redis-cli TTL probe step — do not touch schema or `src/` |
| Strict-schema rejection of an extra step/lab field | `content:check` error listing an unrecognized key | Author against `src/sdk/validate.ts:156-189`; remove the key, re-validate |
