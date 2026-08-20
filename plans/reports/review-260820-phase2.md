# Code Review — Phase 2: Routing, subjects, workspace wiring

Date: 2026-08-20 · Plan: `plans/260819-2348-phase-2-shared-ui/` (phase 2)

## Scope

- Files: `src/shell/router.ts`, `src/shell/router.test.ts`, `src/shell/subjects.ts`,
  `src/shell/HubHome.tsx`, `src/shell/AppShell.tsx`, `src/shell/SubjectWorkspace.tsx`,
  `src/shell/SubjectWorkspace.test.tsx`, `src/shell/tool-views.tsx`,
  `src/shell/views.test.tsx`, `src/ui/SubjectOverview.tsx`, `src/styles/views.css`,
  `src/main.tsx`, `src/App.tsx`
- LOC: ~1,160 (new + modified)
- Focus: phase-2 delivery (routing, subject merge, workspace tabs, overview)
- Gates: `npx tsc -b` clean · `npm run lint` (oxlint) clean · `npm run build` green
  (chunk-size/eval warnings come from the Phase-1 markdown deps, `package.json`
  mtime 00:09 predates phase-2 edits) · `npm test` 222/222 in 24 files ·
  `npm run content:check` 3/3

## Overall Assessment

Solid, convention-faithful delivery. All seven phase requirements are implemented
and unit-tested, Phase 0/1 touchpoints are regression-free, and the hard
constraints hold (verified by mtime scan: only the 13 in-scope files changed
after plan creation — nothing under `src/sdk/`, `src/engines/`, `content/`;
user data is read-only; CSS is token-only with no hex; no view imports
`contentSource`). One High finding: the broken-pack error state is effectively
unreachable through the real content source, and one invalid pack silences
*every* installed subject for the session.

## Critical Issues

None.

## High Priority

### H1. Broken-pack handling is dead code against the real source; one bad pack hides all installed subjects

Evidence chain:

- `src/sdk/content-source.ts:467` — `listSubjects: () => [...bySubject.keys()].sort().map((id) => load(id).subject)`.
  Listing performs a **full load + validation of every pack**, all-or-nothing:
  any pack that fails validation makes `listSubjects()` throw.
- `src/shell/subjects.ts:93-102` — `installedCards()` catches that throw and
  caches `[]` in `installedCardsMemo` **permanently for the session**.
- Consequences in the real app (e.g. valid `fixture` + one broken pack):
  home and the rail lose *all* installed cards; `findSubject('fixture')` returns
  `undefined`, so the valid fixture workspace renders "Unknown subject"; the
  broken pack's own workspace renders "Unknown subject" too — never the
  "This pack failed to load" state (`src/shell/SubjectWorkspace.tsx:146-151`).
- That error state is unreachable in production: `loadPack` throws only if
  `loadSubject(id)` throws, but a successful `listSubjects()` already proved
  `load(id)` succeeds for every pack (same deterministic `load` over an eager
  static glob). The catch only fires in tests.
- The comment at `src/shell/subjects.ts:88-90` ("a pack that fails to even list
  simply does not appear here — its workspace owns load errors") misdocuments
  the actual semantics: none appear, and no workspace shows a load error.
- `src/shell/SubjectWorkspace.test.tsx:6-21` mocks `listSubjects` as
  metadata-only (returns without loading), which is not what the real seam does
  at the failure point — the test proves the catch path in isolation while the
  integration failure mode (misleading "Unknown subject" / "not in the hub yet")
  is untested. (The mock approach itself follows phase step 6, so this is a
  plan-level semantics gap, not implementer carelessness.)

Impact: no crash (the "never a crashed app" letter holds), but the phase
requirement "broken pack renders an error state" and the plan's "broken pack
renders an error state in its workspace/home card" fail in spirit, and a single
bad pack bricks the installed-content surface until reload. Will surface as soon
as Phase 3 lands a second pack.

Fix direction (report-only): make the installed listing per-pack
fault-tolerant — iterate pack ids and `loadSubject` each with its own
try/catch (or catch per-item in the aggregator), cache successes only, and add
an integration test with two packs where one is broken. At minimum, correct the
`subjects.ts` comment.

## Medium Priority

### M1. Tablist a11y: focus does not follow arrow-key selection

`src/shell/SubjectWorkspace.tsx:78-85` navigates on ArrowLeft/Right (hash
change → `activeTab` moves → roving `tabIndex` updates at line 131), but
nothing calls `.focus()` on the newly active tab. DOM focus stays on the old
button (React reuses the nodes), so the focus ring and `aria-selected`
disagree — keyboard and screen-reader users hear the old tab while a different
one is selected. Subsequent arrows still work only because keydown bubbles
from the still-focused button. Also missing: `aria-controls`/`id` ↔
`role="tabpanel"` pairing for the bodies, and Home/End key support (APG
recommended). `views.test.tsx:118-125` asserts only the hash, so it passes
despite the gap. Fix: focus the next tab in `onTablistKeyDown` after computing
it (e.g. via ref lookup), and pair tabs with panels when viewers land.

## Low Priority

- **L1. Progress rounding** — `src/ui/SubjectOverview.tsx:12-14`: `Math.round`
  makes 199/200 lessons display "100%" (and `aria-valuenow` 100) while
  incomplete. Prefer `Math.floor` for progress displays.
- **L2. `.status.live` contrast and placement** — `src/styles/views.css:5-8`:
  `--accent-fg` (#FFFFFF) on `--success` (#3BB283) ≈ 2.9:1 in light/dark
  themes, below AA 4.5:1 for 11px text (`--success-fg` is also #FFFFFF in the
  light theme, so the token swap alone doesn't fix light). It also styles a
  home-card chip (shell chrome) while living in views.css, whose header says
  view-level styles — app.css is the natural home.
- **L3. Placeholder mode labels unnormalized** — `src/shell/subjects.ts:68`:
  gh-600 advertises "Study plan", which matches no `TOOL_REGISTRY` label; when
  the pack lands its tabs will differ from the chips. Cosmetic honesty nit.

## Edge Cases Found by Scout

- `#/subject//learn` — `filter(Boolean)` collapses the empty segment, yielding
  `subjectId: 'learn'`; lands in the Unknown-subject state. Safe fallback.
- Hash query strings are not stripped (`#/subject/fixture?x` → Unknown-subject
  state, not blank). Safe fallback; worth a router test if deep links ever
  carry query params.
- Percent-encoded segments are not decoded; unknown ids degrade to the
  Unknown-subject state. Safe.
- `mode: 'overview'` is addressable via URL (`#/subject/fixture/overview`) and
  renders the Overview — harmless quirk of the pseudo-tab id.

## Module-Scope Cache Assessment (requested)

- `installedCardsMemo` (`subjects.ts:91-102`): correct for this phase per the
  plan's pre-decided memoization; the failure-caching half is the H1 issue.
- `packCache`/`packErrors` (`SubjectWorkspace.tsx:26-43`): idempotent under
  StrictMode double-render (cache check precedes the side effect); caching
  errors gives a stable error state on revisit, which is the right call for
  static content. Cross-test hazards are contained: vitest isolates module
  registries per file, so the `SubjectWorkspace.test.tsx` mock cannot leak into
  `views.test.tsx`; within-file persistence is deterministic (real source, no
  mocks). Future hazard to keep in mind: a test that mocks the registry after
  a first render would silently read the memoized list.

## computeStats Slice Extraction (requested)

`src/ui/SubjectOverview.tsx:23-31` is correct: selectors are
reference-stable (`s.subjects[subjectId]`, `s.streak` — no re-render loop),
`??` defaults cover the no-data subject, `labsDone`'s numerator is filtered to
known labs matching the `index.totals.labs` denominator, and `lastLessonId` is
resolved through the index with `slug ?? id`. Trivial nit: the accuracy guard
uses `quizCount > 0` while the value uses summed totals — an attempt with
`total: 0` shows "0%" rather than "—".

## Explicit Checks

- **(a) Phase requirements (7 checkboxes): all implemented and unit-tested.**
  Requirement 6 (broken-pack error state) holds in isolation only — see H1.
- **(b) Phase 0/1 regressions: none.** `AppShell.test.tsx` is untouched and
  green (drawer, crumb, active link, Escape); ThemeToggle untouched and tested;
  placeholder copy preserved ("Pack not installed" ×4, "This pack is not in the
  hub yet"); home fallback and Unknown-subject states tested.
- **(c) Public contracts: preserved.** `HubRoute` extension is additive
  (`mode`/`id`/`rest` optional; `parseHash` output for pre-existing shapes
  unchanged). `SubjectPlaceholder` gained a required `modes` field and
  `findSubject`'s return widened to `SubjectCard` (a superset) — the only
  constructors/consumers are in-repo and updated.
- **(d) Patterns: followed.** Component structure, CSS naming, and test style
  mirror Phase 0/1; `tool-views.tsx` correctly keeps view components out of
  `sdk/registry/tools.ts`.
- **(e) Gates: green** (tsc, oxlint, build, 222 tests, content:check).

## Hard Constraints

- No edits under `src/sdk/`, `src/engines/`, `content/` — verified by mtime
  scan (only the 13 in-scope files modified after plan creation).
- User data read-only — `SubjectOverview` uses store selectors only; no store
  actions are called anywhere new.
- Styling law — `views.css` is token-only (no hex, no Tailwind); inline styles
  only via `accentVar()` and `pct()`.
- Content seam — no view imports `contentSource`; `subjects.ts` and
  `SubjectWorkspace` go through `src/content/registry.ts` only.

## Positive Observations (risk calibration only)

The stub-the-seam test design follows the phase file's own step 6, so H1 is a
planning semantics gap rather than implementer error. Caching pack errors for
stable revisit behavior and the per-file `SubjectWorkspace.test.tsx` isolation
are the right calls.

## Recommended Actions

1. (High) Make the installed-subject listing per-pack fault-tolerant before
   Phase 3 adds a second pack; align the `subjects.ts:88-90` comment; add a
   two-pack integration test with one broken.
2. (Medium) Move DOM focus to the active tab on arrow navigation; add
   tab↔panel pairing when viewers land; consider Home/End keys.
3. (Low) Floor-round `pct()`; fix `.status.live` contrast/placement; normalize
   placeholder mode labels.

## Metrics

- Type Coverage: strict TS, `tsc -b` clean (no coverage script in repo)
- Test Coverage: 24 files / 222 tests green (no numeric coverage configured)
- Linting Issues: 0 (oxlint)

## Unresolved Questions

- Should the rail visually distinguish installed vs placeholder subjects?
  Currently identical pips; not required by the phase.
