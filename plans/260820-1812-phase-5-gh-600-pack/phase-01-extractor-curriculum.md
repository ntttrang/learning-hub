---
phase: 1
title: "Extractor + curriculum"
status: completed
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Extractor + curriculum

## Overview

Scaffold the GH-600 extractor script, build the study-plan HTML→blocks converter with unit
tests, and emit the first slice of `content/gh-600/`: `subject.json`, `domains.json`,
`modules.json`, and 23 lesson files — enough for `learn` to work and `content:check` to stay
green.

## Requirements

- Functional: parse `learn-gh-600/gh600-study-plan-captain-corgi.html`'s embedded
  `const DOMAINS=[…]` array; emit domains (official titles + parsed weights), one module per
  domain, and one lesson per topic (23) with faithful block conversion.
- Non-functional: donor values copied verbatim — the extractor changes representation, never
  content (same contract as `scripts/extract-gh-packs.ts`); the repo stays green at this phase
  boundary (`enabledModes: [learn, notes]` only — grows in later phases).

## Architecture

Donor script-segment evaluation: read the HTML, capture the `const DOMAINS=[…];` text between
`<script>` tags with an anchored regex, and evaluate it via `node:vm` `runInNewContext` with a
bare sandbox (`{}` — no `require`, `process`, or globals reachable). The donor is a
**third-party submodule pinned by commit** (captain-corgi repo), so its embedded JS is
data-to-validate, never trusted code; shape assertions run on the parsed result. The capture +
eval helper lives in a **side-effect-free module** (`gh600-extract-lib.ts`) that the CLI
imports — unlike the phase-3 precedent (`extract-gh-packs.ts`), which runs its CLI at module
top level and therefore cannot be imported by tests. The HTML→block converter is a separate
importable module so it is unit-testable without running the extractor.

Block conversion mapping (donor HTML patterns → `CoreBlock`):

| Donor pattern | Hub block | Notes |
| --- | --- | --- |
| leading `<p>…</p>` | `{kind:'md'}` | inline HTML → markdown |
| `<div class="callout c-key\|c-fact\|c-tip\|c-warn">` | `{kind:'tip'}` | keep `<strong>` label as `**…**` prefix |
| `<table class="cmp-table">` | `{kind:'table'}` | first `<tr>` = headers |
| `<ul class="fact-list">` | `{kind:'list'}` | drop `<span class="fi">` arrow icons |
| `<div class="code-block">` | `{kind:'code'}` | strip highlight `<span>`s; language heuristics: yaml ( `key:` lines ) / json ( quoted keys ) / `text` |
| `<div class="ap-row">` | `{kind:'table'}` headers `["Anti-pattern","Correct"]` | one row per `ap-row` (`ap-bad`/`ap-good` text, labels stripped) |
| inline `<strong>/<em>/<code>` | `**…**` / `_…_` / `` `…` `` | HTML entities decoded |

Lesson fields: `id: lesson-gh600-<topicId>` (donor ids `d1t1`… preserved), `domainId:
gh600-d1..d6`, `moduleId: gh600-dN-mod`, `minutes: 8`, `title` = topic name, `summary` =
domain `desc` (donor has no per-topic summary). Domain titles come from
`docs/practice-example-*.md` headers (official names); weights parse from `"15–20%"`
(en-dash) to `{min, max}`.

## Related Code Files

- Create: `scripts/extract-gh600-pack.ts` (thin CLI: `--part curriculum|questions|exams|labs|all`,
  `--dry-run`; provenance header like extract-gh-packs; imports the lib below — no top-level
  side effects beyond `main()` so it stays import-safe)
- Create: `scripts/gh600-extract-lib.ts` (side-effect-free donor capture + `node:vm` eval
  helpers; shared by the CLI and the Phase-4 parity suite)
- Create: `scripts/gh600-blocks.ts` (pure converter: topic HTML string → `Block[]`)
- Create: `scripts/gh600-blocks.test.ts`
- Create: `content/gh-600/subject.json`, `domains.json`, `modules.json`, `lessons/*.json` (23)
- Modify: `package.json` (add `"content:extract-gh600": "tsx scripts/extract-gh600-pack.ts"`)
- Modify: `vite.config.ts` (test include += `scripts/**/*.test.{ts,tsx}` — converter tests;
  keep the `.claude/skills` exclusion comment accurate)
- Modify: `src/shell/views.test.tsx` (one-line installed-pack count pin: "Pack not installed"
  2→1, "Installed" 3→4 — flips when `gh-600` installs over its placeholder; also the home
  card accent visibly changes hub-coral → deep-teal)

## Implementation Steps

1. Add the npm script + extend vitest include; verify a trivial scripts-dir test runs.
2. Write the DOMAINS capture + eval in the extractor; assert shape (6 domains, 23 topics, 30
   quiz entries) and fail loudly on drift — this pins the donor contract the parity test later
   re-checks.
3. Write `gh600-blocks.ts` against the mapping table; unit-test on real donor bodies:
   `d1t1` (md + 3 callouts + fact-list + tip), `d1t3` (ap-rows), `d2t1` (table + code-block),
   `d3t3` (json code-block). Assert block-kind sequences and spot content strings.
4. Emit curriculum files (`--part curriculum`); re-running is idempotent (stable JSON output,
   trailing newline, 2-space indent — same format as existing packs).
5. Run `npm run content:check` and `npm test`; both green with `gh-600` in `learn` mode.

## Success Criteria

- [x] `npm run content:extract-gh600 -- --part curriculum` emits 26 files (1 subject + 2 root + 23 lessons).
- [x] Converter unit tests green, covering every donor pattern at least once.
- [x] `content:check` green: `gh-600` validates with `[learn, notes]`.
- [x] Hub dev server renders the GH-600 workspace: 6 domains → module → 23 lessons.

## Risk Assessment

- **Generated-HTML drift:** the converter assumes regular donor markup. *Signal:* extractor
  shape-assertion or converter test failure on donor bodies. *Response:* extend the mapping
  table for the new pattern — never hand-edit emitted files.
- **Donor eval safety:** the donor is a third-party submodule (not same-repo) — evaluate
  captured segments only via `node:vm` with a bare sandbox; never `new Function`/`eval` with
  ambient scope. *Signal:* capture regex missing (throws before evaluation). *Response:*
  tighten the anchor, keep the shape assertions as the post-parse guard.
- **Placeholder-count test flip:** installing `gh-600` changes `views.test.tsx` expected
  counts and the home card accent. *Signal:* that test fails at step 5. *Response:* the count
  pin edit is in this phase's file list — expected, not a regression.
