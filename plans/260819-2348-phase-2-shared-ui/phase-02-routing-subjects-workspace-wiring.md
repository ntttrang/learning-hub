---
title: "Phase 2: Routing, subjects, workspace wiring"
status: done
---

# Phase 2: Routing, subjects, workspace wiring

## Overview

Make the shell real: extend the hash router with per-subject mode routes, merge
installed packs over the placeholder subject list, and turn `SubjectWorkspace`
from inert chrome into a live tabbed workspace whose tabs come from
`enabledModes` + the tool registry. Tool bodies stay placeholder `EmptyState`s
until Phases 3–7 fill them.

## Requirements

- [x] `parseHash` supports `#/subject/:subjectId/:mode[/:id[/…rest]]` per the Phase 1 route table; bad input falls back (home / overview), never blanks.
- [x] `shell/subjects.ts` aggregates real packs (`contentSource.listSubjects()`) over `PLACEHOLDER_SUBJECTS` by id; installed packs win.
- [x] Hub home and rail render the merged list: installed cards say "Installed" with real mode chips; placeholders keep "Pack not installed".
- [x] Workspace tabs = Overview + `TOOL_LIST ∩ subject.enabledModes` (labels/order from the registry); tabs navigate `#/subject/:id/:mode`.
- [x] Workspace body renders a per-tool placeholder view (Phase 3+ replaces) and an Overview panel with `computeStats` + streak + "continue" link to `lastLessonId`.
- [x] Loading a broken pack renders an error state (`ContentValidationError` caught), not a crashed app.
- [x] Unknown subject state and unknown/disabled-mode fallback preserved and tested.

## Architecture

Data flow: `App` parses the route → `SubjectWorkspace` loads the pack once via
`loadSubjectWithIndex(subjectId)` wrapped in try/catch → tabs derive from
`subject.enabledModes` against `TOOL_LIST` → the selected mode renders its view
component with `{ content, index, subjectId, route }` props. Views receive the
loaded `SubjectContent` + `SubjectIndex` — they never touch `contentSource`
directly (the `src/content/registry.ts` seam stays the only content module).

The tool **component** attachment follows Phase 1's design: extend `ToolMeta`
wiring lives in a shell-side map (`mode → view component`), not in
`sdk/registry/tools.ts` (which stays metadata-only, no React imports in `sdk/`…
note `sdk/registry/*.tsx` already holds renderers, so the map may live in
`shell/tool-views.tsx` to keep the SDK free of app-level view dependencies).

## Related Code Files

- Modify: `src/shell/router.ts` (+ `router.test.ts`), `src/shell/subjects.ts`,
  `src/shell/HubHome.tsx`, `src/shell/SubjectWorkspace.tsx`,
  `src/shell/AppShell.tsx` (rail subject list), `src/App.tsx` (pass mode/id),
  `src/shell/views.test.tsx`
- Create: `src/shell/tool-views.tsx` (mode → view map with placeholders),
  `src/ui/SubjectOverview.tsx`
- No edits under `src/sdk/`, `src/engines/`, `content/`

## Implementation Steps

1. Extend `HubRoute`: `{ view: 'subject'; subjectId: string; mode?: string; id?: string; rest?: string[] }`; update `parseHash` + tests (valid/unknown modes, deep exam rest segments, trailing slashes).
2. Rework `subjects.ts`: keep `PLACEHOLDER_SUBJECTS` as the "coming" list; add `listSubjectCards()` returning `{ meta, installed }` where installed packs override by id; `findSubject` returns the merged shape. Keep `accentVar`.
3. `HubHome` + `AppShell` rail: render merged list (installed first); installed card foot shows `status live`-style chip and real mode labels from `TOOL_REGISTRY`; dynamic count hint.
4. `SubjectWorkspace`: load content (try/catch → error `EmptyState` naming the pack), render tabs (`role="tablist"`, `aria-selected`, keyboard arrow support), active tab from route mode, body from `tool-views.tsx` map; disabled/unknown mode → overview.
5. `SubjectOverview`: `computeStats(content, useSubjectDataStore slice)` → overall progress, domain completion rows, quiz accuracy, labs done, streak; "Continue" link when `lastLessonId` resolves through the index.
6. Update `views.test.tsx`: fixture card visible + linked; workspace tabs enabled for fixture modes; placeholder subjects still honest; unknown mode falls back; broken-pack error state (inject via a temp bad fixture is overkill — cover the catch path with a stubbed `loadSubject` throw in a unit test of the workspace).

## Todo

- [x] Router extension + tests (mode/id/rest parsing, fallbacks)
- [x] subjects.ts aggregator (merge installed over placeholders)
- [x] HubHome + AppShell rail render merged list
- [x] SubjectWorkspace: tabs from enabledModes, error state, tool-view map with placeholders
- [x] SubjectOverview (stats + streak + continue)
- [x] views.test.tsx / AppShell.test.tsx updated and green

## Success Criteria

- Navigating every route in the Phase 1 table renders the right frame with zero blank states; back/forward works.
- Home shows the fixture as installed alongside honest placeholders.
- Tabs are registry-driven: adding a mode to a pack's `enabledModes` (with content) shows the tab with zero shell edits beyond the view map.
- `npm test && npm run lint && npm run build` green.

## Risk Assessment

**Risk:** `contentSource.listSubjects()` loads+validates every pack eagerly on
each home render (fixture is tiny; later packs are not). **Signal:** perceptible
home render cost once real packs land (Phase 3+). **Response:** memoize the
merged list at module scope for this phase; revisit lazy `loadSubject` per
workspace when a real pack exists — pre-decided, not built now (YAGNI).
**Risk:** `views.test.tsx` assertions break en masse (they pin placeholder
copy). **Response:** update them in the same commit — they are Phase 0's
honesty tests and must keep asserting the same honesty for placeholders.
