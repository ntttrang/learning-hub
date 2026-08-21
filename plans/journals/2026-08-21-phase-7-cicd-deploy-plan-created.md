---
title: phase 7 cicd deploy plan created
date: 2026-08-21
summary: "Planned roadmap Phase 7: GH Actions gate + Pages publish; user chose private repo + deferred Docker"
---

# phase 7 cicd deploy plan created

## What happened
- Scouted the repo for roadmap Phase 7 (`docs/unified-learning-hub-plan.md` §7): all gates scriptable (`build`, `lint`, `test`, `content:check`), `vite.config.ts` already deploys-safe (`base: './'` + hash routing), but `.github/` and any git remote are greenfield.
- Found the CI hazard: `scripts/gh600-parity.test.ts` reads the `learn-gh-600/` donor submodule and fails closed without it — plain `npm test` would break in CI. Donors are public, but cloning three repos per run for one parity suite was rejected.
- Mirrored the proven two-job Pages pattern from donor repo `ntttrang/learn-dp-800/.github/workflows/deploy.yml`, extended with lint/test/content gates the donor lacks.
- Wrote and validated `plans/260821-1337-phase-7-cicd-deploy/` (3 phases: CI workflow → private repo + Pages publish → live verify + README docs); set as current plan (`ak plan use`).

## Decision
- User chose **private repo** `ntttrang/learning-hub` — GitHub Pages on private repos needs Pro; the plan gates on this and surfaces Pro-vs-public instead of auto-flipping visibility.
- User chose to **defer** the optional Dockerfile/Docker Hub/AWS track.
- CI runs a new `test:ci` script (`vitest run --exclude scripts/gh600-parity.test.ts`); local `npm test` stays full + fail-closed. No submodules in CI.

## Next steps
- Execute via `/ak:cook plans/260821-1337-phase-7-cicd-deploy/plan.md` (user-selected handoff).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
