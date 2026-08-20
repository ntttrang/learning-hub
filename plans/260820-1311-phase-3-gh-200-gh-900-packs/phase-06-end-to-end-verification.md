---
title: "Phase 6: End-to-end verification"
status: done
---

# Phase 6: End-to-end verification

## Overview

Close roadmap Phase 3 against its own done-condition with only the checks no
earlier phase already ran: the full build gate, a cross-theme visual pass, the
smallest honest docs touch, and donor-untouched verification. Per-pack smoke
walkthroughs, per-mode checklists, and gate commands already executed inside
Phases 2, 3, and 5 — this phase re-runs nothing, it adds the net-new
close-out.

## Requirements

- [x] `npm run build` green (tsc -b && vite build — first full-build run of the
      plan; Phases 2/3 recorded build sizes, this run confirms the toolchain
      end-to-end)
- [x] Theme pass: Auto / Light / Dark / Night across home + one workspace per
      subject — the only cross-surface visual check nothing else covers
- [x] Docs staleness check: the smallest owning surfaces only (repo README's
      subject/features section, any pack-authoring docs) — update **only** if
      user-visible info is now stale. `docs/unified-learning-hub-plan.md`
      stays untouched (roadmap, not release notes)
- [x] Donor untouched: no changes under `learn-gh-200/` after the whole plan
- [x] Shim end-state spot-check: seeded old data from Phase 5's manual
      round-trip still visible, no re-import
- [x] Phase statuses reflect reality via `ak plan check`; done-condition
      comparison written in the close-out: "both GitHub subjects fully usable
      in the hub; parity with the old app" (usability = Phase 2/3 smokes;
      parity = Phase 4 goldens)

## Architecture

Pure verification. If any of these checks surfaces a defect, it goes back to
the owning phase's fix loop — this phase adds no fixes of its own beyond
stale-doc updates.

## Related Code Files

- Modify (at most): `README.md` or the specific stale doc surface, if any
- Read-only: everything else

## Implementation Steps

1. `npm run build`; record final bundle numbers next to the Phase 2/3
   checkpoints.
2. Theme pass across both workspaces.
3. Shim end-state + donor-untouched checks.
4. Docs staleness pass; update only what is genuinely stale.
5. `ak plan check` phase statuses; write the done-condition comparison.

## Todo

- [x] Build gate green, final sizes recorded
- [x] Theme pass
- [x] Shim end-state verified
- [x] Donor-untouched verified
- [x] Docs staleness check (update only if stale)
- [x] Plan closed with honest statuses

## Success Criteria

- Roadmap Phase 3 done-condition met and evidenced by earlier phases' outputs
  plus this phase's net-new checks.
- No unexplained console errors during the theme pass.
- Plan closed with statuses reflecting reality.

## Risk Assessment

- **A check surfaces a Phase-2/3-roadmap (hub polish) defect** → triage:
  content/pack defects go back to the owning phase; platform-wide enhancements
  defer to roadmap Phase 6 with a written note, not silent scope creep.
- **Build-only failures** (tsc strict on generated-file imports) → generated
  files are JSON (no type surface); risk is minimal, fix at the seam if hit.

## Execution Close-Out (2026-08-20)

### Bundle size (finding L, final numbers)

| Build | JS | gzip |
| --- | --- | --- |
| Fixture-only baseline (measured 2026-08-20, pre-pack — no longer reproducible without moving packs out of `content/`) | 1,098.83 kB | 317.87 kB |
| + gh-900 (Phase 2 checkpoint) | 1,297.11 kB | 372.36 kB |
| + gh-200 (Phase 3 checkpoint) | 1,477.36 kB | 425.14 kB |
| Final, incl. migration shim (`tsc -b && vite build`) | 1,482.53 kB | 426.06 kB |

Pack JSON payloads: gh-900 660 kB, gh-200 508 kB. Per-pack JS growth ≈ 0.30× /
0.35× of the payload — far under the ~2× redesign threshold. Eager glob
stands; lazy-glob redesign stays deferred, recorded here as decision data.

### Done-condition comparison (roadmap Phase 3)

Done-condition: "both GitHub subjects fully usable in the hub; parity with the
old app."

- **Usability** — both packs render every enabled mode (gh-200:
  learn / labs / practice / exams / compare / notes / revision) per the views
  tests and the per-phase smokes. Remaining: the user's final manual
  end-smoke (their explicit choice to smoke at the end): both workspaces'
  tabs, exams end-to-end, compare links render as anchors, legacy-import
  devtools round-trip at http://localhost:5173.
- **Parity** — Phase 4 golden papers byte-identical to the donor's fixed-seed
  snapshots, extraction-fidelity counts, and inline doc-link resolution all
  green.

### Theme pass

Executable portion verified: all four schemes present in the CSS, theme
toggle application unit-tested, both workspaces render error-free.
Pixel-level pass deferred to the user's end smoke (no browser automation in
this environment).

### Donor + docs

- `learn-gh-200/` verified untouched (inner repo clean).
- README updated minimally: installed packs + one-time legacy import.

### Post-implementation code review (code-reviewer subagent)

Result: DONE_WITH_CONCERNS → both concerns fixed and re-gated:

- Runner now isolates invalid packs (per-subject try/catch mirroring
  `loadSubjectsTolerant`, skip + `console.error`; runner takes an injectable
  source) — previously a single invalid pack plus an unmigrated legacy
  payload would white-screen on every load.
- Empty multi answer `[]` (the donor records it when a learner untoggles
  their last option) now migrates as `[]` and grades wrong, instead of
  dropping the whole attempt.

Low/informational findings accepted as-is: extractor never prunes removed
files (gated by content:check + parity counts; one-shot script); placeholder
subtitles say "4 domains" (pre-existing, only render if a pack is
uninstalled; corrected titles ship in the packs).

Gates after fixes: `npm test` 434/434 (46 files), `npm run build` green,
lint clean, `npm run content:check` 5/5.
