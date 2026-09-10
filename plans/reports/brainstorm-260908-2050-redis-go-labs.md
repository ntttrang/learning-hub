# Brainstorm — Redis Go client labs

Date: 2026-09-08 · Branch: `feat/redis-pack` · Status: direction accepted, ready for planning

## Outcome

Learners practice Redis hands-on through Go code (go-redis v9): structures, cache-aside,
locks, rate limiting, streams, pub/sub, pipelining/transactions, keyspace notifications —
as 8 labs in the Redis pack's Labs view under a new `rc-dev-go` domain
("Go clients & application patterns"), mirroring the existing `rc-dev-java` domain.

## Evidence (scouted 2026-09-08)

- Redis pack `content/redis/`: 19 domains, 19 lessons, 9 labs, 3 cert tracks
  (Developer (Java), Software Operator, Cloud Operator).
- Only client lab today: `lab-jedis-cache-aside` (Java) in `rc-dev-java`. Zero Go content.
- Lab schema in `src/sdk/types.ts` (~L178); validated in `src/sdk/validate.ts`:
  `domainId` required, `lessonId` optional (`validate.ts:199`) and ref-checked
  (`validate.ts:422`), so a new domain needs no new lessons.
- Labs are self-verified walkthroughs — steps with fenced code, `expectedOutput`,
  `hint`, `solution`, plus `outcomes[]` and manual `checks[]`. No auto-graded runner.
- `content/languages/` has 31 generic Go labs, none Redis-related (confirmed wrong home).

## Contract

- **Constraints:** existing lab schema + pack validator; walkthrough format matching
  `lab-jedis-cache-aside`; content in `content/redis/`; go-redis v9; Redis Associate
  Developer cert is Java-specific, so Go labs are positioned as practice, not exam prep.
- **Non-goals:** no UI/code-runner changes; no new cert track or lessons; no Java or
  operator lab rewrites; no generic-Go labs in `content/languages`.
- **Acceptance criteria:** 8 new labs pass pack validation; render in Labs view grouped
  under `rc-dev-go`; every `domainId`/`lessonId` ref resolves; build/tests green.

## Chosen approach

New `rc-dev-go` domain + 8 labs. Smallest change satisfying the contract that follows the
pack's own per-client-language convention and keeps Go practice discoverable in one place.

Rejected: (a) distribute into core domains — no single home, Go idioms diluted;
(b) languages pack — orphans Redis content from the Redis subject.

## Lab lineup (8)

| # | id | topic | anchor |
|---|----|-------|--------|
| 1 | `lab-go-structures-tour` | connect + strings/lists/hashes/sets/zsets in Go | `rc-l-01-data-structures` |
| 2 | `lab-go-cache-aside` | cache-aside + stampede mitigation (SetNX lock, TTL jitter); Go sibling of the Jedis lab | `rc-l-03-data-modeling` |
| 3 | `lab-go-distributed-lock` | SET NX PX, token fencing, safe unlock via Lua | `rc-l-01-data-structures` |
| 4 | `lab-go-rate-limiting` | INCR+EXPIRE fixed window; sliding window via Lua | `rc-l-04-perf-debugging` |
| 5 | `lab-go-streams-consumer-group` | XADD/XREADGROUP/XACK/XPENDING, claim stuck entries | `rc-l-01-data-structures` |
| 6 | `lab-go-pubsub-goroutines` | Pub/Sub wired through goroutines and contexts | `rc-l-01-data-structures` |
| 7 | `lab-go-pipeline-transactions` | Pipeliner, TxPipeline, WATCH/MULTI/EXEC optimistic loop | `rc-l-04-perf-debugging` |
| 8 | `lab-go-keyspace-notifications` | `notify-keyspace-events` + expired-event subscriber | `rc-l-02-keys-expiry` |

`domainId: rc-dev-go` on all; `lessonId` set only where an anchor lesson exists.

## Risks / open questions

- Verify go-redis v9 API names against current docs during authoring.
- `rc-dev-go` maps to no cert (unlike `rc-dev-java` → Developer (Java)); check how a
  cert-less domain renders in UI grouping; lab summaries state the practice positioning.
- Prior authoring phases hit model output corruption on structured writes — delegate
  JSON authoring to subagents and validate the pack after each write.
