# Scout: learn-dp-800 store + hub mockup

## Zustand (dp-800)
- Single persist store, key `dp800-store`, `version: 1` (`learn-dp-800/src/lib/store.ts:68-190`)
- Theme inside that JSON (`state.theme`), FOUC parses Zustand blob (`Theme.tsx:63-66`)
- No `StorageAdapter` interface — inline `createJSONStorage(() => localStorage)`
- 4-mode toggle already exists (`auto|light|dark|night`, Lucide 1.75)

Phase 0 must **not** copy the Zustand JSON FOUC pattern. Unified contract is raw `localStorage['cc-theme']`.

## Do not copy from dp-800
- `next/link`, App Router, `usePathname`, `ThemeScript` via `dangerouslySetInnerHTML` in Next head
- Full progress/SRS/achievements store surface

## Mockup (`mockups/learning-hub-mockup.html`)
- Rail 248px + topbar + views
- Theme: `cc-theme`, FOUC script in `<head>`, fixed `.cc-theme-toggle`
- Architecture / Extensibility views, stats, ⌘K, streak, continue banner = **not** Phase 0 done-when

## Brand assets (copy these)
- `.cursor/skills/captain-corgi-hub-design/assets/captain-corgi-hub-avatar.png`
- `.cursor/skills/captain-corgi-hub-design/assets/captain-corgi-avatar.png`
- `.cursor/skills/captain-corgi-hub-design/assets/icons/star.svg`
- `.cursor/skills/captain-corgi-hub-design/assets/icons/logo-wordmark.svg`
- `.cursor/skills/captain-corgi-hub-design/colors_and_type.css` → `src/styles/tokens.css`
