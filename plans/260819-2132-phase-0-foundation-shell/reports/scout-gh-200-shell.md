# Scout: learn-gh-200 shell (Phase 0 donor)

Donor is a subject SPA, not a hub. Copy stack + theme/router patterns. Do not copy content or engines.

## Reuse
- Vite 8 + React 19 + TS + Vitest + oxlint + lucide-react (`learn-gh-200/package.json`)
- Hash router + `base: './'` (`learn-gh-200/src/router.ts`, `vite.config.ts`)
- `cc-theme` key, Auto clears `data-theme` (`learn-gh-200/src/hooks/useTheme.ts:13-34`)
- `bootstrapTheme()` before `createRoot` (`learn-gh-200/src/main.tsx:8-9`)
- Theme unit tests (`learn-gh-200/src/hooks/useTheme.test.ts`)

## Replace
- Topbar-only `AppShell` (`learn-gh-200/src/components/shell/AppShell.tsx`) → rail + topbar
- 3-mode theme (`ThemeSetting = 'auto' | 'light' | 'dark'`) → add `night`
- Cycle `ThemeToggle` → 4-mode radiogroup
- Adapted `tokens.css` (no Night) → verbatim design file
- `useProgress` localStorage hook → Zustand + adapter

## Leave behind
- All `src/content/**`, learn/lab/practice/exams/compare views, grade/score/sample utils
