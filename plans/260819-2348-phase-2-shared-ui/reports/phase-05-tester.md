# Phase 5 tester report — learn / labs / compare viewers

Date: 2026-08-20. Verifier: tester agent. Scope: phase-05 acceptance criteria,
real gates, adversarial probes, regression tests for gaps.

## Gates

| Gate | Command | Result |
|---|---|---|
| Tests | `npm test` | PASS — 35 files, 344/344 (was 339; +5 new) |
| Lint | `npm run lint` (oxlint src) | PASS — no findings |
| Build | `npm run build` (tsc -b && vite build) | PASS — 187ms; known >500kB chunk warning + hljs direct-eval note only |
| Content | `npm run content:check` | PASS — 3/3 |

## Criteria coverage

1. mdx lesson through block pipeline — covered (LessonViewer t1: `Why it matters`
   heading + body from `storage-models.mdx`).
2. JSON block kinds — covered, extended: heading/md/list/code/tip/table all
   asserted (list item text + `GROUP BY city` aggregate assert added).
3. Knowledge check in lesson — covered for mount (`Question 1 of 3` / `1 of 1`);
   scope recording was NOT covered → new test: finishing the check records one
   attempt with `scope: 'm-storage'` (the module), total/correct/questionResults
   verified, and no `← All scopes` back-link renders (embedded, not practice).
4. Bookmark + completion persist — covered (aria-pressed flip + store asserts,
   un-complete path). Passes.
5. Labs — hint/solution reveal, completeLab, plain-lab no-empty-headers all
   covered (LabViewer t2–t4). Passes.
6. Compare — 3 columns, tab switch, `—` missing cells, migration cards, picker
   >1, honest empty state covered (Compare t1–t4). Passes.
7. Navigation round-trip — App-level round trip covered (views.test); criterion
   "every rendered link resolvable" was only spot-checked → new link-integrity
   test: harvests every `#/subject/fixture/…` anchor from LearnIndex, LabIndex,
   Compare, both LessonViewers, LabViewer; parses each via `parseHash`; asserts
   mode ∈ enabledModes and item id resolves in the right index map. 12 anchors /
   6 distinct routes, zero dead ends.
8. Gates green — see table.

Extra probes: LearnIndex orphan lessons (no moduleId) render under their domain
with id-based href, and a domain with no modules/lessons renders nothing — new
test. LearnIndex honest empty state — new test. CSS audit: all phase-5 classes
styled in views.css (`.cmp-picker` wrapper intentionally reuses practice-grid
styles); reduced-motion lives globally in app.css; theme via var() tokens.

## Bugs found and fixed

- **Empty References header when the single-href policy filters everything**
  (src/ui/LessonViewer.tsx). Evidence: lesson with only a `javascript:` ref
  (and/or unresolvable docIds) rendered `<h3>References</h3>` over an empty list
  — failing test `drops the References section when the single-href policy
  filters everything out`. Same defect class the phase bans for plain labs
  ("visibly empty headers"). Fix: extract `resolvableDocLinks(docIds, resolveDoc)`
  in src/ui/doc-context.tsx (DRY — DocLinkChips uses it too), gate the section on
  `externalRefs.length > 0 || resolvableDocs.length > 0`, gate the `<ul>` on
  externalRefs. All consumers (InlineText, QuizRunner, Markdown, primitives)
  re-run green.

## Bugs deferred (with reason)

- Compare sample tabs have no arrow-key roving tabindex (ARIA tab pattern).
  Tabs are native buttons (keyboard-activatable); phase text requires "tabbed
  samples keyed by column label" only. Deferring as polish; the shell tablist
  does implement arrow keys.
- Orphan lessons (no moduleId) are excluded from `lessonSequence()`, so prev/next
  skips them. Consistent with the domain→module→lesson sequence design; noting
  as behavior, not fixing.
- Lab `prerequisites` render as plain text (they carry lesson ids). Schema keeps
  them strings; phase lists prerequisites as a rendered field only.

## Tests added (5)

- src/ui/LessonViewer.test.tsx — knowledge-check scope recording; References
  section dropped when policy filters everything.
- src/ui/LearnIndex.test.tsx — orphan lessons + empty-domain skip; honest empty
  state.
- src/shell/views.test.tsx — cross-view link-integrity test (no dead ends).

## Unresolved questions

- None blocking. Should compare tabs adopt roving tabindex when an a11y pass
  lands? (Deferred above.)
