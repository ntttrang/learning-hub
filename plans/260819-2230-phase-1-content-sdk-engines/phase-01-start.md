---
title: "Phase 1: Start"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Start

## Overview

Retire the two technical unknowns before anything is built on them — Zod's
current API surface and Vite-glob loading of raw `.mdx` + eager `.json` under
Vitest — and pin the layout/naming decisions the later phases assume. Also add
the two new dependencies.

## Requirements

- [x] `zod` and `gray-matter` installed as dependencies; lockfile updated.
- [x] Spike test proves `import.meta.glob('/content/**/*.{json,mdx}')` works in Vitest with JSON eager-parsed and MDX imported via `{ query: '?raw', import: 'default' }`.
- [x] Spike test proves frontmatter splitting on a raw MDX string via `gray-matter`.
- [x] Zod API smoke: object schema, discriminated union, refine — compiles and validates under the installed version (check current zod docs; v4 renamed some APIs).
- [x] `tsconfig.app.json` verified for `resolveJsonModule` / include paths once `content/` glob typing is exercised.
- [x] Layout decision recorded in code reality: create empty `content/` (root) — it will hold `fixture/` in Phase 4.

## Architecture

No production code yet. One throwaway-but-committed spike test file proves the
loader mechanics; it is deleted or absorbed into Phase 4's real tests. If the
glob spike fails under Vitest, the pre-decided fallback is: keep the same
`ContentSource` interface but back tests with direct file reads — the interface
is the guardrail, not the glob.

## Related Code Files

- Create: `src/sdk/loader-spike.test.ts` (temporary), `content/.gitkeep`
- Modify: `package.json`, `package-lock.json`, possibly `tsconfig.app.json`, `vite.config.ts` (only if the spike demands it)

## Implementation Steps

1. `npm install zod gray-matter`.
2. Write the glob spike: drop a scratch `.json` + `.mdx` under `content/_spike/`, glob them, assert shapes; remove scratch files after.
3. Write the zod smoke test (discriminated union + refine + error mapping).
4. Run `npm test`; record results. If either spike fails, apply the documented fallback and note it in this file before proceeding.
5. Delete or absorb spikes per outcome; leave `content/` in place.

## Success Criteria

- [x] `npm test` green including spikes; both unknowns retired or fallback applied.
- [x] `npm run build` still green (dependency additions didn't break the build).

## Risk Assessment

- **Zod v4 API drift** (docs may describe v3 idioms): signal = smoke test compile errors; response = consult current zod docs and adapt schemas in Phase 3, not the plan.
- **Glob behavior differs between `vite build` and Vitest**: signal = spike passes in one, fails in the other; response = interface-first loader with a test-side file-read implementation, decided here, not mid-Phase-4.
