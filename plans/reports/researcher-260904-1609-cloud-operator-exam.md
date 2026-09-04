# Research: Redis Associate Cloud Operator exam facts + domain outline

Date: 2026-09-04 (all sources accessed this date unless noted)
Method: redis.io certification hub + exam landing page + official exam guide PDF + docs + T&C; cross-checked vs university.redis.io (Google-indexed snippets; site is a JS SPA), Accredible credential pages, LinkedIn announcements, third-party truecert.co.

## 1. Exam format (VERIFIED, official)

Official name: **Redis Certified: Associate Cloud Operator** ("Redis Cloud Operator Certification" on the hub page). Associate level.

| Fact | Value | Source |
|---|---|---|
| Questions | **65**, single-select MCQ, 4 options each | exam landing page + exam guide PDF (both agree) |
| Duration | **90 minutes** (extended time via university@redis.com, 72h notice) | hub FAQ + landing page. Note: the PDF itself says "Time allotted — not specified, confirm before publishing"; the website is the confirming source |
| Passing score | **70% (46/65)**, pass/fail, no scaled score (no 700-style scaling) | exam guide PDF |
| Price | **$175 USD** per attempt | hub FAQ + landing page |
| Validity | **2 years**, recertify by retaking latest exam | hub FAQ + T&C §8 |
| Delivery | Online, Kryterion Webassessor, AI-proctored (T&C adds human+AI monitoring) | hub + T&C §6/13 |
| Retake | New purchase required; **14-day wait** after fail; PDF says "no limit to retakes" | T&C §5 + PDF |
| Language | English only, no language-specific section | hub + PDF |
| Prerequisites | None | hub FAQ |
| Credential | Digital certificate + Accredible badge | hub + T&C |
| Promo | **Earlyaccess50** = 50% off first exam (current hub). Earlier "Earlyaccess100" (100% off) promo appears in late-2025/early-2026 LinkedIn/Reddit posts — promo has since stepped down | hub vs LinkedIn/Reddit |
| Scoring detail | Single domain-weighted item bank (not fixed sections); unanswered = wrong; no reference materials; score report shows per-domain breakdown | PDF |
| Beta status | **Not marked beta** on hub/landing page. Sibling Software Operator exam page on university.redis.io still says "in beta". Cloud Operator credentials actively issued on Accredible since ~Jan 2026 | hub, university.redis.io/course/scnre8uji7adfv, credentials.redis.io |

Program context: certification program relaunched 2026 (old program retired June 2024); T&C effective 2026-07-02; three associate exams (Developer, Cloud Operator, Software Operator). Developer exam = 65q/90min/70% scaled-700 era is the OLD 2021–2024 program; current associate exams are raw 70% pass/fail. Software Operator university page lists 60q/60min (beta).

PDF copy-paste artifact warning: the guide's Scoring section says "The Redis Software Associate exam has a pass/fail result" — leftover from the sibling guide; the 70% (46/65) figure is in this exam's own format table and is authoritative.

## 2. Official domain outline (VERIFIED — official exam guide PDF)

Eight official domains with published weightings (sum 100%):

| # | Domain | Weight |
|---|---|---|
| 1 | Architecture | 9% |
| 2 | Subscription administration | 11% |
| 3 | Database administration | 17% |
| 4 | Security | 15% |
| 5 | Networking | 14% |
| 6 | Monitoring | 11% |
| 7 | Automation | 11% |
| 8 | Data access | 12% |

Domain scope one-liners: 1 managed architecture/shards/replicas/failover; 2 Essentials-vs-Pro, dedicated subscription isolation/billing; 3 persistence/durability, memory+throughput sizing w/ HA overhead, eviction, Multi-AZ, Active-Passive; 4 shared responsibility, console roles/MFA/SSO, DB RBAC+TLS, encryption at rest; 5 public vs private endpoints, VPC peering / Private Service Connect / Transit Gateway / PrivateLink, CIDR constraints, route tables post-acceptance; 6 Prometheus+Grafana (Pro, needs private connectivity), observability fit; 7 REST API vs Terraform vs Pulumi, task polling GET /tasks/{taskId}, terraform plan; 8 data size/type/relationships/velocity, structure choice (sorted set/hash/JSON/set/bitmap).

**Plan's candidate 3-domain grouping (account/db mgmt; security+HA; operations) does NOT match — replace with the 8 official domains.** Rough mapping: (a) → Domains 2+3; (b) → Domains 4+5 plus HA halves of 1+3; (c) → Domains 6+7 + remainder of 1+3. Automation (11%) and Data access (12%) are full domains the plan currently lacks.

## 3. Official prep path (PARTIALLY VERIFIED)

- **Operate Redis Cloud** learning path, university.redis.io/learningpath/c3ot5o0wronhgz — free, self-paced; certification page says **12–16 hours** (an older indexed snippet said ~4h; use 12–16h). Requires a Redis Cloud Pro subscription for hands-on. This is the officially recommended prep.
- Verified courses inside/around the path (via Google-indexed course pages; full ordered list not visible without login): Redis Cloud architecture overview (2nd, /course/2zoi3wfkfee5pt), Redis Cloud database administration (4th, /course/ig2xq9p7nnafam), Redis Cloud networking (6th, /course/xkz1coqj9tsqjr), Redis Cloud monitoring overview (7th, /course/sdm9uvjmd0iedp), Redis Cloud security overview (listed in library). Companion path: Get started with Redis Cloud (/learningpath/lwkfbjbbqetoqc).
- **Exam study guide PDF** (the primary source for this report): https://cdn.sanity.io/files/sy1jschh/production/9509c5b4ca38aced819831fd2dfd4253370d8f5d.pdf — objectives, 8 practice questions + answer key. Landing page text says "15 sample questions"; the actual PDF has 8. Trust the PDF (8).
- Live option: Redis Cloud Operator training, professional services, 8h ILT (paid).
- Plan's citation "deployment & operations → security, scaling, troubleshooting" matches the hub's scope line "Deploy, secure, scale, and troubleshoot Redis Cloud" — but the real outline is the 8 domains above.

## 4. Redis Cloud terminology anchors (VERIFIED vs redis.io/docs, 2026-09-04)

- Subscription plans (docs page "Manage subscriptions", current): **Free Redis Cloud Essentials** (30 MB), **Paid Redis Cloud Essentials** (250 MB–12 GB), **Essentials with Redis Flex** (1–100 GB), **Redis Cloud Pro** (dedicated VPCs, Multi-AZ, Active-Active, up to 50 TB). Pro annual plans = "Redis Cloud Pro annual plans" (same features, savings, Premium support). Marketing pricing page tiers: Free / Essentials / Pro.
- **"Enterprise" is NOT a Redis Cloud tier name.** Redis Enterprise Software is the separate self-managed product. Do not call the Pro tier "Enterprise"; do not invent "Enterprise/Annual subscription" as plan names.
- **Pro vs Essentials** is the current database/subscription tier split (there is no legacy "Pro" deprecation — Pro is current). Pro-only: Active-Active, Private connectivity, encryption at rest, REST API automation at scale, Prometheus/Grafana workflow.
- **Redis Flex** = RAM+SSD tiered architecture feature (Essentials and Pro), not a standalone tier.
- Geo: **Active-Active** (Pro, CRDT multi-region) vs **Active-Passive** (current RC term; the old "Replica Of" name has been superseded in RC docs).
- Networking: public vs private endpoints; **CIDR allow list** (docs page term: "IP Restrictions" under network security); **VPC peering** (Pro); GCP **Private Service Connect**, AWS PrivateLink/Transit Gateway alternatives for overlapping-CIDR/service-scoped cases.
- Security: shared responsibility model; console **access management** + **MFA** + **SAML SSO**; DB **RBAC** + default-user password; **TLS** (strongly recommended; can enforce); **encryption at rest** (disk encryption).
- Maintenance windows: Pro = settable manual windows (+skip option); Essentials = daily 12 AM–6 AM region-local, ≤1/week unless urgent; no breaking changes in windows; **major upgrades are opt-in**.
- Backup: docs page "Back up and export a database" — interval backups to AWS S3 / Azure Blob / GCS / FTP; restore from RDB.
- **Hibernation: not a Redis Cloud feature.** Official docs have no hibernation; closest is free 30 MB databases deleted after 14 days of inactivity (support article). Remove "hibernation" from content.
- Other anchors: OSS Cluster API vs standard single-endpoint access mode; REST API + Terraform + Pulumi + `redisctl` CLI; task polling via GET /tasks/{taskId}; Prometheus+Grafana observability (Pro, private connectivity prerequisite).

## Recommended exam object

`questionCount: 65, durationMinutes: 90, passingScore: 70 (raw percent, 46/65, pass/fail — not scaled 700), priceUsd: 175, validityYears: 2, delivery: "Kryterion Webassessor, AI-proctored online"`; domains (official names + weights): Architecture 9%, Subscription administration 11%, Database administration 17%, Security 15%, Networking 14%, Monitoring 11%, Automation 11%, Data access 12%.

## Verified vs unverifiable

Verified (official, ≥1 primary source, most ≥2): 65q/90min/70%/$175/2yr; 8-domain outline with weights; scenario-based single-select format; 14-day retake; Kryterion + Accredible; plan/tier names; Active-Active/Active-Passive; maintenance windows; CIDR allow list/VPC peering/TLS/RBAC/encryption-at-rest; backup mechanics; Prometheus/Grafana prerequisites; OSS Cluster API naming.

Unverifiable / gaps:
- Official university.redis.io Cloud Operator exam-page slug (SPA not crawlable; sibling Software Operator page found instead). Format facts come from redis.io/certifications + the PDF, which agree.
- Whether Redis formally labels this exam "beta" anywhere official (hub/PDF say no; sibling Software exam page still carries a beta banner).
- Full ordered course list of the Operate Redis Cloud path (login-gated).
- Exact exam-guide publication date (PDF undated; retrieved 2026-09-04).

Sources: redis.io/certifications/ · redis.io/certifications/cloud-operator/ · exam guide PDF (cdn.sanity.io link above) · redis.io/legal/redis-certification-program-terms-and-conditions/ · redis.io/docs/latest/operate/rc/ (+ subscriptions, subscriptions/maintenance, security/database-security, databases/back-up-data, databases/active-active) · redis.io/pricing/ · university.redis.io/learningpath/c3ot5o0wronhgz · university.redis.io/course/scnre8uji7adfv (sibling beta page) · credentials.redis.io credential pages · redis.io/tutorials/university/ (stale re certification — predates relaunch)

Status: DONE
Summary: Cloud Operator exam is 65 questions / 90 min / 70% (46/65) / $175 / 2-year validity on Kryterion, with an official 8-domain outline (Architecture 9% … Data access 12%) captured from the official exam guide PDF; "hibernation" and "Enterprise plan" naming in the plan are wrong and must be corrected.
Concerns/Blockers: None blocking. Note the landing page says "15 sample questions" but the PDF contains 8; and the plan should replace its 3-domain grouping with the official 8 domains.
