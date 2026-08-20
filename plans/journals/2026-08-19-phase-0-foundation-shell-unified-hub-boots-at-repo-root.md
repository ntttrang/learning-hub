---
title: "Phase 0 foundation shell: unified hub boots at repo root"
date: 2026-08-19
summary: Built the Phase 0 Vite+React 19 shell from plans/260819-2132; tester+review gates green after fixing a confirmed Zustand rehydrate TDZ bug via persist merge.
---

# Phase 0 foundation shell: unified hub boots at repo root

## What happened

Executed plans/260819-2132-phase-0-foundation-shell (3 phases) at the learning-hub repo root: gh-200 toolchain scaffold, verbatim brand tokens + public/brand assets, four-mode theme (Auto/Light/Dark/Night) behind a StorageAdapter-backed Zustand store, hash-routed AppShell (rail+topbar+mobile drawer), HubHome with four placeholder subject cards, empty SubjectWorkspace. Donor apps untouched.

Gates were delegated: tester (46/46 tests, oxlint clean, build clean, 9/9 acceptance criteria, tokens.css byte-identical) and code-reviewer. Review confirmed both plan deviations were sound (inline BrandWordmark because the shipped SVG hardcodes dark ink and `<img>` SVG can't load CSS/fonts; reduced-motion zero-duration because the plan's literal `transform: none` would pin the drawer open).

## Decision

Review Major M1, verified before fixing: `onRehydrateStorage` in src/engines/store.ts called `useHubStore.setState` — with synchronous storage that callback runs during `create()`, so the reference is in TDZ; a divergent `cc-theme` vs persist blob at module init threw and zustand swallowed it (hasHydrated stuck false, wrong mode highlighted). Reproduced with a module-init regression test (vi.resetModules + dynamic import). Fix: resolve rehydrate precedence inside persist `merge` (raw cc-theme > blob > current) — no self-reference; contract and existing tests unchanged. Also applied review minors: home-link aria-current, Escape closes the drawer, `var(--accent-fg)` over hardcoded #fff, `black` keyword in scrim, eager hero image.

Open lead decisions (not silently changed): `cc-theme` is shared with donor learn-gh-200 (verified useTheme.ts:13 — degrades one-way-safe, but same-origin deploys cross-write); ThemeToggle radiogroup+aria-pressed is non-conformant ARIA inherited from the locked mockup; learn-dp-800 carries pre-existing dirt (docker-compose.yml + untracked files, Jul 29–Aug 5, predates this work).

## Next steps

- Decide cc-theme key sharing vs namespacing before any same-origin deploy of hub + donors.
- Decide ThemeToggle ARIA semantics (group+aria-pressed vs proper radio roles).
- Unified Phase 1 (Content SDK + engines) is a separate plan; do not start from Phase 0.
- Hub root is still not a git repo — git init deferred to the unified plan; nothing was committed.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
