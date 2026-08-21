---
title: "GH-600 pack extracted, verified, committed"
date: 2026-08-21
summary: "learn-gh-600 donor ported to content/gh-600 (390 questions, 8 exams, 8 labs) with donor-anchored parity, one-time progress migration, and a race-safe scoped commit around a concurrent DP-800 session."
---

# GH-600 pack extracted, verified, committed

## What happened
- Executed all 5 phases of plans/260820-1812-phase-5-gh-600-pack: scripts/extract-gh600-pack.ts (node:vm bare-sandbox donor eval; fail-closed on missing submodule) emits content/gh-600 — 6 domains, 23 lessons, 390 unique questions (440 instances, 50 intra-practice collapses), 8 fixed exams, 8 labs.
- scripts/gh600-parity.test.ts (18) + gh600-blocks.test.ts (7) + src/engines/migrate-gh600-progress.test.tsx (13) pin donor↔pack parity and the one-time gh600sp_* → hub progress migration (hydration-gated call in src/App.tsx).
- Verification: content:check 4 packs green; gh-600 changeset 0 test failures; gh600-mock-1 sat through the real engines (60q paper → perfect 1000/pass, blank 100/fail, per-domain 10/14/7/10/10/9); live dev-server HTTP pass; tester + code-reviewer delegates passed every acceptance criterion with zero code changes requested.
- Committed as dc71570 feat(content): add gh-600 pack with parity tests and progress migration.

## Decision
- The repo hosts a concurrent DP-800 session sharing App.tsx/package.json with this changeset. Chosen strategy: scoped commit with split hunks. When the sibling session restaged the shared files mid-flight (its staged blobs would have reverted the gh-600 wiring), the commit was built via temp-index plumbing (git read-tree HEAD + update-index --cacheinfo from staged blob SHAs + commit-tree + guarded update-ref) so the shared index and the sibling's staging were never touched; the two shared index entries were then repaired so the sibling's staged diff is exactly its own lines.

## Next steps
- Optional parity hardening (tester note): pin quiz option text verbatim; assert lab ids in the step-count test.
- src/shell/views.test.tsx installed-count pin flips to 5 when the DP-800 pack lands (owned by the concurrent session).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
