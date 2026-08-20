---
phase: 2
title: "Brand, four-mode theme, Zustand adapter"
status: todo
priority: P1
effort: 3h
dependencies: [1]
---

# Phase 2: Brand, four-mode theme, Zustand adapter

## Overview

Install Captain Corgi tokens and brand files, then ship Auto / Light / Dark / Night with FOUC-safe persistence. Zustand sits behind a swappable `StorageAdapter`. Theme of record for the document is still the raw `cc-theme` string.

## Context Links

- Tokens source: `.cursor/skills/captain-corgi-hub-design/colors_and_type.css` (includes `[data-theme="night"]` at line 149)
- Toggle reference: `.cursor/skills/captain-corgi-hub-design/assets/theme-toggle.html`
- gh-200 theme core: `learn-gh-200/src/hooks/useTheme.ts`, `useTheme.test.ts`
- dp-800 persist: `learn-dp-800/src/lib/store.ts:68-190` (pattern only — do not use key `dp800-store`)
- Unified contract: `docs/unified-learning-hub-plan.md` §Phase 0

## Key Insights

- gh-200 tokens **omit Night** (`learn-gh-200/src/styles/tokens.css:6`). Copying that file fails the contract. Copy the design-skill file.
- dp-800 FOUC parses Zustand JSON (`Theme.tsx:65`). Unified plan forbids that: persist `localStorage['cc-theme']`.
- Design toggle HTML uses stroke 2; unified plan requires Lucide **1.75**. Use Lucide icons, not the inline SVG from the HTML asset.
- Storing `'auto'` in `cc-theme` is allowed. FOUC ignores it. Do not delete the key on Auto (gh-200 tests depend on round-trip).

## Requirements

- Functional: verbatim `src/styles/tokens.css`; brand files under `public/brand/`.
- Functional: four theme modes; Auto removes `data-theme`; light/dark/night set it.
- Functional: `StorageAdapter` with localStorage + in-memory fallback when storage throws.
- Functional: Zustand store `{ theme, setTheme }` persisted as `cc-hub-store` **and** mirrored to `cc-theme`.
- Non-functional: FOUC inline script in `index.html` (not a React `useEffect`, not Zustand JSON parse).
- Non-functional: blocked storage still applies the theme for the session.

## Architecture

```
index.html FOUC
  reads cc-theme ∈ {light,dark,night} → set data-theme
  else → leave html bare (CSS @media prefers-color-scheme)

engines/storage.ts
  StorageAdapter { getItem, setItem, removeItem }
  createMemoryAdapter()
  createLocalStorageAdapter(fallback)  // probe with setItem/removeItem; on throw use fallback

engines/theme.ts
  ThemeSetting = 'auto' | 'light' | 'dark' | 'night'
  THEME_KEY = 'cc-theme'
  readThemeSetting(adapter) / applyTheme(setting) / writeThemeSetting(adapter, setting)
  bootstrapTheme(adapter)  // belt-and-suspenders after FOUC

engines/store.ts
  zustand persist name 'cc-hub-store'
  storage: createJSONStorage(() => adapterAsStateStorage(adapter))
  setTheme(next) { applyTheme(next); writeThemeSetting(adapter, next); set({ theme: next }) }
  onRehydrateStorage: applyTheme(state.theme) after read; if cc-theme raw exists it wins

shell/ThemeToggle.tsx
  radiogroup .cc-theme-toggle, Monitor/Sun/Moon/Coffee, aria-pressed
  data-auto-shadow on the OS-resolved mode when setting is auto
  matchMedia('prefers-color-scheme: dark') listener for auto-shadow only
```

Adapter-as-Zustand-storage:

```ts
function adapterAsStateStorage(adapter: StorageAdapter): StateStorage {
  return {
    getItem: (name) => adapter.getItem(name),
    setItem: (name, value) => adapter.setItem(name, value),
    removeItem: (name) => adapter.removeItem(name),
  };
}
```

Do **not** put progress/SRS/notes in this store. Empty slice only.

## Related Code Files

- Create: `src/styles/tokens.css` (copy verbatim), `src/styles/theme-toggle.css` (from theme-toggle.html `<style>`, Lucide overrides), `src/engines/storage.ts`, `src/engines/storage.test.ts`, `src/engines/theme.ts`, `src/engines/theme.test.ts`, `src/engines/store.ts`, `src/engines/store.test.ts`, `src/shell/ThemeToggle.tsx`, `src/shell/ThemeToggle.test.tsx`
- Create assets:
  - `public/brand/captain-corgi-hub-avatar.png`
  - `public/brand/captain-corgi-avatar.png`
  - `public/brand/icons/star.svg`
  - `public/brand/icons/logo-wordmark.svg`
- Modify: `package.json` (add `zustand` ^5, same major as dp-800 `^5.0.3`), `src/main.tsx` (import tokens + theme-toggle css; `bootstrapTheme`), `index.html` (FOUC script in `<head>`; favicon `brand/icons/star.svg`)
- Delete: none
- Copy sources:
  - tokens: `.cursor/skills/captain-corgi-hub-design/colors_and_type.css`
  - PNGs + SVGs: `.cursor/skills/captain-corgi-hub-design/assets/` (PNGs exist on disk; editor glob may hide them — copy via shell `cp`)

## Implementation Steps

1. `cp` tokens file to `src/styles/tokens.css`. Do not rewrite comments, Night block, or `@import`.
2. `cp` four brand files into `public/brand/` as listed. Do not copy `anchor.svg`.
3. Port gh-200 `useTheme.ts` into `src/engines/theme.ts`. Widen union with `'night'`. Inject `StorageAdapter` instead of touching `window.localStorage` directly.
4. Implement `createLocalStorageAdapter`: try/catch around a probe write. Never throw to UI.
5. Add Zustand store. `setTheme` always calls `applyTheme` + `writeThemeSetting` so `cc-theme` stays a raw string even if persist middleware is slow.
6. Inline FOUC in `index.html` `<head>` (same logic as mockup lines 11–16). Keep `bootstrapTheme()` in `main.tsx` for testability.
7. Build `ThemeToggle` from `theme-toggle.html` behavior + dp-800 icon set (`Monitor/Sun/Moon/Coffee`). `strokeWidth={1.75}`. Mount it from `App.tsx` for this phase so theme can be QA'd before the rail exists.
8. Tests (must exist before calling the phase done):
   - `readThemeSetting`: default auto; stored light/dark/night; invalid → auto; blocked storage → auto
   - `applyTheme('night')` sets `data-theme="night"`; `applyTheme('auto')` removes attribute
   - adapter: memory fallback used when `localStorage` getter throws (`useTheme.test.ts` `blockStorage` helper — copy that)
   - store: `setTheme('night')` writes `cc-theme=night` and persist blob
   - ThemeToggle: four buttons, pressing Night sets attribute + storage
9. `npm test && npm run lint && npm run build`

## Todo

- [x] Verbatim tokens + brand files in `public/brand/`
- [x] `StorageAdapter` + tests including blocked storage
- [x] Theme engine with Night + FOUC script
- [x] Zustand store mirroring `cc-theme`
- [x] Four-mode `ThemeToggle` (Lucide 1.75)

## Success Criteria

- [x] `src/styles/tokens.css` matches the design-skill file (no Night-stripping)
- [x] Reload with `cc-theme=night` paints Night before React (FOUC script present in `dist/index.html`)
- [x] Auto: `document.documentElement.hasAttribute('data-theme') === false`
- [x] Blocked storage: Night still applies in-session
- [x] `public/brand/captain-corgi-hub-avatar.png` and `icons/logo-wordmark.svg` exist

## Risk Assessment

- **Zustand persist vs `cc-theme` drift.** Signal: FOUC shows Light while React shows Night. Response: `setTheme` writes `cc-theme` first; on rehydrate, raw `cc-theme` wins.
- **PNG copy skipped because glob hid files.** Signal: 404 on mascot. Response: copy with `cp` from the design-skill `assets/` paths in the file list above (verified present via `find`).
- **Verbatim `@import` plus `index.html` fonts double-fetch.** Acceptable. Do not strip the `@import` (violates verbatim).

## Security Considerations

- Adapter must never `eval` stored JSON for theme. Theme values are a closed union; invalid → `auto`.
- Persist blob is untrusted JSON: Zustand rehydrate failure must fall back to `{ theme: 'auto' }`, not crash.

## Next Steps

Phase 03: rail + topbar + hash routes + HubHome + empty SubjectWorkspace. ThemeToggle stays mounted in the shell.
