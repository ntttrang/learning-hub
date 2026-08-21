---
title: Phase 7 CI/CD deploy complete — hub live on Pages
date: 2026-08-21
summary: Green CI now publishes the unified hub on push to main; three maiden runs root-caused lockfile and donor-coupling failures before going green.
---

# Phase 7 CI/CD deploy complete — hub live on Pages

## What happened

Roadmap Phase 7 (final) executed end to end. `.github/workflows/ci.yml` gates
every push/PR on `npm ci` → lint → `npm test` → `content:check` → `build`,
then deploys `dist/` to GitHub Pages on push to `main` only. Repo
`ntttrang/learning-hub` created and wired as `origin`; site live at
https://ntttrang.github.io/learning-hub/ after three maiden runs:

1. Run 1 red — `npm ci` failed: lockfile referenced 15 rolldown platform
   bindings but carried standalone entries for 13 (darwin-x64 and
   linux-arm64-gnu missing). `npm install --package-lock-only` was a no-op and
   a full regen produced a degenerate stub; fixed by surgically inserting the
   two entries with registry-sourced integrity. Clean `npm ci` re-proved.
2. Run 2 red — `tsc -b` failed TS2307 on donor imports: extractor scripts
   compile against donor TS via `tsconfig.scripts.json`. Disproved the
   "tests-only donor coupling" assumption a third time.
3. Run 3 green — build + deploy both succeeded; live URL HTTP 200.

Live verification: shell/JS/CSS/brand assets all 200 under the `/learning-hub/`
sub-path; browser pass on the live URL confirmed home renders (4 subjects),
`#/subject/dp-800` renders on cold direct load, Night theme applies
(`data-theme=night`) and survives a cold reload.

## Decision

- **Submodule reversal (evidence-driven):** the pre-planned "hermetic
  `test:ci` slice, no submodules" design was replaced with
  `submodules: recursive` + the identical local gate (full `npm test`,
  `test:ci` script removed). Donors are build inputs at three levels (vitest
  suites, tsc project graph, build). Lesson: when the local gate is
  donor-coupled, CI must replicate it, not approximate it.
- **Repo visibility:** created private per user choice; enabling Pages
  returned 422 on GitHub Free; user chose public over Pro. Flipped only on
  that explicit decision. Recorded in plan User Decisions.

## Next steps

- Deferred follow-up (user decision): Dockerfile + Docker Hub publish + AWS
  deploy — out of scope for this plan.
- One unreproducible flake seen once locally (1/583): if it flakes in CI, fix
  that named test; no retries.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
