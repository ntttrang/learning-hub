---
title: "Phase 5: Subject Scaffolder"
status: todo
priority: P1
effort: 5h
dependencies: [phase-01]
---

# Phase 5: Subject Scaffolder

## Overview

The add-subject flow: `npm run content:new -- --id <id> --code <CODE> --title <t>
--accent <token>` stamps a fresh content pack that passes Zod validation,
appears in the hub with exactly the modes it has content for, and works
end-to-end — proving the roadmap's core promise: adding a subject requires
**zero core-code edits**. This is the roadmap's done-when for Phase 6.

## Context

- Packs are discovered by Vite glob (`content/**/*.{json,mdx}`) — no registry
  edit is needed for a new subject; `loadSubjectsTolerant` isolates a broken
  pack from the others, and `content:check` (vitest over `content-check.test.ts`)
  is the strict validation gate.
- Precedent for file-stamping scripts: `scripts/extract-gh-packs.ts`,
  `extract-gh600-pack.ts`, `extract-dp800-pack.ts` (all run via `tsx`, all in
  `package.json` as `content:extract-*`; lint covers `scripts/`).
- Integrity contract (§8): "Each subject exposes only modes it has content
  for" — a scaffolded pack's `enabledModes` must match what it stamps.
- **Locked decision:** scaffold minimal-but-real content — 1 domain, 1 lesson,
  1 question → `enabledModes: ["learn", "practice"]` — so "working empty pack"
  means usable, not a dead shell.
- Placeholder merging: `PLACEHOLDER_SUBJECTS` in `src/shell/subjects.ts` only
  affects known roadmap ids; a fresh scaffold id simply appears as installed.

## Requirements

- [x] `scripts/scaffold-subject.ts`:
  - pure, importable `buildStarterPack(opts)` → `Record<relativePath, string>`
    (the whole pack as data) + a thin CLI wrapper that writes it;
  - flags: `--id` (kebab-case, required), `--code` (required), `--title`
    (required), `--accent` (must be one of the `AccentToken` names in
    `src/sdk/types.ts`, required), `--subtitle`, `--description` (optional);
  - refuses to overwrite an existing `content/<id>/` directory.
- [x] Stamped pack: `subject.json` (metadata + `enabledModes: ["learn",
  "practice"]`), `domains.json` (one sample domain), `modules.json` (one sample
  module), `lessons/welcome.mdx` (frontmatter: id, title, minutes, domainId;
  short body), `questions/welcome.json` (one single-choice question with a
  correct answer + explanation), empty `labs.json`, `exams.json`,
  `comparisons.json`.
- [x] `scripts/scaffold-subject.test.ts`: `buildStarterPack` output validates
      against the SDK Zod schemas (same path `content:check` uses), ids
      cross-resolve (lesson → domain, question → lesson), and flags reject
      bad accent/ids.
- [x] `package.json` gains `"content:new": "tsx scripts/scaffold-subject.ts"`.
- [x] Docs: the "Add a subject" flow is documented where the repo's README /
      docs already list the content scripts (smallest owning surface; include
      the Vite-glob restart note — a running dev server will not pick up new
      content files until restarted).
- [x] Verified end-to-end on a scratch id: scaffold → `content:check` green →
      hub lists the subject with Learn + Practice → sample lesson renders,
      sample question grades → scratch pack deleted afterward.

## Implementation Steps

1. Read one small real pack (`content/fixture/`) end-to-end as the template
   source of truth for shapes and naming.
2. Write `buildStarterPack` + CLI (arg parsing in-script, no new dependency;
   follow the existing scripts' flag style).
3. Write the validation test importing `buildStarterPack` + the Zod schemas
   from `src/sdk/validate.ts`.
4. Add the npm script; run the end-to-end scratch verification (step above),
   then delete the scratch pack and re-run `content:check`.
5. Update the README/docs surface with the flow + restart note.
6. `npm test`, `npm run lint` (lint covers `scripts/`).

## Todo

- [x] Script + pure builder written
- [x] Validation test green
- [x] npm script + docs updated
- [x] Scratch end-to-end pass + cleanup verified

## Success Criteria

- **Roadmap done-when:** the "Add a subject" flow produces a working empty
  pack — validated by `content:check`, visible in the hub with honest modes,
  sample lesson + question usable, zero core-code edits, scratch pack removed.

## Risk Assessment

- **Risk:** the sample content drifts from schema (e.g. a required question
  field). *Signal:* scaffold test fails against Zod. *Response:* the test IS
  the guard — fix the template, never the schema, here.
- **Risk:** contributors expect the scaffolder to register the subject
  somewhere. *Signal:* docs confusion. *Response:* docs state explicitly that
  glob discovery picks it up and a dev-server restart is needed.
- **Risk:** a scaffolded id colliding with a roadmap placeholder id changes
  placeholder behavior. *Signal:* scratch run with id `gh-200`. *Response:*
  that's existing, correct merge behavior (installed wins); CLI warns when the
  id matches a known placeholder, does not block.
