---
phase: 2
title: "Application Patterns"
status: done
priority: P1
effort: 8h
dependencies: ["phase-01-start.md"]
---

# Phase 2: Application Patterns

## Overview

Author labs 3-6 — distributed locks, rate limiting, streams consumer groups, and
pub/sub with goroutines — appended to `content/redis/labs.json` under the
`rc-dev-go` domain created in Phase 1. Same loop as Phase 1: delegated subagent
authoring, one lab per write, `npm run content:check` after every write, commit
after each validated write. API facts:
[research report](../reports/researcher-260908-2117-go-redis-v9-api.md).

## Requirements

### Functional

- **R1 — Labs 3-6** appended to `content/redis/labs.json` (after labs 1-2):

  | # | id | title | minutes | difficulty | lessonId |
  |---|----|-------|---------|------------|----------|
  | 3 | `lab-go-distributed-lock` | Distributed locks: SetNX, tokens, safe unlock | 35 | intermediate | `rc-l-01-data-structures` |
  | 4 | `lab-go-rate-limiting` | Rate limiting: fixed and sliding windows | 35 | intermediate | `rc-l-04-perf-debugging` |
  | 5 | `lab-go-streams-consumer-group` | Streams consumer groups in Go | 45 | advanced | `rc-l-01-data-structures` |
  | 6 | `lab-go-pubsub-goroutines` | Pub/Sub with goroutines and clean shutdown | 30 | intermediate | `rc-l-01-data-structures` |

  All `domainId: "rc-dev-go"`; same field set and voice as Phase 1 (mirror
  `lab-jedis-cache-aside`, `content/redis/labs.json:111-169`): fenced Go in
  instructions, occasional redis-cli verification, `expectedOutput`, `hint`/
  `solution` on later steps, 3-4 `outcomes`, 3-4 `checks`, and
  `prerequisites[1-2]` naming the Go fluency assumed (Validation Session 1).

- **R2 — Lab 3 `lab-go-distributed-lock`.** Learner implements a safe lock:
  acquire with `SetNX(ctx, key, token, ttl)` where the value is a random token
  generated with `crypto/rand` (16 random bytes, hex-encoded — never
  `math/rand`; the compare-and-del unlock is only as safe as the token's
  unguessability); release with `redis.NewScript` compare-and-del —
  `if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`
  via `script.Run(ctx, client, keys, args...)`. Demonstrates why a GET-then-DEL
  unlock is unsafe (let the lock expire mid-hold, watch the wrong holder's lock
  get deleted) and closes with fencing tokens discussed as a limitation of
  single-instance Redis locks. Directives 1 + 4.

- **R3 — Lab 4 `lab-go-rate-limiting`.** Two limiters over the same idea: a fixed
  window with `Incr` + first-hit `Expire` (both verified APIs), and a sliding
  window as one Lua script run via `redis.NewScript` — window bookkeeping
  (zadd/zremrangebyscore/zcard/expire) lives server-side inside the script, so the
  Go surface is only `script.Run`. Name the non-atomicity gap explicitly: a crash
  or failure between `Incr` and `Expire` leaves the window key TTL-less and that
  client permanently locked out; show the re-arm guard (`if ttl < 0 → Expire`,
  which the lab already teaches) or `SET key 1 NX EX` on the first hit. Add a
  checks item verifying the window key carries a positive TTL. Proves over-limit
  rejection and window reset, visible from redis-cli (GET/TTL on the window
  keys; TTL reads use the `ttl < 0` sentinel branch). Directives 1 + 3.

- **R4 — Lab 5 `lab-go-streams-consumer-group`.** Producer:
  `XAdd(ctx, &XAddArgs{Stream, Values, MaxLen int64, Approx})`. Consumer group:
  `XGroupCreate`, then `XReadGroup(ctx, &XReadGroupArgs{Group, Consumer,
  Streams: []string{stream, ">"}, Count, Block})` — `Block: 0` = indefinite,
  negative disables; walkthrough examples use a finite Block or a ctx with
  timeout so the learner never hangs. Acknowledge with `XAck`; inspect stuck
  entries with `XPendingExt` (returns ID/Consumer/Idle/RetryCount); reclaim with
  `XAutoClaim` (returns `([]XMessage, string, error)` — requires Redis ≥6.2;
  the lab's setup step restates the ≥6.2 floor from lab 1). Proves at-least-once

  <!-- Updated: Validation Session 1 - prerequisites field (R1); Redis ≥6.2 note at XAutoClaim (R4) -->
  delivery: skip an ack, watch the entry pend, claim it from another consumer.
  Directive 5.

- **R5 — Lab 6 `lab-go-pubsub-goroutines`.** `Subscribe(ctx, channel)` consumed in
  a goroutine — via `pubsub.Channel()` (`<-chan *Message`) or
  `ReceiveMessage(ctx)` which honors ctx cancellation — while main `Publish`es
  (returns receiver count). Ends with clean shutdown via `defer pubsub.Close()`
  and the reason stated in prose: `Channel()` spawns a goroutine that only
  `Close()` stops. Notes that the first `Receive(ctx)` returns `*Subscription`,
  not `*Message`. Directive 2.

### Non-functional

- Strict LabSchema — fields exactly the allowed set
  (`src/sdk/validate.ts:156-189`); no extra keys.
- Every Go snippet compiles as written against go-redis v9 ≥9.16 on Go 1.24.
- Authoring writes delegated to subagents, one lab per write;
  `npm run content:check` green after every write.
- This phase touches only `content/redis/labs.json`.

### Research directives embedded in this phase

(from the research report's "Authoring directives")

1. `.Result()` + `errors.Is(err, redis.Nil)`; never `redis.String()` or
   `SetExpiration` — labs 3-4.
2. Every blocking receive/subscribe path gets `defer pubsub.Close()` and says why — lab 6.
3. TTL reads branch on `ttl < 0` (sentinels `-1ns`/`-2ns` stored raw) — lab 4.
4. Locks: `SetNX` + random token + `NewScript` compare-and-del unlock; the token
   MUST be generated with `crypto/rand` (16 random bytes, hex-encoded — never
   `math/rand`); fencing named as a limitation — lab 3.
5. Streams: `Streams: []string{stream, ">"}` pair shape; `MaxLen` as `int64` — lab 5.

## Architecture

Same data flow as Phase 1 (`labs.json` → `loadAllContent()` strict validation →
lab→domain/lesson ref checks → Labs view flat card grid in labs.json array order
(`src/ui/LabIndex.tsx:33-67` — no domain grouping); no `src/` changes).
This phase only appends four objects to the existing `content/redis/labs.json`
array; `content/redis/domains.json` is untouched.

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Modify | `content/redis/labs.json` | append labs 3-6 |
| Create | — | none |
| Delete | — | none |

Off-limits: unchanged from Phase 1 (`src/ui/**`, `src/styles/**`,
`content/languages/**`, `scripts/polyglot-*`, plus `content/redis/domains.json`
which is final after Phase 1).

## Implementation Steps

1. Delegate: author lab 3 `lab-go-distributed-lock` (spec R2, directives 1/4) and
   append to `content/redis/labs.json`. One lab per write; JSON self-check before
   reporting back. Compile-first: before splitting the lab into step snippets,
   the subagent assembles the lab's Go code as one runnable `main.go` in a
   scratch module (`go mod init scratch && go get
   github.com/redis/go-redis/v9@v9.22.0 && go build ./... && go vet ./...`) and
   reports the green output; only then split into the lab's
   `instructions`/`solution` fences.
2. Validate: `npm run content:check`, then assert count/ids —
   `node -e "const l=require('./content/redis/labs.json'); console.log(l.length, l.map(x=>x.id).join(','))"`
   must show 12 labs with all 9 original ids plus labs 1-3; glance at
   `git diff --stat content/redis/labs.json` before committing.
3. Commit (conventional, no AI references): `feat: add go-redis distributed-lock lab`.
4. Delegate: author lab 4 `lab-go-rate-limiting` (spec R3, directives 1/3);
   compile-first rule applies. Append.
5. Validate: `npm run content:check` + the count/id assertion — 13 labs, all 9
   original ids plus labs 1-4; `git diff --stat` glance.
6. Commit: `feat: add go-redis rate-limiting lab`.
7. Delegate: author lab 5 `lab-go-streams-consumer-group` (spec R4, directive 5);
   compile-first rule applies. Append.
8. Validate: `npm run content:check` + the count/id assertion — 14 labs, all 9
   original ids plus labs 1-5; `git diff --stat` glance.
9. Commit: `feat: add go-redis streams consumer-group lab`.
10. Delegate: author lab 6 `lab-go-pubsub-goroutines` (spec R5, directive 2);
    compile-first rule applies. Append.
11. Validate: `npm run content:check` + the count/id assertion — 15 labs, all 9
    original ids plus labs 1-6; `git diff --stat` glance.
12. Commit: `feat: add go-redis pub/sub lab`.
13. End-of-phase gate — all four green:
    `npm run content:check && npm test && npm run build && npm run lint`

## Success Criteria

- [x] Labs 3-6 appended with exactly the R1 ids/titles/minutes/difficulties/lessonIds;
      all `domainId: "rc-dev-go"`
- [x] `npm run content:check` green after each individual lab write (steps
      2/5/8/11)
- [x] Count/id assertion after each lab write: 12/13/14/15 labs respectively,
      all 9 original ids still present
- [x] Full gate (step 13) green
- [x] Each validated lab write committed separately (per-write commits; no
      phase-end bulk commit)
- [x] Lab 3 uses SetNX + random token + `NewScript` compare-and-del unlock and
      names fencing as a limitation
- [x] Lock tokens use `crypto/rand` (never `math/rand`)
- [x] Lab 4 names the `Incr`+`Expire` non-atomicity gap (permanent lockout) and
      its re-arm guard; a checks item verifies the window key carries a positive
      TTL
- [x] Lab 5 uses the verified stream API shapes: `Streams: []string{stream, ">"}`,
      `MaxLen int64`, `XAck`/`XPendingExt`/`XAutoClaim`
- [x] Lab 6 closes pubsub (`defer pubsub.Close()` with stated reason) and handles
      the `*Subscription` first receive
- [x] Only `content/redis/labs.json` modified this phase

## Risk Assessment

| Risk | Observable signal | Pre-decided response |
|------|-------------------|----------------------|
| Structured-write corruption as labs.json grows | Parse/Zod errors naming stray keys or truncation after a write | Same as Phase 1: one lab per delegated write, validated and committed after each; `git checkout -- content/redis/labs.json` restores the last committed state — with per-write commits that is always the previous validated write, so re-delegating that single write is safe |
| Blocking calls hang the walkthrough (`XReadGroup` with `Block: 0` is indefinite; pubsub receive blocks) | Learner reports a stuck terminal; lab steps produce no output | Authoring rule already encoded in R4/R5: stream and pubsub examples use a finite `Block`, `ctx` with timeout, or `Channel()` with a `Close()` — never a bare indefinite block in a step the learner must run |
| Sliding-window Lua is semantically wrong (script internals are Redis commands, not verified go-redis API) | Learner's counts do not match `expectedOutput` in the lab's redis-cli verification steps | Keep the script minimal and canonical; the lab's redis-cli verification steps (GET/TTL on window keys) are the designed catch — if a mismatch is reported, fix the script text and expectedOutput together |
| Strict-schema rejection of an extra step/lab field | `content:check` error listing an unrecognized key | Author against `src/sdk/validate.ts:156-189`; remove the key, re-validate |
| Gate red from files this plan does not own (gates are whole-tree: vitest/tsc/vite/oxlint cover `src/**`) | Failing check involving no `content/redis/**` or README change | Record an external blocker naming the owning plan (260821-1457 or 260903-1450); never edit `src/**` to unblock; re-run the gate once the foreign workstream greens |
| API drift vs the research report | Review spots an API name absent from the report (e.g. `ChannelSize`, deprecated) | Replace with the verified form from the research report; cut the snippet if unverified — log an open question |
