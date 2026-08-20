---
title: "Phase 1: Content-seam fault tolerance + pack extractor"
status: done
---

# Phase 1: Content-seam fault tolerance + pack extractor

## Overview

Two enablers land **before** any real pack exists. First, make the content seam
per-pack fault tolerant *without weakening the strict CI path*: today one
invalid pack makes `listSubjects()` throw for all packs and the hub home falls
back to placeholders-only (`src/shell/subjects.ts:96-105`; the comment at
`:87-93` defers this fix to "the content-seam work that ships with the second
real pack" — this is that work). Second, build the one-off extractor script
that transforms `learn-gh-200` TS content into hub pack files, proven in
`--dry-run` mode against the donor inventory. No pack lands in this phase.

## Requirements

- [x] **Strict/lenient split** (red-team finding A — the cut matters):
      `FileContentSource.listSubjects()` and `loadAllContent()` stay **strict**
      (throw on any invalid pack — this is what `content:check` runs on,
      `src/content/registry.ts:17-19`); add a non-loading enumeration
      (e.g. `listSubjectIds()`) to the `ContentSource` surface, and do the
      per-pack try/catch in `src/shell/subjects.ts` `installedCards()` over
      those ids — invalid pack logs a descriptive error (id + first validation
      issue) and is skipped; valid packs still listed
- [x] **Failure UX pinned** (finding FM-8): invalid pack with a placeholder
      (gh-900/gh-200) → placeholder card + `console.error`; invalid pack
      without a placeholder (fixture today) → absent from home + `console.error`.
      Console-only is the accepted permanent channel for this plan
- [x] **Testable seam**: the per-pack isolation loop is a pure exported helper
      (e.g. `loadSubjectsTolerant(ids, loadId)` in `content-source.ts` or
      `subjects.ts`) — no `import.meta.glob` stubbing possible
      (`content-source.ts:433-446` has no injection point)
- [x] **Strictness test with ≥2 packs**: invalid + valid pack together → valid
      pack listed by the tolerant path AND strict `loadAllContent()` still
      throws. (A fixture-only corruption test false-passes — with one pack the
      list empties and `length > 0` fails for the wrong reason,
      `content-check.test.ts:13`)
- [x] **Deterministic pool order** (finding F): sort each subject's file bucket
      by path inside `createFileContentSource` before assembly (mirrors the
      existing id sort at `content-source.ts:472`) — vite's glob key order is
      **not a documented contract** (vite 8), and golden-paper parity must not
      rest on it
- [x] `scripts/extract-gh-packs.mts` with `--cert gh900|gh200|both` and
      `--dry-run`; flag→directory mapping is explicit (`gh900` → `content/gh-900/`,
      `gh200` → `content/gh-200/` — `subject.id` must equal the directory,
      `content-source.ts:307-313`); startup assertion `subject.id === dirName`
- [x] Dry-run prints per-pack planned file counts matching the donor inventory
      exactly: gh900 153 files (6 root JSON + 7 lessons + 140 questions);
      gh200 112 files (7 root JSON incl. comparisons + 5 lessons + 100
      questions); plus docs-partition sizes
- [x] Extractor runs under Node ≥22.6 native type-stripping (`node scripts/…mts`,
      this machine is Node 24) — add `tsx` only if a runtime limitation forces it;
      extractor is inside the quality gates: `tsc` covers `scripts/` (extend
      `tsconfig.node.json` or add `tsconfig.scripts.json`) and lint covers it
      (`oxlint src scripts`)

## Architecture

Strict/lenient split (finding A): `loadAllContent()` is literally
`contentSource.listSubjects().map((s) => contentSource.loadSubject(s.id))`
(`registry.ts:17-19`), so making `listSubjects()` lenient would make
`content:check` structurally unable to fail on an invalid pack. The lenient
path therefore lives in the shell: `listSubjectIds()` enumerates directory ids
without loading; `installedCards()` try/catches each `loadSubject(id)` through
the pure helper. The fixture pack has no placeholder — under isolation an
invalid fixture simply vanishes from home with a console error; that is the
documented behavior, and the strictness test keeps CI able to see it.

Extractor: a plain TS module importing donor content directly:

```
scripts/extract-gh-packs.mts
  imports: ../learn-gh-200/src/content/{domains,questions,labs}/index.ts,
           exams.ts, compare.ts, docs.ts     (verified pure data + local type imports)
  mapping: scout-report.md §4.1 table, embedded as code
  emits:   content/gh-900|gh-200/{subject,domains,modules,docs,labs,exams}.json,
           content/gh-200/comparisons.json,
           content/<cert>/lessons/<lessonId>.json,
           content/<cert>/questions/<domainId>-q<NN>.json
```

Justification (honest, post red-team): provenance record for ~265 committed
generated files + staged per-cert landing. Not GH-600 reuse — that donor is
static HTML and shares nothing with typed-TS extraction.

Transform rules (from scout §4.1 — authoritative):

- `subject.json`: hand-authored `SUBJECT_META` table inside the script —
  gh-900 `{id:'gh-900', code:'GH-900', title:'GitHub Foundations', subtitle:'GitHub Foundations · 7 domains', accent:'corgi-orange', enabledModes:['learn','labs','practice','exams','notes','revision']}`,
  gh-200 `{id:'gh-200', code:'GH-200', title:'GitHub Actions', subtitle:'GitHub Actions · 5 domains', accent:'hub-green', enabledModes:['learn','labs','practice','exams','compare','notes','revision']}`.
  Titles are pinned here because `PLACEHOLDER_SUBJECTS` has no `title` field
  (`subjects.ts:14-22`) and `SubjectSchema.title` is required; subtitles are
  **corrected**, not copied — the placeholder strings say "4 domains" for both
  (`subjects.ts:49,57`) and the real counts are 7 and 5. Descriptions copy
  verbatim from the placeholders.
- domains: `{id, order: number, title, weight: {min: weightMin, max: weightMax}, summary}`.
- modules: one per subSkill `{id, domainId, order: <index within domain, 1-based>, title, docIds}`.
- lessons: unnest `domain.lesson`; `moduleId` = the domain's **first** subSkill
  id; blocks `h3`→`{kind:'heading', text, level:3}`, `p`→`{kind:'md', body}`,
  `list|code|tip|table` unchanged.
- questions: `stem`→`prompt`, `docId`→`docIds:[docId]`, `subSkillId`→`moduleId`,
  drop `cert`; options → `{id:'o'+(i+1), text}`; `single.correct` = id at
  `answerIndex`; `multi.correct` = ids at `answerIndexes`; `order`: options from
  `items` in authored order, `correct` = full id sequence; `fill`:
  `codeTemplate`→`template`, blank `alternatives: []` omitted; `bug` unchanged.
- labs: `steps: string[]` → `steps: [{instructions}]`; outcomes/checks direct.
- exams: `{id, title, durationMinutes: 100, passingScore: 700, selection:
  {kind:'sampled', domainPlan, seed}}`; mock-b adds `excludeExamIds:
  ['<cert>-mock-a']`; drop `cert` + `totalQuestions`.
- comparisons (gh200): `columns: [{id:'github', label:'GitHub Actions'},
  {id:'other', label: counterpart}]`, `rows: [{aspect: dimension, cells:
  {github, other}}]`.
- docs: **referenced-only partition** — union of explicit `docIds`/`docId`
  fields (subSkills, questions) plus a `[label](docId)` regex scan over all
  lesson/lab/comparison string content (donor `content.test.ts` approach);
  emits only referenced ids per pack (automatically includes gh-200's
  `repo-deploy-workflow` + `repo-actions-runs` living-lab links).
- JSON: 2-space indent, trailing newline, `domainPlan` keys emitted in domain
  order (insertion order preserved by loader).

## Related Code Files

- Create: `scripts/extract-gh-packs.mts`
- Modify: `src/sdk/content-source.ts` (file-bucket path sort; `listSubjectIds()`
  or equivalent + pure tolerant-load helper export)
- Modify: `src/shell/subjects.ts` (per-pack try/catch via the helper)
- Modify: `src/content/registry.ts` (expose the new enumeration if it lives at
  the source level; keep `loadAllContent()` strict)
- Modify: `src/content/content-check.test.ts` (multi-pack strictness test)
- Modify: `src/shell/SubjectWorkspace.test.tsx` (its `vi.mock('../content/registry')`
  stubs the whole module — any new export must be added to that mock in the
  same change or these tests TypeError)
- Modify: `package.json` (`content:extract-gh` script entry; lint scope
  `oxlint src scripts`), `tsconfig.node.json` or new `tsconfig.scripts.json`
  (cover `scripts/`)
- Read-only: `learn-gh-200/src/content/**`

## Implementation Steps

1. Read `src/sdk/content-source.ts` + `src/shell/subjects.ts` +
   `src/content/registry.ts`; implement the strict/lenient split exactly as
   pinned above (strict source, tolerant shell, pure helper).
2. Write the isolation + strictness tests (invalid+valid together; tolerant
   path lists valid, `loadAllContent()` throws). Update the registry mock in
   `SubjectWorkspace.test.tsx`. Confirm existing suites stay green.
3. Add the file-bucket path sort in `createFileContentSource`; note it in a
   comment as the golden-paper order contract.
4. Author `scripts/extract-gh-packs.mts` with the full mapping table above;
   `--dry-run` prints planned counts and docs-partition sizes without writing.
   Add tsconfig + lint coverage for `scripts/`.
5. Verify dry-run counts against the inventory table (scout §3.2). Investigate
   any mismatch before proceeding — a count mismatch means the mapping is wrong.
6. Run `npm test`, `npm run content:check`, `npm run lint` — all green.

## Todo

- [x] Strict/lenient split + pure helper implemented
- [x] Multi-pack strictness test + tolerant-listing test green
- [x] Registry mock updated in SubjectWorkspace.test.tsx
- [x] File-bucket sort landed (golden order contract)
- [x] Extractor script with mapping table + dry-run, under tsc+lint gates
- [x] Dry-run counts match donor inventory exactly
- [x] Gates green

## Success Criteria

- With one stubbed invalid + one valid pack: valid pack listed, invalid
  isolated with logged error; strict `loadAllContent()` still throws on the
  invalid one.
- File buckets are path-sorted regardless of glob emission order.
- Dry-run output: gh900 = 153 files, gh200 = 112 files, docs-partition sizes
  printed and matching.

## Risk Assessment

- **Donor imports pull runtime deps** → mitigation: content files are pure
  data (verified by two independent reviewers); if an import surprises, import
  the per-file collections directly instead of index barrels.
- **New ContentSource member breaks the interface's consumers** → consumers
  enumerated: `subjects.ts:99`, `registry.ts:18`, `content-check.test.ts:13`,
  `SubjectWorkspace.test.tsx` (mocked). Additive member + mock update in the
  same change.
- **Extractor is throwaway temptation** → keep it committed as the provenance
  record for ~265 generated files; it stays under tsc + lint gates.
- Signal a mapping assumption broke: dry-run counts deviate from the inventory
  table → stop and re-diff donor types before emitting anything.

## Execution Notes (2026-08-20)

- Shipped as `scripts/extract-gh-packs.ts` run via tsx, not `.mts` under
  Node-native type stripping: the donor's extensionless relative imports do
  not resolve under type stripping, so the planned fallback became the path.
  tsc + lint gates cover the script as planned.
- The extractor imports `extractDocIds` from the donor's
  `learn-gh-200/src/utils/inline.ts` directly, so the docs partition uses the
  donor's own tokenizer semantics rather than a reimplementation. This fixed
  a real bug: a strip-spans-first scan treated the code-span label
  ``[`.github/workflows/deploy.yml`](repo-deploy-workflow)`` as non-link
  text and dropped doc `repo-deploy-workflow` on the first gh-200
  extraction; donor semantics count it as a link (gh-200 docs 48→49 after
  the fix).
