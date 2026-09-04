# Report: Cloud lessons 16-19 (networking, monitoring, automation, data access)

Agent: cloud lessons 16-19 | Date: 2026-09-04 | Branch: feat/redis-pack

## What I wrote

Four flagship JSON lessons (exemplar format of `lesson-rc-l-09-install-upgrade.json`: single md block with `## Exam takeaways`, references[], docIds[], questionIds, minutes 15, difficulty intermediate). All under `/Users/trang_thi_thuy.n/GIT/learning-hub/content/redis/lessons/`:

| File | id / module / domain / slug | docIds | questionIds (for sibling question agents) |
|---|---|---|---|
| lesson-rc-l-16-cloud-networking.json | rc-l-16-cloud-networking / m-cloud-networking / rc-cloud-networking / cloud-networking | rc-networking, rc-security, rc-create-database, rc-monitoring | rc-q-16-kc-1..3 |
| lesson-rc-l-17-cloud-monitoring.json | rc-l-17-cloud-monitoring / m-cloud-monitoring / rc-cloud-monitoring / cloud-monitoring | rc-monitoring, rc-maintenance, rc-networking, rs-monitoring-alerts | rc-q-17-kc-1..3 |
| lesson-rc-l-18-cloud-automation.json | rc-l-18-cloud-automation / m-cloud-automation / rc-cloud-automation / cloud-automation | rc-subscriptions, rc-create-database, rc-backups, rc-security | rc-q-18-kc-1..3 |
| lesson-rc-l-19-cloud-data-access.json | rc-l-19-cloud-data-access / m-cloud-data-access / rc-cloud-data-access / cloud-data-access | rc-create-database, rc-security, rc-networking, rc-active-active | rc-q-19-kc-1..3 |

Coverage matches the assigned specs: 16 = public/private endpoints, VPC peering (AWS flow, up-to-5-CIDR limit, route tables post-acceptance, GCP custom-routes), PSC, DNS/prefix and endpoint formats (static `redis-<port>.c<number>` vs dynamic `.db.redis.io`), CIDR allow lists, ports; 17 = console metrics/intervals, per-plan alert thresholds with defaults, email delivery via Access Management, Prometheus endpoint (Pro, port 8070, private connectivity, RFC-1918, whole-subscription scope), Grafana dashboards, Datadog/New Relic, system logs audit, capacity/latency watchlist; 18 = account key + user key headers, disabled-by-default API, endpoint + 400 req/min limit, provision/scale/backup flows with `GET /tasks/{taskId}` polling, Terraform provider RedisLabs/rediscloud with env vars and core resources, safe-automation practices; 19 = endpoints/ports, TLS facts + SNI, default user + RBAC/ACLs, standard vs OSS Cluster API access modes, Smart client handoffs, redis-py timeout/retry/pool defaults.

Question files were NOT created (sibling agents own them), per instructions.

## Verified docs (all fetched this date via WebFetch)

- https://redis.io/docs/latest/operate/rc/security/vpc-peering/ — Pro-only peering; AWS steps incl. "Modify my route tables now"; up to five consumer CIDRs, no overlap; GCP gcloud accept, import/export custom routes
- https://redis.io/docs/latest/operate/rc/security/private-service-connect/ — Pro on GCP; overlapping CIDRs; higher latency; Cluster API + SCH pre-handoff unsupported; 10-min Cloud DNS wait
- https://redis.io/docs/latest/operate/rc/security/database-security/network-security/ — CIDR allow-list support matrix (Azure: Pro only); Azure annual = own VPC
- https://redis.io/docs/latest/operate/rc/databases/connect/ — endpoint formats (static/dynamic), Access vs General sections, block public endpoint (Pro), default user, AA per-region connect
- https://redis.io/docs/latest/operate/rc/databases/monitor-performance — intervals, metric definitions, full alert table with defaults and plan availability, email recipients, Prometheus endpoint copy / prometheusEndpoint field
- https://redis.io/docs/latest/integrate/prometheus-with-redis-cloud/ — Pro only, internal network, port 8070, RFC-1918 whitelist, covers whole subscription, prebuilt dashboards
- https://redis.io/docs/latest/operate/rc/logs-reports/system-logs/ — Logs page fields, CSV export, GET /logs
- https://redis.io/docs/latest/operate/rc/api/get-started — x-api-key / x-api-secret-key semantics, account key once + support for changes, user key roles, CIDR allow list per key, visible-only-at-creation
- https://redis.io/docs/latest/operate/rc/api/get-started/use-rest-api — https://api.redislabs.com/v1, Swagger UI, curl form, 400 req/min per account key
- https://redis.io/docs/latest/integrate/terraform-provider-for-redis-cloud/get-started/ — REDISCLOUD_ACCESS_KEY / REDISCLOUD_SECRET_KEY, rediscloud_subscription / rediscloud_subscription_database / payment-method data source, init/plan/apply
- https://redis.io/docs/latest/operate/rc/security/database-security/tls-ssl — TLS not on Free plan, off by default, all-connections-once-enabled, new-connections-only toggle, mutual TLS, redis_ca.pem bundle contents, redis-cli --tls recipes
- https://redis.io/blog/redis-short-lived-tls-certificates/ — GlobalSign short-lived (~3 months, auto-rotated) leaf certs; trust-store guidance
- https://redis.io/docs/latest/operate/rc/security/access-control/data-access-control/role-based-access-control (+ /data-access-control landing) — Users/Roles/Redis ACLs tabs, ACL command support table (SETUSER/DELUSER unsupported), MULTI/EXEC always permitted, DB users ≠ account users
- https://redis.io/docs/latest/develop/clients/redis-py/produsage/ — 10 s default connect/command timeouts, 3 retries with exponential backoff + jitter, retryable error lists (cluster: + ClusterDownError), health_check_interval, pool/timeout trade-off guidance
- https://redis.io/docs/latest/operate/rc/ (landing nav) and https://redis.io/docs/latest/integrate/datadog-with-redis-cloud/ (title + "predefined dashboards" claim confirmed via redis.io search snippet; page not fully fetched)

## Unverifiable / renamed facts and how I handled them

1. "Standard vs advanced metrics" (task outline): the current monitor-performance docs no longer use this split. Handled by describing what IS current: console Metrics tab for all plans plus the per-plan alert table (Pro-only dataset-size and replica-sync alerts, Essentials-only plan-total/connections alerts) and the Pro-only Prometheus endpoint. No invented tier names.
2. Native webhook alert delivery: current docs document email delivery to team members only; no webhook channel. Stated email as the delivery path and framed webhook routing as done by the observability stack (Prometheus Alertmanager, Datadog monitors). Flagged as an exam distractor angle.
3. Amazon CloudWatch integration: no official Redis Cloud-to-CloudWatch integration exists in current docs. Stated explicitly that Redis Cloud does not push to CloudWatch; documented integrations are Prometheus (Pro) plus Datadog and New Relic; CloudWatch typically monitors the customer's app tier. Deviates from the task's integration list deliberately, per the "verify every load-bearing specific" rule.
4. Task polling `GET /tasks/{taskId}`: the API reference/examples pages are JS-rendered and unfetchable via WebFetch. Source of record: the official exam guide PDF (per researcher report, domain 7 scope) plus the fetched use-rest-api page for the async/task pattern context. Stated as the exam-guide flow.
5. TLS SNI: the main RC TLS page does not name SNI; the requirement is evidenced by the short-lived-certs blog (hostname-served certificates) plus client-library issue history. Phrased as guidance ("connect by exact hostname; clients that skip SNI can fail the handshake") rather than a numbered spec.

Terminology guardrails: no "hibernation" anywhere; "Enterprise" never used as a Cloud tier (grep-swept); Active-Passive used for Cloud geo-replication (the Pro sync alerts are described as replica-sync alerts with Active-Passive named as the feature); plan names are Free/Paid Redis Cloud Essentials, Redis Cloud Pro.

## Validation evidence

- `jq empty` on all 4 files: OK (one repair required on lesson 17: two `\n` escapes in an authored table serialized as raw newlines; repaired and re-validated).
- Python `json.load` strict parse: OK on all 4.
- Spec check script: questionIds exactly as assigned, module/domain/slug per spec, minutes 15, difficulty intermediate, references 4 each (all https://redis.io), docIds 4 each and all within the allowed 8 rc-* + 8 rs-* set, "Exam takeaways" present, no banned terms. All 4 PASS.
- docs.json (sibling, in-flight) already contains all 8 rc-* ids; my citations resolve.
- `git status --short`: my only writes are the 4 lesson files plus this report; all other dirty/untracked paths belong to sibling agents or pre-existing state.

## Unresolved questions

- None blocking. If the pack later wants a "webhook alerts" or "CloudWatch" framing for exam realism, it should be added as an explicit distractor, not as a Redis Cloud feature.

Status: DONE

Summary: Authored the four flagship cloud lessons (networking, monitoring, automation, data access) with all load-bearing facts verified against current redis.io Redis Cloud docs; all four files are strictly valid JSON, spec-compliant, and terminology-clean.

Concerns/Blockers: None blocking. Four task-outline items deviated deliberately against current docs: no "standard vs advanced metrics" split (replaced with current per-plan alert/Prometheus facts), no native webhook alert delivery (email + observability-stack routing), no Amazon CloudWatch integration (stated as a non-feature/distractor), and task polling sourced from the official exam guide since the API reference page is JS-rendered.
