---
phase: 1
title: "Start"
status: done
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: Start

## Overview

Create the cert-less `rc-dev-go` domain and the first two labs: the beginner
structures tour and the Go cache-aside lab with stampede control (sibling of
`lab-jedis-cache-aside`). This phase also establishes the authoring loop every
phase reuses: delegate each structured write to a subagent (project memory:
primary-session structured writes corrupt), run `npm run content:check` after
every write, and commit each validated write (per-write commits keep
`git checkout -- <file>` a safe rollback to the previous validated state).
API facts: [research report](../reports/researcher-260908-2117-go-redis-v9-api.md) ·
schema/gate facts: [scout report](../reports/scout-260908-2050-redis-go-labs.md).

## Requirements

### Functional

- **R1 — Domain.** Append to `content/redis/domains.json` (19 entries exist, orders
  1-19) the exact object below. `weight` and `tracks` are deliberately omitted:
  this domain maps to no certification, and omitted/empty `tracks` renders clean.

  ```json
  {
    "id": "rc-dev-go",
    "order": 20,
    "code": "D20",
    "title": "Go clients & application patterns",
    "summary": "Practice-oriented Go client patterns on go-redis v9: caching, locking, rate limiting, streams, pub/sub, and pipelining. The Redis Associate Developer certification is Java-specific — these labs build real client-engineering skills, not exam prep."
  }
  ```

  Positioning note: the domain `summary` renders nowhere for this domain —
  `src/ui/PracticeIndex.tsx:62-63` returns null for a zero-question domain and
  `src/ui/PracticeIndex.tsx:91` is the sole `domain.summary` render site. Each
  lab's `summary` must therefore open with or contain a short
  practice-positioning clause (e.g. "Go client practice — not exam prep; the
  Redis Associate Developer cert is Java-specific") — lab summaries are the only
  rendered surface (`src/ui/LabIndex.tsx:46`).

- **R2 — Labs 1-2** appended to `content/redis/labs.json` (bare JSON array, after
  the existing 9 entries):

  | # | id | title | minutes | difficulty | lessonId |
  |---|----|-------|---------|------------|----------|
  | 1 | `lab-go-structures-tour` | go-redis structures tour | 30 | beginner | `rc-l-01-data-structures` |
  | 2 | `lab-go-cache-aside` | Cache-aside in Go with stampede control | 40 | intermediate | `rc-l-03-data-modeling` |

  Both `domainId: "rc-dev-go"`. Field set and voice mirror `lab-jedis-cache-aside`
  (`content/redis/labs.json:111-169`): `id, domainId, lessonId, title, minutes,
  difficulty, summary, steps[], outcomes[3-4], checks[3-4]`; steps carry
  `title` + `instructions` (fenced Go, occasional redis-cli verification) +
  `expectedOutput`, with `hint`/`solution` on later steps. Every lab also
  carries `prerequisites[1-2]` naming the Go fluency assumed (Go modules,
  goroutines, contexts, `errors` handling), and its summary includes a
  one-clause audience signal — "beginner" here means Redis-beginner, not
  Go-beginner.

  Lesson back-links (pre-decided): labs anchor `lessonId` to existing core
  lessons (topical anchoring — there are no Go lessons and `lessonId` is
  optional, `src/sdk/validate.ts:172`), so the Labs-view back-link
  (`src/ui/LabIndex.tsx:56-63`) lands on core-domain material by design; each
  lab's summary frames the linked lesson as related core reading so the
  cross-domain hop is legible.

- **R3 — Lab 1 `lab-go-structures-tour`.** Learner scaffolds a Go module (go.mod:
  `go 1.24`, `github.com/redis/go-redis/v9 v9.22.0` or "≥9.16" wording — 9.15.0
  was a broken, mistaken release: avoid it; this pack requires ≥9.16), connects
  with `redis.NewClient(&redis.Options{...})` +
  `Ping(ctx).Err()`. The lab's setup step states the server floor: a local
  `redis-server` ≥6.2 (lab 5 relies on `XAUTOCLAIM`, added in Redis 6.2). The
  learner then writes and reads each core structure — string, list, hash, set,
  sorted set — verifying a couple of keys from redis-cli.

  <!-- Updated: Validation Session 1 - prerequisites field + audience clause (R2); Redis ≥6.2 floor in lab 1 setup (R3) --> Proves the
  two Go idioms every later lab depends on: missing key = `Get(ctx,key).Result()`
  returning `redis.Nil` checked with `errors.Is(err, redis.Nil)` (`Val()` returns
  `""` on Nil), and TTL reads via `TTL(ctx,key)` branching on `ttl < 0` —
  sentinels are stored raw (`-2ns` missing, `-1ns` no-expiry), never compared
  against `-1*time.Second`.

- **R4 — Lab 2 `lab-go-cache-aside`.** Go sibling of the Jedis lab: read path
  `Get` → miss (`errors.Is(err, redis.Nil)`) → load a stand-in origin →
  `Set(ctx, key, val, ttl)` (TTL is the 4th arg, `0` = no expiry; there is no
  `SetExpiration`); write path updates the origin then `Del`s the key; deliberate
  TTL with jitter. Then stampede control as a single-flight lock: acquire with
  `SetNX(ctx, key, token, ttl)` using a random token generated with
  `crypto/rand` (16 random bytes, hex-encoded — never `math/rand`; the
  compare-and-del unlock is only as safe as the token's unguessability),
  release via `redis.NewScript` compare-and-del —
  `if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`
  (`script.Run(ctx, client, keys, args...)` runs EVALSHA with EVAL fallback) —
  with fencing tokens named as a limitation. Verified from redis-cli
  (MONITOR/GET/TTL), mirroring the Jedis lab's proof steps.

### Non-functional

- Strict schemas: lab/step fields exactly the allowed set
  (`src/sdk/validate.ts:156-189`); domain fields exactly
  `{id, order, code?, title, weight?, summary?, tracks?}`
  (`src/sdk/validate.ts:64-74`). Zod `.strict()` rejects extra keys.
- Every Go snippet compiles as written against go-redis v9 ≥9.16 on Go 1.24
  (research report, baseline + breaking notes).
- Authoring writes delegated to subagents; `npm run content:check` green after
  every `domains.json`/`labs.json` write before proceeding.
- This phase touches only `content/redis/domains.json` and `content/redis/labs.json`.

### Research directives embedded in this phase

(from the research report's "Authoring directives")

1. Never show `redis.String()` (that is redigo's API) or `SetExpiration`; use
   `.Result()` + `errors.Is(err, redis.Nil)` — labs 1-2.
3. Any TTL read handles the `-1ns`/`-2ns` sentinels with a `ttl < 0` branch — labs 1-2.
4. Locks: `SetNX` + random token + `NewScript` compare-and-del unlock; the token
   MUST be generated with `crypto/rand` (16 random bytes, hex-encoded — never
   `math/rand`); mention fencing as a limitation — lab 2, deepened by lab 3 in
   Phase 2.
7. Lab 1's go.mod snippet: `go 1.24` + `github.com/redis/go-redis/v9 v9.22.0`
   (or "≥9.16" wording).

## Architecture

Data flow (no `src/` changes; UI and validator are data-driven):

`content/redis/domains.json` + `labs.json` → `loadAllContent()` throws on any
schema or contract issue (`src/content/content-check.test.ts:26`) → strict
`DomainSchema`/`LabSchema` validation → ref graph: `lab.domainId` must resolve to
a domains.json entry; `lab.lessonId` (optional, `src/sdk/validate.ts:172`) must
resolve to an existing lesson (`src/sdk/validate.ts:419-424`; no check requires a
domain to own labs or lessons) → Labs view is a flat card grid in labs.json
array order (`src/ui/LabIndex.tsx:33-67` maps `content.labs` with no domain
grouping anywhere; card meta renders the lesson back-link at `:56-63` and
`lab.summary` at `:46`), and the domain row renders unconditionally in the
subject overview (`src/ui/SubjectOverview.tsx:79-106`); `tracks` omitted or
empty renders nothing (`src/ui/SubjectOverview.tsx:83-85` guards empty tracks),
so a cert-less domain is safe. `npm run content:check` runs every pack through
files → glob → Zod → graph → registry coverage; one failing pack fails the build.

## Related Code Files

| Action | File | Change |
|--------|------|--------|
| Modify | `content/redis/domains.json` | append `rc-dev-go` (order 20) |
| Modify | `content/redis/labs.json` | append labs 1-2 |
| Create | — | none |
| Delete | — | none |

Off-limits (other plans' ownership): `src/ui/**`, `src/styles/**`
(plan 260821-1457-ui-redesign-brand-conformance); `content/languages/**`,
`scripts/polyglot-*` (plan 260903-1450-polyglot-languages-subject).

## Implementation Steps

1. Pre-flight (UI facts are time-sensitive — ui-redesign commit `631dbd9` landed
   on `feat/redis-pack` mid-planning): re-verify the two load-bearing UI
   behaviors in the current tree — (a) omitted/empty `tracks` renders nothing
   (SubjectOverview empty-tracks guard) and (b) a domain row renders
   unconditionally in the subject overview (`src/ui/SubjectOverview.tsx:79-106`).
   If either has drifted, stop and re-assess before writing content.
2. Delegate to an authoring subagent: append the R1 domain object to
   `content/redis/domains.json`. The delegation prompt must include the exact JSON,
   the absolute file path, "preserve all existing entries unchanged, keep the file
   valid JSON", and a pre-report self-check (`node -e "JSON.parse(require('fs').readFileSync('content/redis/domains.json','utf8'))"`).
3. Validate in the controlling session: `npm run content:check` — must be green
   (a domain with zero labs passes: refs resolve lab→domain only,
   `src/sdk/validate.ts:419-424`).
4. Commit (conventional, no AI references): `feat: add rc-dev-go domain`.
5. Delegate: author lab 1 `lab-go-structures-tour` (spec R3, directives 1/3/7).
   Compile-first: before splitting the lab into step snippets, the subagent
   assembles the lab's Go code as one runnable `main.go` in a scratch module
   (`go mod init scratch && go get github.com/redis/go-redis/v9@v9.22.0 &&
   go build ./... && go vet ./...`) and reports the green output; only then
   split into the lab's `instructions`/`solution` fences. Append it to
   `content/redis/labs.json`. Same delegation rules: one lab per write, JSON
   self-check before reporting.
6. Validate: `npm run content:check`, then assert count/ids —
   `node -e "const l=require('./content/redis/labs.json'); console.log(l.length, l.map(x=>x.id).join(','))"`
   must show 10 labs with all 9 original ids plus `lab-go-structures-tour`;
   glance at `git diff --stat content/redis/labs.json` before committing.
7. Commit: `feat: add go-redis structures tour lab`.
8. Delegate: author lab 2 `lab-go-cache-aside` (spec R4, directives 1/3/4);
   compile-first rule applies (scratch-module `go build`/`go vet` green before
   splitting into fences). Append.
9. Validate: `npm run content:check` + the count/id assertion — 11 labs, all 9
   original ids plus the two `lab-go-*` ids; `git diff --stat` glance.
10. Commit: `feat: add go cache-aside lab with stampede control`.
11. End-of-phase gate — all four green before the phase is done:
    `npm run content:check && npm test && npm run build && npm run lint`

## Success Criteria

- [x] `rc-dev-go` in `domains.json` exactly as R1 — order 20, no `weight`, no `tracks`
- [x] Labs 1-2 appended with exactly the R2 ids/titles/minutes/difficulties/lessonIds
- [x] `npm run content:check` green after each individual write (steps 3, 6, 9)
- [x] Count/id assertion after each labs.json write: 10 labs after lab 1, 11 after
      lab 2, all 9 original ids still present
- [x] Full gate (step 11) green
- [x] Each validated write committed separately (per-write commits; no phase-end
      bulk commit)
- [x] Lab Go code compiles in a scratch module before splitting into steps
      (compile-first rule); uses only research-verified APIs; directives
      1/3/4/7 respected
- [x] Lock tokens use `crypto/rand` (never `math/rand`)
- [x] No files other than `content/redis/domains.json` + `content/redis/labs.json`
      modified this phase

## Risk Assessment

| Risk | Observable signal | Pre-decided response |
|------|-------------------|----------------------|
| Structured-write corruption (known primary-session failure mode) | Zod/JSON parse errors naming stray keys, spliced tokens, or truncation in labs.json/domains.json | Mitigated by design: writes only via delegated subagents, one lab per write, validated and committed after each. If a write still corrupts: `git checkout -- <file>` restores the last committed state — with per-write commits that is always the previous validated write, so re-delegating that single write is safe |
| Strict-schema rejection of an extra field | `content:check` error listing an unrecognized key | Author against the exact allowed field set (`src/sdk/validate.ts:156-189`); remove the key, re-validate |
| Cert-less domain misrenders (tracks UI assumed present) | Labs view shows a cert badge or track label on `rc-dev-go` | Not expected — omitted `tracks` renders nothing (scout-verified; the step-1 pre-flight re-verifies it in the current tree because ui-redesign `631dbd9` landed mid-planning). If observed anyway, do NOT edit `src/`; record an open question and route it to plan 260821-1457 |
| `rc-dev-go` shows 0% completion forever (domainCompletion counts lessons only, `src/engines/progress.ts:40-44`; this domain owns zero lessons) | Subject overview renders the domain row with a 0% completion bar even after all 8 labs are done | Known, accepted cosmetic consequence — do NOT edit `src/`; at closeout, note the lab-aware-completion suggestion for whichever plan owns `src/` (currently 260821-1457) |
| Gate red from files this plan does not own (gates are whole-tree: vitest/tsc/vite/oxlint cover `src/**`) | Failing check involving no `content/redis/**` or README change | Record an external blocker naming the owning plan (260821-1457 or 260903-1450); never edit `src/**` to unblock; re-run the gate once the foreign workstream greens |
| go-redis API drift vs the research report | Review spots an API name absent from the research report (e.g. a redigo-ism) | Replace with the verified form from the research report; if the report lacks the API entirely, cut that snippet rather than guess and log an open question |
