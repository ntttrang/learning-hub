---
phase: 3
title: "AppShell, routes, HubHome, SubjectWorkspace"
status: todo
priority: P1
effort: 3h
dependencies: [2]
---

# Phase 3: AppShell, routes, HubHome, SubjectWorkspace

## Overview

Replace gh-200's topbar shell with the mockup's **rail + topbar**. Wire hash routes for hub home and an empty subject workspace. Chrome shows star + wordmark + hub-crew mascot. No content engines.

## Context Links

- Visual spec: `mockups/learning-hub-mockup.html` `.app` / `.rail` / `.topbar` / `#v-home` / `#v-subject`
- Hash pattern: `learn-gh-200/src/router.ts`, tests in `router.test.ts`
- Empty-state pattern: `learn-gh-200/src/components/ui/EmptyState.tsx`
- Target dirs: `docs/unified-learning-hub-plan.md` §4 (`src/shell/`)

## Key Insights

- Mockup Architecture / Extensibility / stats / ⌘K / streak / Tools / fake % are **not** in Phase 0 done-when. Shipping them is scope creep.
- `PLACEHOLDER_SUBJECTS` is a temporary constant, not the Content SDK. Comment `// removed in unified Phase 1`.
- gh-200 `Section` union is subject-mode (`learn|lab|…`). Hub routes are `home | subject`. Do not keep the old union.

## Requirements

- Functional: `#/` HubHome; `#/subject/:subjectId` SubjectWorkspace; unknown hash → home.
- Functional: rail brand = `brand/icons/star.svg` + `brand/icons/logo-wordmark.svg`; hub home also shows hub-crew PNG.
- Functional: four placeholder cards (dp-800, gh-200, gh-900, gh-600) navigate to workspace.
- Functional: workspace shows subject code/title, mode tabs as **inert chrome**, and an honest empty state.
- Functional: unknown `subjectId` still renders workspace with "Unknown subject" empty state (no blank page).
- Non-functional: Lucide 1.75, round caps; no emoji in chrome; no CSS-drawn star.
- Non-functional: keyboard tab through rail + theme toggle; `:focus-visible` from tokens; `prefers-reduced-motion: reduce` disables transform/transition in `app.css`.
- Non-functional: viewport &lt; 900px — rail becomes a drawer opened by a topbar button (dp-800 hides sidebar below `lg`; hub must be usable).

## Architecture

```
src/shell/router.ts
  type HubRoute = { view: 'home' } | { view: 'subject'; subjectId: string }
  parseHash('#/') → home
  parseHash('#/subject/dp-800') → { view: 'subject', subjectId: 'dp-800' }
  parseHash('#/nope') → home
  useHashRoute / navigate

src/shell/subjects.ts
  PLACEHOLDER_SUBJECTS: { id, code, title, accent: brand token name }[]
  accent ∈ sky-cyan | hub-green | corgi-orange | hub-coral  (locked brand tokens, not hex)

src/shell/AppShell.tsx
  grid: 248px rail + main
  Rail: brand, nav Hub home, "My subjects" links (no % badges), local-profile footer with hub-crew avatar
  Topbar: crumb ("Hub home" | "{code} workspace") + mobile menu button
  children: view
  ThemeToggle (already built) remains fixed bottom-right, not in the topbar

src/shell/HubHome.tsx
  eyebrow + h1 from mockup
  card grid of PLACEHOLDER_SUBJECTS, status chip "Pack not installed"
  hub-crew mascot on the hero/continue-less region — use a simple mascot well, not the teal "Resume" CTA (that needs lastLessonId)

src/shell/SubjectWorkspace.tsx
  subject-head from lookup; fallback unknown
  tabs: Overview Learn Labs Practice Mock exams Compare Notes — visual only, Overview selected
  EmptyState: "This pack is not in the hub yet. Content lands in later phases."

src/styles/app.css
  port mockup layout CSS (.app, .rail, .topbar, .card, .navi) using token vars
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; transform: none !important; } }
  lucide default: svg.lucide { stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
```

Route table:

| Hash | View |
| --- | --- |
| ``, `#`, `#/` | HubHome |
| `#/subject/dp-800` | workspace |
| `#/subject/gh-200` | workspace |
| `#/subject/gh-900` | workspace |
| `#/subject/gh-600` | workspace |
| anything else | HubHome |

## Related Code Files

- Create: `src/shell/router.ts`, `src/shell/router.test.ts`, `src/shell/subjects.ts`, `src/shell/AppShell.tsx`, `src/shell/AppShell.test.tsx`, `src/shell/HubHome.tsx`, `src/shell/SubjectWorkspace.tsx`, `src/shell/views.test.tsx`, `src/ui/EmptyState.tsx`, `src/styles/app.css`
- Modify: `src/App.tsx` (route switch inside AppShell), `src/main.tsx` (import `app.css`)
- Delete: none
- Do not create: `src/sdk/**`, `src/content/**`, `src/ui/LessonViewer.tsx`, search dialog, streak engine

## Implementation Steps

1. Write `parseHash` + tests first (TDD for the router). Port gh-200 test style; new cases only.
2. Add `PLACEHOLDER_SUBJECTS` with ids `dp-800`, `gh-200`, `gh-900`, `gh-600`. Accents: dp-800 `sky-cyan`, gh-200 `hub-green`, gh-900 `corgi-orange`, gh-600 `hub-coral`.
3. Implement `AppShell` rail/topbar from mockup CSS, swapping inline SVG sprites for Lucide (`Home`, `Layers`, subject pip as a span using `var(--{accent})`).
4. Brand block: `<img src="brand/icons/star.svg" alt="" width="34" height="34" />` plus `<img src="brand/icons/logo-wordmark.svg" alt="Captain Corgi Hub" />` (alt on the wordmark, empty alt on decorative star).
5. HubHome cards: each is an `<a href="#/subject/{id}">`. Include hub-crew `<img src="brand/captain-corgi-hub-avatar.png" alt="" />` in the hero well (decorative; heading already names the hub).
6. SubjectWorkspace empty state via `EmptyState`. Tabs are `<div role="tablist">` with Overview `aria-selected="true"`; other tabs `disabled` + `title="Available when this pack ships"`.
7. Mobile: CSS drawer; button `aria-label="Open navigation"` / `aria-expanded`.
8. Tests:
   - `parseHash` table above
   - AppShell: wordmark img present, star img present
   - HubHome: four subject links
   - click (or `href`) to `#/subject/dp-800` shows workspace heading containing `DP-800`
   - unknown subject id shows "Unknown subject"
   - ThemeToggle still has four options after shell mount
9. `npm test && npm run lint && npm run build`
10. Manual: `npm run dev` — click Auto/Light/Dark/Night, confirm rail contrast on Night (amber tokens).

## Todo

- [x] Hash router + tests (`home` / `subject/:id`)
- [x] AppShell rail + topbar + mobile drawer
- [x] HubHome placeholder cards + mascot + wordmark
- [x] Empty SubjectWorkspace + disabled mode tabs
- [x] reduced-motion + focus-visible smoke (no emoji in chrome)
- [x] Full suite + build green

## Success Criteria

- [x] `#/` shows "One hub for every subject you study" (or the locked hero line) and four cards
- [x] Wordmark and hub-crew PNG render (no broken images)
- [x] `#/subject/gh-900` shows empty workspace, not GH-200 lesson content
- [x] Theme toggle still works from the shell
- [x] No files created under `learn-gh-200/` or `learn-dp-800/`

## Risk Assessment

- **Shipping mockup doc views (Architecture/Extensibility).** Signal: extra routes in `parseHash`. Response: delete them; they are mockup-only.
- **Placeholder subjects mistaken for the SDK.** Signal: `src/content/registry.ts` appears. Response: stop; that is unified Phase 1. Keep `PLACEHOLDER_SUBJECTS` only.
- **Night contrast on rail borders.** Signal: Night rail indistinguishable from `--bg`. Response: tokens already define `--bg-elevated` vs `--bg` for Night (`colors_and_type.css:149-153`); use those vars, not hardcoded hex.
- **Hash vs file:// assets.** `base: './'` + relative `brand/...` paths. Signal: images 404 on `vite preview`. Response: do not prefix with `/` (gh-200 uses `mascot/...` relative).

## Security Considerations

- `subjectId` from the hash is reflected in the heading. Treat as text content only (`{subject.code}` from lookup, or a fixed "Unknown subject" string). Never `dangerouslySetInnerHTML` with the hash.
- No auth. "Local profile" footer is static copy, not a user record.

## Next Steps

Stop. Unified Phase 1 (Content SDK + engines) is a **separate** plan. Do not start it from this cook.
