# Report: Cloud Operator questions — domains 12–14 (rc-q-12/13/14)

Date: 2026-09-04. Branch: `feat/redis-pack`.
Scope: 24 practice-question files for the Redis Cloud Operator track — Architecture (6), Subscription administration (7), Database administration (11) — per the content spec in the delegation brief and the domain outline in `plans/reports/researcher-260904-1609-cloud-operator-exam.md`.

## What was written

All under `content/redis/questions/`. File stem = `id` in every file (verified 24/24).

| Domain | Files | Kind mix (exact) |
|---|---|---|
| rc-cloud-arch / m-cloud-arch | rc-q-12-bank-1..3, rc-q-12-kc-1..3 | 2 single, 1 multi, 1 fill, 1 matching, 1 order |
| rc-cloud-subscription / m-cloud-subscription | rc-q-13-bank-1..4, rc-q-13-kc-1..3 | 3 single, 1 multi, 1 fill, 1 matching, 1 codeReading |
| rc-cloud-db-admin / m-cloud-db-admin | rc-q-14-bank-1..8, rc-q-14-kc-1..3 | 4 single, 2 multi, 1 fill, 1 codeReading, 1 matching, 1 order, 1 bug |

- lessonId on kc files: `rc-l-12-cloud-architecture`, `rc-l-13-cloud-subscription`, `rc-l-14-cloud-db-admin` (the last per the coordinator's mid-task correction; verified against `content/redis/lessons/lesson-rc-l-14-cloud-db-admin.json`).
- Difficulty spread: 7 beginner / 13 intermediate / 4 advanced (29%/54%/17%); all kc questions beginner or intermediate.
- Bank questions carry no lessonId; every tags array starts with `redis`.
- Operator scenarios covered: shard-count sizing on Pro, OSS Cluster API client impact, Pro-only capability matrix, replication-doubles-memory sizing (Essentials 1 GB plan → 512 MB dataset; the bug question flags a 10 GB limit for a 10 GB replicated dataset), persistence per plan tier (AOF-every-write is Pro only; free Essentials has no persistence at all), import overwrite + expired-keys-not-imported, backup destination setup, Active-Passive migration sequence and memory (+25% overhead), immutable Pro zone settings, REST API availability per plan, missing user-key header, user-key CIDR allow-list blocking a CI runner, support-only tasks (account key change/delete, cross-account Active-Passive).

## Verified sources (all fetched 2026-09-04)

Every load-bearing specific was checked against current redis.io docs pages:

- Subscriptions / plan matrix (30 MB free; paid Essentials 250 MB–12 GB; Flex 1–100 GB; Pro 50 TB; Pro-only encryption at rest + private connectivity + Active-Active; REST API absent on free; Flex on Essentials and Pro; Pro annual = savings + Premium support) — https://redis.io/docs/latest/operate/rc/subscriptions
- High availability (multi-zone/single-zone/no replication per plan; replication requires memory limit double the dataset size; 1 GB plan → 512 MB dataset; Pro zone settings immutable post-creation; per-database replication toggle; Multi-AZ needs ≥3 AZs) — .../databases/configuration/high-availability
- Data persistence (None / AOF every write [Pro only] / AOF every 1 s / snapshots 1–6–12 h; free = no persistence; persistence runs against replicas) — .../databases/configuration/data-persistence
- Data eviction (volatile-lru marked "(Default)"; full policy list; A-P: no eviction/expiration on target; A-A eviction at 80% — not used in questions) — .../databases/configuration/data-eviction-policies
- Backups (S3/GCS/Azure Blob/FTP; RDB format; Pro intervals 1–24 h with settable hour, Essentials fixed 24 h; free cannot back up; storage location must exist before enabling; max 4 concurrent) — .../databases/back-up-data
- Import (overwrites existing data; expired keys not imported; sources: Redis server or RDB via S3/GCS/Azure/FTP/HTTP) — .../databases/import-data
- Migrate via Active-Passive (5-step order; target must be Pro; enabling flushes target; don't write to target; Pending→Active→Synced; +25% memory, 1 GB→2.5 GB worked example) — .../databases/migrate-databases
- Maintenance (Essentials daily 12 AM–6 AM region-local, ≤1/week unless urgent; Pro manual windows + skip; major upgrades opt-in) — .../subscriptions/maintenance
- REST API keys (account key x-api-key, user key x-api-secret-key, both required, disabled by default, user-key CIDR allow list, account key change/delete via support) — .../api/get-started
- Clustering / OSS Cluster API (25 GB or 25,000 ops/sec guidance; auto shard count; single-endpoint standard mode; OSS Cluster API Pro-only, cluster-aware client, standard hashing policy) — .../databases/configuration/clustering

## Unverifiable / not used

- Free-plan 14-day inactivity deletion (support-article only, not in main docs) — dropped; no question depends on it.
- "Hibernate/hibernation": never used, per guardrails. No "Enterprise plan" naming; geo features use Active-Active/Active-Passive only.

## Validation evidence

- `jq empty` ran after every single file write (24/24 OK); intermediate authoring slips (wrong id stems, stray fields) were caught and fixed immediately per file.
- Final scripted sweep (python over all 24 files): 24 files; per-domain counts 6/7/11; per-domain kind totals exactly as specified; stems = ids 24/24; kc lessonIds correct; kc difficulties all beginner/intermediate; multi corrects are 2–3 ids with distractors; fill templates contain `___`; matching lefts unique; order correct arrays are permutations of option ids; bug indices in range; tags start with `redis`. Result: all checks passed.
- Terminology grep over the 24 files: no "hibernat*", no "Enterprise plan", no legacy "Replica Of" feature references (only plain-English "replica of the source/primary" phrasing).
- `git status` shows my footprint is exactly the 24 `rc-q-12-*`/`rc-q-13-*`/`rc-q-14-*` question files plus this report; the other modified/added paths (lessons 12–19, questions 15–19, shared manifests) belong to parallel agents.

Status: DONE
Summary: Wrote and validated all 24 question files for domains 12–14 (pools 6/7/11, exact kind mixes, verified Redis Cloud facts only) plus this report; final sweep passes with stems matching 24/24.
Concerns/Blockers: None. Note for integrators: the codeReading/bug scenarios use illustrative pseudo-config (e.g., `memoryLimit: "10 GB"`), not literal REST API field names, to stay accurate against API drift.
