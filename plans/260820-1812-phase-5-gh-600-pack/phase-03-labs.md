---
phase: 3
title: "Labs"
status: completed
priority: P1
effort: "0.5d"
dependencies: [2]
---

# Phase 3: Labs

## Overview

Convert `learn-gh-600/docs/labs/lab-00-bootstrap.md` … `lab-07-capstone.md` (descriptive
filenames) into 8 `Lab` records and switch on `labs` mode — completing the pack's donor
surface (study plan, exams, labs).

## Requirements

- Functional: 8 labs with title, summary, objective, scenario, steps (`### N.` sections),
  checks (validation checklist), outcomes; domain pinning `00→d1, 01→d1, 02→d2, … 06→d6, 07→d6`.
- Non-functional: no dead links in the hub — `scaffold/…` and `docs/practice-example-*.md`
  references are rewritten to donor-repo paths as inline code / hub-mode pointers, never
  relative URLs.

## Architecture

Markdown section mapping. The 8 donor labs come in **four section shapes** (verified by
heading survey — the parser asserts each file against its expected shape, not one template):

| Shape | Files | Sections present |
| --- | --- | --- |
| A | `lab-00-bootstrap.md` | Objective, Scenario, GitHub product path, Alternative tools, Steps (6× `###`), Validation checklist, **Exam practice connection** — no Domain objectives / Self-check / Anti-patterns |
| B | `lab-01-sdlc-architecture.md` | Objective, Scenario, Domain objectives, GitHub product path, Alternative tools, Steps (7×), Validation checklist, **Common anti-patterns to avoid**, Self-check — the only lab with anti-patterns |
| C | `lab-02-*.md` … `lab-06-*.md` | Objective, Scenario, Domain objectives, GitHub product path, Alternative tools, Steps, Validation checklist, Self-check |
| D | `lab-07-capstone.md` | Objective, Scenario, **Required artifacts**, Steps (8×), Validation checklist, **Completion criteria** — no product path / Self-check |

Destination for every section (no orphan headings):

| Donor section (shapes) | Lab field |
| --- | --- |
| `# Lab N: …` | `title` (donor heading verbatim) |
| labs-index card `<p>` one-liner | `summary` (from `gh600-labs-captain-corgi.html` cards) |
| `## Objective` (all) | `objective` (md) |
| `## Scenario` (all) | `scenario` (md) |
| `## Domain objectives` (B, C) | dropped from the lab; they duplicate module curriculum (the domain's module already carries the topic lessons) |
| `## GitHub product path` + `## Alternative tools` (A, B, C) | leading step `"Context — GitHub product path"` (both sections' content in it, md; content preserved, not lost) |
| `## Required artifacts` (D) | leading step `"Context — required artifacts"` (same slot as product path — every lab gets exactly one leading context step) |
| `## Steps` → `### k. Title` (all) | `steps[] {title, instructions}` (md body under each heading) |
| `## Validation checklist` (all) | `checks[]` (checkbox text) |
| `## Common anti-patterns to avoid` (B only) | trailing step `"Review common anti-patterns"` (bullets as md) |
| `## Self-check` (B, C) ("Review docs/practice-example-N.md questions a–b") | appended `checks[]` entry: `"Self-check: answer practice exam N, questions a–b, in Practice"` |
| `## Exam practice connection` (A only) | appended `checks[]` entry pointing at the linked practice exam in hub `practice` |
| `## Completion criteria` (D only) | appended `checks[]` entries (verbatim criteria text) |

**Step-count formula** (what Phase 4 pins): hub `steps.length` = donor `### ` heading count
+ 1 (leading context step — every lab has either product-path or required-artifacts)
+ 1 if the lab has anti-patterns (lab-01 only). Concretely: lab-00 → 7, lab-01 → 9,
labs 02–06 → `###`+1, lab-07 → 9.

- `minutes`: estimated per lab depth — 30 (labs 00–06) / 60 (lab-07 capstone); documented
  as estimates (donor has none).
- `outcomes`: donor "what we build" hero bullets apply to the whole track, not per-lab —
  omit rather than fabricate; the validation checklist carries the per-lab outcomes.
- Inline code spans and fenced blocks copy verbatim (lab md is already hub-markdown-compatible).
- `subject.json` final: `enabledModes: [learn, labs, practice, exams, notes, revision]`.

## Related Code Files

- Modify: `scripts/extract-gh600-pack.ts` (labs part: md section parser + index-card summaries)
- Create: `content/gh-600/labs.json` (8 records)
- Modify: `content/gh-600/subject.json` (+= `labs`)

## Implementation Steps

1. Add the md section parser with per-shape assertions: pin the 8 real filenames and each
   file's expected section list (shapes A–D above); fail on any unexpected or missing
   heading instead of silently dropping content.
2. Map to `Lab` records per the table; rewrite `scaffold/` links to inline code paths;
   rewrite self-check lines to hub-practice pointers.
3. Emit `--part labs`; `content:check` + `npm test` green.
4. Dev-server check: labs index lists 8 labs in order; a lab renders steps + checks.

## Success Criteria

- [x] `labs.json` holds 8 labs with step counts matching the formula above (parity pins exact numbers in Phase 4).
- [x] No relative `docs/…`/`scaffold/…` links resolve inside the hub UI.
- [x] `content:check` green with `labs` enabled; full suite green.

## Risk Assessment

- **Section-shape drift** (a heading renamed/added in a donor file, or a new lab file):
  *signal:* per-shape parser assertion names the file + section. *Response:* update the shape
  inventory and destination table; never fall back to silent skip.
- **Content loss through mapping** (sections with no target field): every observed section
  has a destination row; the assertion fails on any unassigned heading — visible, fixable.
- **Conditional sections misapplied** (e.g. anti-pattern logic run on labs without the
  section): the parser branches on the per-file shape, not on section presence probes —
  a shape-D file can never take the self-check branch.
