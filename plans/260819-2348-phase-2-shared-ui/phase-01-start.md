---
title: "Phase 1: Start"
status: done
---

# Phase 1: Start

## Overview

Land the two new dependencies this plan needs, spike the three technical
unknowns (react-markdown v10, highlight.js theming through brand tokens,
registry renderer-signature extension), lock the route shape, and baseline the
gates before any viewer code exists.

## Requirements

- [x] `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js` installed and building.
- [x] Spike proves: GFM markdown + fenced code highlighting renders under Vitest/jsdom.
- [x] Spike proves: custom link component can resolve `[label](docId)` against a docs registry.
- [x] Spike proves: adding `revealed?: boolean` to question renderer signatures compiles without touching graders.
- [x] Route shape for `#/subject/:id/:mode/…` written down (table below) and agreed with Phase 2.
- [x] All gates green before Phase 2 starts.

## Architecture

Route shapes Phase 2 implements (hash router, home fallback preserved):

| Route | Renders |
|---|---|
| `#/` | Hub home |
| `#/subject/:subjectId` | Workspace overview (stats + continue) |
| `#/subject/:subjectId/learn` | Learn index (domains → modules → lessons) |
| `#/subject/:subjectId/learn/:slugOrId` | Lesson viewer |
| `#/subject/:subjectId/labs` / `…/labs/:labId` | Lab index / lab viewer |
| `#/subject/:subjectId/practice` / `…/practice/:scopeId` | Practice index / quiz run |
| `#/subject/:subjectId/exams` / `…/exams/:examId/run` / `…/exams/:examId/review/:attemptIndex` | Exam index / sitting / review |
| `#/subject/:subjectId/compare` | Compare view |
| `#/subject/:subjectId/notes` | Notes + bookmarks |

Unknown subject → workspace "Unknown subject" state; unknown/disabled mode →
overview state; never a blank page.

## Related Code Files

- Modify: `package.json`, `package-lock.json` (deps only — no source edits this phase)
- Create: throwaway spike under `src/ui/` only if it becomes the real `Markdown.tsx` in Phase 3; otherwise delete before commit

## Implementation Steps

1. Run the full baseline: `npm test && npm run lint && npm run build && npm run content:check` — all green.
2. `npm install react-markdown remark-gfm rehype-highlight highlight.js` (current majors; dp-800 pins `react-markdown@^9` — verify v10's prop/plugin surface still matches `remarkPlugins`/`rehypePlugins`/`components`, else pin `^9`).
3. Spike A (markdown): render a fixture-shaped string (h2, bold, list, fenced ```sql block, `[label](docId)` link) with `remarkGfm` + `rehypeHighlight` and a custom `a` component; assert output in a scratch Vitest file; confirm jsdom handles the highlight spans.
4. Spike B (theming): check which hljs classes land on tokens; sketch the token→CSS-var mapping (`.hljs-keyword` → `var(--code-fg)` accents) to apply in Phase 3's `views.css`; no imported hljs theme file — style through tokens so all four themes work.
5. Spike C (signature): add `revealed?: boolean` as a 5th parameter to one core question renderer's props flow; run `npx tsc -b` + engine/registry tests; revert or keep behind the Phase 4 work.
6. Record the route table above into Phase 2's execution (already embedded in this file).

## Todo

- [x] Baseline gates green (test/lint/build/content:check)
- [x] Dependencies installed; build still green
- [x] Spike A: markdown + GFM + highlight + docId link rendering proven in Vitest
- [x] Spike B: hljs token → brand-var mapping approach decided
- [x] Spike C: `revealed` renderer param compiles; graders untouched
- [x] Route shape table confirmed for Phase 2

## Success Criteria

- Dependencies installed; `npm run build` green with the new imports tree-shaken into the bundle.
- Spikes A–C each proven by a passing scratch test or a documented tsc check.
- No source-file changes survive this phase except `package.json`/lockfile.

## Risk Assessment

**Risk:** react-markdown v10 changed the `components` prop typing (v9→v10 tightened
`ExtraProps`), breaking the docId-link customization. **Signal:** spike A fails to
type-check or the custom `a` never receives href. **Response:** pin
`react-markdown@^9` (dp-800-proven) — pre-decided fallback; everything else in the
plan is version-agnostic. Rollback: `npm uninstall` the four packages; no other
files touched.
