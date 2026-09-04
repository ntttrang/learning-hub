---
title: Redis pack phase 1 complete — delegation beat output corruption
date: 2026-09-04
summary: Phase 1 authored via subagent delegation after primary-session writes kept corrupting; mdx lessons flipped to json (browser Buffer crash); all gates and review green; commit pending user
---

# Redis pack phase 1 complete — delegation beat output corruption

## What happened
- Resumed phase 1 of the Redis pack on `feat/redis-pack`. The fresh session
  corrupted 5/5 long structured writes (stray keys, `X if False else Y`
  splices, truncation) — same failure class as the 2026-09-03 halt.
- Working mitigation: delegated all content authoring to three parallel
  subagents (clean output streams) with strict per-write validation in each
  prompt; ~16 corruption events were caught and fixed across agents; primary
  session verified everything inbound. Zero residue per independent review.
- Late blocker found in the browser: `.mdx` lessons crash pack load
  (gray-matter `lib/utils.js` calls `Buffer.from`; `buffer` is externalized
  in Vite, so the pack silently fails to appear). Pre-existing platform bug —
  the fixture pack's mdx lesson fails the same way. Converted all 8 redis
  lessons to `.json` blocks (frontmatter preserved, body = one `md` block).

## Decision
- Stayed inside plan scope: no core-code changes; `.json` lessons match every
  shipped pack. Platform mdx/Buffer fix (polyfill vs drop gray-matter) is
  recorded as a follow-up for the user to decide.
- Review minors fixed immediately: `latest_fork_usec` section corrected to
  `INFO persistence` (x2), replica-election wording (replicas campaign,
  masters elect), AOF MISCONF ellipsis replaced. Deferred to phase 3: Jedis
  7.x docs-freshness note, rc-q-01-bank-12 domain misfile.

## Outcome
- Gates: content:check 5/5, vitest 613/613 (installed-pack test count 6→7),
  lint clean, build OK. Code review PASS 8/8 acceptance, 0 critical/major.
  Sampler verified byte-identical across seeded runs (65 questions, per-domain
  counts exact). Six-mode click-through verified on a temp dev server (:5174,
  stopped after); user's :5173 server predates the pack and needs a restart.

## Next steps
- User reviews + commits phase 1 on `feat/redis-pack`.
- Phase 2 (Software Operator track) then phase 3 (Cloud Operator + README).
- Phase 3 carry-overs: Jedis docs note, question domain move, mdx/Buffer
  platform decision, optional redis golden test pinning seeded paper ids.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
