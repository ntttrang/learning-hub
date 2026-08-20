# Phase 6 Tester Report — Exam engine and review

Date: 2026-08-20. Scope: independent validation of Phase 6 per
`plans/260819-2348-phase-2-shared-ui/phase-06-exam-engine-and-review.md`.
Probe file `src/ui/__probe.test.tsx` was used for adversarial checks and deleted
afterwards (verified: `ls src/ui | grep -i probe` → no match).

## Gates

| Gate | Result | Evidence (actual output) |
|---|---|---|
| `npm test` | PASS — 41 files / 381 tests, 0 failed | `Test Files 41 passed (41)` / `Tests 381 passed (381)`, exit 0. Re-run after probe cleanup: identical |
| `npm run lint` | PASS | `oxlint src` clean, exit 0 |
| `npm run build` | PASS (2 warnings) | `✓ built in 176ms`, exit 0. Warnings: direct `eval` in `node_modules/gray-matter/lib/engines.js` and chunk >500 kB after minification — both infra-level, no phase-6 dependency added |
| `npm run content:check` | PASS — 1 file / 3 tests | `Test Files 1 passed (1)` / `Tests 3 passed (3)`, exit 0 |

## Acceptance Criteria

1. **Complete fixture sitting records exactly one ExamAttempt, lands on review, SRS ingest** — ✓
   - Untimed full flow: `src/ui/ExamEngine.test.tsx:120-160` (4-question sampled paper, `attempts` length 1, hash `…/exam-practice/review/0`, inflight cleared).
   - Timed flow: `src/ui/ExamEngine.test.tsx:187-220` (confirm dialog → 1 attempt, timed `true`); auto-submit path `:242-261` also records exactly 1.
   - Store wiring: `src/engines/subject-store.ts:154-162` — `recordExam` prepends attempt (cap 50) and calls `ingestResults(data.srs, attempt.results, now())`.
   - SRS ingest unit-tested at `src/engines/subject-store.test.ts:103-111`; probe confirmed end-to-end from an engine submit: card created for blank `q-multi`, none for correct `q-single` — correct per the only-after-first-miss contract at `src/engines/srs.ts:53-67`.
   - Probe: double-click on "Submit and score" still records exactly 1 attempt (`submitted` ref guard, `src/ui/ExamEngine.tsx:110-112`).

2. **Reload resumes paper/answers/flags/clock; expired auto-submits** — ✓ (one note)
   - Resume: `src/ui/ExamEngine.test.tsx:222-240` — seeded inflight mounts straight into the sitting with answers (`1/2 answered`), flag, timer; storage read once via lazy `useState` (`src/ui/ExamEngine.tsx:75`).
   - Expired-on-return: `src/ui/ExamEngine.test.tsx:242-261` — mount with past deadline submits immediately (effect at `src/ui/ExamEngine.tsx:134-136`), duration reconstructed and capped at 600 s.
   - Note: navigator **position** is not resumed (probe below). The phase contract's inflight shape (`phase-06…md:23`) has no position field and Success Criterion 2 lists only "paper, answers, flags, and clock" — contract-conformant, logged as a UX observation.

3. **Review replays the exact deterministic paper with learner's answers marked** — ✓
   - Both sitting and review derive the paper from the single `assemblePaper` (`src/ui/ExamEngine.tsx:70`, `src/ui/ExamReview.tsx:59-62`); determinism asserted in `src/engines/exam-paper.test.ts:16-26` (same seed → same order, twice).
   - Replay test: `src/ui/ExamReview.test.tsx:93-130` — paper identity asserted once via `assemblePaper` (`:98-101`), learner answer marked (`q-opt-correct` class `:111-112`), blank → `Unanswered`/`Left blank` (`:115-116`), explanation + doc + lesson links (`:117-129`).

4. **No scoring math in the engine** — ✓
   - `src/ui/ExamEngine.tsx:6,113` — the only score source is `scoreAttempt(exam, paper, answers)`; the attempt payload copies `score.scaledScore/passed/perDomain/results` (`:120-124`). Grep for `900|100 +|accuracy` across the three exam UI files returns display-only uses of `score.scaledScore`, `attempt.scaledScore`, and `passingScore ?? 700` captions. `ExamReview.tsx:92` `correctCount` counts stored `results` for the caption; verdicts themselves are the stored `scoreAttempt` outputs.
   - Scale math lives solely in `src/engines/scoring.ts:57-60` (`toScaledScore`).

5. **All four gates green** — ✓ (see Gates).

## Probe Results

Throwaway file `src/ui/__probe.test.tsx` (7 tests, all passing, 3/3 stable re-runs; deleted).

| Probe | Outcome | Evidence |
|---|---|---|
| Navigator aria labels: answered + flagged + current combined | PASS — `aria-label="Question 1, answered, flagged"`, `aria-current="true"`, classes `answered flagged current`; cell 2 has no `aria-current` | Probe; label built at `src/ui/ExamEngine.tsx:282-285`. Existing test covered flagged-only (`ExamEngine.test.tsx:174`) |
| Untimed sitting never auto-submits even with stale deadline in stored inflight | PASS — sitting shown, timer counts up (`elapsed`), 0 attempts, re-saved inflight has `deadline: undefined` | Probe seeding `timed: false` + past deadline. Load-side drop at `src/engines/exam-inflight.ts:82`; save-side covered by `src/engines/exam-inflight.test.ts:37-45` |
| Resume restores position | **NOT RESTORED** — after navigating to Q2 and remounting, Q1 of 2 is shown | Probe (asserts actual behavior). Contract shape (`phase-06…md:23`) omits `position`; answers/flags/clock do resume |
| `formatClock` minutes over 60 stay as-is | PASS — `75:00`, `100:00`, `61:05` | Probe; `src/ui/ExamEngine.tsx:23-28` (mm:ss, no hour folding). No existing test covered >60 min |
| Review "Sit again" restarts fresh | PASS — intro shown, timed default (`Begin — 10 minutes`), `0/2 answered` after begin | Probe. Submit clears inflight (`src/ui/ExamEngine.tsx:126`) and the route hop remounts the engine (`key` at `src/shell/tool-views.tsx:125`) |
| Cross-subject inflight discarded on visit | PASS — same `examId` stored under another `subjectId` → intro + `loadInflight()` null | Probe; subject+exam both must match (`src/ui/ExamEngine.tsx:76-79`), discard effect `:92-94`. Complements cross-exam test `ExamEngine.test.tsx:263-277` |
| Double submit guard (extra) | PASS — two clicks on "Submit and score" → 1 attempt | Probe; `submitted` ref `src/ui/ExamEngine.tsx:110-112` |
| SRS ingest end-to-end (extra) | PASS — `q-multi` card present after engine submit, `q-single` absent (only-after-first-miss) | Probe; `src/engines/srs.ts:56-74` |

## Test-Quality Audit

Mandated patterns (phase file `:52`, `:73-81`) — all present:

- Untimed happy path: `ExamEngine.test.tsx:120-160`. ✓
- Mount-with-expired-deadline auto-submit (no tick waits): `ExamEngine.test.tsx:242-261`. ✓
- No real-time waits: grep for `waitFor|setTimeout|advanceTimers|useFakeTimers|sleep` across all six phase test files → zero matches. ✓
- Paper identity asserted exactly once in the review test: `ExamReview.test.tsx:98-101`. ✓
- Deadline math as pure function: `sittingSeconds` suite `ExamEngine.test.tsx:288-304`. ✓

Flake risk: low. The resume test seeds a 9-minute deadline margin (`:228`); the
auto-submit duration assertion (exactly 600) is deterministic because it derives
from the cap, not wall time (`src/ui/ExamEngine.tsx:36-47`); sampled papers use
the fixed seed 42 (`content/fixture/exams.json:11`), so no `Math.random`
instability. Probe file passed 3/3 consecutive runs.

jsdom hygiene (`afterEach` resets store fixture key + localStorage + hash):

- `ExamEngine.test.tsx:88-94`: all three (+ `clearInflight`). ✓
- `ExamIndex.test.tsx:30-34` and `ExamReview.test.tsx:61-65`: store + localStorage only, **no `window.location.hash = ''`**. Neither file navigates (renders are direct, no `navigate()` calls), so there is no actual pollution today — consistency gap only.
- `BreakdownBar.test.tsx`: no `afterEach` — pure component, touches no globals. Acceptable.

Coverage gaps worth noting (none mandated): `formatClock` >60 min and combined
navigator aria labels were untested until probed; both pass — candidate
additions if the team wants them pinned.

## Defects Found

No blocking defects. Observations:

1. **Low (UX, contract-conformant)** — Resume does not restore navigator
   position; a mid-sitting reload returns the learner to question 1 (answers,
   flags, and clock do resume). Path: `src/ui/ExamEngine.tsx:86`
   (`useState(0)` — position is not in `InflightSitting`,
   `src/engines/exam-inflight.ts:15-26`). The phase contract's shape omits it,
   so this is a deliberate scope line, not a bug. If the behavior is later
   wanted, pin it with a test like:
   ```tsx
   // src/ui/ExamEngine.test.tsx (addition)
   it('resumes at the question the learner was viewing', () => {
     seedInflight({ subjectId: 'fixture', examId: 'exam-case-study', timed: false,
       startedAt: Date.now() - 30_000, answers: {}, flags: [] });
     const view = draw('exam-case-study');
     fireEvent.click(screen.getByRole('button', { name: 'Question 2' }));
     view.unmount();
     draw('exam-case-study');
     expect(screen.getByText('Question 2 of 2')).toBeInTheDocument(); // FAILS today: shows Question 1 of 2
   });
   ```
2. **Info** — `ExamIndex.test.tsx` / `ExamReview.test.tsx` afterEach missing the
   hash reset used by `ExamEngine.test.tsx:93`. Harmless today (no navigation in
   those files); align if the convention is meant to be uniform.
3. **Info** — Build warnings (gray-matter `eval`, >500 kB chunk) pre-date this
   phase's surface; no action required here.

## Recommendation

Phase 6 passes independent validation: all four gates green, all five success
criteria met with evidence, probes confirm the adversarial edge behaviors
(combined aria states, untimed-deadline immunity, fresh restart, cross-subject
discard, double-submit guard). Approve. Optional follow-ups, in priority order:
pin `formatClock` >60 min and the combined navigator aria label as permanent
tests (both already proven green); decide whether navigator position should join
the inflight shape in a future phase; align the two afterEach blocks on the hash
reset.

Unresolved questions: none.

Status: DONE
Summary: All four gates green (381/381 tests, lint, build, content:check) and all five acceptance criteria verified with file:line evidence; 7 adversarial probes pass (3/3 stable), one contract-conformant UX note that resume does not restore navigator position.
Concerns/Blockers: none blocking; see Defects Found for two informational items.
