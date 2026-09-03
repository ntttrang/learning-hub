---
phase: 1
title: "Vendor donor + scaffold pack"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Vendor donor + scaffold pack

## Overview

Bring the polyglot-hub source into the repo as a vendored donor app and stamp
the empty `languages` pack shell — so Phase 2's extractor has both a stable
build input and a validating target with zero core-code edits.

## Requirements

- Functional: `learn-polyglot/` exists in-repo as a build input (same status as `learn-dp-800/`, `learn-gh-200/`, `learn-gh-600/`); `content/languages/` exists, validates, and shows on the home rail.
- Non-functional: donor copy is verbatim source (minus excluded litter); no new runtime dependency.

## Architecture

No runtime involvement — Phase 1 only adds a vendored directory and pack data.
Packs are discovered by Vite glob over `content/*/`, so writing files is the
whole registration; a running dev server must be restarted to see the new
subject.

## Related Code Files

- Create: `learn-polyglot/` (vendored copy of `ntttrang/polyglot-hub` `main`)
  — include `data/`, `src/`, `index.html`, `package.json`, `vite.config.ts`,
  tsconfigs, `README.md`; **exclude** `.git/`, `.github/`, `node_modules/`,
  `.tmp_gen_java_quiz.py`
- Create: `content/languages/` via `npm run content:new`
- Modify: `README.md` layout table (donor row) — full doc pass is Phase 5

## Implementation Steps

1. Vendor the donor (all dotfiles excluded, HEAD SHA recorded — red-team
   findings 9/15: the exclusion list must match the no-dotfile criterion, and
   after the source repo is archived the SHA is the only provenance tie):
   ```bash
   git clone https://github.com/ntttrang/polyglot-hub /tmp/polyglot-src
   git -C /tmp/polyglot-src rev-parse HEAD   # record in README donor row + plan journal
   rsync -a --exclude '.*' --exclude node_modules \
     --exclude .tmp_gen_java_quiz.py /tmp/polyglot-src/ learn-polyglot/
   rm -rf /tmp/polyglot-src
   ```
2. Sanity-read the vendored `data/` against what was scouted: 5 JSON files per
   language dir (`learn/lab/practice/quiz/framework.json`) + `manifest.json` +
   `compare/topics.json`; spot-check one file per section. If the shape differs
   from `src/lib/types.ts` in the donor, stop and reconcile the Phase 2 mapping
   before touching content.
3. Stamp the pack shell and take the real values (verified brand token):
   ```bash
   npm run content:new -- --id languages --code LANG --title "Languages" \
     --accent captain-red \
     --subtitle "Java · Go · Python · Ruby — senior-level revision" \
     --description "Senior-engineer revision across four stacks: core language, one flagship framework per stack, labs, practice, knowledge checks, and cross-language comparisons — ported from the donor Polyglot Revision Hub."
   ```
4. Confirm the starter pack validates and registers:
   `npm run content:check`, then `npm run dev` (restart if already running) →
   home rail shows **Languages** with only `learn` + `practice` starter modes.
5. `README.md` layout table: add the `learn-polyglot/` donor row (one line,
   mirroring the other donor rows, including the recorded donor HEAD SHA;
   full README pass stays in Phase 5).

## Success Criteria

- [x] `learn-polyglot/` verbatim donor present; `git status` shows no dotfile/`node_modules` litter inside it; donor HEAD SHA recorded
- [x] `content/languages/` exists, `npm run content:check` passes
- [x] Dev server (restarted) shows the Languages card on the home rail with honest starter modes
- [x] Lint passes for the vendored dir per repo lint scope rules (`oxlint src scripts` — `learn-polyglot/` is outside lint scope like the other donors)

## Risk Assessment

Risk rests on one assumption: the donor `main` JSON matches the scouted schema
in `src/lib/types.ts`. **Observable signal it broke:** step 2's spot-check
diverges (new fields, renamed sections). **Pre-decided response:** stop,
re-read the donor types, and adjust the Phase 2 mapping table before any
content write — do not force-fit the extractor.
