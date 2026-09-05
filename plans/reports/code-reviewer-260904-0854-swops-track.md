# Code Review — Redis pack "Software Operator" track (D9-D11)

Reviewer: code-reviewer subagent, 2026-09-04. Branch `feat/redis-pack`, uncommitted changes only.
Verdict: **PASS_WITH_MINORS**

## Scope

- Modified: `content/redis/domains.json`, `modules.json`, `exams.json`, `labs.json`
- Created: `content/redis/docs.json`, 3 lessons, 45 questions
- Dirty tree contains exactly the scoped files plus pre-existing untracked `plans/260821-1457-ui-redesign-brand-conformance/` and `plans/reports/code-reviewer-260821-1512-ui-redesign-plan-attack.md` (both present in the conversation-start git snapshot, not part of this change) and the three implementation agent reports from this task (`plans/reports/agent-260904-0854-*.md`). Nothing under `src/`, `package.json`, `docs/`, `README` is touched.
- LOC: ~1,600 added across manifests + 48 new JSON files.

## Acceptance criteria results

### 1. Domains — PASS
`content/redis/domains.json:66-89`: `rc-swops-install` (order 9, D9, weight 20-35), `rc-swops-cluster` (order 10, D10, 30-45), `rc-swops-ops` (order 11, D11, 25-40). Weights are provisional-wide per plan. The diff is a pure append — D1-D8 entries are byte-identical to HEAD.

### 2. Modules / lessons / questions / labs — PASS
- 3 modules, one per domain, codes 09-11, orders 9-11 (`content/redis/modules.json:10-12`).
- 3 lessons in the flagship single-md-block format matching `lesson-rc-l-05` (minutes/difficulty/references/docIds/questionIds/slug all present, one `md` block). Depth is comparable to the exemplar (~5-7 `##` sections + "Exam takeaways").
- 45 questions: 12 bank + 3 kc per domain (file counts verified).
- 3 labs (`labs.json` diff): fields conform to `LabSchema` (`src/sdk/validate.ts:166-187`); steps use title/instructions/expectedOutput/hint, matching the 3 existing labs' richer shape. Lab `lessonId`s resolve to the exact lesson ids.

### 3. kc wiring — PASS
- `questionIds` are exactly `rc-q-09-kc-1..3` / `rc-q-10-kc-1..3` / `rc-q-11-kc-1..3` (lessons 09/10/11).
- Every kc question carries the matching `lessonId`; difficulty is beginner/intermediate (kc-3 intermediate on 09 and 11; all beginner on 10 — within spec).
- All 36 bank questions have no `lessonId` (verified by structural dump).

### 4. Exam — PASS
`content/redis/exams.json` (new entry `redis-swops-mock-1`): 60min, passingScore 700 (scaled-out-of-1000 semantics per `src/sdk/types.ts:267`), sampled selection, seed 20260904 recorded. Hand-edited domainPlan: 15+15+15 (swops) + 3+1+1+2+3+2+3 (core) = **60**; JSON valid (`jq empty` pass). Actual per-domain question counts verified by grep: types 18, keys 9, model 12, perf 15, cluster 11, persist 7, security 6, swops 15 each — every plan count ≤ pool, so `exam-infeasible` cannot fire.

### 5. docs.json resolution + URL freshness — PASS
8-entry registry. All 12 lesson `docIds` usages (5+3+4) resolve to registry keys. Live spot-checks (4 of 8 URLs fetched, all current redis.io `/docs/latest/operate/rs/` pages): `rs-install` (plan-deployment), `rs-licenses`, `rs-monitoring`, `rs-rladmin`.

### 6. Content originality + internal consistency — PASS
All 45 questions and all 3 lessons read in full.

Kind mix per domain (bank + kc): exactly 6 single / 2 multi / 2 fill / 2 codeReading / 1 matching / 1 order / 1 bug — all three domains. Structural validity confirmed per kind: multi has ≥2 correct + ≥1 distractor (worst case rc-q-11-bank-4: 3 of 4); fill blank counts equal `___` counts; order `correct` arrays are exact permutations; matching lefts unique; `buggyLineIndex` in range (3/5, 3/5, 2/4).

Factual verification against redis.io (WebFetch/WebSearch, 2026-09-04):
- Trial license 30 days / 4 shards incl. master+replica; one license per cluster incl. DR standby; expired-license blocked vs still-allowed action list; 7-day default expiry alert — all match the license-keys page exactly (lesson 09, rc-q-09-bank-9, rc-q-11-kc-2, rc-q-11-bank-12, lesson 11 playbook).
- Port table: 8443 UI (configurable via `cm_port`), 9443 secure + 8080 unencrypted REST API, 8001 discovery, 8070 metrics, UDP 53/5353, 10000-19999 database traffic, 20000-29999 shard traffic — matches port-configurations page (lesson 09, kc-1, rc-q-09-bank-1/4, rc-q-11-bank-1/6).
- Ubuntu port-53 `systemd-resolved` stub listener as documented install-failure cause, and the sysctl 30000 ephemeral-range recommendation — confirmed (rc-q-09-bank-12).
- Metrics stream engine GA in 8.0, v2 endpoint `https://<cluster>:8070/v2` — confirmed (lesson 11, rc-q-11-bank-6, lab alert-triage).
- `rladmin` verbs `upgrade db`, `metrics`, `running_actions` ("Lists all active tasks"), `cluster debug_info` ("Creates a support package"), `create/join/recover` — confirmed on the rladmin reference pages.
- Maintenance mode showing `0/0` shards in `rladmin status` — confirmed by the maintenance-mode doc ("Now node 2 has 0/0 shards…"), load-bearing for rc-q-10-bank-9's key and rc-q-09-bank-5's explanation.
- Default-enabled alerts `cluster_license_about_to_expire` (7 days) + `cluster_users_count_approaches_limit` — confirmed by the alert_settings REST object reference (rc-q-11-bank-5, lab alert-triage step 2).
- `GET /v1/bdbs/{uid}/availability` is a real documented endpoint (requests/bdbs/availability + monitoring/db-availability guide) — rc-q-11-bank-3 and bank-9 are sound.

No contradictions found across lessons/labs/questions on ports, commands, or defaults (trial limits, Replica Of cutover rule, maintenance-mode semantics, eviction default `volatile-lru`, 65/70/80% sizing thresholds all consistent everywhere they appear). Prose is original paraphrase, not copied doc text; tone matches the existing pack ("The exam tests…", "Exam takeaways").

### 7. JSON validity — PASS
`jq empty` across all 4 modified manifests + 48 created files: zero failures.

## Findings

### Minor 1 — References region renders duplicated links on the 3 new lessons
`src/ui/LessonViewer.tsx:134-152` renders inline `references` as a link list AND `DocLinkChips docIds={lesson.docIds}` in the same References section. Duplication counts: rc-l-09 — all 4 inline references duplicate docId chips (rs-install, rs-bootstrap, rs-licenses, rs-upgrades; only rs-certificates is chip-only); rc-l-10 — 2 of 4 (rs-rladmin, rs-backup-restore); rc-l-11 — 1 of 4 (rs-monitoring-alerts). Existing lessons (rc-l-01..08) carry no `docIds`, so this redundancy is introduced by this change and is worst on rc-l-09 (8 rendered links for 5 unique sources).
**Assessment:** cosmetic, no data or contract impact — but worth fixing pre-merge because it is 7 deletions. Recommended fix: remove the duplicated inline reference entries, keeping only references with URLs not in docs.json (rc-l-10: "Create a Redis Software database", "Recover a failed database"; rc-l-11: logging, support package, test-client connectivity). Alternative: fold those extra URLs into docs.json and drop inline references entirely — more churn for no learner-visible gain.

### Minor 2 — rc-q-09-bank-7 option b wording wrinkle
Option b ("Repeat for every remaining node, one at a time, **starting with the master node**") is the last step of the correct order a→d→e→c→b, but "starting with the master node" implies the master comes after the node already handled in a/d/e/c, while the explanation (and lesson 09) say the master/primary is upgraded first. The intended sequence is still unambiguous (b is the only "repeat" step), so the question is answerable; but rewording b to "Repeat for every remaining node, one at a time" and moving "upgrade the primary node first" into the stem would remove the tension.

### Info — deterministic full-pool draw
domainPlan 15/15/15 against pools of exactly 15 means every sitting of `redis-swops-mock-1` contains all 45 swops questions, and the fixed seed makes the entire paper identical across sittings. By design per the plan premise and consistent with exam 1 (fixed seed 20260903); flagged only so nobody expects retake variety. Also note: removing any swops question later will (correctly, loudly) fail `content:check` feasibility.

### Info — version-coupled trivia in one explanation
rc-q-11-bank-5's explanation cites "90% of the 32,000-user maximum on new clusters". The two default-enabled alerts and the 7-day threshold are confirmed current docs; the 32,000 figure is version-dependent. Not a defect today.

## Regression / contract checks

- Public contracts untouched: `src/`, `package.json`, `docs/`, `README` clean in `git status`. No exported interface, schema, or validation rule changed.
- Conformance to `src/sdk/types.ts` + `src/sdk/validate.ts` verified by reading both: all new entities fit the strict Zod shapes (no unknown keys); graph rules (unresolved refs, exam feasibility, per-kind answerability, docId resolution) all satisfied — and `npm run content:check` re-run by this reviewer: **5/5 pass**.
- Pack conventions: no lesson anywhere in the pack sets `labId` (labs link to lessons via `lessonId` only) — new content matches. `docIds` on lessons is a new convention introduced by this change per the accepted plan; questions and modules use no docIds anywhere (consistent before and after).
- Gates claimed passing (vitest 613, oxlint, tsc+vite) not re-run — no `src/` change makes them load-bearing for this diff.

## Recommended actions

1. (Pre-merge, trivial) Remove the 7 duplicated inline reference entries across the 3 new lessons — see Minor 1.
2. (Optional) Reword rc-q-09-bank-7 option b — see Minor 2.
3. No other changes required.

## Metrics

- JSON validity: 52/52 files pass `jq empty`
- content:check: 5/5 (re-run by reviewer)
- Kind mix: 3/3 domains exact
- Docs verified live: 4/8 registry URLs fetched, plus 5 additional redis.io pages for fact-checks
- Lint/type/build: not re-run (out of scope for a content-only diff)

## Unresolved questions

None.

## Sources

- [Cluster license keys](https://redis.io/docs/latest/operate/rs/clusters/configure/license-keys/)
- [Plan Redis Software deployment](https://redis.io/docs/latest/operate/rs/installing-upgrading/install/plan-deployment/)
- [Network port configurations](https://redis.io/docs/latest/operate/rs/networking/port-configurations/)
- [Monitoring with metrics and alerts](https://redis.io/docs/latest/operate/rs/monitoring/)
- [rladmin](https://redis.io/docs/latest/operate/rs/references/cli-utilities/rladmin/) / [rladmin cluster](https://redis.io/docs/latest/operate/rs/references/cli-utilities/rladmin/cluster/)
- [Database requests (REST API)](https://redis.io/docs/latest/operate/rs/references/rest-api/requests/bdbs/) / [Database availability requests](https://redis.io/docs/latest/operate/rs/references/rest-api/requests/bdbs/availability/)
- [Maintenance mode for cluster nodes](https://redis.io/docs/latest/operate/rs/clusters/maintenance-mode/)
- [Alert settings object](https://redis.io/docs/latest/operate/rs/references/rest-api/objects/cluster/alert_settings/)

---

Status: DONE_WITH_CONCERNS
Summary: Swops track (D9-D11, 3 modules/lessons/labs, 45 questions, sampled 60q exam, docs registry) fully conforms to the SDK contracts and plan acceptance criteria; all load-bearing facts spot-checked against current redis.io docs check out. Two minor pre-merge fixes recommended: duplicate inline references in the 3 lessons' References region (worst on rc-l-09) and a wording wrinkle in rc-q-09-bank-7 option b.
Concerns/Blockers: Minor 1 (reference duplication — 7 deletions across lesson-rc-l-09/10/11.json) and Minor 2 (rc-q-09-bank-7 option b reword). Neither blocks correctness or the gates.
