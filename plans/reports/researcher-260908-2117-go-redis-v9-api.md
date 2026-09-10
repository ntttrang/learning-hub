# Research — go-redis v9 API for Redis Go labs (feeds plan 260908-2104-redis-go-labs)

Date: 2026-09-08 · Verified against `github.com/redis/go-redis@v9.22.0` tagged source
(latest release 2026-08-03; cross-checked pkg.go.dev + redis.io). Signature-stable
since ≥9.5.0 except items in the breaking-notes section.

## Baseline facts

- Import `github.com/redis/go-redis/v9`; no v10 exists. Latest v9.22.0. **go.mod
  needs `go 1.24`+** (bumped in 9.19.0). Labs pin ≥9.16 (9.15.0 was a broken
  release — never pin it).
- `redis.NewClient(&redis.Options{Addr, Username, Password, DB, PoolSize, TLSConfig…})`;
  `redis.ParseURL` accepts `redis://`, `rediss://` (auto TLS 1.2), `unix://`.
  `Ping(ctx).Err()`.
- `Set(ctx, key, val interface{}, expiration time.Duration)` — TTL is the 4th arg,
  `0` = no expiry; there is **no `SetExpiration`**. `GetEx`, `GetSet` exist.
- `Get(ctx,key).Result()` → `(string, error)`; missing key = `redis.Nil` (=
  `proto.Nil`), check with `errors.Is(err, redis.Nil)`; `Val()` returns `""` on Nil.
- **No `redis.String()` helper exists in go-redis** (that is redigo's API).
- `SetNX(ctx,key,val,expiration).Result()` → `(bool, error)`.
- `Incr`, `IncrBy`, `Expire(ctx,key,d)`, `TTL(ctx,key)` (DurationCmd).
- **TTL sentinels stored raw, not scaled**: key missing → `-2ns`, no expire →
  `-1ns`; real TTLs are `n * time.Second`. Labs must branch on `ttl < 0` and not
  compare against `-1*time.Second`.
- Lua: `redis.NewScript(src)` → `script.Run(ctx, client, keys []string, args...)`
  (`EVALSHA` with `EVAL` fallback); param type is `Scripter` (satisfied by
  `*Client`/`*ClusterClient`/`*Ring`). Unlock = compare-and-del script:
  `if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`.

## Streams (v9.22)

- `XAdd(ctx, &XAddArgs{Stream, Values interface{} /* map[string]interface{} */, MaxLen int64, Approx, ID})` → entry ID.
- `XGroupCreate`; `XReadGroup(ctx, &XReadGroupArgs{Group, Consumer, Streams []string{stream, ">"}, Count int64, Block time.Duration})` — `Block: 0` = BLOCK 0 (indefinite), negative disables.
- `XAck(ctx, stream, group, ids...)`; `XPending(ctx, stream, group)` → `*XPending{Count, Consumers map[string]int64}`;
  `XPendingExt(ctx, &XPendingExtArgs{Stream, Group, Idle, Start, End, Count, Consumer})` → `[]XPendingExt{ID, Consumer, Idle, RetryCount}`;
  `XAutoClaim(ctx, &XAutoClaimArgs{Stream, Group, MinIdle, Start, Count, Consumer})` → `([]XMessage, string, error)`.
- (Discovered during lab 5 authoring, verified live + vs v9.22.0 source:) a
  blocked `XReadGroup` that times out on an empty stream returns `redis.Nil`
  (the decoder maps the protocol nil reply to it) — labs treat it as the
  standard miss sentinel.

## Pub/Sub

- `Subscribe(ctx, channels...) *PubSub`; `PSubscribe` for patterns.
- `pubsub.Channel()` → `<-chan *Message` (variadic options since 9.5; `ChannelSize` deprecated).
  **`Channel()` spawns a goroutine stopped only by `Close()`** — labs must `defer pubsub.Close()`.
- `ReceiveMessage(ctx)` honors ctx cancellation; **first `Receive(ctx)` returns
  `*Subscription`, not `*Message`**. `Message{Channel, Pattern, Payload string}`.
  (Discovered during lab 6 authoring, verified live + vs v9.22.0 source:) a
  ctx deadline on `ReceiveMessage` surfaces as a raw `read tcp …: i/o timeout`,
  NOT `context.DeadlineExceeded` — labs teach the observed form.
- `Publish(ctx, channel, message).Result()` → receiver count.

## Pipelining / transactions

- `Pipeline() Pipeliner`; `Pipelined(ctx, func(pipe redis.Pipeliner) error) ([]Cmder, error)`;
  `TxPipeline()` / `TxPipelined(...)` wrap MULTI/EXEC.
- `Watch(ctx, func(tx *redis.Tx) error, keys ...string) error`; inside: `tx.TxPipelined(ctx, fn)`,
  `tx.Watch/Unwatch`. Per-command errors surface via `cmds[i].Err()`; EXEC aborts land there.
- Newer helpers: `Pipeliner.Cmds()` (9.13), `BatchProcess` (9.14) — not needed in labs.

## Keyspace notifications

- `ConfigSet(ctx, "notify-keyspace-events", "Ex")` / `ConfigGet(ctx, param)` (exactly
  one param, returns map). Subscribe `__keyevent@0__:expired` (DB index in channel name);
  `PSubscribe("__keyevent@0__:*")` for all. **CONFIG is not routed across cluster
  nodes — labs use a standalone client.**

## Breaking/deprecation notes 9.5 → 9.22 (labs should respect)

- **9.15.0 was a broken mistaken release (missing errUnexpectedRead; retraction
  attempt unsuccessful — go-redis issue #3535); 9.15.1 shipped as the working
  patch. Never pin 9.15.0; require ≥9.16.**
- 9.7.3: `DisableIndentity` (typo) → `DisableIdentity`.
- 9.17: typed errors — prefer `errors.As` over string matching; XMessage gained CLAIM fields.
- 9.19: min Go 1.24; `ReplicaOf` replaces deprecated `SlaveOf`; `NewScriptServerSHA` added.
- 9.21: `XTrimLimitDisabled = -1`; PubSub health-check pings use bounded contexts.
- 9.22: default `Options` changed (Read/WriteTimeout 3s→5s, backoff 10ms/1s, TCP keep-alive);
  `SetArgs` gained compare-and-set (`MatchValue`, `Mode: IFEQ/IFNE/IFDEQ/IFDNE`). Explicit
  values unaffected. Nothing relevant renamed/removed.

## Authoring directives for the 8 labs

1. Never show `redis.String()`/`SetExpiration`; use `.Result()` + `errors.Is(err, redis.Nil)`.
2. Every blocking receive/subscribe path gets `defer pubsub.Close()` and mentions why.
3. Any TTL read handles the `-1ns`/`-2ns` sentinels correctly (or uses PTTL semantics via `TTL` with `< 0` branch).
4. Locks: `SetNX` + random token + `NewScript` compare-and-del unlock; mention fencing as a limitation.
5. Streams: `Streams: []string{stream, ">"}` pair shape; `MaxLen` as `int64`.
6. Keyspace lab pins a standalone client and notes the cluster caveat.
7. go.mod snippet in lab 1: `go 1.24`, `github.com/redis/go-redis/v9 v9.22.0` (or "≥9.16" wording).

Sources: pkg.go.dev/github.com/redis/go-redis/v9 (v9.22.0); github.com/redis/go-redis tree @v9.22.0
(redis.go, script.go, tx.go, pipeline.go, pubsub.go, *_commands.go, options.go, go.mod);
github.com/redis/go-redis/releases (9.5.5→9.22.0); redis.io/docs/latest/develop/clients/go/.
