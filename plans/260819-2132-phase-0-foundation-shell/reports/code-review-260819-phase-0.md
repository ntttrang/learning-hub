# Code Review — Phase 0 Foundation Shell (260819)

Reviewer: code-reviewer agent. Read-only review; no files modified except this report.
Gates re-run by reviewer at hub root: `npm test` 42/42 PASS · `npm run lint` (oxlint) clean · `npm run build` (tsc -b + vite 8.2.1) clean.

## Verdict per check

| Check | Verdict | Notes |
| --- | --- | --- |
| (a) Acceptance criteria | **PASS** (coverage nits) | All six criteria met; two have test-coverage gaps (nits 4–5). |
| (b) Donors untouched / localStorage collision | **PASS WITH CONCERN** | No hub-scope changes in donors; but `cc-theme` IS shared with gh-200 (task premise "donors use their own" is wrong for gh-200) — minor 1. dp-800 tree has unrelated pre-existing dirt — minor 6. |
| (c) SDK boundary (engines) | **PASS** | Only `storage.ts` (the seam) touches `window.localStorage`; `theme.ts`/`store.ts` go through adapters; no engine imports UI. |
| (d) Patterns (router/test idioms, stroke 1.75, no emoji, no CSS star, token accents) | **PASS** (minors) | Two hex leaks in app.css (minor 4, nit 1); radiogroup semantics inherited from locked mockup (minor 2); `aria-current` gap on home link (minor 3). |
| (e) Lint/type/build | **PASS** | Verified by reviewer run, not by claim. Strict TS + `verbatimModuleSyntax` + `erasableSyntaxOnly` present in both tsconfigs. |

## Findings

### Major

**M1 — Zustand rehydrate references the store inside its own creation (TDZ); "raw cc-theme wins" contract breaks at module-init.**
`src/engines/store.ts:51-57` — `onRehydrateStorage`'s callback calls `useHubStore.setState(...)`. With zustand 5.0.15 and synchronous storage, that callback runs *during* `create()`, before the `const useHubStore` binding is initialized.
Empirically reproduced by reviewer (node, exact pattern, zustand 5.0.15 from this repo's lockfile): with `cc-theme='light'` and blob `{theme:'night'}` present at module init, the `setState` throws (TDZ ReferenceError), zustand's thenable swallows it, and the result is:
- store state keeps the blob's `night` while the document correctly renders `light` → ThemeToggle highlights the wrong mode (violates the precedence the code comment and tests claim);
- `persist.hasHydrated()` stays `false` forever; `onFinishHydration` never fires.

Trigger paths are realistic, not exotic: (1) quota/partial-write failure — raw write succeeds, blob write silently dropped by the adapter's catch; (2) donor gh-200 writing the shared `cc-theme` key (see minor 1) after the hub wrote its blob; (3) manual localStorage edits. The existing tests (`store.test.ts:33-52`) miss it because they call `await useHubStore.persist.rehydrate()` *after* creation, when the binding exists.
Suggested fix: make raw win at merge time, before any set, e.g. use the `merge` option — `merge: (persisted, current) => ({ ...current, ...(persisted as Partial<HubState>), theme: readRawThemeSetting() ?? (persisted as Partial<HubState>)?.theme ?? current.theme })` — and drop the `setState` from `onRehydrateStorage` (keep only `applyTheme(settled)` there if desired; `bootstrapTheme()` already applies the document theme). Add a module-init test using `vi.resetModules()` + dynamic import with divergent storage pre-seeded.

### Minor

**m1 — `cc-theme` is shared with donor learn-gh-200, not hub-exclusive.**
Verified: `learn-gh-200/src/hooks/useTheme.ts:13` (`const STORAGE_KEY = 'cc-theme'`). The hub's value union is a superset (`night` added). Degradation is one-way-safe, verified in donor source (`useTheme.ts:20-21` validates against `auto|light|dark`; hub's `night` → donor falls back to `auto`; donor writes only subset values the hub accepts). No crash, no corruption — but on a same-origin deploy (GitHub Pages subpaths share localStorage), visiting gh-200 after the hub rewrites the hub's theme-of-record, and it directly feeds M1's divergence path. `cc-hub-store` does not collide (`dp800-store` per scout report; probe key `__cc-hub-storage-probe__` is write-and-remove, read by nobody). gh-600 storage usage unverified (read constraint blocked donor inspection).
Suggested fix: document the sharing as intentional continuity in plan/README, or namespace the hub key (`cc-hub-theme`) before any same-origin deploy. Note: `cc-hub-theme` would also require updating the FOUC script, `THEME_KEY`, and tests together.

**m2 — Theme toggle: `role="radiogroup"` containing `aria-pressed` buttons is not conformant ARIA.**
`src/shell/ThemeToggle.tsx:46-57`. A radiogroup must own `radio` roles; press-buttons inside it send mixed semantics to AT, and there is no arrow-key navigation. Inherited verbatim from the locked design asset (`mockups/learning-hub-mockup.html:575-576` uses the same pattern), so this is a design-contract issue, not an implementation deviation — do not silently change it against the locked decision. Recommend a follow-up decision: either `role="radio"` + `aria-checked` + roving tabindex, or drop to `role="group"` and keep `aria-pressed`.

**m3 — "Hub home" rail link lacks `aria-current="page"` when active.**
`src/shell/AppShell.tsx:46-49` — subject links get `aria-current` (`:59`) but the home link only gets the `on` class. Add `aria-current={route.view === 'home' ? 'page' : undefined}` for parity.

**m4 — Badge text hardcodes `#fff` instead of `--accent-fg`.**
`src/styles/app.css:269`. Tokens define lifted accent foregrounds for Dark (`#FFF3DD`) and Night (`#FFE0B2`); hard white is off-contract and violates the "hex only in token files / BrandWordmark brand fills" rule. Fix: `color: var(--accent-fg);` (the pattern `theme-toggle.css:31` already uses).

**m5 — Mobile drawer: no Escape-to-close and no focus management.**
`src/shell/AppShell.tsx:83-95`, `app.css:409-446`. Scrim click and hashchange close exist (good). Add `keydown` Escape handling and consider returning focus to the menu button on close.

**m6 — learn-dp-800 working tree is not clean.**
`git -C learn-dp-800 status`: ` M docker/docker-compose.yml`, untracked `.github/copilot-instructions.md`, `.vscode/`, `docker/dab-config.json`, `docker/seed/mssql/AdventureWorksLT2025.bak`. None of these are hub-scope files (Phase 0 touches only repo-root `src/`), so almost certainly pre-existing local state — but the constraint says donors "must NOT have been modified", so the lead should confirm provenance via dp-800's git log if strictness matters. gh-200: clean. gh-600: untracked `.DS_Store` files only (macOS noise, no tracked modifications).

### Nit

- **n1** `app.css:431` — scrim `color-mix(in srgb, #000 42%, transparent)`; use the `black` keyword (identical rendering) to keep app.css hex-free per the accent rule.
- **n2** `SubjectWorkspace.tsx:55-69` — tablist has `role="tab"`/`aria-selected`/disabled but no `tabpanel`/`aria-controls` linkage or roving tabindex. Acceptable while tabs are inert chrome; add when a tab actually activates.
- **n3** `public/brand/icons/logo-wordmark.svg` is now referenced only by a comment (`BrandWordmark.tsx:2`) — duplicated geometry (two sources of truth) and a dead asset shipped in dist. Keep deliberately as the brand source-of-record (and say so), or remove.
- **n4** Criterion "blocked localStorage still switches theme" is covered at adapter level (`storage.test.ts:39-51`, `theme.ts` catches), not by a store-level blocked-storage test exercising `setTheme` end to end.
- **n5** Route tests cover `dp-800` and `gh-900`; `gh-200`/`gh-600` ids ride the same code path untested (`views.test.tsx`).
- **n6** `plan.md` still reads `status: pending`, all phases `Pending`, success boxes unchecked — left for the lead to update (reviewer does not mutate plans).
- **n7** `AppShell.tsx:90` — menu button label is static "Open navigation"; `aria-expanded` conveys state, but "Toggle navigation" would read better.
- **n8** `HubHome.tsx:22-28` — hero mascot is above-the-fold yet `loading="lazy"`; drop it to keep the LCP image eager.

## Judgment-call verdicts

**1. BrandWordmark inline SVG instead of plan's `<img>` — SOUND.**
Verified against the shipped asset (`public/brand/icons/logo-wordmark.svg:10`): the title hardcodes `fill="#1F2A33"`, invisible on Dark `--bg #0E1318` and Night `#0A0704` — the stated reason is real. The deviation is actually stronger than argued: the asset's title relies on `class="wm-text"` styled *externally*, and an SVG loaded via `<img>` can neither load external CSS/fonts nor inherit document fonts — so the plan's `<img>` would also have rendered the wordmark in a fallback font at weight 400. The inline copy preserves geometry exactly (same viewBox `0 0 420 80`, same star path/fills/stroke 1.8, same x/y/sizes/letter-spacing), moves only the title to `currentColor` (resolved via `.brand .wordmark { color: var(--fg) }`), and confines hex to brand fills inside BrandWordmark — exactly where the rule permits it. Only cost is n3 (duplicated geometry source).

**2. Reduced-motion zero-duration pattern instead of plan's `transform: none !important` — SOUND.**
Verified `app.css:419`: the drawer's *hidden* state is itself `transform: translateX(-102%)`; the plan's literal `transform: none !important` would neutralize the hidden offset and pin the drawer permanently open for reduced-motion users — a real bug the implementation correctly avoided. The zero-duration pattern (`app.css:460-468`) is the standard safe alternative: end-states are preserved, transitions complete near-instantly. No residual `scroll-behavior` or parallax usage needs the plan's literal form.

## Explicit deep-checks

- **FOUC script (`index.html:5-15`): correct.** Reads the raw string, strict-compares against the three pinned modes, never parses JSON, wrapped in try/catch for blocked storage, runs before stylesheets/fonts. Auto/absent leaves `<html>` bare so `tokens.css:201-226` (`:root:not([data-theme])` media query) drives the scheme.
- **Rehydrate precedence:** implemented and tested for the post-creation path, but broken at module-init — see M1.
- **Blocked-storage degradation (`storage.ts:31-76`): solid.** Single probe at adapter creation, per-op try/catch, memory fallback, session-scoped theme switching preserved; tests exercise a throwing `localStorage` getter.
- **A11y:** radiogroup/aria-pressed (m2), `aria-current` (m3), drawer `aria-expanded`/scrim/hashchange close present (m5), tablist with disabled tabs (n2), `:focus-visible` ring via `tokens.css:454-458`, focus-within expansion of the toggle pill (`theme-toggle.css:54-62`), reduced motion (verdict 2).
- **Mobile drawer:** transform-based, scrim + hashchange + button-toggle close, `nav-open` class scoped to ≤900px where the menu button is displayed; desktop unaffected.
- **tokens.css verbatim:** `diff` against `.cursor/skills/captain-corgi-hub-design/colors_and_type.css` → **IDENTICAL** (header comment intact).
- **Lucide stroke 1.75 everywhere:** `AppShell.tsx:47,94`, `ThemeToggle.tsx:59`, `EmptyState.tsx:17`, plus global `svg.lucide` rule `app.css:8-12`. No emoji in chrome (scanned). Star is a brand `<img>` asset, not CSS-drawn.
- **Donor idioms:** router (`parseHash` fallback-home / `useHashRoute` / `navigate`) and `test-setup.ts` mirror `learn-gh-200/src/router.ts` and its test idiom; theme engine generalizes `learn-gh-200/src/hooks/useTheme.ts` to four modes without the cycle toggle, as planned.

## Metrics

- Type coverage: gates pass with strict TS; no `any` widening spotted in review.
- Tests: 8 files / 42 tests, all passing; behavioral (document attrs, storage values, navigation), not phantom.
- Lint: 0 issues (oxlint). Build: clean, 206 kB JS (65.9 kB gzip).

## Unresolved questions

1. Is the shared `cc-theme` key with gh-200 intentional continuity or an oversight? (m1/M1 interaction — needs a lead decision, possibly a user decision per review rules.)
2. learn-dp-800's dirty `docker/docker-compose.yml` + untracked files — confirm they predate Phase 0 (m6).
3. Should the radiogroup semantics be fixed forward in the design asset too, given the hub ported it faithfully from the locked mockup (m2)?
