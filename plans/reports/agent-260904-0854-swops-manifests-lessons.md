# Report: Software Operator track — manifests, docs registry, lessons, mock exam

Date: 2026-09-04 · Branch: feat/redis-pack · Phase 2 scaffolding for the Redis Certified Software Operator track.

## What was written

- **content/redis/domains.json** — appended 3 domains (existing D1-D8 untouched): `rc-swops-install` (D9, order 9), `rc-swops-cluster` (D10, order 10), `rc-swops-ops` (D11, order 11), with the exact ids/weights/summaries from the task spec.
- **content/redis/modules.json** — appended 3 modules (existing 01-08 untouched): `m-swops-install` (09), `m-swops-cluster` (10), `m-swops-ops` (11), each bound to its domain.
- **content/redis/docs.json** — created the citation registry, 8 entries, docId → {title, url}, kebab ids prefixed `rs-`, matching the gh-200 docs.json shape used elsewhere in the repo.
- **content/redis/lessons/lesson-rc-l-09-install-upgrade.json** — flagship single-md-block lesson (requirements/planning, install vs bootstrap, first-cluster bootstrap flow, license/trial/expiry mechanics, TLS certificate set, in-place vs rolling upgrades, security patch + RSAL awareness, exam takeaways).
- **content/redis/lessons/lesson-rc-l-10-cluster-db-ops.json** — Cluster Manager/rladmin twin consoles, node add/remove/rebalance/maintenance mode, rack-zone awareness (why + 3-level setup), DMC/proxy/endpoint policy + discovery on 8001, database provisioning (memory, shards, replication, persistence, eviction, port, name rules), endpoints/FQDN and the IP-vs-FQDN DNS diagnostic, scheduled backups and the two restore paths (import; `rladmin recover`), live migration via Replica Of, exam takeaways.
- **content/redis/lessons/lesson-rc-l-11-monitoring-troubleshooting.json** — metrics UI + metrics stream engine v2 Prometheus endpoint (8070/v2), alert configuration and thresholds (license expiry default 7 days; 65%/70% RAM, 80% CPU tripwires; AA eviction at 80%), logs (Cluster > Logs, /var/opt/redislabs/log/, event_log.log), job scheduler (logrotate 5-min, cert rotation, CCS rotation, cleanup via /v1/job_scheduler), support package (UI/CLI/REST + contents), 4 failure playbooks (node down, endpoint unreachable, license/cert expiry, memory pressure), exam takeaways.
- **content/redis/exams.json** — appended `redis-swops-mock-1` (60 min, 700, sampled domainPlan 13/16/16 over swops + trimmed core 3/1/1/2/3/2/3 = 60, seed 20260904).

Lessons use fields id/moduleId/domainId, order 1, minutes 15, difficulty intermediate, one `{kind:"md"}` block, 4 references, 3-5 docIds, and exactly the prescribed questionIds (rc-q-09/10/11-kc-1..3, authored by the sibling agent). labs.json was not touched; existing labs reference rc-l-01/02/08, so no alignment edits were needed.

## Verified docs.json URL list (every URL fetched with WebFetch and confirmed on-topic)

| docId | Title | URL |
|---|---|---|
| rs-install | Plan Redis Software deployment | https://redis.io/docs/latest/operate/rs/installing-upgrading/install/plan-deployment/ |
| rs-bootstrap | Set up a new cluster | https://redis.io/docs/latest/operate/rs/clusters/new-cluster-setup/ |
| rs-licenses | Cluster license keys | https://redis.io/docs/latest/operate/rs/clusters/configure/license-keys/ |
| rs-certificates | Certificates | https://redis.io/docs/latest/operate/rs/security/certificates/ |
| rs-upgrades | Upgrade a Redis Software cluster | https://redis.io/docs/latest/operate/rs/installing-upgrading/upgrading/upgrade-cluster/ |
| rs-rladmin | rladmin | https://redis.io/docs/latest/operate/rs/references/cli-utilities/rladmin/ |
| rs-backup-restore | Schedule periodic backups | https://redis.io/docs/latest/operate/rs/databases/import-export/schedule-backups/ |
| rs-monitoring-alerts | Monitoring with metrics and alerts | https://redis.io/docs/latest/operate/rs/monitoring/ |

Additional verified URLs used as inline lesson references (fetched on-topic, not in docs.json): Hardware requirements (/installing-upgrading/install/plan-deployment/hardware-requirements/), Rack-zone awareness (/clusters/configure/rack-zone-awareness/), Create a Redis Software database (/databases/create/), Recover a failed database (/databases/recover/), Create a support package (/installing-upgrading/creating-support-package/), Logging events (/clusters/logging/), Test client connection (/databases/connect/test-client-connectivity/), Redis Software quickstart (/installing-upgrading/quickstarts/redis-enterprise-software-quickstart), Replica Of (/databases/import-export/replica-of/).

## Facts verified and used (all from the fetched pages above)

8443 UI / 9443 REST / 8001 discovery (Sentinel-compatible) / 8070 metrics (+ v2 endpoint `https://<cluster>:8070/v2`, GA 8.0) / 53+5353 / DB ports 10000-19999; static IPs only; prod min 3 nodes (odd), 2 cores/8 GB min, ephemeral ~2x RAM, persistent ~3x RAM, 35-node cap, 30% RAM free, 65%/70% RAM and 80% CPU thresholds; install.sh → /opt/redislabs, redislabs user/group, rl_uninstall.sh, rlutil maintenance utility, rladmin in /opt/redislabs/bin; bootstrap flow (admin credentials = REST credentials, optional license key, immutable FQDN, cluster.local caveat); trial = 30 days / 4 shards / all features, one license per cluster incl. DR standby, no return to trial, expiry effects, default 7-day expiry alert; certificate names (cm, api, proxy, syncer, metrics_exporter, internode, ldap_client, mtls_trusted_ca, sso_*); rlcheck prereq, maintenance mode via yellow SHARDS, primary first, in-place vs rolling (extra node / replace node / replace_node flag), supervisorctl restart cnm_exec, redis_upgrade_policy; rack-zone awareness (cluster-level one-way, immutable node rack_id, per-DB rack_aware, rack ID rules, second_rack_id since 7.22, 3 nodes → 3 racks); rladmin verbs (bind, migrate, failover, recover, tune, verify, upgrade, placement); POST /v1/bdbs memory_size, DB name rules, port/capabilities immutable; backup intervals 24/12/4/1 h, UTC start + random offset staggering, storage targets, .gz RDB, max_simultaneous_backups default 4, 5-min trigger; rladmin recover list/all/db, recovery_path, /var/opt/redislabs/persist/redis, recovery_wait_time default -1; Replica Of (≤32 sources, syncing/synced/sync stopped, lag, disable before cutover, destination-before-source upgrade order, TLS 1.2, compression); job scheduler /v1/job_scheduler (logrotate every 5 min, cert/CCS rotation, redis cleanup); support package debuginfo.tar.gz contents, rladmin cluster debug_info, debuginfo_path, GET /v1/cluster/debuginfo; logs /var/opt/redislabs/log/ + event_log.log; license quota metrics cluster_shards_limit / bdb_shards_used.

## Could not verify / how handled

- **Domain weights D9-D11** — the beta Software Operator exam's domain weights are not published; the wide min/max weights (20-35 / 30-45 / 25-40) are kept exactly as the task spec'd and should be treated as provisional.
- **"Action center"** (requested for the job scheduler section) — no current redis.io page documents an "action center" for Redis Software. Handled by covering the job scheduler's verified jobs (/v1/job_scheduler; logrotate every 5 minutes, cert/CCS rotation, redis cleanup) and event visibility via the Cluster > Logs screen instead.
- **rlutil** — verified only via the CLI utilities reference listing (maintenance utility) plus release-note mentions (`create_socket_path`, `check`); no dedicated page was fetched directly, so the lesson mentions it only at that level of detail.
- **Named proxy endpoint policies** (e.g. all-nodes) — not verified on a fetched page; the lesson says endpoint policy via `rladmin bind` without enumerating policy names.
- **RSAL/security patches** — patch flow verified from RS release notes ("Redis Software implements the latest security fixes available with open source Redis"); the RSALv2/SSPLv1 (7.4+) and AGPLv3 (Redis 8) framing comes from redis.io blog/legal pages, which are outside the /docs/latest/ scope of docs.json, so they are cited in this report only.

Corrections made during the write-validate loop (both caught and fixed before final validation): lesson 10 initially had a truncated "Recover a failed database" reference URL; lesson 11 initially had a stray non-standard key inside one reference object.

## Validation evidence

- `jq empty` OK for all 7 touched files (domains, modules, exams, docs, 3 lessons).
- `jq -r '.[] | .id' domains.json | wc -l` → 11; `modules.json` → 11.
- `jq length docs.json` → 8; `jq length exams.json` → 2.
- Lesson cross-check: ids/moduleIds/domainIds correct, order 1, minutes 15, difficulty intermediate, single md block, 4 references each, docIds all resolve to docs.json keys, questionIds exactly rc-q-09/10/11-kc-1..3.
- Exam: redis-swops-mock-1, durationMinutes 60, passingScore 700, kind sampled, domainPlan sums to 60, seed 20260904.

Status: DONE_WITH_CONCERNS
Summary: Added the three Software Operator domains/modules, an 8-entry verified docs.json registry, three flagship lessons, and the 60-question Software Operator mock exam; all JSON validated and counts confirmed (11/11/8/2).
Concerns/Blockers: D9-D11 weights are provisional (beta exam weights unpublished); "action center" is absent from current docs and was replaced by verified job-scheduler and Logs content; questions rc-q-* and labs for this track are owned by other work and must land before the exam can actually sample 60 questions.
