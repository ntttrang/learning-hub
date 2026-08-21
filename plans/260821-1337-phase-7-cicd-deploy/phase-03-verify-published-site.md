---
phase: 3
title: "Verify Published Site"
status: pending
priority: P1
effort: "1h"
dependencies: [2]
---

# Phase 3: Verify Published Site

## Overview

Verify the published hub live — assets resolve, hash deep links load, themes
work — then document the CI/deploy flow in the README and close the roadmap.

## Requirements

- Functional: the Pages URL serves the hub (HTTP 200 on the site root), with
  relative asset URLs resolving under the `/<repo>/` sub-path.
- Functional: a hash deep link (e.g. `…/#/subject/dp-800`) renders the subject
  workspace on direct load; hub chrome (mascot, wordmark) renders; the
  Auto/Light/Dark/Night toggle cycles and persists across reload.
- Functional: README gains a "CI & deploy" section documenting the gate, the
  publish flow, the Pages URL, why CI checks out submodules and runs the full
  `npm test` (reversal of the original `test:ci` slice), and the deferred
  Docker/AWS follow-up.
- Non-functional: docs claims verified against live state; roadmap journal
  entry written.

## Architecture

Verification layers, cheapest first:

1. **HTTP** — `curl` the site root and one hashed-asset URL extracted from
   `index.html` (proves the artifact was uploaded whole and `base: './'` holds).
2. **Browser** — one live pass (repo has the `ak-agent-browser` capability):
   open the URL, confirm hub home renders, deep-link reload on a subject route,
   cycle the theme toggle, reload to confirm persistence. Falls back to the
   HTTP layer + local `npm run preview` equivalence only if no browser tool is
   available.
3. **Docs** — README section, smallest owning surface for this change; the
   roadmap doc `docs/unified-learning-hub-plan.md` already describes Phase 7
   and is not edited by completion.

## Related Code Files

- Modify: `README.md` (new "CI & deploy" section)
- Create: journal entry under `plans/journals/`
- Reference (read-only): the live Pages URL from phase 2.

## Implementation Steps

1. HTTP verification:
   ```bash
   URL=$(gh api repos/ntttrang/learning-hub/pages --jq .html_url)
   curl -sSf -o /dev/null -w '%{http_code}\n' "$URL"
   # extract one asset href from the served index and fetch it:
   curl -sS "$URL" | grep -o 'assets/[^"]*' | head -1
   curl -sSf -o /dev/null -w '%{http_code}\n' "$URL/$(…)"
   ```
2. Browser verification on the live URL: hub home renders (subjects visible),
   navigate to `#/subject/dp-800` via direct URL entry, cycle the four themes,
   reload — theme choice persists, route holds.
3. README "CI & deploy" section — cover: push/PR runs the gate
   (lint → test → content:check → build — full `npm test`, no `test:ci` slice,
   per the phase-1 reversal), push to `main` publishes Pages at the URL, why
   CI checks out submodules (donors are build inputs), and the deferred
   Docker/AWS follow-up pointer.
4. Verify every doc claim against live state (URL works, commands exist in
   `package.json`, workflow file matches prose).
5. Close out: `ak plan check` each phase file, write the journal entry
   (`plans/journals/2026-MM-DD-phase-7-cicd-deploy-*.md`), commit
   `docs: document hub ci and pages deploy`.

## Todo

- [x] HTTP checks green (root 200, asset 200)
- [x] Browser pass green (home, deep link, themes, persistence)
- [x] README section written and claim-verified
- [x] Phases checked, journal written, committed

## Success Criteria

- [x] Live URL serves the hub; assets resolve under the sub-path.
- [x] Hash deep link renders the target route on a cold load.
- [x] README documents CI + deploy + submodule rationale + deferred Docker/AWS.
- [x] Roadmap done-when fully met: **green CI publishes the unified site on
      push to `main`**, verified live.

## Risk Assessment

- **Private-repo Pages gate resurfaces here** (enabled in phase 2 but plan
  limits hit, or the user deferred the Pro decision): signal — URL 404s while
  runs are green. Response: re-present the Pro-vs-public decision; nothing in
  docs claims a live URL until it actually loads.
- **Asset 404 from an absolute path sneaking in** (some file bypassing
  `base: './'`): signal — the asset check in step 1 fails. Response: fix the
  offending reference; don't rewrite the base strategy.
- **Browser capability unavailable**: fallback is HTTP + `npm run preview`
   local equivalence, and the limitation is stated in the report honestly.
