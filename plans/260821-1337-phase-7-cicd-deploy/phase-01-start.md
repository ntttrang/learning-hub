---
phase: 1
title: "CI Workflow"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: CI Workflow

## Overview

Create the GitHub Actions workflow that gates every push and pull request on
lint + hermetic tests + content-integrity validation + build, plus the `test:ci`
npm script that makes the suite runnable without donor submodules. Everything
is proven green locally before the first push happens in phase 2.

## Requirements

- Functional: `.github/workflows/ci.yml` runs on `push` (all branches) and
  `pull_request`; the `build` job executes `npm ci` → `lint` → `test:ci` →
  `content:check` → `build` → upload-pages-artifact; a `deploy` job (same file)
  runs only on push to `main`.
- Functional: new npm script `test:ci` runs the full Vitest suite except the
  two donor-anchored suites (`scripts/gh600-parity.test.ts`,
  `scripts/gh600-blocks.test.ts`); the existing `test` script is untouched.
- Non-functional: no submodules checked out; npm cache via `setup-node`;
  action versions pinned to the same majors the donor repo runs today
  (`checkout@v4`, `setup-node@v4`, `upload-pages-artifact@v3`, `deploy-pages@v4`).

## Architecture

Two-job pattern mirrored from `ntttrang/learn-dp-800/.github/workflows/deploy.yml`,
extended with the quality gates the donor lacks:

- **`build` job** — the CI gate. Runs on every trigger. Uploads the `dist/`
  artifact via `actions/upload-pages-artifact` so the deploy job is a pure
  publisher.
- **`deploy` job** — `needs: build`, gated with
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`,
  `environment: github-pages`, `actions/deploy-pages@v4`. PRs never deploy.

Permissions are declared top-level (`contents: read`, `pages: write`,
`id-token: write`); concurrency `group: pages` with `cancel-in-progress: false`
so production deploys queue instead of cancelling. A `workflow_dispatch`
trigger allows manual re-runs.

## Related Code Files

- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add `test:ci` script next to `test`)
- Reference (read-only): `vite.config.ts` (`base: './'` — already deploy-ready),
  `scripts/gh600-parity.test.ts` (the excluded donor-anchored suite)

## Implementation Steps

1. Add to `package.json` scripts (both exclusions required — `gh600-blocks`
   reads the donor at module-load via `gh600-extract-lib`, found in review):
   ```json
   "test:ci": "vitest run --exclude scripts/gh600-parity.test.ts --exclude scripts/gh600-blocks.test.ts"
   ```
2. Create `.github/workflows/ci.yml` with exactly this content:
   ```yaml
   name: CI

   on:
     push:
     pull_request:
     workflow_dispatch:

   # Allow the workflow to publish to GitHub Pages.
   permissions:
     contents: read
     pages: write
     id-token: write

   # Only one deploy at a time; don't cancel an in-progress production deploy.
   concurrency:
     group: pages
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4   # submodules not needed: donors are extraction-time inputs
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: 24
             cache: npm
         - name: Install dependencies
           run: npm ci
         - name: Lint
           run: npm run lint
         - name: Test (hermetic slice)
           run: npm run test:ci
         - name: Content integrity
           run: npm run content:check
         - name: Build static site
           run: npm run build
         - name: Upload Pages artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: dist

     deploy:
       needs: build
       if: github.ref == 'refs/heads/main' && github.event_name == 'push'
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```
3. Prove the exact CI command list locally, in order:
   ```bash
   npm ci && npm run lint && npm run test:ci && npm run content:check && npm run build
   ```
   All must pass. Confirm `test:ci` output shows the gh-600 parity suite
   excluded while `src/**` suites (including `content-check.test.ts`) run.
4. Sanity-check the artifact: `dist/index.html` references relative assets
   (`assets/…`, `brand/…` — no leading `/`), since `base: './'` must hold for
   the Pages sub-path `/<repo>/`.
5. Commit: `ci: add github actions gate and pages deploy workflow`.

## Todo

- [ ] `test:ci` script added; `npm test` untouched
- [ ] `.github/workflows/ci.yml` created with both jobs
- [ ] Local CI command list green
- [ ] `dist/` relative-asset spot check done

## Success Criteria

- [ ] The five CI commands pass locally, in workflow order, on a clean `npm ci`.
- [ ] `test:ci` excludes exactly the two donor-anchored gh-600 suites; running
      `npm test` still executes both (and both still fail without the donor).
- [ ] Workflow YAML is valid (paste-check or `actionlint` if available).

## Risk Assessment

- **Hidden donor dependency in another suite** — resolved in review
  (2026-08-21): `scripts/gh600-blocks.test.ts` reads the donor at module-load
  by design, so it joins the exclusion set rather than being rewritten with
  vendored fixtures (which would duplicate donor content and betray the suite's
  donor-anchored purpose). Any *future* suite that touches donors accidentally
  gets made hermetic, not excluded — exclusion is for deliberate donor-anchored
  suites only.
- **Vitest `--exclude` semantics**: the config's `include` already restricts
  discovery to `src/**` and `scripts/**`, so overriding excludes cannot pull in
  `node_modules`. If `--exclude` behaves unexpectedly on vitest 4, fall back to
  `vitest run --exclude='scripts/gh600-parity.test.ts'` quoting or a config-level
  `projects` split — do not delete the parity suite.
