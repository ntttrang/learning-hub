# Tester Report — Phase 0 Foundation Shell (2026-08-19 22:00)

Env: macOS (Darwin 25.6.0), node v24.8.0, npm 11.6.0. App: Vite + React 19 + TypeScript SPA at repo root. Read-only verification; no source files modified. `npm run build` wrote `dist/` as sanctioned by the task.

## 1. Command Results

| Command | Result | Evidence |
|---|---|---|
| `npm test` (vitest run) | PASS — 42/42 tests, 8/8 files, 0 failures, 0 skipped | Duration 1.22s (tests 484ms). Output: `Test Files 8 passed (8)` / `Tests 42 passed (42)` |
| `npm run lint` (oxlint src) | PASS — exit 0, no findings | `LINT_EXIT_CODE=0`; oxlint emitted no warnings/errors |
| `npm run build` (tsc -b && vite build) | PASS — type-check clean, bundle built | 1820 modules transformed; `dist/assets/index-BNiOJ1lM.js` 206.37 kB (65.90 kB gzip); CSS 15.89 kB (4.25 kB gzip); built in 111ms |

No failures to capture verbatim. All three commands exited 0.

## 2. Acceptance Criteria Verdicts

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `#/` renders hub home with four placeholder cards (dp-800, gh-200, gh-900, gh-600) | PASS | `src/shell/subjects.ts:26-59` defines exactly those 4 ids; `src/shell/HubHome.tsx:35-64` maps them to cards linking `#/subject/<id>`. `src/shell/views.test.tsx:12-27` asserts hero + all four H3 headings + 4 "Pack not installed" chips. Router: `src/shell/router.ts:14-19` maps `/#/`→home |
| 2 | `#/subject/<id>` renders empty workspace; unknown ids → "Unknown subject", never blank | PASS | `src/shell/SubjectWorkspace.tsx:43-50` renders "Unknown subject" + EmptyState for unknown ids; known ids render empty-state frame ("This pack is not in the hub yet"). `views.test.tsx:37-55` covers dp-800 workspace, gh-900 isolation, `#/subject/not-a-subject` → "Unknown subject". `router.ts` + `router.test.ts:28-31` fall back to home for unknown hashes — no blank path exists |
| 3 | Rail shows star + wordmark; hub-crew mascot appears | PASS | `src/shell/AppShell.tsx:41-44` (star.svg + BrandWordmark in rail), `AppShell.tsx:67-80` (mavatar in rail footer); `HubHome.tsx:22-28` (mascot in hero). `AppShell.test.tsx:11-30` asserts all three |
| 4 | Auto/Light/Dark/Night: Auto leaves `data-theme` unset; reload restores via localStorage['cc-theme'] | PASS | `src/engines/theme.ts:52-58` (auto → removeAttribute; others → setAttribute); `index.html:5-15` FOUC script in `<head>` reads `cc-theme` before paint, pins only light/dark/night; `main.tsx:10` calls `bootstrapTheme()` pre-render. Tests: `theme.test.ts:72-86` (auto clears attr, others pin), `theme.test.ts:97-102` (bootstrap), `store.test.ts:33-52` (raw string wins over persist blob on rehydrate) |
| 5 | Blocked localStorage still switches theme in-session | PASS | `src/engines/storage.test.ts:39-51` "falls back to the memory adapter when storage is blocked" — throws `DOMException('Storage denied','SecurityError')` from the localStorage getter, asserts value survives in-session and setItem never throws. `src/engines/theme.test.ts:53-60` "survives storage being unavailable". Both passed within the 42. Code chain: `store.ts:40-46` applies to document BEFORE persisting; adapter wraps all ops in try/catch (`storage.ts:53-76`) |
| 6 | Brand files exist (4 files) | PASS | Confirmed via find: `public/brand/captain-corgi-hub-avatar.png`, `public/brand/captain-corgi-avatar.png`, `public/brand/icons/star.svg`, `public/brand/icons/logo-wordmark.svg` |
| 7 | `src/styles/tokens.css` byte-identical to `.cursor/skills/captain-corgi-hub-design/colors_and_type.css` | PASS | `diff` exit 0 (no output); both SHA-1 `9739a1c37227b50c60adb12375541a84d16a5910` |
| 8 | Donor apps untouched during implementation | PASS (with notes) | Root is not a git repo; verified via each donor's own `git status --porcelain` + mtimes. Implementation window ≈ Aug 19 21:00–21:58 (root file mtimes). **learn-dp-800**: `M docker/docker-compose.yml` + untracked files exist, but mtimes Jul 29–Aug 5, last dp-800 commit Aug 15 — all pre-date implementation. **learn-gh-200**: porcelain clean (last commit Aug 19 19:55, pre-implementation). **learn-gh-600**: only `.DS_Store` untracked (Aug 19 11:33/12:04 — macOS Finder artifacts, hours before implementation). No donor file has an mtime inside the implementation window |
| 9 | `index.html` inline FOUC script reading 'cc-theme' in `<head>` | PASS | `index.html:3-15` — inline `<script>` inside `<head>`, reads `localStorage.getItem('cc-theme')`, pins `data-theme` only for light/dark/night (auto/unset → attribute left absent), wrapped in try/catch for blocked storage |

## 3. Coverage / Quality Notes

- Test count reconciles per file: App 1, views 9, router 6, AppShell 5, ThemeToggle 4, theme 9, storage 3, store 5 = 42 in 8 files. Matches expectation exactly.
- Blocked-storage is covered at engine level (as the plan specified). No UI-level test clicking ThemeToggle under blocked storage — acceptable per plan wording; the `setTheme` order in `store.ts:43-44` (apply, then write) plus never-throwing adapter makes the in-session switch safe.
- Router edge cases well covered: empty/`#`/`#/`, `#/subject` without id, deeper segments ignored, unknown paths → home.
- Performance: whole suite 1.22s; slowest phase environment setup 5.26s (parallel workers) — no slow individual tests. Build 111ms; JS bundle 65.9 kB gzip — healthy for Phase 0.
- No coverage tooling configured (no `test:coverage` script, vitest run without `--coverage`) — line/branch percentages not measurable this run. Not an acceptance criterion; noting for later phases.
- Rehydrate precedence (raw `cc-theme` string beats zustand blob) is explicitly tested in `store.test.ts:33-52` — good guard for the two-writer design.

## 4. Failures

None. All commands passed; no verbatim error output to report.

## 5. Unresolved Questions

1. learn-dp-800 carries pre-existing local changes (`M docker/docker-compose.yml`, +15 lines; untracked docker/seed and docs files, Jul 29–Aug 5). Confirmed NOT from this implementation, but the donor is not clean — owner may want to commit or stash separately.
2. `captain-corgi-avatar.png` exists in public/brand but no source file references it yet (only `-hub-avatar.png` is used) — presumably staged for a later phase; harmless.
3. Coverage % not measured (no coverage tooling) — confirm whether a coverage threshold is expected before Phase 1.

## 6. Recommendation

All 9 acceptance criteria verified PASS; suite is green, lint clean, build clean. Phase 0 shell is verified fit for the Content SDK phase to plug into.
