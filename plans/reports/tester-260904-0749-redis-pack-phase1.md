# Redis pack phase 1 — independent verification (tester)

Date: 2026-09-04 · Branch: `feat/redis-pack` · Scope: `content/redis/` + one-line bump in `src/shell/views.test.tsx`
Mode: report-only. Nothing modified except this report. Throwaway check scripts lived in `/tmp`.

## 1. Gates

| # | Command | Result | Detail |
|---|---------|--------|--------|
| 1 | `npm run content:check` | PASS | 1 file, 5/5 tests, 1.87s. Full pipeline (glob → Zod → graph validation → registry coverage) ran over all 7 installed packs, redis included |
| 2 | `npm test` | PASS | 65 files, 613/613 tests, 14.42s. 0 failed, 0 skipped |
| 3 | `npm run lint` | PASS | oxlint `src scripts`, silent, exit 0 |
| 4 | `npm run build` | PASS | `tsc -b && vite build`, exit 0, built in 595ms. Warnings: direct-eval from `node_modules/gray-matter` and >500kB chunks — both known/deferred, pre-existing |

## 2. Counts — all exact

- domains: 8 · modules: 8 · lesson `.mdx`: 8 · question `.json`: 91 · labs: 3 · exams: 1
- no `welcome.*` filename and no `welcome` substring anywhere in the pack's 105 files
- ids unique across domains/modules/exams/labs; question ids unique and match filenames
- installed packs: exactly 7 (`dp-800, fixture, gh-200, gh-600, gh-900, languages, redis`) — matches the `views.test.tsx` 6→7 bump, whose diff is exactly that one line + comment

## 3. Exam feasibility (redis-dev-mock-1)

- `domainPlan` 12+6+9+11+8+5+4+10 = **65** ✓
- `durationMinutes: 90` ✓ · `passingScore: 700` ✓ · `seed: 20260903` ✓ · `selection.kind: "sampled"` ✓
- plan ≤ pool for all 8 domains. Pool semantics: `sampleIds` (`src/engines/sampling.ts:62`) filters **all** of the domain's questions (bank + lesson-attached kc), so tightest margins are rc-core-persist 5/7 and rc-core-security 4/6. The sampler throws (`sampling.ts:65-68`) if any domain comes up short, and feasibility is also a load-time check via `registry.ts` → `assemblePaper`.
- Observation (not a defect): under a bank-only pool, rc-core-persist (5 > 4) and rc-core-security (4 > 3) would be infeasible. Fine today; would break if the sampler ever excluded lesson-attached questions.

## 4. Wiring — all clean

- All 24 kc questions: `question.lessonId` → that lesson lists the question in `questionIds`. Bidirectional set equality — no orphans either direction.
- All 67 bank questions carry no `lessonId`.
- For all 8 lessons, the lesson's `moduleId` resolves and its `domainId` equals the lesson's `domainId`.
- Extra checks: every question's `domainId`/`moduleId` pair is consistent (kc vs its lesson; bank vs the module table); kc = exactly 3 per domain across all 8 domains; all 3 labs reference valid domain + lesson with domain alignment; `comparisons.json` optionIds all resolve to real lessons.

## 5. Modes

`enabledModes: [learn, labs, practice, exams, notes, revision]`
- learn ← 8 modules + 8 lessons, every lesson body substantive (>200 chars) ✓
- labs ← 3 labs ✓ · practice ← 91 questions ✓ · exams ← 1 exam ✓
- notes / revision are user-data modes — no content required ✓

## 6. Question validity — independent per-kind audit (mirrors `validate.ts` zod + answerable rules exactly)

Kind distribution: single 36, multi 13, order 5, matching 10, fill 11, codeReading 12, bug 4 = 91. Difficulty: beginner 23, intermediate 49, advanced 19 (no `challenge` — optional enum, fine).

0 failures across: option id uniqueness and non-empty text; correct-in-options; multi ≥2 correct + ≥1 distractor; order correct = exact permutation of option ids; matching lefts unique; fill `___` placeholder count == blanks count; bug `buggyLineIndex` in range; prompt/explanation present; difficulty in enum.

Note: duplicate `right` values in matching are schema-legal and semantically legitimate (e.g. GET and ZSCORE both O(1)); the validator only requires unique lefts.

First-pass false alarm: my initial audit flagged 26 "failures" — entirely my script's wrong field guesses (`fill` uses `template` + `{answer, alternatives}`; I guessed `text`/`answers`) and an over-strict dup-rights rule. Corrected audit above is clean. Pack files were right.

## 7. Determinism

- Empirical: drove the repo's real `sampleIds` via `npx tsx` over the real pack JSON. Two runs: **byte-identical including order**; 65 served, 65 unique; per-domain served counts exactly equal `domainPlan`; `seed+1` yields a different paper (the seed is load-bearing); 16/65 picks are lesson-attached kc questions (expected — pool is all domain questions).
- Suite coverage: `src/engines/sampling.test.ts` (mulberry32 same-seed sequence, different-seed divergence, golden paper, plan-insufficiency throws) and `src/engines/exam-paper.test.ts` ("serves the seeded sample … deterministically") — all green within the 613.
- Observation: no redis-specific golden test pins the redis paper's exact served ids; only fixture-based generic tests do. Empirically verified here instead.

## 8. Corruption sweep (second pair of eyes on the prior injected-token issue)

105 files, all strict-UTF-8 parseable. Non-ASCII limited to legitimate typography (`· × – — →`). 0 hits for mojibake patterns, control chars, `<|`/`|>`-style token artifacts, or TODO/FIXME/lorem markers. Prose in sampled files reads coherent.

## Verdict

**PASS.** All four gates green; every requested pack-specific check passes with exact counts; wiring is bidirectionally complete; the exam is feasible and deterministic under the app's real sampler; no corruption artifacts found.

Non-blocking observations:
1. Exam draws 16/65 questions from lesson-attached kc questions; only a bank-only pool interpretation (not the app's) would make D6/D7 infeasible.
2. A redis-specific golden exam-ids test would pin the seeded paper against future sampler drift.

Unresolved questions: none.

Status: DONE
Summary: All four gates green (content:check 5/5, vitest 613/613, lint clean, build exit 0) and every pack-specific check passed — counts exact (8/8/8/91/3/1, no welcome files), exam feasible and byte-identical across seeded runs, wiring bidirectionally complete, no corruption artifacts.
Concerns: none blocking; two observations above (bank-only-pool hypothetical, missing redis golden test).
