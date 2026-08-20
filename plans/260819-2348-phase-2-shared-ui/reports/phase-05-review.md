# Phase 5 Review — Learn / Labs / Compare viewers

Date: 2026-08-20. Reviewer: code-reviewer. Scope: the phase-5 change set (5 new viewers + tests, `doc-context.tsx`, `QuizRunner.tsx`, `tool-views.tsx`, `views.css` phase-5 block, `views.test.tsx`). Not a git repo — reviewed by reading current files; no diff baseline.

## Findings

| # | Severity | Location | Issue | Evidence | Suggested resolution |
|---|----------|----------|-------|----------|----------------------|
| 1 | H | `src/ui/QuizRunner.tsx:56,164-171` (also 65-77) | `backHref={null}` produces a dead "Back to practice" button on the knowledge-check finish screen | `back = backHref === undefined ? …/practice : backHref ?? undefined` turns `null` into `undefined`; the finish screen renders `<Button href={back} variant="secondary">Back to practice</Button>`, and `Button` with no `href` renders `<button type="button">` with no `onClick` (`src/ui/Button.tsx:39-49`). Every completed lesson knowledge check shows an inert button (label is also lesson-context-wrong) | Gate the finish-screen and empty-state buttons on `back`: `{back && <Button href={back}…>}`. Existing practice callers pass nothing and keep the default link |
| 2 | M | `src/ui/LessonViewer.tsx:60` + `src/ui/QuizRunner.tsx:58` | Knowledge-check order reshuffles mid-run when the lesson view re-renders | `index.getQuestions(…)` mints a new array each render (map+filter, `content-source.ts:385`); QuizRunner's `useMemo(() => shuffle(bank), [bank, runId])` reshuffles on every new `bank` identity. LessonViewer re-renders on store changes (bookmark toggle, mark-complete, mount-time `visitLesson`), so `questions[position]` can become a different question mid-check. Grading stays id-keyed/correct; the UX swap is the defect | Memoize in LessonViewer: `useMemo(() => index.getQuestions(lesson.questionIds ?? []), [index, lesson])` (lesson ref is stable from the index map) |
| 3 | M | `src/ui/LabViewer.tsx:94-103` + `content/fixture/labs.json` | Lab prerequisites render raw internal lesson ids as prose | Fixture carries `prerequisites: ["lesson-storage-models"]`; the viewer bullet-lists the string verbatim, so the learner sees "lesson-storage-models". `LabStep`/`Lab` types don't document whether the field is free text or lesson refs; viewer has `index` available but doesn't resolve | Decide the contract: either prerequisites are display strings (fix fixture content), or lesson refs (resolve to lesson title/link via `index.getLesson`). Add a test for whichever is chosen |
| 4 | L | `src/ui/LessonViewer.tsx:121-137` | References section can render with a heading and no content | Gate is `(lesson.references \|\| lesson.docIds)`; references are then filtered by `isExternalUrl` and `DocLinkChips` returns null when docIds don't resolve — all-non-http urls + unresolvable docIds leaves an empty "References" header. Same failure class the plan's risk section forbids for lab sections | Compute the filtered reference list first and gate the section on `filteredList.length > 0 \|\| resolvable docIds` |
| 5 | L | `src/ui/Compare.tsx:131-147` | Sample tabs use `role="tab"` without the tabs keyboard pattern | `role="tablist"`/`role="tab"` + `aria-selected` but no arrow-key handling and no `aria-controls`/tabpanel. `SubjectWorkspace.tsx:79-90` implements the full ARIA pattern, so the precedent exists in-repo | Either implement arrow-key + tabpanel semantics or downgrade to `aria-pressed` toggle buttons (still keyboard-reachable) |
| 6 | L | `src/ui/LessonViewer.tsx:68`, `LabViewer.tsx:65`, `Compare.tsx:48` | `.lesson-head` class has no styles anywhere | No `.lesson-head` rule in `views.css`/`app.css`/`theme-toggle.css` (grep-verified). Harmless — spacing comes from the parent flex gap — but it's a dead class name | Style it or drop it |
| 7 | N | `src/ui/LessonViewer.test.tsx:65-75` | JSON-lesson test doesn't assert the `md` and `list` block renderings | Asserts heading/tip/table/code; the `md` body ("Almost every reporting query…") and the ordered list items aren't pinned. Plan step 6 only required table/code/tip, so criterion met, coverage thinner than the block set | Add two text assertions |
| 8 | N | `src/ui/LessonViewer.tsx:110-117` | Knowledge-check `scope` value (`moduleId ?? 'review'`) is implemented but never asserted | Tests confirm mount and question count; no test inspects the recorded `QuizAttempt.scope` for a lesson run | Assert scope in one store-level test |
| 9 | N | `src/sdk/validate.ts` (comparison graph checks) | No validator check that `samples[].code` keys / row `cells` keys reference declared column ids | `Compare` degrades gracefully (missing cells → '—', unknown sample keys → no tabs), so this is content-tooling hardening, not a UI bug | Optional: extend `validateSubject` |

## Gates (run 2026-08-20)

| Gate | Result |
|------|--------|
| `npm run lint` (oxlint) | clean, 0 issues |
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | succeeds; warnings are pre-existing third-party (gray-matter eval, chunk-size) |
| `npm test` | 35 files / 339 tests passed |
| `npm run content:check` | 3/3 passed |

## Explicit checks

- (a) Acceptance criteria: all met and test-covered — mdx lesson via block registry (LessonViewer.test "mdx lesson end to end"), JSON lesson block kinds (finding 7 note), knowledge check mounts with the required props (finding 8 note), bookmark aria-pressed + persistence, complete/in-progress toggle, prev/next walk, lab rich/plain with only-present sections (plain-lab test asserts absent headers), hint/solution reveals, completeLab, compare 3-column table + sample tabs + migration cards + picker + empty states, tool-views wiring, learn→lab→lesson round-trip (views.test.tsx:162-192). Navigation dead-ends: none found — every rendered hash href targets a resolvable route; unknown lesson/lab ids fall back to honest EmptyStates with back links.
- (b) Regressions: `backHref` is additive (`string | null | undefined`); practice callers pass nothing and `views.test.tsx:151` still asserts '← All scopes' → default preserved (finding 1 is the unfinished edge of the new contract, not a regression for old callers). Store-selector stability: grep-verified every `useSubjectDataStore((s) => …)` selector in src returns a stable reference (whole subject slice, stored array via `?.completedLabs`, or store action). The only `?? []` arrays are derived values computed after selection (e.g. `LessonViewer.tsx:59`), which cannot loop `useSyncExternalStore`. No other instance anywhere in src.
- (c) Public contracts: `QuizRunnerProps.backHref?: string | null` is the only change — additive and called out. `TOOL_VIEWS` gained learn/labs/compare wiring; exams/notes/revision remain placeholders by design. No schema or store-shape changes.
- (d) Patterns: EmptyState for all empty collections (lessons, labs, comparisons, unknown ids), Pill for meta, CodeBlock for all code, hash hrefs `#/subject/:id/:mode/:item` everywhere, no per-subject branches, UI components import only types from content modules (`import type`), no runtime content imports.
- (f) HTML validity: no nested anchors — LabIndex cards are divs with a title link (comment documents why); LearnIndex rows/continue-card/lab-card are single anchors whose children are span/Pill/svg only; Compare picker anchors wrap h3/div/p (HTML5-legal flow content). No `<div>` inside `<p>`: prose containers are `md-prose` divs; objective/hint/engines `<p>`s hold plain strings. `cmp-table` and `DataTable` both set `th scope="col"`/`scope="row"` sensibly.
- (g) Single href policy: every external anchor path filters through `isExternalUrl` — LessonViewer references (filter before map), DocLinkChips, QuizRunner docLinks, Markdown link component, InlineText. All remaining hrefs are hash routes. Verified by reading each anchor site.
- (h) Styling law: phase-5 block (views.css:871-1476) uses only `var(--…)` tokens (all referenced tokens exist in tokens.css), zero hex colors, zero font-family declarations, zero animations/transitions needing reduced-motion guards (only `:hover`/`:focus-visible`). `continue-card`/`practice-card` classes are reused from earlier phases, not duplicated.

## Phase risk assessment

- LessonViewer genericity: held. The file contains only breadcrumb, chips, block stream (`renderBlock`), lab card, knowledge check, references, footer actions — no dp-800 section names, no fixed 18-section layout leakage. Richness correctly deferred to registered block kinds.
- Lab field optionality: held. Every section is field-gated and the plain-lab test asserts the absent headers; `migration` cards are safe because the Zod schema (`validate.ts:296-306`) requires all six strings.

## Contract-change assessment

`backHref?: string | null` on QuizRunner is acceptable and additive; old behavior (default practice href) is bit-identical for callers that omit it. The `null` branch is correctly hidden in the quiz header but incompletely handled on the finish screen (finding 1) — finish the contract before calling the change done.

## Verdict

DONE_WITH_CONCERNS — ship-blocking nothing, but fix finding 1 (dead button on every completed knowledge check) and finding 2 (mid-run reshuffle) before Phase 6 builds on QuizRunner-in-lesson. Findings 3-6 are quick polish; 7-9 optional.

---

## Controller resolution (2026-08-20, post tester + review)

| # | Finding | Resolution |
|---|---------|------------|
| 1 | H — dead "Back to practice" button when `backHref={null}` | **Fixed**: both finish-screen and empty-state back buttons gated on `back`; regression assertion added (embedded check finish shows no back button, keeps "Practice again"). Practice-side link covered by the existing QuizRunner test. |
| 2 | M — knowledge check reshuffles mid-run | **Fixed**: LessonViewer memoizes `index.getQuestions(...)` (`useMemo([index, lesson])`); regression test flips the shuffle seed after mount and asserts the question stays put across a bookmark toggle. |
| 3 | M — prerequisites render raw internal ids | **Fixed without schema change**: prereqs that resolve to lesson ids render titled lesson links; free text stays plain text. Both paths tested. |
| 4 | L — empty References header | **Fixed by tester** during verification (`resolvableDocLinks` helper; section gates on surviving links; failing-then-passing test). |
| 5 | L — compare tabs lack ARIA keyboard pattern | **Fixed**: ArrowLeft/ArrowRight move selection with DOM focus (wrapping); test asserts focus + aria-selected + code switch. |
| 6 | L — `.lesson-head` has no CSS | **Accepted as-is**: semantic grouping hook for the three viewers' headers; harmless. |
| 7 | N — coverage gaps | Closed by tester (scope-recording run, md/list block assertions, orphan lessons, link-integrity sweep). |
| 8 | N — no validator check for sample/cell column keys | **Deferred** to the schema-freeze backlog; UI degrades gracefully ('—' cells, absent tabs). |

Final gates after fixes: 346/346 tests, oxlint clean, tsc+build clean
(known chunk warning), content:check 3/3.
