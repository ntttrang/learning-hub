# Brainstorm: Redis subject pack (3 Associate certifications)

Date: 2026-09-03 · Branch at capture: `feat/languages-pack` · Status: contract accepted by user

## Outcome

One `content/redis/` subject pack in the unified hub preparing all three Redis
Associate certifications, delivered in phases:

- Phase 1 — pack scaffold + shared Redis core domains + **Developer (Java)** track
  complete (lessons, labs, practice questions, mock exam).
- Phase 2 — **Software Operator** track complete + its mock exam.
- Phase 3 — **Cloud Operator** track complete + its mock exam + README/pack-list refresh.

## Constraints

- Exact Content SDK schema (`src/sdk/`): Zod-validated JSON, locked accent token
  (`captain-red` taken by Languages → use `deep-teal`); no core-code edits; pack
  discovered by Vite glob (dev server restart after scaffold).
- Original study content; disclaimer field: independent study aid, not affiliated
  with or endorsed by Redis Ltd. ("Redis" trademark note, mirroring the Languages
  pack's disclaimers).
- Modes: `learn, labs, practice, exams, notes, revision` (exam-pack convention; no
  `compare`).
- Gates: `npm run content:check`, `npm test`, `npm run build` must pass each phase.

## Non-goals

- No shell/engines/UI/core changes; no standalone `learn-redis/` app.
- No live Redis sandbox/Docker lab; labs are guided written walkthroughs (pack convention).
- No verbatim copying of Redis docs or Redis University course material.

## Acceptance criteria

- All three gates green at every phase end; Redis subject on the home rail with all
  enabled modes working.
- ≥1 mock exam per certification whose `domainPlan` mirrors that exam's real domain
  structure and format (see exam facts below).
- Shared core domains reused by all three mock exams; per-track questions tagged by
  `domainId` + `moduleId`.
- README "Installed packs" updated at final phase.

## User decisions (do not reverse without asking)

1. One subject (not three packs) — shared core stays DRY.
2. Phased delivery, not full-at-once.
3. Track order: Developer (Java) → Software Operator → Cloud Operator.

## Evidence

Repo: pack convention + `npm run content:new -- --id … --code … --title … --accent …`
stamps a starter; comparable packs: gh-900 (7 lessons/140q/7 labs/2 exams/7 domains),
dp-800 (43/179/3/2/3), gh-200 (5/100/6/2/5). Accent tokens: `sky-cyan, hub-green,
corgi-orange, hub-coral, petal-pink, deep-teal, captain-red`.

Exam facts (search-verified, 2026-09):

- **Associate Developer (Java)** — 65 questions / 90 min, AI-proctored. Prep:
  RU101 (data structures), RU102J (Redis for Java), "Develop with Redis". Domains
  seen in official study guide: general CS/DB/Redis knowledge, Redis keys, data
  structures, data modeling, + (persistence, client usage — confirm in plan).
- **Associate Software Operator** — 60 questions / 60 min / passing 70% / 2-year
  validity / 1 free retake; listed "in beta" Jan 2026. Prep: "Operate Redis
  Software" path (Redis Software/Enterprise: install, clustering, backup/restore,
  security, monitoring).
- **Associate Cloud Operator** — prep: "Redis Cloud deployment & operations →
  security, scaling, troubleshooting" path; exact format/weights unconfirmed.

Sources: <https://redis.io/certificates/> (deprecation page → university.redis.io),
<https://university.redis.io/academy>,
<https://redis.io/blog/how-to-ace-the-redis-certified-developer-exam/>,
<https://university.redis.io/course/scnre8uji7adfv> (Software Operator course page).

## Risks / open questions (plan-phase work)

- Cloud Operator exam format + domain weights unverified; Redis University is a JS
  SPA — course pages need browser fetch (agent-browser skill) or `university@redis.com`.
- Official domain weight ranges should come from Redis's study guides before
  freezing `domains.json`; mark provisional weights in Phase 1 if not yet confirmed.
- Work branch: repo sits on `feat/languages-pack`; plan should create its branch
  from `main`.
- Question volume: 3 exams × ~60-65 questions each needs a deep pool per domain
  (≥8-10 per heavily-weighted domain) so sampled mock exams stay valid across seeds.

## Handoff

→ `ak-plan` (plan dir: `plans/260903-1731-redis-subject/`), then `/ak:cook` per phase.
