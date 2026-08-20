---
title: "Phase 4: Parity tests"
status: done
---

# Phase 4: Parity tests

## Overview

Prove "parity with the old app" mechanically, for the things only a
cross-repo comparison can prove: golden exam papers (sampling parity) and
pack-level counts (extraction fidelity). Deliberately thin — every invariant
the hub validator already enforces at load time is *not* re-asserted here
(`content:check` is the authoritative gate for schema-level content
integrity; this suite runs inside the normal `npm test`).

## Requirements

- [x] New `src/content/pack-parity.test.ts` loading real packs via the content
      source (same path `content-check.test.ts` uses)
- [x] **Golden papers**: `assemblePaper` for all four exams (seeds 9001, 9002,
      2001, 2002) produces the exact 35-id lists copied verbatim from
      `learn-gh-200/src/content/exams.test.ts`; mock-a ∩ mock-b = ∅ per cert
- [x] **Counts** (extraction fidelity): domains 7/5; modules 34/41; lessons
      7/5; questions 140/100 (20 per domain); labs 7/6; exams 2/2;
      comparisons 0/2; docs = the Phase 1 dry-run partition sizes
- [x] **Inline doc-link scan**: every `[label](docId)` link in lesson blocks,
      lab steps/outcomes/checks, and comparison cells resolves in that pack's
      `docs.json` (donor `extractDocIds` approach) — closes the one genuinely
      unvalidated gap (inline links are not schema-validated)
- [x] Full `npm test` green; parity suite runs in the normal vitest pass
- [x] NOT included (validator-duplicated or donor style, per red-team finding
      G): option-id uniqueness, option counts per kind, fill blank-count
      equality, explanation length, per-domain kind minimums — all either
      enforced by `validate.ts` at load (e.g. dup option ids) or donor
      authoring style with no hub contract

## Architecture

One test file, grouped `describe` blocks per concern, driven by a small table
`[{cert: 'gh-900', …expected}, {cert: 'gh-200', …expected}]`. Golden lists are
pasted as constants — snapshots of donor behavior, not values to recompute.

**Ordering note (finding F)**: a golden mismatch is always an ordering bug,
and the order contract is the Phase 1 file-bucket path sort inside
`createFileContentSource` — not vite glob internals (vite ^8.2.0 documents no
ordering guarantee). If goldens diverge: diff the per-domain loaded order
against donor authored order (`q01..q20`) and fix file naming or the sort,
never the golden list.

Inline-link scan: regex `\[([^\]]+)\]\(([^)]+)\)` over every string field of
lesson blocks (`md` bodies, `list` items, `tip` texts, `table` cells), lab
strings, and comparison cells; assert each captured docId is a key of the
pack's docs registry. (Question prose has zero inline links — scout-verified —
skip it.)

## Related Code Files

- Create: `src/content/pack-parity.test.ts`
- Read-only: `learn-gh-200/src/content/exams.test.ts` (golden lists),
  `learn-gh-200/src/content/content.test.ts` (extractDocIds approach)
- Modify (only if a genuine content bug surfaces): `scripts/extract-gh-packs.mts` + regenerate

## Implementation Steps

1. Copy the four golden 35-id lists from donor `exams.test.ts` into the test as
   constants; write the paper-assembly assertions (per exam: exact list; per
   cert: A/B disjointness).
2. Add the counts table per pack (docs sizes from the Phase 1 dry-run output).
3. Add the inline doc-link scan.
4. Run; on failure, diagnose per Architecture (ordering first, mapping second,
   golden lists last — never).
5. Full `npm test` + `npm run lint`.

## Todo

- [x] Golden papers ×4 + disjointness assertions
- [x] Counts per pack (incl. docs partition sizes)
- [x] Inline doc-link scan
- [x] Gates green

## Success Criteria

- All four golden papers match donor snapshots exactly.
- Counts + doc scans green in the normal `npm test` run.
- A deliberately renamed question file (simulated locally) fails the golden
  test — ordering sensitivity proven, then reverted.

## Risk Assessment

- **Golden mismatch after correct extraction** → first suspect file naming /
  the Phase 1 sort, second `domainPlan` key order in emitted exams.json; the
  sampler and ids are verbatim so divergence is mechanical — find it by
  comparing the first divergent domain.
- **Inline-scan regex over-matches** (markdown links that are real URLs) →
  donor semantics: parenthesized token that is NOT `http(s)://` is a docId;
  mirror that rule.
- **Test brittleness vs future content edits** → intended: these are parity
  pins for the migration; editing content later updates the pins deliberately.
