---
title: "Phase 0 Foundation Shell"
description: "Scaffold the unified Vite hub at repo root: brand, four-mode theme, Zustand storage adapter, rail+topbar shell, hub home and empty subject workspace."
status: completed
priority: P1
effort: 8h
tags: [feature, frontend, critical]
blockedBy: []
blocks: []
created: 2026-08-19
---

# Phase 0 Foundation Shell

## Overview

Build the unified Captain Corgi Learning Hub **at the learning-hub repo root** as a new Vite + React 19 SPA. Reuse `learn-gh-200` as the **stack skeleton** (Vite, hash router, test/lint toolchain). Reuse `learn-dp-800` only for Zustand persist + four-mode theme behavior. Do **not** mutate the donor apps in place. Do **not** port lessons, engines, or SDK.

Done when: hub home and empty subject-workspace routes render; hub-crew mascot + wordmark show in chrome; Auto / Light / Dark / Night persist via `localStorage['cc-theme']` with no `data-theme` in Auto.

## Scope Challenge

- Existing code: three donor apps + mockup + design tokens/assets. No app at hub root today (no `package.json`, no `src/`, no `.git`).
- Requested scope: unified-plan **Phase 0 only**.
- Complexity: ~25 new files, 1 adapter + 1 Zustand store, 3 cook phases.
- Selected mode: **HOLD SCOPE** (no `--yagni`).

## Locked decisions

| Topic | Decision |
| --- | --- |
| App location | New app at **repo root**. `learn-gh-200` / `learn-dp-800` / `learn-gh-600` stay sibling donors. |
| Router | Hash router copied from gh-200 (`base: './'`). No React Router. |
| Routes | `#/` hub home; `#/subject/:subjectId` empty workspace; anything else → home. |
| Theme key | Raw string `localStorage['cc-theme']` = `auto` \| `light` \| `dark` \| `night`. FOUC script in `index.html` sets `data-theme` only for light/dark/night. |
| Theme UI | Design-skill / mockup `.cc-theme-toggle`: fixed bottom-right radiogroup, expand on hover/focus-within. Lucide stroke **1.75** (plan wins over the HTML asset's stroke 2). |
| Store | Zustand persist behind a `StorageAdapter`. Theme also written to `cc-theme` so FOUC never parses Zustand JSON. Store name `cc-hub-store` holds `{ theme }` only in this phase. |
| Placeholder subjects | Hardcoded `PLACEHOLDER_SUBJECTS` in `src/shell/subjects.ts`. Honest "pack not installed" copy. Replaced by Content SDK in unified Phase 1. |
| Hub chrome | Rail (brand + Hub home + My subjects) + topbar crumb only. No fake search, streak, continue banner, Tools group, Architecture, or Extensibility views. |
| Tokens | Copy `colors_and_type.css` **verbatim** to `src/styles/tokens.css`. Also load fonts from `index.html` (gh-200 pattern). |
| A11y | Tokens already ship `:focus-visible`. Add `prefers-reduced-motion` in `app.css` (not in the token file). |

## Cross-Plan Dependencies

None. No unfinished plans in `plans/`. Hub root is not a git repo, so `ak plan use` cannot pin a worktree pointer until git is initialized.

## Phases

| Phase | Name | Status |
| --- | --- | --- |
| 1 | [Scaffold Vite app at hub root](./phase-01-start.md) | Done |
| 2 | [Brand, four-mode theme, Zustand adapter](./phase-02-brand-theme-and-store.md) | Done |
| 3 | [AppShell, routes, HubHome, SubjectWorkspace](./phase-03-appshell-routes-and-views.md) | Done |

## Architecture

```
index.html (FOUC script → cc-theme)
  → src/main.tsx (bootstrapTheme + createRoot)
    → App.tsx (useHashRoute)
      → AppShell (rail + topbar + main)
        → HubHome | SubjectWorkspace
      → ThemeToggle (reads Zustand, writes cc-theme + data-theme)
    → engines/store.ts (Zustand + StorageAdapter)
```

Donor mapping:

| Need | Copy from | Do not copy |
| --- | --- | --- |
| Vite/Vitest/oxlint/React 19 | `learn-gh-200/package.json`, `vite.config.ts`, tsconfigs, `test-setup.ts` | content, views, `useProgress` |
| Theme apply/read tests | `learn-gh-200/src/hooks/useTheme.ts` + tests | 3-mode union, cycle toggle |
| Four-mode + persist middleware | `learn-dp-800/src/lib/store.ts` persist wrapper; `Theme.tsx` apply logic | Next `ThemeScript`, full progress store |
| Visual chrome | `mockups/learning-hub-mockup.html` rail/topbar/home/workspace | stats, ⌘K, streak, arch/extend |
| Tokens + brand files | `.cursor/skills/captain-corgi-hub-design/` | `anchor.svg` (not in Phase 0 contract) |

## Related Code Files

Create under hub root (see phases). Modify none of the donor apps.

## Success Criteria

- [x] `npm test`, `npm run lint`, `npm run build` pass at hub root
- [x] `#/` renders hub home with four placeholder subject cards
- [x] `#/subject/dp-800` (and the other three ids) renders empty workspace
- [x] Rail shows star + wordmark; hub-crew mascot appears on hub home
- [x] Auto/Light/Dark/Night each change surfaces; Auto leaves `data-theme` unset; reload restores `cc-theme`
- [x] Blocked `localStorage` still switches theme for the session

## Out of scope

Unified Phases 1–7: Content SDK, engines, real packs, search, SRS, CI/CD, git init, GitHub Pages workflow, Architecture/Extensibility mockup pages.

## Dependencies

- Node.js able to run Vite 8 / Vitest 4 (same as `learn-gh-200`)
- Brand files listed in phase 02 (PNGs exist on disk even if editor glob ignores them)

## Reports

- [learn-gh-200 shell scout](./reports/scout-gh-200-shell.md)
- [dp-800 store + mockup scout](./reports/scout-dp-800-store-and-mockup.md)
- [tester gate](./reports/tester-260819-phase-0.md) — 42/42 tests, lint/build clean, 9/9 acceptance criteria verified, donors untouched
- [code review](./reports/code-review-260819-phase-0.md) — both plan deviations judged sound; Major M1 (rehydrate self-reference) confirmed by regression test and fixed via persist `merge`; minors m3/m4/m5/n1/n8 applied; m1/m2/m6 open for the lead

<!-- slug: phase-0-foundation-shell -->
