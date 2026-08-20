# Tester report — Phase 2: Routing, subjects, workspace wiring

Date: 2026-08-20 · Plan: `plans/260819-2348-phase-2-shared-ui/phase-02-routing-subjects-workspace-wiring.md`

## Gates

| Gate | Result | Detail |
|---|---|---|
| `npm test` | PASS (exit 0) | 24 files, **226/226** tests (222 before; +4 added by this review) |
| `npm run lint` (oxlint) | PASS (exit 0) | 0 diagnostics |
| `npm run build` (`tsc -b && vite build`) | PASS (exit 0) | Pre-existing warnings only (see below) |
| `npm run content:check` | PASS (exit 0) | 3/3 tests |

Pre-existing, non-blocking build warnings (dependency/bundle level, not from this phase):
- `node_modules/gray-matter/lib/engines.js` direct `eval` (rolldown warning).
- `js-yaml` "buffer" externalized for browser compatibility.
- Chunk >500 kB after minification (highlight.js/react-markdown weight).

## Coverage vs the 7 acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `parseHash` mode/id/rest + fallbacks, never blanks | Covered (pre-existing) | `src/shell/router.test.ts` — empty/`#`/`#/`, subject-only, `#/subject/:id/:mode/:id/:rest`, trailing slashes, unknown mode parsed permissively, unknown path → home; `views.test.tsx` unknown-hash → home render |
| 2 | subjects.ts merges installed over placeholders by id; installed win | **Gap → fixed** | Fixture id `fixture` matches no placeholder id, so the same-id override branch had no test. Added 2 tests in `src/shell/SubjectWorkspace.test.tsx` (`subject list merge` describe): installed `dp-800` replaces placeholder (1 card, `installed: true`, pack copy + `enabledModes` win) and remaining placeholders stay uninstalled with empty `enabledModes` |
| 3 | Home + rail merged list; "Installed" + real mode chips; "Pack not installed" | Covered (+ strengthened) | `views.test.tsx` honesty test (`Installed` ×1, `Pack not installed` ×4), rail+card links ×2 each; real registry-label chips now asserted via merge test (`modes` = `['Learn','Labs']` from `TOOL_REGISTRY`) |
| 4 | Tabs = Overview + TOOL_LIST ∩ enabledModes, registry order; navigate `#/subject/:id/:mode` | Covered (pre-existing) | `views.test.tsx` — exact tab order `['Overview','Learn','Labs','Practice','Exams','Compare']`, none disabled, click → hash `#/subject/fixture/learn`, arrow keys → `labs`, uninstalled → `['Overview']` |
| 5 | Per-tool placeholders + Overview (computeStats + streak + continue) | **Gap → fixed** | Placeholder views + stats/domains were covered (`Learn is on its way`, overview region). Streak + continue link had no test. Added test in `views.test.tsx`: seeds `cc-subject-data` (streak 3, `lastLessonId: 'lesson-query-shapes'`), rehydrates store, asserts streak stat shows 3 and continue link href `#/subject/fixture/learn/query-shapes` |
| 6 | Broken pack → error state, not crash | Covered (pre-existing) | `src/shell/SubjectWorkspace.test.tsx` — stubbed `loadSubjectWithIndex` throw renders "This pack failed to load" with the validation message |
| 7 | Unknown subject + unknown/disabled-mode fallback | **Partial gap → fixed** | Unknown subject + unknown mode were covered. Disabled mode (valid `ToolId` not in `enabledModes`) was not — added test: `#/subject/fixture/notes` renders overview, Overview tab selected, no Notes tab |

## Tests added (test files only; no source changes)

- `src/shell/SubjectWorkspace.test.tsx`
  - mock's `listSubjects` gained a healthy `dp-800` pack (existing broken-pack mock + assertions untouched)
  - `subject list merge > lets an installed pack override the same-id placeholder — installed wins`
  - `subject list merge > keeps the remaining placeholders honest and uninstalled`
- `src/shell/views.test.tsx`
  - `falls back to the overview for a valid tool the pack has not enabled`
  - `shows the streak and a continue link from the last visited lesson` (seeds localStorage `cc-subject-data`, `await useSubjectDataStore.persist.rehydrate()`, restores store state in `finally` — no leakage into other tests)

## Notes

- Plan called for `src/ui/SubjectOverview.tsx` — present and wired via `SubjectWorkspace` (overview pseudo-tab `overview`, not a tool id). Tab derivation matches the architecture note: `TOOL_LIST ∩ enabledModes`, component map in `shell/tool-views.tsx`, SDK stays React-free.
- `subjects.ts` and `SubjectWorkspace` memoize/cache at module scope (per plan's risk response). Test-side implication: `installedCardsMemo`/`packCache` freeze on first use per test file — the merge tests use a static mock so this is deterministic.
- Registry-order proof (criterion 4) is only as strong as the fixture's `enabledModes`, which is already registry-ordered; a pack with shuffled `enabledModes` would prove filtering order more sharply, but that needs fixture content changes (out of tester scope, no source/content edits allowed).

## Unresolved questions

- None blocking. Optional follow-up (needs content/fixture change, owner decision): add a pack with non-registry-ordered `enabledModes` to pin tab-order filtering.
