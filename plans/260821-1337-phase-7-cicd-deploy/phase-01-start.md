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
- Functional: CI runs the identical local gate — `npm ci` → `lint` →
  `npm test` (full, donor-backed) → `content:check` → `build` — so no
  CI-only command divergence can hide runner-only failures.
- Non-functional: submodules checked out (`recursive`) because the extractor
  scripts compile and the parity suites test against donor sources; npm cache
  via `setup-node`; action versions pinned to the same majors the donor repo
  runs today (`checkout@v4`, `setup-node@v4`, `upload-pages-artifact@v3`,
  `deploy-pages@v4`).

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

1. Create `.github/workflows/ci.yml` with exactly this content (no
   `package.json` script change — CI runs the same `npm test` as local):
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
           uses: actions/checkout@v4
           with:
             # Extractor scripts compile (tsc -b) and test (parity suites)
             # against donor sources — the gate needs the submodules present.
             submodules: recursive
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: 24
             cache: npm
         - name: Install dependencies
           run: npm ci
         - name: Lint
           run: npm run lint
         - name: Test
           run: npm test
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
2. Prove the exact CI command list locally, in order:
   ```bash
   npm ci && npm run lint && npm test && npm run content:check && npm run build
   ```
   All must pass (donor submodules present locally make this the same run CI
   does). One flake was seen once (1/583, unreproducible, name not captured) —
   if it flakes in CI, fix that named test; never add retries.
3. Sanity-check the artifact: `dist/index.html` references relative assets
   (`assets/…`, `brand/…` — no leading `/`), since `base: './'` must hold for
   the Pages sub-path `/<repo>/`.
4. Commit: `ci: add github actions gate and pages deploy workflow`.

## Todo

- [x] CI gate uses the identical local command set (no `test:ci` script)
- [x] `.github/workflows/ci.yml` created with both jobs
- [x] Local CI command list green
- [x] `dist/` relative-asset spot check done

## Success Criteria

- [x] The five CI commands pass locally, in workflow order, on a clean `npm ci`.
- [x] CI command set is identical to local (no `test:ci` divergence;
      donor-anchored suites run in both).
- [x] Workflow YAML is valid (paste-check or `actionlint` if available).

## Risk Assessment

- **Donor coupling is three-level, not test-level only** — resolved by
  reversal (2026-08-21): the maiden runs showed `tsc -b` compiles the
  extractors against donor TS (`tsconfig.scripts.json` exists for that), so a
  submodule-free CI can never pass `npm run build`. The original
  no-submodules + `test:ci` slice design was replaced wholesale with
  `submodules: recursive` + full `npm test`. Lesson recorded: when the local
  gate is donor-coupled, CI must replicate it, not approximate it.
- **Vitest `--exclude` semantics**: the config's `include` already restricts
  discovery to `src/**` and `scripts/**`, so overriding excludes cannot pull in
  `node_modules`. If `--exclude` behaves unexpectedly on vitest 4, fall back to
  `vitest run --exclude='scripts/gh600-parity.test.ts'` quoting or a config-level
  `projects` split — do not delete the parity suite.
