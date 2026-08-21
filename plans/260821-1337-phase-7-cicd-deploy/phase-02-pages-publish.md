---
phase: 2
title: "Pages Publish"
status: pending
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: Pages Publish

## Overview

Create the private GitHub repository `ntttrang/learning-hub`, enable GitHub
Pages with the Actions build type, push `main` — which triggers the phase-1
workflow's maiden run — and watch both jobs go green.

## Requirements

- Functional: repo exists at `ntttrang/learning-hub`, private, with `main`
  pushed and `origin` wired.
- Functional: GitHub Pages enabled with `build_type: workflow` **before** the
  first push, so the maiden workflow run can deploy.
- Functional: the first Actions run completes green (build + deploy).
- Non-functional: no secrets in the pushed tree; the working tree is clean and
  committed before push; the deploy job's site URL is captured for phase 3.

## Architecture

Push flow (ordering matters):

```text
commit clean tree → audit tracked files for secrets
  → gh repo create (private, origin wired, NO push yet)
  → gh api: enable Pages (build_type=workflow)
  → git push -u origin main        ← triggers the maiden CI run
  → gh run watch                   ← build + deploy must both be green
```

Creating the repo without `--push` and enabling Pages first is deliberate: the
`deploy` job fails if Pages isn't enabled when the workflow first runs, and a
red maiden run would muddy phase 3's verification.

Submodule pointers ride along in the pushed tree (`.gitmodules` + commit SHAs —
donor code itself is not pushed). CI never clones them (phase 1 decision), so
their availability is irrelevant to the pipeline.

## Related Code Files

- Create: the GitHub repository `ntttrang/learning-hub` (remote target)
- Modify: git config (add `origin` remote)
- No source files change in this phase.

## Implementation Steps

1. Clean tree: commit or stash any local modifications (scouted state: modified
   plan files under `plans/` and a dirty `learn-gh-200` submodule pointer —
   `.gitmodules` sets `ignore = dirty` for it, so the pointer just needs its
   current SHA committed).
2. Secret audit on tracked files:
   ```bash
   git ls-files | grep -iE '\.env|secret|token|key|credential' || echo clean
   ```
   `.gitignore` already excludes `.env.*`; anything the grep surfaces gets
   judged before push (untrack + rotate if a real secret).
3. Create the repo without pushing:
   ```bash
   gh repo create learning-hub --private --source . --remote origin
   ```
4. Enable Pages with the Actions build type:
   ```bash
   gh api -X POST repos/ntttrang/learning-hub/pages -f build_type=workflow
   ```
   - **403 / "not available for private repositories"** → the known
     private-repo gate: STOP. Present the user with the choice (enable GitHub
     Pro vs make the repo public). Do not flip visibility unilaterally.
   - `201`/`200` → proceed.
5. Push and trigger the maiden run:
   ```bash
   git push -u origin main
   gh run watch   # first run of "CI": build + deploy must both succeed
   ```
   If anything raced, `gh run rerun <id>` or the `workflow_dispatch` trigger
   gives a clean re-run.
6. Capture the Pages URL for phase 3:
   ```bash
   gh api repos/ntttrang/learning-hub/pages --jq .html_url
   ```

## Todo

- [x] Tree committed clean; secret audit passed
- [x] Private repo created, `origin` wired
- [x] Pages enabled (`build_type=workflow`)
- [x] `main` pushed; maiden run green (build + deploy)
- [x] Pages URL captured

## Success Criteria

- [x] `gh repo view ntttrang/learning-hub --json visibility` → `PRIVATE` at
      creation; **flipped to `PUBLIC` 2026-08-21** by explicit user decision
      after the Pages API returned 422 on GitHub Free (risk below fired as
      predicted). Final live state: `PUBLIC`, Pages serving.
- [x] `gh run list` shows the maiden CI run with conclusion `success` for both
      jobs — **green CI on push to `main`** (roadmap done-when, pipeline half).
- [x] Pages API returns an `html_url`.

## Risk Assessment

- **Private-repo Pages unavailable (GitHub Free)** — signal: step 4's 403, or a
  deploy-job failure mentioning private repositories. Response: surface the
  Pro-vs-public decision to the user; the phase is `BLOCKED` until they choose.
- **Maiden run red for a workflow-syntax reason** (never validated in a real
  runner): `gh run view --log-failed` to read the exact step; fix the YAML and
  amend — do not disable gates to go green.
- **Push rejected / auth hiccup**: `gh` token already carries `repo` + `workflow`
  scopes (verified 2026-08-21); re-auth only if git operations specifically fail.
