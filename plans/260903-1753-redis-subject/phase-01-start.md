---
phase: 1
title: "Scaffold + Core + Developer Java Track"
status: done
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Scaffold + Core + Developer (Java) Track

## Overview

Branch `feat/redis-pack` off `main`, scaffold `content/redis/`, author the five
shared core domains + two Developer-track domains, lessons, labs, practice
questions, and the 65-question/90-min Developer mock exam. Deliverable: a usable
Redis subject on the home rail after restart.

## Requirements

- Functional: original exam-prep content for shared core + Developer (Java)
  domains; mock exam format 65q / 90 min / 70% pass.
- Non-functional: passes `npm run content:check`, `npm test`, `npm run build`;
  follows pack conventions (kebab ids, per-domain lesson files like gh-900).

## Key Insights

- Pack pattern proven by 5 shipped packs; scaffold: `npm run content:new -- --id redis --code REDIS --title "Redis" --accent deep-teal`.
- Schema (verified in `src/sdk/validate.ts` + shipped packs): `domains.json`
  [{id, order, title, weight{min,max}, summary}]; `modules.json` [{id, domainId,
  order, title, docIds}]; `docs.json` {docId: {title, url}}; one lesson file per
  domain (`lessons/lesson-<id>.json`: {id, domainId, moduleId, title, minutes,
  blocks[kind: md|heading|list|code|tip|table]}); questions per file {id,
  domainId, moduleId, prompt, explanation, docIds, kind: single|multi|order|
  matching|fill|codeReading|bug, options, correct}; `labs.json` [{id, domainId,
  title, minutes, summary, steps[{instructions}]}]; `exams.json` [{id, title,
  durationMinutes, passingScore (scaled /1000; default 700 = 70%), selection
  {kind: sampled, domainPlan, seed, excludeExamIds?}}].
- Accent `captain-red` taken by Languages → `deep-teal`. Real exam pass line 70%
  = engine default 700.
- Official dev-exam study guide (redis.io blog, "How to ace the Redis Certified
  Developer exam") lists domains: general CS/DB/Redis knowledge, Redis keys, data
  structures, data modeling, + persistence and client usage sections.

## Related Code Files

- Create: `content/redis/subject.json`, `domains.json`, `modules.json`,
  `docs.json`, `labs.json`, `exams.json`, `lessons/lesson-rc-core-*.json` (5),
  `lessons/lesson-rc-dev-*.json` (2), `questions/*.json` (~90)
- No core-code changes; Vite glob discovers pack after dev-server restart.

## Implementation Steps

1. Branch: `git checkout main && git pull && git checkout -b feat/redis-pack`.
2. Verify official outlines before freezing domains: WebFetch the redis.io dev
   study-guide blog post; browser-fetch (agent-browser) the three Redis
   University course pages (dev-Java, Software Operator, Cloud Operator) for
   format + domain names. Record corrections into domain defs; weights stay
   provisional (wide min/max) where unconfirmed.
3. Scaffold: `npm run content:new -- --id redis --code REDIS --title "Redis" --accent deep-teal`; edit `subject.json`:
   subtitle "Developer (Java) · Software Operator · Cloud Operator",
   disclaimers ["Independent study aid. Not affiliated with or endorsed by
   Redis Ltd. Redis is a trademark of Redis Ltd."], enabledModes [learn, labs,
   practice, exams, notes, revision].
4. Author `domains.json` (7 domains, provisional weights, refine after step 2):
   - `rc-core-types` Redis data types (strings→hashes/sets/zsets, streams,
     bitmaps, hyperloglog, geospatial; per-type commands + complexity)
   - `rc-core-keys` keys & data modeling (keyspace, TTL/EXPIRE, SCAN vs KEYS,
     naming, big-key/O(n) hazards)
   - `rc-core-persist` persistence & durability (RDB, AOF, hybrid, fsync, rewrite)
   - `rc-core-ha` replication, HA & clustering (replica, Sentinel, cluster
     slots/resizing/failover)
   - `rc-core-security` security & configuration (ACL, TLS, memory/eviction,
     maxmemory, lazy freeing)
   - `rc-dev-java` Redis for Java (Jedis/Lettuce/Redisson, pooling, codecs,
     pipelines, transactions, Lua via Java)
   - `rc-dev-app` application patterns (cache-aside, TTL strategy, sessions,
     rate limiting, pub/sub & streams for services)
5. Author `docs.json`: link real redis.io docs pages (data types, persistence,
   cluster, ACL, Jedis/Lettuce docs) — linking, never copying.
6. Lessons: 7 domain lessons + modules (1-3 modules per domain, 15-20 total),
   following gh-900's per-domain lesson file convention; knowledge-check
   questions inline where the lesson engine supports them (mirror gh-900).
7. Questions: ~90 original questions (~15-20 per domain; every question
   answerable from pack lessons + linked docs; mix kinds: single/multi/order/
   matching/fill/codeReading/bug).
8. Labs (3-4): redis-cli data-structures tour; TTL/eviction lab; Java client
   (Jedis) cache-aside lab. Written walkthroughs (pack convention — no sandbox).
9. Mock exam `redis-dev-mock-1`: durationMinutes 90, passingScore 700, sampled,
   domainPlan 65 questions weighted per domain weights (core-heavy), seed
   fixed + recorded.
10. Gates: `npm run content:check` → `npm test` → `npm run lint` → `npm run build`;
    restart dev server, click through all six modes on home rail; conventional
    commit `feat: add Redis pack — core + Developer (Java) track`.

## Todo

- [x] Branch `feat/redis-pack` from `main`; confirm exam outlines (step 2)
- [x] Scaffold pack + subject.json (accent deep-teal, disclaimers, modes)
- [x] domains.json (8 domains per verified outline, weights provisional)
- [x] ~~docs.json~~ skipped per resume note (inline links + lesson references instead)
- [x] 8 domain lessons (mdx→json, see note below) + 8 modules
- [x] 91 questions across 8 domains
- [x] 3 labs
- [x] Developer mock exam (65q/90min/700)
- [ ] All gates green + six-mode click-through + commit (commit pending user)

## Success Criteria

- [x] Gates green; pack passes schema + reference validation
- [x] Home rail shows Redis; all enabled modes render real content
- [x] Mock exam samples 65 questions across core+dev domains, scales pass at 700
- [x] Content original; disclaimer present; no copied Redis docs text

## Risk Assessment

- Exam outline drift (search-derived facts). Mitigation: step 2 verifies against
  official pages before domains freeze; weights authored as wide min/max.
- Observed signal if assumption broke: university pages unreachable headless →
  fall back to study-guide blogs + `university@redis.com` question, keep
  provisional weights. Pre-decided response: adjust weights, don't block phase.
- Branch base: `main` may lack languages-pack commits — irrelevant to content/;
  README conflict deferred to Phase 3 (only shared file).
- Question-pool depth: 65-sample needs ≥90 pool for seed variety — sized above.

## Security Considerations

- No secrets; content links only public redis.io URLs; original text only.

## Progress note — 2026-09-03 (session paused)

Implementation halted mid-authoring by repeated model output corruption
(malformed JSON in large AND small writes; caught by python json.load each
time). User chose pause + fresh-session resume.

Verified-good on branch `feat/redis-pack` (off latest `main`, uncommitted):
- Plan/report/journal intact (`plans/260903-1753-redis-subject/`, brainstorm
  report, `plans/journals/2026-09-03-plan-redis-subject-pack-*.md`)
- `content/redis/subject.json` valid + final (deep-teal, disclaimers, 6 modes)
- Scaffold intact: comparisons/exams/labs empty arrays, welcome.mdx +
  welcome.json starter, `modules.json` scaffold default
- Outline research done (do NOT redo): official dev-exam study guide = 7
  sections (fundamentals+Big-O, keys, data structures+complexity, modeling,
  debugging MONITOR/RESP, perf/correctness pipelines+transactions+eviction,
  clusters shards/slots/hash-tags); no language-specific questions on the exam;
  Software Operator 60q/60min/70%; Cloud format still unverified (Phase 3)

Resume steps for next session:
1. Rewrite `content/redis/domains.json` (currently placeholder garbage — 8
   domains: types, keys, model, perf, cluster, persist, security, dev-java;
   weights provisional; schema: {id, order, code, title, weight{min,max},
   summary}, strict)
2. `modules.json` — 8 modules (1/domain, ids m-data-structures, m-keys,
   m-data-modeling, m-perf-debugging, m-clustering-ha, m-persistence,
   m-security-config, m-java-clients), keep {id, domainId, order, code, title,
   summary} shape; `lessons/lesson-*.mdx` per module (frontmatter: id,
   domainId, moduleId, order, slug, title, summary, minutes, difficulty;
   markdown body; inline redis.io doc links — docs.json optional, skip it)
3. ~90 questions via python generator (kinds verified in src/sdk/validate.ts:
   single/multi/order/matching{pairs}/fill{template,blanks}/codeReading{code}/
   bug{codeLines,buggyLineIndex}; base: id, domainId, moduleId, lessonId,
   difficulty, prompt, explanation, tags)
4. 3 labs + dev mock exam (65q/90min, sampled domainPlan 12/6/9/11/8/5/4/10,
   passingScore 700, seed fixed) — delete welcome.mdx/welcome.json when real
   content lands
5. Gates: content:check → test → lint → build; six-mode click-through; commit

Caution for next session: write SMALL (one file per call), validate JSON
immediately after each write, do not batch multiple files into one tool call.

## Progress note — 2026-09-04 (phase 1 complete, commit pending)

Fresh-session resume hit the SAME injected-token corruption (5/5 corrupted
long structured writes in the primary session: stray keys, `X if False else Y`
splices, truncation). Working mitigation: delegate all content authoring to
subagents (their output streams were clean) with per-write validation in each
prompt; primary session verifies inbound. ~16 corruption events were caught
and fixed across three authoring agents (labs/exams, lessons, questions);
zero residue per independent review.

Delivered on `feat/redis-pack` (uncommitted): domains.json (8), modules.json
(8), 8 lessons, 91 questions (per-file convention), labs.json (3), exams.json
(redis-dev-mock-1, 65q sampled, seed 20260903), welcome.* removed, one-line
installed-pack test count 6→7 in src/shell/views.test.tsx.

Lesson format flipped mdx→json late in the phase: `.mdx` lessons crash in the
browser (gray-matter `lib/utils.js` `Buffer.from` — `buffer` externalized in
Vite; ReferenceError at pack load, pack silently skipped). Pre-existing
platform bug: fixture pack's `storage-models.mdx` fails the same way. Needs a
platform fix decision (polyfill vs drop gray-matter) before any pack uses
`.mdx` lessons. All shipped packs use `.json` lessons; redis now does too
(frontmatter fields preserved, body = single `md` block).

Gates: content:check 5/5 · vitest 613/613 · lint clean · build OK. Review:
code-reviewer PASS 8/8 acceptance (0 critical/major, 5 minor — 3 fixed:
`latest_fork_usec` section = `INFO persistence` ×2, replica-election
wording, MISCONF AOF ellipsis; 2 deferred to phase 3: Jedis docs now show
7.x `RedisClient` vs pinned 5.x API note, rc-q-01-bank-12 fill misfiled in
data-structures pool). Tester: wiring symmetric (24 kc ↔ lessons), sampler
byte-identical across seeded runs, per-domain counts exact.

Six-mode click-through verified on a temp dev server (:5174, stopped after):
home rail REDIS card, learn/labs/practice/exams/notes/revision all render;
mock exam detail + Start render; paper assembly proven by sampler run.
NOTE: the user's long-running dev server on :5173 predates the pack and must
be restarted to see Redis.

Carry-overs for phase 3: Jedis docs freshness note, rc-q-01-bank-12 domain
move, platform mdx/Buffer bug, tester observations (exam draws 16/65 from
kc-attached questions; consider a redis golden test pinning seeded paper ids).
