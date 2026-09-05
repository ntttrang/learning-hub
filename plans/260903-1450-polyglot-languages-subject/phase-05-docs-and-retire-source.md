---
phase: 5
title: "Docs + retire source repo"
status: in-progress
priority: P2
effort: "1h"
dependencies: [3, 4]
---

# Phase 5: Docs + retire source repo

## Overview

Update the two evergreen docs surfaces the move touches and archive the source
repo — the outward-facing step the user explicitly chose (archive, 2026-09-03).

## Requirements

- Functional: docs reflect the sixth pack and the archived donor; the archive action is gated on the pack being live on Pages.
- Non-functional: no doc churn beyond the touched surfaces; archive is reversible (unarchive) and done via `gh`.

## Architecture

Documentation impact follows the repo's documentation-management rule: update
the smallest owning surfaces. Two surfaces change: the root `README.md`
(layout table + unified-platform clause), and the pack inventory in
`docs/unified-learning-hub-plan.md`. The vendored donor keeps its own README
inside `learn-polyglot/`.

## Related Code Files

- Modify: `README.md` (finish the Phase 1/2 one-liners: donor row, pack count 5→6, provenance clause)
- Modify: `docs/unified-learning-hub-plan.md` — pack inventory list (five packs → six)
 where it lists installed packs
- Archive: `ntttrang/polyglot-hub` (GitHub repo, via `gh`)

## Implementation Steps

1. README layout table: `learn-polyglot/` donor row (subject "Polyglot Revision Hub donor", run "none — vendored build input").
2. README unified-platform section: pack inventory 5→6 with Languages + provenance ("moved from the donor Polyglot Revision Hub; source repo removed upstream after ship — the vendored copy is the surviving source").
3. `docs/unified-learning-hub-plan.md`: add Languages to the installed-pack inventory; note the donor is vendored.
4. Verify all links/claims against the tree (docs rule: verify after edit).
5. **Production verification (observable retirement gate):** confirm the hub's
   Pages deploy verifiably serves the Languages pack (deploy job success on the
   push-to-main run + `plg-java` content present in the served bundle — done
   2026-09-03, run 33743588207). The personal one-time import fires by itself
   the first time the owner opens the live hub in the browser that holds
   `prh-progress`; no devtools seeding needed.
6. **Retire the source repo — user action, amended to DELETE** (was archive;
   user decision 2026-09-03, after the live verification above passed):
   ```bash
   gh repo delete ntttrang/polyglot-hub --yes   # requires delete_repo scope
   ```
   Deletion is permanent; `learn-polyglot/` at recorded SHA `fa0019e` is the
   only surviving source. With deletion, the old Pages site stops serving
   entirely (unlike the frozen-site behavior of the archive path).
7. Post-retirement note: record the hub deploy SHA that carried the
   verification in the plan journal (db8f094 lineage; live bundle
   `index-BtzM8NcI.js`).


## Success Criteria

- [x] README + unified-plan doc updated, links verified
- [x] Live hub Pages deploy verifiably serves the Languages pack (deploy success, bundle content confirmed)
- [ ] `ntttrang/polyglot-hub` deleted upstream by the user (their explicit action; irreversible)
- [x] Old standalone site no longer presented as a live surface anywhere in hub docs

## Risk Assessment

Risk: retiring the repo before the pack is verifiably live would leave the user
with no working polyglot study surface — and deletion additionally destroys the
only upstream copy of the source. **Mitigations in place:** the live-deploy
verification gate passed first (finding 8's observable-signal fix); the vendored
`learn-polyglot/` copy at recorded SHA `fa0019e` preserves the source verbatim,
and the extractor regenerates the pack from it byte-identically. **Sequence
guard held:** verification passed before any retirement; the deletion itself is
the user's explicitly-stated action.
