# Code review: Redis Cloud Operator track + polish (uncommitted, feat/redis-pack)

Date: 2026-09-04 · Reviewer: code-reviewer · Mode: advisory, nothing modified
Scope: content/redis/ uncommitted changes — 8 cloud domains/modules/lessons, 65 questions, 1 exam, 8 docIds, 3 labs, README row, and two polish items (rc-q-07-bank-4 re-file, lesson-08 Jedis note).

## Verdict

**PASS_WITH_MINORS** — no critical or high findings. All 8 acceptance criteria verified against files; every externally checkable fact I spot-checked matches live redis.io docs verbatim. Findings below are LOW/INFO polish plus one commit-hygiene risk.

## Per-criterion results

### 1. Domains D12-D19 — PASS
- `content/redis/domains.json:90-154`: exactly 8 additions after D11; D1-D11 untouched (diff context confirms).
- Orders 12-19, ids rc-cloud-*. Weight ranges vs official %s: 7-12 (Arch 9), 9-14 (SubAdm 11), 14-20 (DbAdm 17), 12-18 (Sec 15), 11-17 (Net 14), 8-14 (Mon 11), 8-14 (Auto 11), 9-15 (Data 12) — every official weight falls inside its range.
- Trace: Arch and SubAdm ranges center at 9.5/11.5 (+0.5 vs official). Inclusive; cosmetic only.

### 2. Modules, lessons, kc wiring — PASS
- `content/redis/modules.json:13-20`: 8 entries m-cloud-*, orders/codes 12-19, domainIds 1:1 with new domains.
- 8 lesson files lesson-rc-l-12..19; every moduleId ↔ lesson 1:1; every lesson `questionIds` = rc-q-NN-kc-1..3 and each of those 24 files carries the reciprocal `lessonId` (verified by tabulating all 65 files).
- Format matches flagship lesson-rc-l-09 shape (single md block, summary/minutes/difficulty/references/docIds/questionIds). Depth 7.3-9.5 KB vs lesson-09 at 9.4 KB and existing track range 7.1-10.1 KB — in family; lesson-15 (7.3 KB) is the lightest but above the existing floor.
- Observation: cloud lessons carry both `references` (4) and `docIds` (3-4); dev track uses references-only, swops uses docIds-only. Cloud doing both is the richest variant and schema-valid; all docIds resolve into docs.json (comm check clean).

### 3. Questions and labs — PASS
- 65 new files; per-domain counts 6/7/11/10/9/7/7/8 match the pools exactly. Kind mix spans single/multi/fill/matching/order/codeReading/bug with sensible difficulty spread.
- Structural invariants clean across all 65: single→string `correct`, multi→array, order→full permutation (4 or 5 options), bug→`buggyLineIndex` in range. 5-option multis match the swops-track precedent (rc-q-09/10 bank multis).
- Labs: lab-cloud-subscription-db → rc-l-13, lab-cloud-security-config → rc-l-15, lab-cloud-monitoring-alerts → rc-l-17; domainIds match (labs.json:319+).

### 4. Exam redis-cloud-mock-1 — PASS
- `content/redis/exams.json:47-65`: 65q (6+7+11+10+9+7+7+8), durationMinutes 90, passingScore 700, selection sampled, seed 20260905; every domainPlan count ≤ pool (in fact == pool).
- INFO: pool == plan for every domain, so the mock deterministically includes all 65 questions — the seed only affects order. Expected for mock-1; mock-2 will need fresh questions.
- INFO: 700 on the engine's 100-1000 scale (`src/engines/scoring.ts:57-60`, `100 + 900·correct/total`) equals 66.7% raw = 44/65, slightly more lenient than the official 70% = 46/65. The description discloses "70% to pass (scaled 700)" and 700 is the hub-wide convention (all three redis exams, fixtures, UI defaults). Not actionable in this change.

### 5. README — PASS
- `README.md:41-43`: single insertion "Redis (Developer, Software Operator, and Cloud Operator tracks)" into the installed-packs sentence, matching style; nothing else changed.

### 6. Polish items — PASS (both verified externally)
- rc-q-07-bank-4: git mv detected (RM status). Diff vs `HEAD:content/redis/questions/rc-q-01-bank-12.json` changes only id/domainId/moduleId/tags (data-structures→configuration+memory); prompt/explanation/template/blanks byte-identical. No references to the old id anywhere. New domain/module exist. Dev/swops exam plans stay feasible (rc-core-types pool 12 == dev plan 12, exact fit; gates green). Side effect: dev-mock-1's sampled paper shifts slightly — acceptable for a re-file.
- Jedis note (`content/redis/lessons/lesson-rc-l-08-java-clients.json:37` version-note bullet): verified against https://redis.io/docs/latest/develop/clients/jedis/ — docs state "Jedis 7.2.0 introduced a new client connection API": `RedisClient` replaces `UnifiedJedis`, `JedisPool`, `JedisPooled`; `RedisClusterClient` replaces `JedisCluster`; `RedisSentinelClient` replaces `JedisSentinelPool`; "The old client classes are now considered deprecated." The bullet is accurate (omits UnifiedJedis — trace). The framing that exam-tested threading facts are unchanged is the right hedge given the lesson still teaches JedisPool mechanics.

### 7. Content quality and cross-file consistency — PASS
- 15 questions read in full across all 8 domains; all 65 prompts skimmed. Scenario-based, single defensible correct answers, and explanations that both justify the key and dismiss each distractor — the house bar.
- Load-bearing facts, internally consistent AND verified against live docs:
  - TLS: not available on Free, off by default, mandatory once enabled, applies to new connections only, mTLS certs downloadable only at creation, redis_ca.pem bundle incl. GlobalSign root — all verbatim on .../security/database-security/tls-ssl/ (lesson 19, labs 1-2, rc-q-15-kc-1).
  - CIDR allow list: "Essentials plans can have between 4 and 32 entries... Pro plans can have up to 32" and "applies to both the public endpoint and the private endpoint... VPC Peering and Transit Gateway... must also add those IPs" — verbatim on .../security/cidr-whitelist/ (labs, lesson 16, rc-q-15-bank-3).
  - API auth: `x-api-key` + `x-api-secret-key`, both required, same account, user-key CIDR allow list, account-key change via support, user keys for Owner/Viewer/Billing admin/Logs viewer, values visible only at creation, 400 req/min/account key, base URL `https://api.redislabs.com/v1` + Swagger URL — all verbatim on .../rc/api/get-started/ and /use-rest-api (lesson 18, rc-q-13-bank-3, rc-q-13-kc-2, rc-q-18-kc-3, rc-q-18-bank-*).
  - Terraform env vars `REDISCLOUD_ACCESS_KEY`/`REDISCLOUD_SECRET_KEY` and resource names (lesson 18).
  - Ports: Prometheus 8070 + Pro-only + RFC-1918 whitelist consistent across lesson 17 / lab 3 / rc-q-17-bank-4 / rc-q-17-kc-2, and coherently distinct from Software's `:8070/v2` (pre-existing lessons 9/11). 16379 appears only as a distractor (rc-q-16-bank-2) and is correctly treated as a non-Cloud endpoint format; Cloud ports are embedded in hostnames (lessons 16/19, rc-q-19-kc-1). 443 implicit for the API — no contradictions.
  - Default eviction volatile-lru (rc-q-14-bank-1) and Active-Passive sizing (+25% over replication doubling; docs' 1 GB→2.5 GB arithmetic, rc-q-14-kc-3) check out.
  - All 11 docs URLs used by new content return 200 (8 docs.json additions + create-free-database + tls-ssl + cidr-whitelist).
  - No "Enterprise" tier, no "hibernation", Active-Passive per research anchors.

### 8. The 14-day free-database fact — KEEP AS WRITTEN (adjudication)
- Occurrences: lesson 12 body + takeaway ("Redis support documents deletion after 14 days of inactivity" — attributed), subscription lab step 1 and checks, monitoring lab hint ("about 14 days"). Zero occurrences in questions — correct, since the fact is support-article-sourced, not main-docs.
- The wording is appropriately hedged everywhere (attribution in the lesson, "about" in labs). Do not trim: it is operationally load-bearing for free-tier lab learners (the monitoring lab even uses it as motivation). Note the parent briefing said "lesson 12/13" — it is lesson 12 only; lesson 13 does not mention it.

## Findings (ranked)

**Medium (process, not content)**
1. Untracked out-of-scope files can ride into the commit. `plans/260821-1457-ui-redesign-brand-conformance/` and `plans/reports/code-reviewer-260821-1512-ui-redesign-plan-attack.md` are pre-existing artifacts of the unrelated ui-redesign initiative (present on the branch before this work). Commit this change with explicit paths (or stage-ignore them) so feat/redis-pack doesn't ship another initiative's plan files. The five `plans/reports/agent-260904-1606-*` + researcher report belong to this initiative — include as usual.

**Low**
2. `content/redis/labs.json:366` (subscription lab checks): "State two things that happen to a free database with no reads or writes for about 14 days..." — the lab text states only ONE consequence of inactivity (deletion); the other "plan fact" (one free database per account) is not inactivity-dependent, so the check as phrased has one answer. Fix: "State the two free-plan facts worth writing down — the per-account free-database limit and the inactivity deletion window — and name one paid-Essentials capability..."
3. `content/redis/lessons/lesson-rc-l-08-java-clients.json:37`: the note now makes the lesson contain two different `RedisClient` classes — Jedis 7.2's `redis.clients.jedis.RedisClient` and Lettuce's `io.lettuce.core.RedisClient` in the code sample a screen later. Qualify the bullet ("Jedis's own `RedisClient`") to pre-empt conflation. (Lettuce's `RedisClient.create(...)` vs Jedis's `new RedisClient(...)` differ, but the shared bare name is the trap.)
4. `content/redis/lessons/lesson-rc-l-17-cloud-monitoring.json` docIds include `rs-monitoring-alerts` (Software docs page, .../operate/rs/monitoring/) while all four of its `references` are Cloud URLs and the body never discusses Software. Swap for an rc- docId or drop the chip.
5. `content/redis/questions/rc-q-14-bank-1.json` distractor "no-eviction" — the canonical policy name is `noeviction` (as rc-q-07-bank-4's own explanation spells it). Cosmetic, distractor-only.

**Trace / informational**
6. rc-q-14-bank-8 `codeLines` use a `#` comment inside a JS-shaped object literal — fine as pseudo-config, slightly off dialect.
7. Phase-3 plan doc (`plans/260903-1753-redis-subject/phase-03-cloud-operator-track-polish.md`) still records the pre-research scope (3 domains, ~45q, 60q/60min, status todo). Delivered scope follows the research correction and user decision; the plan file is stale and its todos unchecked — leave for the lead/planner to reconcile.
8. Cloud exam uses the entire question bank (pool == plan in all 8 domains); seed orders but does not select.
9. 700 == 66.7% raw under the hub's 100-1000 scaling (see criterion 4) — hub-wide convention, disclosed in the exam description.

## Regression / contract answers (explicit)

- **src/ untouched?** Yes — git status shows zero changes under src/; only README.md and content/redis/** modified.
- **D1-D11 / dev+swops content untouched?** Yes, except the single sanctioned re-file (rc-q-01-bank-12 → rc-q-07-bank-4) and the single sanctioned lesson-08 bullet. Both diffs are exactly as scoped.
- **Public contracts / schema:** none changed — content-only additive change plus one id rename with no dangling references (grep clean).
- **Existing exams:** dev-mock-1 and swops-mock-1 objects unchanged; feasibility preserved (rc-core-types exact-fit at 12; gates green per primary session). Sampled papers may shift slightly due to the pool move — benign.
- **README contract:** one sentence extended in place; no structural edit.
- **Anything else dirty?** Only the items in finding 1; nothing unexpected.

## Metrics
- Gates (per primary session, not re-run): content:check 5/5, vitest 613/613, oxlint clean, build OK.
- Doc links: 11/11 live (200).
- External facts spot-checked live this review: 6 pages (Jedis, TLS, CIDR allow list, API get-started, API use-rest-api; Datadog/New Relic previously verified by primary) — all matched, most verbatim.
- Questions fully read: 15/65 across all 8 domains; all 65 prompts skimmed.

## Recommended actions
1. Before committing: keep the two ui-redesign artifacts out of this commit (explicit paths).
2. Optional polish (one small commit): lab check reword (finding 2), "Jedis's own RedisClient" qualifier (finding 3), drop/swap rs-monitoring-alerts docId (finding 4), noeviction spelling (finding 5).
3. Lead/planner: reconcile the phase-3 plan doc with the delivered scope.

Status: DONE_WITH_CONCERNS
Summary: Cloud Operator track verified clean against all 8 acceptance criteria with zero critical/high findings and every spot-checked fact matching live redis.io docs; remaining items are minor wording polish and keeping two unrelated untracked ui-redesign artifacts out of the commit.
Concerns/Blockers: Commit hygiene risk only (finding 1); findings 2-5 are optional polish.
