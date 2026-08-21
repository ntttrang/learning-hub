---
title: "Phase 7 CI/CD Deploy"
description: "Roadmap Phase 7 of docs/unified-learning-hub-plan.md: a GitHub Actions workflow that gates every change on lint + full donor-backed tests + content-integrity + build, and publishes the unified hub to GitHub Pages on push to main — repo made public by user decision after the Free-plan Pages gate, with Docker/AWS deferred."
status: completed
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
`gh600-extract-lib.ts`. The maiden runs then disproved donor-independence a
third way: `tsc -b` compiles the extractor scripts against donor TS
(`tsconfig.scripts.json` exists for exactly that), so `npm run build` itself
needs the submodules. Decision reversed (2026-08-21, evidence-driven): CI
checks out submodules and runs the identical local gate — full `npm test`,
no `test:ci` slice.

## User Decisions (2026-08-21)

| Decision | Choice | Consequence |
| --- | --- | --- |
| Git remote | **Create private repo** `ntttrang/learning-hub` | GitHub Pages on a private repo requires GitHub Pro; the deploy step gates on this (phase 3 surfaces the choice — never auto-flips to public) |
| Git remote visibility (**reversed 2026-08-21**) | **Made public** — `gh repo edit --visibility public` | Enabling Pages on a private repo returned 422 on GitHub Free; user chose public over upgrading to Pro. Site is live at a public URL |
| Optional Docker/AWS track | **Defer** | Dockerfile + Docker Hub publish + AWS deploy stay a documented follow-up, out of this plan's scope |

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | CI workflow gates every push/PR on lint + full donor-backed tests + content-integrity + build | P1 |
| 2 | Push to `main` publishes the unified hub to GitHub Pages from the new repo (public since 2026-08-21) | P1 |
| 3 | Published site verified live (assets, deep links, themes) and CI/deploy documented in README | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [CI Workflow](./phase-01-start.md) | Completed |
| 2 | [Pages Publish](./phase-02-pages-publish.md) | Completed |
| 3 | [Verify Published Site](./phase-03-verify-published-site.md) | Completed |

Phase order rationale: the workflow file must exist locally before the first
push (phase 2's push triggers it), and the site must be published before live
verification (phase 3).

## Success Criteria

- [x] CI runs on every push and pull request: `npm run lint`, `npm test`
      (full, donor-backed), `npm run content:check`, `npm run build` — all
      green. **(Roadmap: build + lint + tests + content-integrity validation
      in CI.)**
- [x] Push to `main` publishes the unified site to GitHub Pages; the Actions run
      is green end-to-end. **(Roadmap done-when: green CI publishes the unified
      site on push to `main`.)**
- [x] The live site serves `index.html` with resolving relative assets, working
      hash deep links (e.g. `#/subject/dp-800`), and Auto/Light/Dark/Night themes.
- [x] Pull-request runs build + test but never deploy.
- [x] CI and local run the identical command set (the `test:ci` slice was
      removed; donor-anchored suites run in both).
- [x] README documents the CI gate, the deploy flow, the Pages URL, and the
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
| CI test slice | **Reversed 2026-08-21:** CI checks out `submodules: recursive` and runs full `npm test` — no `test:ci` script | Maiden runs proved the gate is donor-coupled at three levels (vitest suite, tsc project graph, build); a "hermetic slice" diverged from the local gate and failed twice. One command set, identical local and CI |
| Submodules in CI | `actions/checkout` with `submodules: recursive` | All three donors are public; the extractors compile and the parity suites test against donor sources at pinned SHAs — donors are build inputs after all |
| Content-integrity step | Explicit `npm run content:check` step, separate from `test` | Names the roadmap contract in the Actions log for direct failure triage, even though the full suite also covers it |
| Asset/deploy details | No `BASE_PATH` env, no `.nojekyll` | `base: './'` is already relative (donor's BASE_PATH was Next-specific); `deploy-pages@v4` serves the artifact raw (donor's `.nojekyll` served its `out/` Next artifacts) |
| Private-repo Pages gate | Detect-and-surface, never auto-flip | Fired as predicted: 422 on Pages enablement. Surfaced to the user, who chose public (2026-08-21); visibility flipped only on that explicit decision |
| First-publish ordering | Create repo without pushing → enable Pages (`build_type=workflow`) → push | The deploy job fails if Pages isn't enabled when the workflow first runs; enabling first makes the maiden run green |

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Private repo + GitHub Free: Pages publish unavailable | Observable signal: `gh api …/pages` returns 403 at setup, or the `deploy` job fails with "not available for private repositories". Pre-decided response: stop, present Pro-upgrade vs flip-to-public to the user; do not silently change visibility |
| Donor repos unavailable at pinned SHAs breaks CI (checkout fails) | All three donors public and pinned by gitlink; acceptable coupling for a personal hub — if a donor vanishes, re-extraction is a conscious local step anyway |
| One flaky test seen once locally (1/583, unreproducible, name not captured) | If it flakes in CI, the run log names it; fix that test then — do not add retries or weaken the gate |
| Other `scripts/` suites hidden donor/temp dependencies | Phase 1 runs the exact CI command list locally before anything is pushed — green locally is the proof |
| `learn-gh-200` submodule pointer is dirty (`+` in `git submodule status`) | Phase 2 starts from a clean, committed tree; commit the pointer (or leave it untracked-dirty — `ignore = dirty` is set) so the pushed tree is reproducible |
| First workflow run races Pages enablement | Enable Pages before the first push (ordering decision above); `workflow_dispatch` trigger allows a clean re-run if anything races anyway |
| Secrets accidentally published on first push | `git ls-files` audit against `.env*`/token patterns before creating the repo; `.gitignore` already excludes `.env.*` |

## Cross-Plan Dependencies

None. Plans for roadmap Phases 0–6 are all `completed`. This is the last
roadmap phase; nothing follows it except the deferred Docker/AWS follow-up.

<!-- slug: phase-7-cicd-deploy -->
