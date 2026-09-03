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
2. README unified-platform section: pack inventory 5→6 with Languages + provenance ("moved from the donor Polyglot Revision Hub; source repo archived 2026-09").
3. `docs/unified-learning-hub-plan.md`: add Languages to the installed-pack inventory; note the donor is vendored + archived.
4. Verify all links/claims against the tree (docs rule: verify after edit).
5. **Production import smoke (observable archive gate):** on the live
   <https://ntttrang.github.io/learning-hub/> site, seed `prh-progress` in
   devtools, reload, confirm the import fires once (learn progress + lab
   completions appear, `cc-polyglot-progress-migrated` appears, the donor key
   survives), then clear the seeded keys.
6. **Archive the source repo** — only after the Phase 3 Pages verification
   and the step-5 import smoke both passed:
   ```bash
   gh repo edit ntttrang/polyglot-hub --archive
   ```
7. Post-archive note (finding 8): the old standalone site stays publicly
   reachable, frozen, with no visitor-facing notice — expected archived-repo
   Pages behavior, not a failure signal; record the hub deploy SHA that
   carried the verification in the plan journal.


## Success Criteria

- [ ] README + unified-plan doc updated, links verified
- [ ] Production import smoke passed on the live hub site before archiving
- [ ] `ntttrang/polyglot-hub` archived via gh after the hub's Pages deploy verifiably serves the Languages pack
- [ ] Old standalone site no longer presented as a live surface anywhere in hub docs

## Risk Assessment

Risk: archiving before the pack is verifiably live would leave the user with no
working polyglot study surface — and the old site can't serve as a signal
because archived repos' Pages sites stay live frozen with no notice (finding 8).
**Signal:** Phase 3's Pages verification or the step-5 import smoke failed or
was skipped. **Sequence guard:** archive only after both passed; if either
can't be confirmed, do not archive — report and wait for the user.
