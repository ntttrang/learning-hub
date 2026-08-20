---
phase: 1
title: "Scaffold Vite app at hub root"
status: todo
priority: P1
effort: 2h
dependencies: []
---

# Phase 1: Scaffold Vite app at hub root

## Overview

Create the unified app **at `/Users/trang_thi_thuy.n/GIT/learning-hub/` root** by copying the gh-200 toolchain, not the gh-200 source tree. After this phase, `npm run dev` shows a blank branded-ready mount and tests/build are green.

## Context Links

- Donor config: `learn-gh-200/package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/test-setup.ts`
- Target layout: `docs/unified-learning-hub-plan.md` §4
- Scout: `./reports/scout-gh-200-shell.md`

## Key Insights

- Hub root currently has `docs/`, `learn-*`, `mockups/`, `.cursor/` — **no** `package.json` or `src/`.
- Copying the whole `learn-gh-200/src` tree would drag GH content into the hub. Copy **config + empty mount only**.
- `vite.config.ts` `base: './'` is required so hash routing works on GitHub Pages later (unified Phase 7). Do it now.

## Requirements

- Functional: Vite + React 19 + TypeScript app named `learning-hub` boots at `/`.
- Functional: Vitest jsdom + oxlint scripts match gh-200.
- Non-functional: Typecheck (`tsc -b`) and `vitest run` pass on a smoke test.
- Non-functional: Do not initialize git. Do not edit donor apps.

## Architecture

```
learning-hub/                  # NEW app root (this repo)
  package.json                 # copy gh-200 scripts + deps; add nothing extra yet
  vite.config.ts               # base './', vitest include src/**/*.test.{ts,tsx}
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  index.html                   # title Captain Corgi Learning Hub; fonts; #root
  src/main.tsx                 # StrictMode mount only (theme bootstrap lands in phase 02)
  src/App.tsx                  # returns a single <p> smoke heading
  src/App.test.tsx             # asserts the heading
  src/test-setup.ts            # jest-dom + cleanup + localStorage.clear
  .gitignore                   # from gh-200, with plans/ NOT ignored
```

`zustand` is added in phase 02, not here.

## Related Code Files

- Create: `package.json`, `package-lock.json` (via `npm install`), `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/test-setup.ts`, `.gitignore`
- Modify: none
- Delete: none
- Do not copy: `learn-gh-200/src/content/**`, `src/components/**`, `src/hooks/**`, `src/utils/**`

## Implementation Steps

1. Copy `learn-gh-200/package.json` to hub root. Change `"name"` to `"learning-hub"`. Keep scripts `dev`, `build`, `test`, `lint`, `preview`. Keep React 19, Vite 8, Vitest, oxlint, lucide-react, testing-library. Do **not** add zustand yet.
2. Copy `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` verbatim from gh-200.
3. Write `index.html`: `lang="en"`, fonts CDN identical to gh-200 `index.html:12-17`, favicon later in phase 02, title `Captain Corgi Learning Hub`, `<body class="cc-body"><div id="root"></div>`.
4. Write `src/main.tsx`: import `./App`, `createRoot`, StrictMode. No theme yet.
5. Write `src/App.tsx` that renders `<p>Captain Corgi Learning Hub</p>`.
6. Write `src/App.test.tsx` with RTL `screen.getByText(/Captain Corgi Learning Hub/)`.
7. Copy `src/test-setup.ts` from gh-200.
8. `npm install` at hub root.
9. Copy `learn-gh-200/.gitignore` as a starting point, then **delete the `plans` ignore line** (`learn-gh-200/.gitignore:19`). Hub `plans/` is canonical AgentKit state and must be committable. Keep `node_modules`, `dist`, `.env`, `.DS_Store`. gh-200 has no `src/vite-env.d.ts` — do not invent one; `tsconfig.app.json` already sets `"types": ["vite/client"]`.
10. Run `npm test && npm run lint && npm run build`.

## Todo

- [x] Root `package.json` + lockfile from gh-200, name `learning-hub`
- [x] Vite/TS configs copied
- [x] `index.html` + empty `App` + smoke test
- [x] `npm test`, `npm run lint`, `npm run build` green

## Success Criteria

- [x] `cd /Users/trang_thi_thuy.n/GIT/learning-hub && npm test` exits 0
- [x] `npm run build` emits `dist/`
- [x] `learn-gh-200/` and `learn-dp-800/` file trees unchanged

## Risk Assessment

- **Wrong directory:** implementing inside `learn-gh-200/` instead of hub root. Signal: hub root still has no `package.json`. Response: stop, move files to root, leave donor intact.
- **Dragging content:** glob-copy of `src/`. Signal: `src/content` appears. Response: delete it; only the files listed above belong in this phase.

## Security Considerations

- No user data yet. Fonts load from Google Fonts CDN (same as donors + design tokens). Acceptable for static Pages hosting.

## Next Steps

Phase 02: verbatim tokens, brand assets, four-mode theme, storage adapter, Zustand.
