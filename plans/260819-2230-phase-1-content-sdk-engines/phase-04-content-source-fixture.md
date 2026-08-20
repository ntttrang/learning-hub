---
title: "Phase 4: Content Source Fixture"
status: completed
priority: P1
effort: "4h"
dependencies: [3]
---

# Phase 4: Content Source Fixture

## Overview

The loading half of the SDK: the `ContentSource` interface, its `FileContentSource`
implementation over `import.meta.glob`, the tiny fixture pack under
`content/fixture/`, and `src/content/registry.ts` as the app-facing aggregator.
UI and engines will only ever talk to `ContentSource` — this is the seam that
lets file storage swap for Supabase/CMS later with zero UI changes.

## Requirements

- [x] `ContentSource` interface (in `src/sdk/content-source.ts`): `listSubjects(): SubjectMeta[]`, `loadSubject(id): SubjectContent`, plus the accessor family generalized from dp-800's `content.ts` (`getLesson`, `getQuestion(s)`, `getLab`, `getExam`, `lessonsForDomain`, `modulesForDomain`, `adjacentLessons`, …) operating on a loaded subject.
- [x] `FileContentSource`: two globs — `.json` eager-parsed, `.mdx` raw via `{query:'?raw', import:'default'}` (verified in Phase 1); `gray-matter` splits frontmatter; the mdx body becomes one `{kind:'md', body}` block appended after any frontmatter-declared blocks.
- [x] Loader pipeline per subject: parse files → Zod parse (Phase 3 schemas) → assemble `SubjectContent` → run `validateSubject`; invalid content throws a typed `ContentValidationError` carrying the issues.
- [x] Fixture pack `content/fixture/` exercising every path:
  - `subject.json` — all 7 question kinds usable, 2 domains, `enabledModes` subset;
  - 2 lessons: one `.mdx` (prose + frontmatter), one `.json` (structured blocks);
  - `questions/*.json` — one question per kind (7 total minimum);
  - 1 lab, 1 sampled exam (`domainPlan` + `seed`), 1 comparison (3 columns to prove N>2), `docs.json`.
- [x] `src/content/registry.ts`: `loadAll()` → validated `SubjectContent[]` + typed re-exports; this is the only module the app imports to reach content.
- [x] `content:check` now runs the real file pipeline (registry → validate) instead of inline objects.
- [x] Tests: fixture loads and validates clean; mdx frontmatter + body-block assembly correct; both lesson source formats normalize to the same `Lesson` shape; a deliberately-broken fixture copy (in `src/sdk/__fixtures__/` as inline string, not under `content/`) trips each error class.

## Architecture

```
content/fixture/**/*.{json,mdx}
        │  import.meta.glob (json: eager / mdx: raw)
        ▼
FileContentSource ── parse+assemble ──► Zod (validate.ts) ──► SubjectContent
        ▲                                                        │
ContentSource (interface)                                     registry.ts
        └── future: SupabaseSource / CmsSource ────────────────┘
```

Fixture lives under `content/fixture/` and is real data — Phase 2 will render it
end-to-end — but the shell's subject list does NOT consume the registry yet
(Phase 2/3 decision), so no user-visible change ships in this plan.

## Related Code Files

- Create: `src/sdk/content-source.ts`, `src/sdk/content-source.test.ts`, `src/content/registry.ts`, `content/fixture/**`
- Modify: `package.json` (`content:check` entry swap)
- Read (port reference): `learn-dp-800/src/lib/content.ts` (accessor pattern to generalize)

## Implementation Steps

1. Define `ContentSource` + `SubjectContent` assembly types.
2. Implement `FileContentSource` (globs, path→subject/file-type parsing, mdx normalization).
3. Author the fixture pack files (real content, tiny — this doubles as schema dogfooding).
4. Write `registry.ts`, point `content:check` at it.
5. Write tests including the broken-content cases; run full `npm test`, `npm run build`.

## Todo

- [x] Interface + implementation
- [x] Fixture pack (7 question kinds, both lesson formats, sampled exam, N-column compare)
- [x] Registry + `content:check` wiring
- [x] Load/validate/error tests

## Success Criteria

- [x] `npm test` and `npm run content:check` green against files on disk; `npm run build` green (glob wiring survives production build).
- [x] A pack is visible to the app only through `ContentSource` — grep shows no direct `import.meta.glob('/content…')` outside `FileContentSource`.

## Risk Assessment

- **Path→id parsing brittleness** (subject/file/type derived from file paths): signal = any hardcoded path assumption in tests; response = one `parseContentPath()` helper with its own table-driven test.
- **Fixture rots as schema evolves**: signal = Phase 6+ schema edits break fixture tests; response = that breakage is the feature (fixture is the canary) — fix fixture with the schema, never weaken validation.
