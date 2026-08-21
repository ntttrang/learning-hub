---
title: "Phase 1: Land Topbar + Search Baseline"
status: todo
priority: P1
effort: 2h
dependencies: []
---

# Phase 1: Land Topbar + Search Baseline

## Overview

The working tree already contains a complete, tested implementation of Phase 6's
global ⌘K search plus the topbar redesign it ships in. This phase verifies that
work against the full suite, themes, a11y, and narrow viewports — then lands it
as the committed baseline the rest of Phase 6 builds on.

## Context

Uncommitted files in the tree (all authored before this plan; do not rewrite
working code):

- `src/engines/search.ts` + `search.test.ts` — pure ranked matcher
  (`SearchEntry[]` + query → capped, kind-ranked results; tokens AND-ed).
- `src/shell/search-entries.ts` + `.test.ts` — maps subject cards (installed
  packs **and** roadmap placeholders) + lessons + labs to `SearchEntry`s with
  hash routes.
- `src/shell/TopbarSearch.tsx` + `.test.tsx` — combobox UI: ⌘K/Ctrl+K global
  focus, ↑↓ Enter Esc keyboard nav, aria combobox/listbox pattern,
  pointer-outside close, subject-code badges.
- `src/shell/AppShell.tsx` + `.test.tsx` — topbar now holds search + streak
  chip (`useSubjectDataStore` streak, `role="status"`) + ThemeToggle + local
  profile chip; fixed theme toggle removed.
- `src/styles/app.css` (+180 lines: searchbox/pop, topbar-actions, streak chip),
  `src/styles/theme-toggle.css` (topbar-group restyle).
- `mockups/learning-hub-mockup.html` — design reference updated to match.

Focused run of the four touched test files: **26/26 passing**.

## Requirements

- [x] The four touched test files pass (already verified: 26/26).
- [x] Full `npm test`, `npm run lint`, `npm run build` pass with the tree applied.
- [x] Manual pass: ⌘K focus → type → ↑↓ → Enter navigates; Esc closes; click
      outside closes; searching a placeholder subject code (e.g. an uninstalled
      pack) resolves to its workspace route.
- [x] Search + streak chip + theme group render correctly in Auto / Light /
      Dark / Night and below 900px (drawer intact, search does not overflow).
- [x] Changes committed with a conventional message, no plan/phase identifiers
      in code or commit text.

## Implementation Steps

1. Run the broadened gates over the tree: `npm test`, `npm run lint`,
   `npm run build`.
2. Manual verification pass (dev server) against the requirements above,
   including `prefers-color-scheme` Auto behavior and keyboard-only navigation.
3. Fix only real gaps found in 1–2 (style collisions in `app.css` are the most
   likely; keep fixes scoped to the search/topbar surfaces).
4. Commit the six-file set as one focused commit, e.g.
   `feat(hub): add global ⌘K search and topbar redesign with streak chip`.

## Todo

- [x] Broadened gates green (`test`, `lint`, `build`)
- [x] Manual a11y + theme + mobile pass
- [x] Gap fixes (if any)
- [x] Commit landed

## Success Criteria

- Working tree is clean of Phase 6 search work (committed on `main`); the hub
  has working global search over every pack + placeholder; no theme, router, or
  shell regressions vs the committed test suite.

## Risk Assessment

- **Risk:** the in-flight CSS conflicts with existing component styles at
  unusual widths. *Signal:* visual breakage below 900px or in Night theme.
  *Response:* scoped fix in this phase; do not redesign.
- **Risk:** hidden dependency between the new AppShell profile chip copy
  ("Trang") and tests. *Signal:* AppShell test failures around profile chip.
  *Response:* keep the existing chip; it shipped with passing tests.
