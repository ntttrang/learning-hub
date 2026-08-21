---
title: "Phase 7 CI/CD Deploy"
description: "Roadmap Phase 7 of docs/unified-learning-hub-plan.md: a GitHub Actions workflow that gates every change on lint + hermetic tests + content-integrity + build, and publishes the unified hub to GitHub Pages on push to main — in a new private repo, with Docker/AWS deferred."
status: pending
priority: P1
effort: 4h
tags: [ci, deploy, github-pages, devops]
blockedBy: []
blocks: []
created: 2026-08-21
---

# Phase 7 — CI/CD + Deploy

## Overview

Execute **roadmap Phase 7** of `docs/unified-learning-hub-plan.md` §7 — the final
roadmap phase. Two deliverables: a CI quality gate (build + lint + tests +
content-integrity validation) and a GitHub Pages publish pipeline that releases
the unified site on every push to `main`, mirroring the proven two-job workflow
already running in the donor repo `ntttrang/learn-dp-800`.

**Starting state (scouted 2026-08-21):** Phases 0–6 complete and committed;
five packs installed (`dp-800`, `gh-200`, `gh-900`, `gh-600`, `fixture`). All
CI-able scripts already exist (`build`, `lint`, `test`, `content:check`). The
build is already static-deploy-ready: `vite.config.ts` sets `base: './'` and
routing is hash-based (`src/shell/router.ts`), so no history-fallback or
path-prefix work is needed. **No `.github/` directory exists and the repo has
no git remote** — both are greenfield here. `gh` is authenticated as `ntttrang`
with `repo` + `workflow` scopes. Donor reference: `ntttrang/learn-dp-800` ships
`.github/workflows/deploy.yml` (checkout → setup-node → `npm ci` → build →
`upload-pages-artifact` → `deploy-pages`). One CI hazard: `scripts/gh600-parity.test.ts`
reads the `learn-gh-600/` donor submodule at test time and **fails closed**
(never skips) when the donor is absent — plain `npm test` in CI would fail
without submodules. Code review (2026-08-21) surfaced a **second** donor-anchored
suite: `scripts/gh600-blocks.test.ts` reads the donor at module-load via the
same fail-closed lib, hidden from a filename grep because the read lives in
`gh600-extract-lib.ts`.

## User Decisions (2026-08-21)

| Decision | Choice | Consequence |
| --- | --- | --- |
| Git remote | **Create private repo** `ntttrang/learning-hub` | GitHub Pages on a private repo requires GitHub Pro; the deploy step gates on this (phase 3 surfaces the choice — never auto-flips to public) |
| Optional Docker/AWS track | **Defer** | Dockerfile + Docker Hub publish + AWS deploy stay a documented follow-up, out of this plan's scope |

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | CI workflow gates every push/PR on lint + hermetic tests + content-integrity + build | P1 |
| 2 | Push to `main` publishes the unified hub to GitHub Pages from the new private repo | P1 |
| 3 | Published site verified live (assets, deep links, themes) and CI/deploy documented in README | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [CI Workflow](./phase-01-start.md) | Pending |
| 2 | [Pages Publish](./phase-02-pages-publish.md) | Pending |
| 3 | [Verify Published Site](./phase-03-verify-published-site.md) | Pending |

Phase order rationale: the workflow file must exist locally before the first
push (phase 2's push triggers it), and the site must be published before live
verification (phase 3).

## Success Criteria

- [ ] CI runs on every push and pull request: `npm run lint`, `npm run test:ci`,
      `npm run content:check`, `npm run build` — all green. **(Roadmap: build +
      lint + tests + content-integrity validation in CI.)**
- [ ] Push to `main` publishes the unified site to GitHub Pages; the Actions run
      is green end-to-end. **(Roadmap done-when: green CI publishes the unified
      site on push to `main`.)**
- [ ] The live site serves `index.html` with resolving relative assets, working
      hash deep links (e.g. `#/subject/dp-800`), and Auto/Light/Dark/Night themes.
- [ ] Pull-request runs build + test but never deploy.
- [ ] Local `npm test` is unchanged — the full suite, including both
      donor-anchored gh-600 suites, still runs and still fails closed
      without the submodule.
- [ ] README documents the CI gate, the deploy flow, the Pages URL, and the
      deferred Docker/AWS follow-up.

## Constraints & Non-Goals

- **Constraints:** static-hostable client-only app — no runtime changes; keep
  the platform content-integrity contracts (`docs/unified-learning-hub-plan.md`
  §8) enforced in CI via `content:check`; never commit secrets or tokens.
- **Non-goals (roadmap + user decisions):** Docker image publish to Docker Hub
  and AWS deploy (deferred 2026-08-21); custom domain; branch protections or
  release-tag workflows; backend/auth/cloud sync; changing the gh-600 parity
  suite's fail-closed contract.

## Key Decisions (pre-made, from scouting)

| Decision | Choice | Why |
| --- | --- | --- |
| Workflow shape | One file `.github/workflows/ci.yml`, two jobs: `build` (gate) → `deploy` (gated `if: push && refs/heads/main`) | Donor's proven pattern; PRs get the full gate without deploying |
| Node version in CI | `node-version: 24` | Matches local dev (v24.8.0) where the toolchain (Vite 8, vitest 4, TS 6) is proven green |
| CI test slice | New script `test:ci` = `vitest run --exclude scripts/gh600-parity.test.ts --exclude scripts/gh600-blocks.test.ts`; local `npm test` untouched | Both gh-600 suites are donor-anchored **by design** and fail closed without the submodule (reviewer-verified: `gh600-blocks` reads the donor at module-load); CI has no submodules and shouldn't clone three donor repos to re-derive extraction parity — `content:check` already validates the committed artifact graph |
| Submodules in CI | Not checked out | Donors (all public) are extraction-time inputs, not build inputs; skipping them keeps CI fast and decoupled from donor repo availability |
| Content-integrity step | Explicit `npm run content:check` step, separate from `test:ci` | Names the roadmap contract in the Actions log for direct failure triage, even though `test:ci` also covers it |
| Asset/deploy details | No `BASE_PATH` env, no `.nojekyll` | `base: './'` is already relative (donor's BASE_PATH was Next-specific); `deploy-pages@v4` serves the artifact raw (donor's `.nojekyll` served its `out/` Next artifacts) |
| Private-repo Pages gate | Detect-and-surface, never auto-flip | User chose private knowing Pages needs Pro; the deploy failure (or Pages API 403) is the signal — phase 3 presents Pro-vs-public as a user decision |
| First-publish ordering | Create repo without pushing → enable Pages (`build_type=workflow`) → push | The deploy job fails if Pages isn't enabled when the workflow first runs; enabling first makes the maiden run green |

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Private repo + GitHub Free: Pages publish unavailable | Observable signal: `gh api …/pages` returns 403 at setup, or the `deploy` job fails with "not available for private repositories". Pre-decided response: stop, present Pro-upgrade vs flip-to-public to the user; do not silently change visibility |
| Excluding the two donor-anchored gh-600 suites from CI lets donor/pack drift through CI | `npm test` (full, fail-closed) remains the pre-merge local gate — documented in README's CI section; `content:check` still validates the committed pack graph in CI |
| Other `scripts/` suites hidden donor/temp dependencies | Phase 1 runs the exact CI command list locally before anything is pushed — green locally is the proof |
| `learn-gh-200` submodule pointer is dirty (`+` in `git submodule status`) | Phase 2 starts from a clean, committed tree; commit the pointer (or leave it untracked-dirty — `ignore = dirty` is set) so the pushed tree is reproducible |
| First workflow run races Pages enablement | Enable Pages before the first push (ordering decision above); `workflow_dispatch` trigger allows a clean re-run if anything races anyway |
| Secrets accidentally published on first push | `git ls-files` audit against `.env*`/token patterns before creating the repo; `.gitignore` already excludes `.env.*` |

## Cross-Plan Dependencies

None. Plans for roadmap Phases 0–6 are all `completed`. This is the last
roadmap phase; nothing follows it except the deferred Docker/AWS follow-up.

<!-- slug: phase-7-cicd-deploy -->
