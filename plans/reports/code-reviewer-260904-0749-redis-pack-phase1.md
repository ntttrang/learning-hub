# Code Review — Redis pack phase 1 (`content/redis/`)

Reviewer: code-reviewer agent · 2026-09-04 · branch `feat/redis-pack` (uncommitted)
Scope: `content/redis/**` (new pack) + one-line change in `src/shell/views.test.tsx`
Spec: `plans/260903-1753-redis-subject/plan.md` + `phase-01-start.md` (resume steps)

## Verdict

**PASS with minor findings.** Zero corruption residue found. All eight acceptance
criteria met; wiring verified programmatically; every lesson, lab, exam, and all
91 questions read in full; technical facts spot-checked against live redis.io
docs. Findings below are minor wording/freshness items, none blocking.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Gates green | PASS | Re-ran `npm run content:check` (5/5) and `vitest run src/shell/views.test.tsx` (27/27) during review; full `npm test` 613/613 + build pre-verified, nothing changed since |
| 2 | 8 domains + 8 modules + 8 lessons + 91 questions + 3 labs + 1 exam, ids per resume steps | PASS | `domains.json` rc-core-{types,keys,model,perf,cluster,persist,security} + rc-dev-java; `modules.json` m-data-structures…m-java-clients exactly per plan; 91 question files (18+9+12+15+11+7+6+13); lessons `rc-l-01…08`; labs `lab-redis-cli-tour`/`lab-ttl-eviction`/`lab-jedis-cache-aside`; exam `redis-dev-mock-1` |
| 3 | Exam 90 min / 700 / plan sum 65 / seed / pools | PASS | `exams.json`: 90, 700, plan 12/6/9/11/8/5/4/10 = 65, seed 20260903; pools 18/9/12/15/11/7/6/13 all ≥ plan; each plan share falls inside its domain weight min/max (e.g. types 12/65=18.5% in 15–25%) |
| 4 | kc questions lessonId ↔ lesson questionIds symmetric; bank none | PASS | Programmatic sweep over all 91 questions + 8 lesson frontmatters: zero mismatches; 24 kc all back-linked symmetric, 67 bank all lessonId-free |
| 5 | Strict frontmatter, 2–4 real refs, substantive bodies, no docIds | PASS | All 8 mdx lessons carry exactly 4 `references`, all redis.io; spot-fetched hyperloglogs/antipatterns/jedis/cluster-spec/geospatial URLs live — all valid; zero `docIds` anywhere; no `docs.json` exists |
| 6 | 3 labs, real walkthroughs, strict schema | PASS | redis-cli tour (7 steps), TTL+eviction (6 steps, incl. disposable 6399 instance + honest "your counts will differ" expectedOutput), Jedis cache-aside (7 steps, real pom/code, NX+EX single-flight) — schema-validated green |
| 7 | Original content, disclaimer, six modes backed | PASS | Prose is distinctive vs fetched redis.io pages (no verbatim text); disclaimer in `subject.json:9`; learn/labs/practice/exams backed by content, notes/revision user-data-backed per `validate.ts:332` |
| 8 | Minimal honest test bump | PASS | `src/shell/views.test.tsx:39`: 6→7 + "+ redis" in comment only; nothing weakened |

## Review checks

- **(b) No business-logic regression** — PASS. `git status`: only `M src/shell/views.test.tsx` (1 line) + untracked `content/redis/` and plans/ journal/report workflow artifacts. `src/sdk` untouched.
- **(c) No public-contract changes** — PASS. No `src/` change besides the test count.
- **(d) Conventions** — PASS. Per-file questions match gh-900 granularity; `.mdx` lessons match the fixture pack's mdx frontmatter style exactly (`content/fixture/lessons/storage-models.mdx`); kebab-case ids; sampled domainPlan exam mirrors other packs; `comparisons.json` left as scaffold default (empty). Omitting `docs.json` is the plan's explicit resume-step decision ("docs.json optional, skip it"), and the no-docIds state is exactly what criterion 5 requires.
- **(e) Gates** — PASS (see criterion 1).
- **(f) Corruption sweep** — PASS. All 8 lessons, all 91 questions, all 3 labs, and the exam read in full. No injected placeholder strings, no stray keys, no duplicated/contradictory sentences, no mangled code blocks, no garbled prose. Grep for corruption markers (`data attempt`, `cache_control`, `cormrect`, `if False else`, TODO/lorem) clean.

## Fact verification (answer keys + technical claims)

Verified correct, among others: HLL 12 KB / 0.81% error / PFADD O(1) / PFMERGE O(N)
(matches live docs exactly); GEOPOS O(1) and GEOSEARCH O(N+log M) (lesson's cost
table matches the live geospatial command table); SCAN guarantees (completeness
for keys present whole iteration, duplicates, COUNT hint default 10, MATCH
post-filter); TTL −1/−2 sentinels; plain SET clears TTL, KEEPTTL; EXPIRE
NX/XX/GT/LT (7+); active expiry 10×/s, 20-key sample, 25% re-sample; SLOWLOG
defaults (10000 µs / 128) and entry shape (id, unix ts, µs duration, args) — the
codeReading transcript `rc-q-04-bank-10` matches; MULTI queueing-vs-execution
error semantics (`rc-q-04-bank-11` WRONGTYPE answer key correct); WATCH nil EXEC;
MOVED vs ASK (permanent map update vs one-off ASKING, no map update) and
CROSSSLOT; hash tags CRC16 of `{...}` mod 16384; Sentinel SDOWN/ODOWN, quorum
triggers vs majority authorizes, promotion order priority→offset→runid;
`cluster-require-full-coverage` default yes; RDB save-point semantics and
`save ""`; appendfsync windows (always/everysec ~1–2s/no); AOF wins at restart;
hybrid RDB preamble default since 5; eviction policy table incl. volatile-* →
noeviction degeneration and maxmemory-samples 5; ACL rule grammar (`>`, `#`,
`%R~`, `&`, selectors 7+); protected-mode and bind defaults; Jedis non-thread-safe
/ pool, Lettuce Netty shared thread-safe connection + sync/async/reactive,
Redisson RLock/RMap + Jackson default; EVAL/EVALSHA; lab arithmetic (LPUSH/RPOP
FIFO ordering, ZADD/leaderboard output order, DEBUG POPULATE 47351+152649=200000,
TTL jitter 300–359, Jedis `SetParams.setParams().nx().ex(10)`).

## Findings

### Critical

None.

### Major

None.

### Minor

1. **`latest_fork_usec` attributed to the wrong INFO section.**
   `content/redis/lessons/lesson-rc-l-04-perf-debugging.mdx:92` lists it under
   `INFO stats`, and `content/redis/lessons/lesson-rc-l-06-persistence.mdx:59`
   says "in `INFO stats`". Per the official INFO docs the field lives in the
   `persistence` section (`INFO persistence`). Semantics (µs, last fork) are
   correct; only the section label is wrong. Fix: replace "`INFO stats`" with
   "`INFO persistence`" in both spots.

2. **Cluster replica-election wording.**
   `content/redis/lessons/lesson-rc-l-05-clustering-ha.mdx:135` — "the failed
   master's replicas vote, one is promoted". Per the cluster spec, the failed
   master's replicas *campaign*; **master nodes** cast the votes ("Replica
   election and promotion is handled by replica nodes, with the help of master
   nodes that vote for the replica to promote"). The exam takeaway (a replica of
   the failed master is promoted) is right; the verb is off. Suggested: "the
   failed master's replicas campaign, masters vote, one replica is promoted".

3. **Vague ellipsis in persistence prose.**
   `content/redis/lessons/lesson-rc-l-06-persistence.mdx:88` — "(…rejects writes
   (`aof-write-...` handling)". Reads like an unfinished thought (the only
   placeholder-ish string in the pack). Either name the actual mechanism or drop
   the parenthetical.

4. **Jedis API freshness vs its own reference link.**
   `content/redis/lessons/lesson-rc-l-08-java-clients.mdx:33-40` and
   `content/redis/labs.json` (Jedis 5.1.0) teach `JedisPool`/`JedisPooled`.
   Current redis.io Jedis docs (Jedis 7.2) introduce `RedisClient` and mark
   those classes deprecated. Content is internally consistent and correct for
   the pinned 5.1.0 (and for the associate-exam canon), but a learner following
   the lesson's `docs/latest/clients/jedis/` reference sees different class
   names. Optional phase-3 polish: a one-line note that newer Jedis replaces the
   pool classes. Not blocking.

5. **One thematically-misfiled question.**
   `content/redis/questions/rc-q-01-bank-12.json` is a `CONFIG SET maxmemory`
   fill living in the rc-core-types pool; it belongs to security/config (D7). If
   the sampler draws it, the "data structures" exam section asks a memory-config
   question. Cosmetic; no wiring break.

## Metrics

- Corruption artifacts found: 0 (full read of every content file)
- Wiring issues: 0 (programmatic sweep)
- Answer-key errors: 0 (all 91 read; facts verified against official docs)
- Gate status: green (content:check 5/5 re-run; views test 27/27 re-run; full suite + build pre-verified)

## Sources consulted for fact checks

- [Redis INFO command](https://redis.io/docs/latest/commands/info/) — `latest_fork_usec` section placement
- [Redis geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/) — GEOPOS/GEOADD/GEOSEARCH complexities
- [Redis HyperLogLog](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs) — 12 KB / 0.81% / complexity table
- [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) — replica election mechanics
- [Redis anti-patterns](https://redis.io/learn/howtos/antipatterns) — KEYS/TTL/hot-key claims
- [Jedis guide (Java)](https://redis.io/docs/latest/develop/clients/jedis/) — current client API surface
