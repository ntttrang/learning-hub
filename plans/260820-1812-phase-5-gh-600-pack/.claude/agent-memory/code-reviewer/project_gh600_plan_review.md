---
name: gh600-plan-review-facts
description: Verified donor/hub facts from the Phase 5 GH-600 plan review (2026-08-20) — plan evidence tables contained errors worth re-checking in future phases
metadata:
  type: project
---

Phase 5 GH-600 plan (plans/260820-1812-phase-5-gh-600-pack) review found the plan's
evidence table wrong on several verifiable facts. Future reviews of content-pack plans
should re-verify donor claims with grep before trusting them.

**Why:** the plan asserted lab filenames `lab-{00..07}.md` (actual: `lab-00-bootstrap.md`
etc.), a Q-array md5 `1e418759…` (actual `2cecb566…` for the same byte-identical
arrays), and a ~360-question bank (actual 390 uniques under the plan's own dedup key;
quiz/exam overlap is 0). The donor lab template is NOT uniform across the 8 files.

**How to apply:** for learning-hub donor plans, run the counts/md5s yourself against the
`learn-*` submodule files; treat "verified" claims in plan evidence tables as unverified
until reproduced. Donor numbering gotcha: study-plan domain ids are numeric 0–5, exam
question `d:` values are 1–6.

Also verified sound (safe to rely on): `scripts/extract-gh-packs.ts` executes its CLI at
module top level (import-unsafe — relevant when tests want to share extractor helpers),
and `src/content/pack-parity.test.ts` uses golden literals only, never reads donor files.
