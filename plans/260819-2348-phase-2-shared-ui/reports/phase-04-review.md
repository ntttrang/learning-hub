# Phase 4 code review — question renderers and practice

Reviewer: code-reviewer subagent (ak-cook mandatory gate). Reviewed by direct
read — the workspace is not a git repository, so no diff baseline; grader
freeze verified by pinned grading tests + donor comparison
(`learn-gh-200/src/utils/grade.ts`). Independently re-ran vitest, `tsc
--noEmit`, and oxlint.

## Overall assessment

The renderer rewrite is faithful to the locked architecture: renderer/viewer
split clean, grader semantics pinned by tests and matching donor behavior
(modulo the documented, pre-existing `normalizeBlank` case-insensitive
superset), `Answer = string[]` end to end, CSS token-only with no hex, tests
substantive (assert payloads, aria, classes, store calls). Phase landed with
defects the reviewer's probes demonstrated; all were fixed by the controller
in the same session (see Resolution log).

## Findings and resolutions

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| B1 | blocker | Scratch probe file `src/sdk/registry/__scratch-phase4.test.tsx` left failing in tree during review window | Stale at review time — the tester had deleted it; suite 313/313 when re-checked. Probes promoted to permanent regressions instead |
| B2 | blocker | `QuizRunner.tsx` doc links emitted `href={doc.url}` from the registry, bypassing the `isExternalUrl` single-href policy (javascript:/data: urls would become clickable) | Fixed: `docLinks` now filters through `isExternalUrl(doc.url)`; non-http registry urls degrade away like every other path |
| H1 | high | Verdict graded `answers[id] ?? initialAnswer(q)` but finish/record graded `answers[id] ?? []` — a no-move order question (seeded answer satisfies readiness without emitting `onAnswer`) showed "Correct" yet recorded wrong, corrupting SRS ingest | Fixed: shared `answerFor(question)` helper used by verdict, record, and finish paths. Regression test: no-move order run records 1/1 correct |
| H2 | high | Matching `chosen()` used `token.split('::')[1]`, truncating rights that themselves contain `::` (std::vector): pick redisplays blank, correct answers styled missed | Fixed: `token.slice(String(leftIndex).length + 2)` strips only the index prefix. Regression test covers full token emission, redisplay, and clean reveal |
| M1 | medium | `QuizRunner` not keyed by scope in `PracticeView` — a hashchange between scopes reused run state; stale position beyond the new bank length crashed on `current.id`, violating fallback-never-blank | Fixed: `key={`${subjectId}:${id}`}` on the runner |
| L1 | low | Module chips carried a hover affordance but were inert spans | Resolved by removing the hover rule (nested `<a>` inside the card anchor would be invalid HTML; chips documented as informational) |
| L2 | low | `aria-label` on a bare `<span>` for the correct-answer reveal | Fixed: `role="note"` added |
| N1 | nit | `KIND_LABELS[kind]` renders empty Pill for extension kinds | Fixed: `?? kind` fallback in both QuizRunner Pill sites |
| N2 | nit | A domain with id `all` would shadow the everything-run scope | Deferred to the real-pack phase alongside the Zod url tightening (schema freeze stands) |

## Explicit ak-cook checks

- **(a) Acceptance criteria:** all 10 requirement bullets met and test-verified
  after the H1/H2/B2 fixes; 8 were met at review time.
- **(b) Blast radius:** graders byte-equivalent in semantics to pinned tests;
  `Answer = string[]` holds end to end; renderers never mutate props;
  SubjectWorkspace change additive (overview branch untouched);
  `PracticeIndex` copies before sorting — pack cache not mutated.
- **(c) Contracts:** `renderQuestion` 5th param, widened handler types, and
  `DocResolver | undefined` are additive and in-phase.
- **(d) Patterns:** donor loop structure faithfully ported; tokens only across
  all four theme blocks; lucide-react icons; reduced-motion covered by the
  global guard for the one new transition. (dp-800 donor noted as off-disk at
  review time; hub tests carry the assertions.)
- **(e) Gates:** post-fix — vitest 315/315, tsc clean, oxlint clean, build ok
  (known chunk-size warning, deferred), content:check 3/3.

Status: DONE
Summary: Architecturally faithful phase; two high defects and one policy
bypass found and fixed in-session with regression tests added; suite green at
315/315.
