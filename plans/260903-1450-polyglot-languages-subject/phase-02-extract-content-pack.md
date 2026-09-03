---
phase: 2
title: "Extract content pack"
status: completed
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Extract content pack

## Overview

Implement the provenance extractor that transforms the vendored donor JSON into
a validating `content/languages/` pack — every learn lesson, lab, practice
problem, framework challenge, quiz question, and compare topic migrated exactly
once, with each authored remap marked inline like the DP-800 extractor does.

## Requirements

- Functional: `npm run content:extract-polyglot` regenerates `content/languages/` from `learn-polyglot/data/`; output passes `content:check`.
- Non-functional: donor values verbatim; transformations are code, not hand-edits; authored derivations marked inline; output deterministic (re-run → byte-identical).

## Architecture

A one-off tsx script, but structured like `scripts/extract-gh600-pack.ts`, not
the dp-800 one: derivation helpers and builders live in a side-effect-free
`scripts/polyglot-extract-lib.ts`, and `scripts/extract-polyglot-pack.ts` is a
thin entry that runs only under an explicit entry guard
(`if (process.argv[1]?.endsWith('extract-polyglot-pack.ts'))`) — red-team
finding 5: the dp-800 extractor runs unguarded at module top level, so a test
importing it would execute a full extraction mid-suite. The parity test (Phase
3) imports the lib only.

The entry reads `learn-polyglot/data/**`, transforms per the mapping below, **prunes
`content/languages/` to exactly its generated file set before writing** (red-team
finding 6: `content:new` stamps starter files — `welcome` lesson/question on the
`d-foundations` domain — that a write-only extractor never removes, and they
hard-fail `content:check` with `unresolved-ref` once real domains replace the
scaffold's), validates in-script with the pack's own Zod schemas, then writes.
Deterministic + idempotent: same input → byte-identical output (stable key
order, no timestamps).

**Section → tool mapping (locked in plan.md):** learn + framework-overview →
`learn`; lab + practice + framework-challenges + coding-quiz → `labs`;
quiz (mcq/multi/output/fill) → `practice`; compare → `compare`; sampled mixed
exam → `exams`; notes/revision are engine-backed, enabled with no content.

**Domain/module spine:** 4 domains, one per language (`plg-java`, `plg-go`,
`plg-python`, `plg-ruby`; codes `JAVA`/`GO`/`PYTHON`/`RUBY`; weight omitted —
no exam weights exist), 2 modules each (`plg-<lang>-core` from learn lessons;
`plg-<lang>-framework` from framework lessons/labs/challenges).

## Related Code Files

- Create: `scripts/polyglot-extract-lib.ts` (side-effect-free: derivations, id helper, builders — imported by the extractor entry and the Phase 3 parity test)
- Create: `scripts/extract-polyglot-pack.ts` (thin guarded entry)
- Modify: `package.json` — add `content:extract-polyglot`: `tsx scripts/extract-polyglot-pack.ts`
- Create: `content/languages/**` (generated: subject.json, domains.json, modules.json, docs.json, lessons/, questions/, labs.json, exams.json, comparisons.json)
- Modify: `README.md` unified-platform section — one clause: pack count 5→6, provenance note "moved from the donor Polyglot Revision Hub (ntttrang/polyglot-hub), archived on ship"

## Implementation Steps

1. **Id discipline:** red-team verified the donor's ids are already globally
   unique across all files and 100% kebab-clean — so the shared id helper is
   `plg-` + verbatim donor id (prefix-only; namespaces the storage and
   review-queue keys), plus a uniqueness assertion that **fails loudly**
   rather than silently suffixing (finding 11: a suffix rule would break the
   parity bijection, which Phase 3 computes through this same helper
   function). The helper lives in `src/engines/polyglot-ids.ts` — engines must
   not import from `scripts/`, and scripts already import from `../src/` —
   and `polyglot-extract-lib.ts` re-exports it so the parity test has one
   import path. Domains/modules are authored ids (`plg-java`, `plg-java-core`,
   …).
2. **Lessons (learn.json)** — donor
   `Lesson{id, title, level, tags, estMinutes, body, codeSamples?, docs?}` →
   hub `Lesson` in module `plg-<lang>-core`:
   - `body` → one leading `{kind: 'md', body}` block
   - `codeSamples[]` → `{kind: 'code', language, code}` blocks in order
   - `estMinutes → minutes`, `level → difficulty`
     (junior→beginner, mid→intermediate, senior→advanced)
   - `tags` → **dropped, marked derivation** (finding 4: the strict hub
     `LessonSchema` has no `tags` field — emitting it fails Zod on all 100
     lessons). The lib exports the drop as a counted derivation; parity
     asserts `donorTagCount === droppedTagCount` so the loss is never silent
   - `docs[]` → `docIds` into `docs.json`; donor `resources[]` (file-level)
     have no lesson to attach to — carried into `docs.json` registry only
     (authored touch, marked inline)
   - `questionIds`: none — polyglot quizzes are language-scoped, not
     lesson-scoped; do not fabricate linkage
3. **Framework overview lesson** (from `framework.json` `FrameworkMeta{name,
   tagline, overview, docs?}`) per language, module `plg-<lang>-framework`:
   `title = "<Lang> · <framework name>"`, one `md` block = tagline + overview,
   `docs → docIds`, `minutes = 10` (authored, marked).
4. **Labs (lab.json)** — donor
   `Lab{title, goal, steps[], starterCode, language, solution, expectedOutput, docs?}`
   → hub `Lab` (domain `plg-<lang>`):
   - `summary = goal` (authored derivation, marked inline)
   - steps[0] `{instructions: donor steps as a markdown ordered list}`
   - steps[1] `{instructions: 'Starter code' + fenced `<language>` block +
     "Solution" section with fenced solution and expected output}`
   - `docs[]` → inline links in the step instructions (finding 13: the hub
     `LabSchema` has no `docIds`); when a `DocLink.note` exists, its text is
     inlined next to the link so it stays visible
5. **Practice problems** (practice.json `problems[]`) → labs, `summary = prompt`
   (authored, marked), single step: instructions = prompt + starter-code fence +
   "Solution" section (fenced solution + expected output), `difficulty` mapped.
6. **Framework challenges** → labs, same shape as practice problems.
7. **Coding quiz questions → labs** (decision 5). `Lab` has no tags field, so
   provenance lives in the id (`…-quiz-coding-…`) and
   `checks: ["Self-check: compare your program's output with the expected output."]`.
8. **Questions (quiz.json)** — `mcq→single` (`answer→correct`),
   `multi→multi` (donor `answers→correct`), `output→fill` (decision 6):
   template = the donor's code as **plain unfenced text** (finding 12: the hub
   renders fill templates inside a `<pre><code>` — markdown fences would show
   literally; the stem stays only in `prompt`, so it renders once) ending with
   `Predicted output: ___`, `blanks: [{answer}]` — the hub's `normalizeBlank`
   grader is a verified looser superset of polyglot's trim-exact grading,
   including the 12 multiline answers (probe in Phase 3 documents this).
   `fill→fill`: **marker rewrite is a marked derivation** (finding 3: donor
   templates use `_____` (5 underscores); the hub validator and renderer split
   on `___`) — every underscore-run of ≥3 collapses to exactly `___`, and each
   resulting blank gets an answer (`answer`→blanks[0].answer,
   `accept→alternatives` replicated per blank). The one donor template with
   two markers and one answer (`<_____>test</_____>`) gets the donor answer
   replicated to both blanks — matching the donor's replace-all semantics;
   marked inline, parity-asserted. Assert `explanation` non-empty on every
   question in-script; fail loudly rather than authoring content.
9. **Comparisons** (compare/topics.json): one `Comparison` per topic, columns =
   the four language domains, `rows = [{aspect: topic.dimension, cells}]`,
   `samples = [{label: topic.title, code}]` when snippets exist. 9 topics →
   9 comparisons.
10. **Exam:** one `sampled` exam — `plg-exam-1` "Languages knowledge check",
    60 min, `domainPlan {plg-java: 10, plg-go: 10, plg-python: 10, plg-ruby: 10}`,
    fixed `seed` (20260903), default passingScore.
11. **docs.json** — every donor `DocLink{title, url, note?}` across
    learn/framework → `Reference{title, url}` (donor has no dates; no
    fabrication). `note` strings are **dropped as a marked derivation**
    (finding 13: `ReferenceSchema` is strict and has no `note` field); parity
    asserts `donorNoteCount === droppedNoteCount` (41 total: 19 learn
    resources + 22 lab docs — the lab ones stay visible via step 4's inlining).
12. **In-script validation:** pack Zod schemas + global id uniqueness (via the
    shared helper) + per-language/per-section count assertions equal to donor
    counts (100 lessons, 16 labs, 20 practice, 424 quiz questions total:
    109/105/105/105, 9 comparisons, framework challenges per donor), before any
    write; `--dry-run` prints the migration summary and writes nothing.
13. Add npm script `content:extract-polyglot: tsx scripts/extract-polyglot-pack.ts`;
    run, iterate on validation failures until clean, update the README clause.
14. Commit: extractor + pack + package.json + README clause — conventional
    commit, e.g. `feat: extract Languages pack from vendored polyglot donor`.

## Success Criteria

- [x] Extractor run is clean and idempotent: re-run leaves `git diff` empty; `--dry-run` writes nothing; no scaffold ghost files survive (pack dir pruned to the generated set)
- [x] Every donor entity migrated exactly once; in-script assertions equal donor file counts exactly (100 learn lessons + 4 framework overviews, 16 labs, 20 practice, 424 questions minus those remapped to labs, 9 comparisons)
- [x] Remaps and drops are lossless in meaning: `output→fill` keeps code + answer in a plain-text template; `_____` → `___` everywhere; `fill` keeps `accept` as alternatives; practice/framework/coding became labs with starter + solution + expected output; dropped `tags`/`note` strings are counted in parity assertions
- [x] `npm run content:check` green; explanations non-empty on all migrated questions
- [x] Pack appears with honest modes: `["learn", "labs", "practice", "exams", "compare", "notes", "revision"]`

## Risk Assessment

Risk: mass conversion hits schema edges the scout didn't see (option ids not
present in the donor's own options, empty `explanation`, single-option mcqs).
**Signal:** extractor's in-script validation fails in bulk. **Response:** fix
in the transform — widen with `alternatives` where the hub grader is stricter,
never weaken schemas, never hand-edit generated files: regenerate from the
donor via the extractor instead.
