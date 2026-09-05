# Report: Cloud Operator questions, domains 17-19 (monitoring / automation / data access)

Date: 2026-09-04
Scope: 22 question files authored per assignment. Nothing else created or modified.

## What was written

All files in `content/redis/questions/`, stem equals id, tags start with `redis`.

### Monitoring — rc-cloud-monitoring / m-cloud-monitoring (pool 7)
| File | Kind | Difficulty | Topic |
|---|---|---|---|
| rc-q-17-bank-1 | single | beginner | Prometheus/Grafana = Pro only (private connectivity prerequisite) |
| rc-q-17-bank-2 | single | intermediate | Metrics tab interval scrollbar (5 min window / 30-second resolution is smallest) |
| rc-q-17-bank-3 | multi | intermediate | Which metric graphs exist on the Metrics screen |
| rc-q-17-bank-4 | codeReading | advanced | prometheus.yml scrape times out without private connectivity |
| rc-q-17-kc-1 | single | beginner | Console location of performance graphs (Metrics tab) |
| rc-q-17-kc-2 | fill | intermediate | Prometheus endpoint port 8070 |
| rc-q-17-kc-3 | matching | advanced | Alert type vs plan eligibility (Pro / Essentials / Paid Essentials or Pro) |

### Automation — rc-cloud-automation / m-cloud-automation (pool 7)
| File | Kind | Difficulty | Topic |
|---|---|---|---|
| rc-q-18-bank-1 | single | beginner | Base URL https://api.redislabs.com/v1 |
| rc-q-18-bank-2 | single | intermediate | Auth headers x-api-key (account key) + x-api-secret-key (user key) |
| rc-q-18-bank-3 | multi | advanced | User key properties (per-user, roles, CIDR allow list, shown only at creation) |
| rc-q-18-bank-4 | matching | intermediate | Terraform data source vs resources (Pro/Essentials/Active-Active) |
| rc-q-18-kc-1 | single | beginner | Async POST returns taskId; poll GET /tasks/{taskId} |
| rc-q-18-kc-2 | fill | beginner | API disabled by default |
| rc-q-18-kc-3 | bug | advanced | Script reuses account key value as user key (x-api-secret-key) |

### Data access — rc-cloud-data-access / m-cloud-data-access (pool 8)
| File | Kind | Difficulty | Topic |
|---|---|---|---|
| rc-q-19-bank-1 | single | beginner | Essentials = public endpoint only; private endpoint is Pro |
| rc-q-19-bank-2 | single | intermediate | Dynamic endpoints (db.redis.io) are redirectable |
| rc-q-19-bank-3 | multi | intermediate | Default user: username `default`, masked password, off under RBAC |
| rc-q-19-bank-4 | codeReading | advanced | MOVED errors => OSS Cluster API needs a cluster-aware client |
| rc-q-19-bank-5 | order | intermediate | RBAC setup order: ACLs -> roles -> users -> assign |
| rc-q-19-kc-1 | single | beginner | Static endpoint redis-<port>.c<number>: the number is the port |
| rc-q-19-kc-2 | fill | intermediate | TLS applies to new connections only |
| rc-q-19-kc-3 | matching | beginner | Structure choice: sorted set/hash/set/bitmap/JSON |

Difficulty totals: 8 beginner / 9 intermediate / 5 advanced (~36/41/23) — approximates the requested ~1/3 / ~1/2 / rest split. Knowledge checks carry `lessonId` rc-l-17-cloud-monitoring / rc-l-18-cloud-automation / rc-l-19-cloud-data-access; bank files have no lessonId.

## Verified sources (all fetched 2026-09-04)

- Monitor database performance — redis.io/docs/latest/operate/rc/databases/monitor-performance/ : Metrics tab, interval/resolution table, metric definitions, alert types with plan eligibility and defaults (dataset size Pro 80%, plan total Essentials 80%, throughput paid 1000 ops/sec, latency paid 10 msec, connections Essentials 80%), recipients via Access Management > Team, Prometheus endpoint via console or GET /subscriptions/{id}.
- Prometheus and Grafana with Redis Cloud — redis.io/docs/latest/integrate/prometheus-with-redis-cloud/ : port 8070, internal network, private connectivity options (VPC peering / PSC / TGW / PrivateLink), Pro only, not for Essentials, covers all databases in the subscription, RFC 1918 whitelist, Grafana dashboards.
- REST API get-started — redis.io/docs/latest/operate/rc/api/get-started/ : API disabled by default; account key -> x-api-key, user key -> x-api-secret-key; Owner/Viewer/Billing admin/Logs viewer roles; CIDR allow list; key values shown only at creation; system log tracks the key used per request.
- Use the REST API — .../api/get-started/use-rest-api/ : base URL https://api.redislabs.com/v1; 400 requests/min per account API key.
- API request lifecycle — .../api/get-started/process-lifecycle/ : POST/PUT/DELETE (+some GET) async; taskId; GET /tasks/{taskId}; states received / processing-in-progress / processing-completed (returns resourceId) / processing-error; provisioning states pending/active/deleting/error.
- System logs — redis.io/docs/latest/operate/rc/logs-reports/system-logs/ : Logs page, GET /logs, CSV export.
- Back up and export a database — .../databases/back-up-data/ : plan-dependent backup cadence (Pro 1-24h intervals + set hour UTC; paid Essentials every 24h; free none); S3 / GCS / Azure Blob / FTP(S); RDB per shard; 4 concurrent backups. (Used in report context only; no direct question relied on the free-plan exclusion.)
- Terraform provider — redis.io/docs/latest/integrate/terraform-provider-for-redis-cloud/ (+ get-started) and github.com/RedisLabs/terraform-provider-rediscloud README : source RedisLabs/rediscloud; data sources read-only vs resources; resource names for Pro/Essentials/Active-Active subscriptions/databases and rediscloud_acl_*; env vars REDISCLOUD_ACCESS_KEY (account key) + REDISCLOUD_SECRET_KEY (user key).
- Connect to a Redis Cloud database — .../databases/connect/ : public endpoint both tiers, private Pro-only + connectivity methods, block public endpoint (Pro), static `redis-<port>.c<number>` vs dynamic `*.db.redis.io` (redirectable, recommended), default user `default` with masked password per tier.
- TLS — .../security/database-security/tls-ssl/ : not available on Free Essentials, not enabled by default, toggle affects new connections only, redis_ca.pem bundle, mutual TLS optional.
- Role-based access control — .../security/access-control/data-access-control/role-based-access-control/ : Data Access Control screen Users/Roles/Redis ACLs tabs; ACL = named permissions; roles bundle permissions per database; DB users differ from account users.
- Clustering Redis Databases — .../databases/configuration/clustering/ : default single-endpoint proxy routing needs no cluster-aware client; OSS Cluster API (Pro only, Performance section) requires a cluster-API-capable client, topology fetch then direct shard connections; hashing policies and hash tags.

## Unverifiable / swapped facts and handling

- "Advanced metrics with 1-second granularity" (older RC docs): absent from the current monitor-performance page -> avoided entirely; metric questions use the verified interval/resolution table and metric list.
- Datadog / New Relic / CloudWatch as first-class Redis Cloud integrations: current RC docs verify only the Prometheus endpoint (a support article shows Datadog reading it) -> no question asserts those integrations; the monitoring questions stay on Prometheus/Grafana, alerts, metrics, system logs.
- OSS Cluster API "minimum 30 shards, new subscriptions only, contact support": found only in an older FAQ snippet, not re-verifiable on current docs (rc/faq 404s) -> dropped; the MOVED question rests on the verified current clustering page (cluster-API-capable client required).
- Terraform env var names: one search snippet claimed REDISCLOUD_API_KEY/api_key; official Redis docs and the provider README both say REDISCLOUD_ACCESS_KEY / REDISCLOUD_SECRET_KEY -> used the official names.
- Terminology guardrails held: only "Redis Cloud Essentials" / "Paid Redis Cloud Essentials" / "Redis Cloud Pro"; no "hibernation", no "Enterprise" tier anywhere.

## Validation evidence

- jq empty run immediately after every Write: 22/22 OK.
- Structural sweep (python over all 22 files): file count 22; id == stem 22/22; per-domain pools 7/7/8; kind totals exact per domain (3 single + assigned special kinds each); multi correct within 2-3; fill templates contain ___; matching lefts unique; order correct is a permutation of option ids; buggyLineIndex in range; kc files carry the right lessonId; bank files have no lessonId. Result: PROBLEMS none.
- Difficulty spread: 17 = 2B/3I/2A, 18 = 3B/2I/2A, 19 = 3B/4I/1A.
- git status --short shows my 22 untracked question files plus changes owned by parallel agents (rc-q-12..16, cloud lessons 12-17, shared json/README edits, other plan reports) — none of those were touched by me.

Status: DONE
Summary: Authored and validated all 22 questions for domains 17-19 (monitoring 7, automation 7, data access 8) with exact kind totals and a beginner/intermediate/advanced spread; every load-bearing fact was checked against current redis.io Redis Cloud docs on 2026-09-04.
Concerns/Blockers: None blocking. Two scope items from the assignment outline were left uncovered because current docs no longer verify them (Datadog/New Relic/CloudWatch as RC integrations; OSS cluster 30-shard minimum); the affected slots were filled with verified Prometheus/clustering facts instead.
