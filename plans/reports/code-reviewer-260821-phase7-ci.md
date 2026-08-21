# Code Review — Phase 7.1 CI Workflow (2026-08-21)

Reviewer: code-reviewer · Scope: `.github/workflows/ci.yml` (new), `package.json` (+`test:ci`)
Verdict: **DONE_WITH_CONCERNS — one critical, CI-breaking defect; fix before the phase-2 push.**

## Critical

### C1. `test:ci` exclusion is incomplete — `scripts/gh600-blocks.test.ts` is donor-anchored and will fail every CI run

The "Test (hermetic slice)" step is not hermetic. `scripts/gh600-blocks.test.ts` reads the
`learn-gh-600` donor submodule at module load, outside the exclusion list:

- `scripts/gh600-blocks.test.ts:8,15-19` — imports `readDonorFile, loadDonorConst` from
  `./gh600-extract-lib` and calls `readDonorFile('gh600-study-plan-captain-corgi.html')` at
  module top level (collection time). Its own header says it: "Converter regression net on
  real donor bodies (GH-600 pack)… Donor reads go through the shared extract lib."
- `scripts/gh600-extract-lib.ts:15,19-29` — `DONOR_ROOT = join(REPO_ROOT, 'learn-gh-600')`;
  a missing submodule throws fail-closed ("donor submodule not checked out?").
- `.gitmodules` — `learn-gh-600` is a git submodule (third-party `captain-corgi/learn-gh-600`).
  `actions/checkout@v4` in `ci.yml:23-24` has no `submodules:` input, so on GitHub runners the
  path is an empty directory → `readFileSync` ENOENT → module-level throw → vitest exits 1.
- `vite.config.ts:15` includes `scripts/**/*.test.{ts,tsx}`; `test:ci`
  (`package.json:10`) excludes only `scripts/gh600-parity.test.ts`.

Exhaustive sweep: these two files are the ONLY suites in the `test:ci` slice importing
donor-reading modules (`gh600-extract-lib`, `extract-*-pack`, `readDonorFile`, `DONOR_ROOT`).
All `src/**` suites load committed `content/` artifacts (928 tracked files) and are hermetic.

Why local proof missed it: `npm run test:ci` is green locally (61 files / 565 tests) because
the donors are checked out here. The plan's mitigation "the local run in step 3 catches it"
(risk table, `plan.md:110`) is blind to donor-read dependence — green-with-donors proves
nothing about runner hermeticity. The plan's premise that gh-600 parity is "the"
donor-anchored suite undercounted by one suite.

Impact: first push (phase 2) gets a red gate on every branch and PR; deploy never runs
until fixed. Contradicts phase-1 success criterion (CI commands green) and plan.md line 66.

Recommended minimal fix (cause-aligned, preserves all stated contracts):

```json
"test:ci": "vitest run --exclude scripts/gh600-parity.test.ts --exclude scripts/gh600-blocks.test.ts"
```

(vitest accepts repeated `--exclude` flags). Local `npm test` stays untouched — both
donor-anchored suites still run locally and still fail closed, exactly the documented
contract. Alternatives rejected: `submodules: recursive` checkout contradicts the
no-submodules decision and couples CI to a third-party repo's availability; vendoring the
donor HTML into tracked fixtures is a source change outside phase-1 scope. The step name
"Test (hermetic slice)" becomes true again once the exclusion covers both suites.

## Verified clean

- **(a) Gating** — triggers `push` (all branches) + `pull_request` + `workflow_dispatch`;
  build steps in required order `npm ci` → lint → test:ci → content:check → build →
  `upload-pages-artifact@v3` with `path: dist`; deploy `needs: build`, gated
  `github.ref == 'refs/heads/main' && github.event_name == 'push'`, `environment:
  github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`. Tag pushes and
  workflow_dispatch correctly never deploy. Matches the official Pages template shape.
- **(b) Script contract** — `test` is byte-identical (`git diff HEAD` shows a single added
  line); exclusion behavior proven at discovery level (`vitest list`: parity suite present
  without the flag, 0 matches with it).
- **(c) Public contracts** — no source files changed; `package.json` +1 script only; no
  env vars, no schema changes. (Note: the `learn-gh-200` submodule pointer is dirty in the
  tree — pre-existing, already tracked as a phase-2 risk in plan.md:111, not part of this
  change.)
- **(d) Pattern fidelity** — verified against the live donor
  `ntttrang/learn-dp-800/.github/workflows/deploy.yml` (fetched via `gh api`): identical
  action majors, top-level permissions, concurrency `pages`/`cancel-in-progress: false`,
  environment/url block. Deltas are all decided ones: Node 20→24, added gate steps, added
  deploy `if:` (required by the broadened triggers), dropped BASE_PATH/.nojekyll.
- **(e) YAML validity** — parses clean (PyYAML structural dump: top-level
  name/on/permissions/concurrency/jobs; step keys name/uses/with/run/id correct; `if:`
  plain scalar and `environment.url` expression valid). Bare `on:` key is the standard
  GitHub idiom. `actionlint` is NOT installed on this machine (`command -v actionlint`
  empty) — per task instructions reporting its absence; schema placement verified manually
  instead. `ci.yml` is not gitignored.

## Non-blocking notes

- Re-running a failed push-triggered run preserves `event_name == 'push'`, so the plan's
  "workflow_dispatch allows a clean re-run" mitigation actually works via re-run of the
  original run; a fresh dispatch on main will (correctly, per "ONLY push") not deploy.
- `content:check` step duplicates coverage inside `test:ci` — known intentional
  (contract visibility).

## Metrics

- Files reviewed: 5 · LOC changed: 57 (workflow) + 1 (package.json)
- Local evidence: `npm run test:ci` green (61 files / 565 tests, 27.6s); donor-absence
  failure proven by source path analysis (submodule gitlink + fail-closed reader), not
  simulated on this machine (review-only constraint).
