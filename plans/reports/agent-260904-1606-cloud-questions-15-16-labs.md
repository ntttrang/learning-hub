# Agent report: Cloud Operator questions (Security 15, Networking 16) + 3 labs

Date: 2026-09-04 · Branch: feat/redis-pack

## What was written

### 19 question files — content/redis/questions/ (created)

Security (`rc-cloud-security` / `m-cloud-security`, pool 10): `rc-q-15-bank-1..7.json` + `rc-q-15-kc-1..3.json` (kc lessonId `rc-l-15-cloud-security`).
Kinds exactly: 4 single, 2 multi, 1 fill, 1 codeReading, 1 matching, 1 order. Difficulty 3 beginner / 5 intermediate / 2 advanced.
Coverage: shared responsibility (bank-1), TLS plan availability (bank-2), CIDR allow list on both endpoints with peering (bank-3), console Viewer role (bank-4), network-layer controls multi (bank-5), Default user + RBAC facts incl. ACL SETUSER unsupported / MULTI-EXEC always permitted (bank-6), Mutual TLS fill (bank-7), redis-cli over TLS codeReading (kc-1), feature-to-layer matching (kc-2), RBAC setup order ACLs→Roles→Users→turn off default user (kc-3).

Networking (`rc-cloud-networking` / `m-cloud-networking`, pool 9): `rc-q-16-bank-1..6.json` + `rc-q-16-kc-1..3.json` (kc lessonId `rc-l-16-cloud-networking`).
Kinds exactly: 3 single, 2 multi, 1 fill, 1 codeReading, 1 matching, 1 order. Difficulty 3 beginner / 4 intermediate / 2 advanced.
Coverage: public vs private endpoints (bank-1), static endpoint pattern (bank-2), overlapping-CIDR AWS alternatives Transit Gateway/PrivateLink (bank-3), post-peering steps multi (bank-4), private-endpoint timeout troubleshooting multi (bank-5), `internal` private-endpoint segment fill (bank-6), public-endpoint codeReading (kc-1), connectivity-option matching (kc-2), AWS VPC peering order initiate→accept→routes→private endpoint (kc-3).

### labs.json — appended 3 entries (existing 6 untouched)

- `lab-cloud-subscription-db` (rc-cloud-subscription / rc-l-13-cloud-subscription, 30 min, beginner, 6 steps): free-db creation flow, endpoint/Default-user reading, redis-cli verify, Free-plan limits audit, paid Essentials + Pro wizard tour (read-only), Essentials-vs-Pro UI cheat sheet.
- `lab-cloud-security-config` (rc-cloud-security / rc-l-15-cloud-security, 40 min, intermediate, 6 steps): Security-section audit, auth-failure demo, RBAC user/ACL/role creation + NOPERM demo, turn off Default user, TLS enforcement + break, CIDR allow-list add/remove + timeout; closes with failure-signature mapping.
- `lab-cloud-monitoring-alerts` (rc-cloud-monitoring / rc-l-17-cloud-monitoring, 35 min, intermediate, 5 steps): Metrics tab (intervals, promote graphs, summary panel), redis-benchmark load, Throughput alert threshold + Alert-emails delivery, Logs page audit lookup + Export all + GET /logs.

All labs: 2 "You can …" outcomes, 3 checks, markdown instructions with fenced ```bash/```redis blocks, expectedOutput + hint steps. Written walkthroughs only, no automation code.

## Verified sources (all fetched 2026-09-04)

- TLS: available Paid Essentials + Pro only (not Free); not enabled by default; enforcement blocks unencrypted connections; change applies to new connections; "Mutual TLS (require client authentication)"; `redis_ca.pem` bundle; `redis-cli --tls --cacert` — redis.io/docs/latest/operate/rc/security/database-security/tls-ssl/
- CIDR allow list: Paid Essentials/Pro only; Essentials 4–32 entries, Pro up to 32; applies to BOTH public and private endpoints; VPC peering/Transit Gateway sources must be listed; console path Databases → Configuration → Edit database → Security → CIDR allow list — /operate/rc/security/cidr-whitelist/
- Network security matrix: VPC peering Pro only (all clouds); IP restrictions Paid Essentials+Pro (AWS/GCP) and Pro (Azure); GCP subscriptions *require* VPC peering — /operate/rc/security/database-security/network-security/
- VPC peering: consumer VPC CIDRs must not overlap Redis producer VPC CIDR, up to five CIDRs; initiate (Subscriptions → Connectivity > VPC Peering) → accept in AWS → update route tables → switch to private endpoint — /operate/rc/security/vpc-peering/
- Private Service Connect: Pro on Google Cloud only; alternative to peering; allows overlapping CIDRs; endpoint name = prefix + number; Cloud DNS + gcloud script — /operate/rc/security/private-service-connect/
- Endpoints: static `redis-<port>.c<number>...`, private `redis-<port>.internal.c<number>...` (docs example domain rlrcp.com); dynamic endpoints = three words + number ending `.db.redis.io`, redirectable; Essentials endpoints under **Access**, Pro under **General** — /operate/rc/databases/connect/
- Private connectivity methods list (peering, PSC GCP-only, Transit Gateway/PrivateLink AWS-only); block public endpoint = Pro, rejects non-RFC1918; passwordless auth requires blocked public endpoint — /operate/rc/security/database-security/block-public-endpoints/
- Console roles: Owner, Billing Admin, Manager, Member, Viewer, Logs Viewer incl. capability matrix (Viewer sees secrets, Billing Admin sees list only, Logs Viewer = GET /logs only); Access Management owns team/API keys/SAML SSO; MFA + Alert emails per member — /operate/rc/security/access-control/access-management/
- Data access control: tabs **Users/Roles/Redis ACLs**; ACL SETUSER/DELUSER/SAVE/LOAD/LOG unsupported; MULTI/EXEC/DISCARD always permitted; Default user username `default`, password < 50 chars, turn-off steps per plan — /operate/rc/security/access-control/data-access-control/role-based-access-control/ and …/default-user/
- Monitoring: **Metrics** tab; intervals 5 min/30 s → 3 months/12 h; promote graphs + min/avg/max/most-recent panel; alerts: Essentials → **Alerts** tab, Pro → Configuration → **Alerts** section; named alerts + defaults (Dataset size 80% Pro, Total size of datasets 80% Essentials, Throughput higher 1000 ops/sec, Throughput lower 10, Latency higher 10 ms, Connections 80% Essentials); recipients via Access Management → Team → Alert emails; Prometheus endpoint Pro-only — /operate/rc/databases/monitor-performance/
- System logs: **Logs** main-menu page; fields Time/Originator/Database name/API key name/Activity; search + Export all CSV; REST `GET /logs` — /operate/rc/logs-reports/system-logs/
- Free plan: one free DB per account, 30 MB, created via **New database → Try 30 MB for free**; deletion after ~14 days inactivity (support.redislabs.com article 33138489404818 + redis.io/legal/cloud-tos); paid Essentials wizard (RAM vs RAM+SSD Flex, HA None/Single-Zone/Multi-Zone, persistence AOF-1s or snapshots 1/6/12 h) and Pro wizard (Easy/Custom, Setup/Sizing/Review tabs, Advanced options: Multi-AZ, Deployment CIDR, Public endpoint access, Maintenance windows) — /operate/rc/databases/create-database/* pages

## Unverifiable / handled

- RBAC (Data Access Control screen) availability on the Free plan — no doc statement found. Handled by not asserting it: the security lab asks the learner to check the console menu empirically; question bank-6 makes no plan claim about RBAC.
- Whether the current Pro wizard exposes an explicit port field — current docs show port auto-assignment (embedded in `redis-<port>`). Avoided any "default port 16379" claim; ports appear only as endpoint-embedded.
- Exact network failure strings (WRONGPASS vs NOAUTH, reset vs timeout) — presented as symptom classes ("an authentication error", "times out"), not verbatim server messages.
- "Hibernation" and "Enterprise plan" never appear (guardrails honored; grep-verified).

## Validation evidence

- `jq empty` OK on all 19 question files + labs.json after every write.
- Sweep script: 19 files; security 10 / networking 9; kind counts exact per domain; stems == ids 19/19; unique ids; kc lessonIds correct, banks have none; tags[0] == "redis"; matching lefts unique; multi correct ∈ [2,3]; single/codeReading correct is string with 4 options; fill has `___`; order sequences match options.
- Difficulty: security 3b/5i/2a, networking 3b/4i/2a.
- `jq length content/redis/labs.json` = 9 with lab-swops-* (6) still first; lab structure: 6/6/5 steps, 2 outcomes each (all "You can …"), 3 checks each.
- Entire content/redis JSON corpus re-parsed clean.

Status: DONE
Summary: Authored and validated 19 original questions (Security pool 10, Networking pool 9, exact kind mixes and difficulty spreads) plus 3 swops-depth labs appended to labs.json, with every load-bearing specific verified against current redis.io Redis Cloud docs and the two unverifiable points handled by empirical framing or omission.
Concerns/Blockers: None blocking. Note for the lesson authors: the security lab and kc files assume rc-l-15-cloud-security / rc-l-16-cloud-networking lesson ids, and the subscription lab references rc-l-13-cloud-subscription — all three lessons are being authored in parallel and did not exist yet at write time.
