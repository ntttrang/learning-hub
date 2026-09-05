# Report: Cloud Operator manifests, lessons 12-15, mock exam, README

Date: 2026-09-04
Branch: feat/redis-pack
Scope: extend Redis pack manifests for the 8 Cloud Operator domains, author 4 flagship lessons (rc-l-12..15), add the cloud mock exam, extend the README installed-packs sentence.

## What was written

### Manifests (modified)
- `content/redis/domains.json` — appended D12-D19 (`rc-cloud-arch`, `rc-cloud-subscription`, `rc-cloud-db-admin`, `rc-cloud-security`, `rc-cloud-networking`, `rc-cloud-monitoring`, `rc-cloud-automation`, `rc-cloud-data-access`), orders 12-19, weights = official % ±2-3 per the research report (Architecture 9% -> 7-12, Subscription admin 11% -> 9-14, DB admin 17% -> 14-20, Security 15% -> 12-18, Networking 14% -> 11-17, Monitoring 11% -> 8-14, Automation 11% -> 8-14, Data access 12% -> 9-15; weights are research-confirmed from the official exam guide PDF). Now 19 entries; D1-D11 untouched.
- `content/redis/modules.json` — appended 8 modules (ids m-cloud-*, codes "12".."19"), each bound to its domain, order matching. Now 19 entries.
- `content/redis/exams.json` — appended `redis-cloud-mock-1` exactly per spec (90 min, 700, sampled, seed 20260905, domainPlan 6+7+11+10+9+7+7+8 = 65). Now 3 exams.
- `content/redis/docs.json` — appended 8 `rc-` entries (rc-subscriptions, rc-create-database, rc-security, rc-networking, rc-monitoring, rc-backups, rc-maintenance, rc-active-active). Now 16 entries; all `rs-` keys untouched.
- `README.md` — installed-packs sentence extended: "..., Redis (Developer, Software Operator, and Cloud Operator tracks), and the `content/fixture/` pack...". One sentence, existing style.

### Lessons (created)
All: single md block, 15 minutes, intermediate, Exam takeaways section, original prose, questionIds exactly the specified rc-q-Nx-kc-1..3 (questions authored by sibling agents; not created by me).
- `content/redis/lessons/lesson-rc-l-12-cloud-architecture.json` — account/subscription/database hierarchy, tier table (Free 30 MB/30 conn/no REST API, Paid Essentials 250 MB-12 GB, Flex 1-100 GB RAM+SSD, Pro to 50 TB), regions/AZs, HA options None/Single-Zone/Multi-Zone, Active-Active facts (Pro, 10 regions/10 DBs, CRDT, 4x memory, evict at 80%, no built-in client failover, 99.999%/99.99%), Active-Passive naming, 4 references + docIds.
- `content/redis/lessons/lesson-rc-l-13-cloud-subscription.json` — six console roles with the capability matrix (Owner/Billing Admin/Manager/Member/Viewer/Logs Viewer), MFA/SAML SSO, Billing & Payments screens, card + AWS/GCP Marketplace payment wiring, cost report, Essentials fixed vs Pro hourly vs annual Pro, maintenance windows per plan (Essentials 12 AM-6 AM daily <= weekly; Pro manual/skippable; urgent overrides; major upgrades opt-in).
- `content/redis/lessons/lesson-rc-l-14-cloud-db-admin.json` — create flow per tier, memory math (replication doubles, AA cumulative 4x, AA evicts at 80% with 1% backlogs, search index memory), persistence (AOF 1s, snapshots 1/6/12h), editable vs immutable settings (new DB + migrate as the fix), versioning (Essentials editable, Pro subscription-level opt-in), backups (free none, Essentials 24h, Pro 1-24h; RDB per shard; S3/GCS/Azure Blob/FTP(S); 4 concurrent; restore via RDB import), danger zone.
- `content/redis/lessons/lesson-rc-l-15-cloud-security.json` — shared responsibility layer map, CIDR allowlists (availability per vendor/plan; Pro-only on Azure), VPC peering (Pro; required on GCP; non-overlapping CIDRs, post-acceptance routes; PrivateLink/TGW/PSC alternates), block-public-endpoint + passwordless, TLS enforcement + mutual TLS + AA sync always TLS, default user vs RBAC (ACL rules -> roles -> users, AA roles variant), console roles/MFA/SSO, encryption at rest on Pro.

## WebFetch-verified docs (all fetched 2026-09-04, current redis.io/docs/latest)
1. https://redis.io/docs/latest/operate/rc/ (docs hub, section list)
2. https://redis.io/docs/latest/operate/rc/subscriptions/ ("Manage subscriptions" — plan comparison table: memory/connections/security/REST API/features per tier)
3. https://redis.io/docs/latest/operate/rc/databases/create-database/ (plan hub; Pro = hourly)
4. https://redis.io/docs/latest/operate/rc/databases/create-database/create-free-database/ (30 MB, one per account)
5. https://redis.io/docs/latest/operate/rc/databases/create-database/create-essentials-database/ (HA None/Single-Zone/Multi-Zone, AOF 1s, snapshots 1/6/12h, RAM vs RAM+SSD Flex, Confirm & pay)
6. https://redis.io/docs/latest/operate/rc/databases/active-active/ (Pro, 10 regions/10 DBs, CRDT, 99.999/99.99, 4x memory, evict at 80%, 1% backlogs, DR strategies)
7. https://redis.io/docs/latest/operate/rc/databases/back-up-data/ (per-plan backup capability, intervals, RDB per shard, S3/GCS/Abs/FTP, 4 concurrent)
8. https://redis.io/docs/latest/operate/rc/security/database-security/ (password + RBAC, IP restrictions + VPCs, TLS, disk encryption)
9. https://redis.io/docs/latest/operate/rc/security/database-security/network-security/ (CIDR allowlist availability matrix; peering required on GCP)
10. https://redis.io/docs/latest/operate/rc/databases/monitor-performance/ (metric intervals, alert table with defaults, Prometheus endpoint for Pro)
11. https://redis.io/docs/latest/operate/rc/subscriptions/maintenance/ (window rules, urgent, opt-in major upgrades)
12. https://redis.io/docs/latest/operate/rc/security/access-control/access-management/ (six roles + full capability matrix, MFA, API keys pointer)
13. https://redis.io/docs/latest/operate/rc/security/access-control/data-access-control/ (default user, RBAC subpages)
14. https://redis.io/docs/latest/operate/rc/billing-and-payments/ (tabs, marketplace accounts, coupons, cost report)
15. https://redis.io/docs/latest/operate/rc/databases/configuration/sizing/ (replication doubles, AA 4x/80%/1%, Essentials limit vs dataset, throughput guidance)
16. https://redis.io/docs/latest/operate/rc/databases/view-edit-database/ (editable vs non-editable per plan; Pro Durability includes "Active-Passive Redis" — naming confirmed on-page)

## Unverifiable / not re-verified facts + handling
- Free-database deletion after 14 days of inactivity: taken from the research report (support-article source); the docs pages I fetched do not state it. Used once in lesson 12 with attribution ("Redis support documents deletion after 14 days of inactivity"). No docs URL could be confirmed for it this session.
- Exam mechanics (65q/90min/70% scaled 700, weights) come from the research report's official exam-guide PDF; the exam object was written exactly as the task specified (including the 700 scaled score requested for this app, though the research notes the live exam is raw 70%).
- GCP Private Service Connect / AWS PrivateLink-Transit Gateway and Prometheus integrations (DataDog/New Relic/CloudWatch) are named from the research report and hub links (Prometheus/Grafana URL appears on the fetched monitoring page); per-tool integration detail pages were not individually fetched because D16/D17 lessons belong to other agents.
- Prices intentionally omitted everywhere.

## Validation evidence
- `jq empty` OK on all 9 touched/created JSON files (run after every write); docs.json = 16 keys (8 rc-), domains.json = 19, modules.json = 19, exams.json = 3.
- Mock exam domainPlans: dev 65, swops 60, cloud 65.
- Guardrail greps: no "hibernation" anywhere in pack/README; the only "Enterprise" hit is the pre-existing D9 summary referring to Redis Enterprise Software (correct product usage, untouched).
- Cross-ref script: all 4 lessons — moduleId exists, module/domain binding consistent, docIds all present in docs.json, references 3-4, questionIds exactly rc-q-Nx-kc-1..3, minutes/difficulty per spec, Exam takeaways present.
- `git status --short` for MY file set: M README.md, M content/redis/{docs,domains,exams,modules}.json, ?? 4 lesson files. The tree also shows concurrent sibling work (new rc-q-12/13/15 question files, a modified rc-q-07 lesson/question rename) and pre-existing untracked plans/ files — not mine, expected in the parallel plan.
- `npm run content:check` currently FAILS, but every issue is either `[unresolved-ref]` for rc-q-13/14/15-kc-* (sibling knowledge-check questions not yet on disk) or `[exam-infeasible]` for redis-cloud-mock-1 domains where sibling bank questions do not exist yet (counts were visibly growing between two runs as siblings land files). No schema, docId, module, or lesson-structure issues attributable to this task. The pack goes green once the sibling question set merges.

Status: DONE_WITH_CONCERNS
Summary: All 8 domains, 8 modules, the cloud mock exam (65-question plan), 8 verified rc- doc entries, 4 flagship lessons, and the README row are written and validated; the only red is `npm run content:check`, entirely due to sibling-authored question files not yet present.
Concerns/Blockers: content:check stays red until the parallel question agents land all cloud bank + knowledge-check questions (esp. rc-q-13-kc-3, rc-q-14-kc-1..3, rc-q-15-kc-3 and the D16-D19 banks); the 14-day free-database inactivity fact rests on the research report's support-article source, not a page I could fetch.
