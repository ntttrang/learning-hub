# Exam index restyled to the DP-800 mock-exams page — 2026-08-21

## Context

User asked for the hub's exam tab to match
`https://ntttrang.github.io/learn-dp-800/exam/`. The donor source lives in-repo
(`learn-dp-800/src/app/exam/page.tsx` + `globals.css` cc-* classes), and the
hub's design tokens are already identical to the donor's, so this was a layout
port, not a re-theme. The hub's ExamIndex had been reusing the Practice view's
`practice-*`/`pill` classes since the DP-800 pack migration.

## Change

Exam index recomposed to the donor layout under scoped `exam-*` classes
(shared `practice-*`, `pill`, `btn` untouched so Practice/Compare don't shift):

- Two-column card grid (1 col ≤720px); each card is a `cc-card`-style panel
  (elevated bg, 1.5px soft border, r-lg, shadow-1) with hover lift
  (translateY −2px → shadow-2), graduation-cap icon head, description,
  hairline chips (question count, clock duration, `Pass 700/1000`, case-study,
  Sampled/Fixed), and a single accent "Start exam" CTA link.
- Consolidated full-width "Attempt history" card below (donor behavior):
  bordered row links per attempt (hover sunken bg), per-domain strength dots,
  pass/fail-colored scaled score; empty state message until first attempt.
- Domain dots use `color-mix(in srgb, var(--accent) N%, var(--border))` —
  hub Domains carry no per-domain accent color, unlike the donor.

Behavior contracts preserved: exam sitting routes, review links keyed by the
attempt's absolute index, newest-first ordering, orphan-attempt filtering, and
the honest no-exams empty state.

- `src/styles/views.css` — old `/* ---- Exam index ---- */` section replaced
  with the `exam-*` port.
- `src/ui/ExamIndex.tsx` — rewritten to donor structure (ExamCard /
  AttemptRow extraction).
- `src/ui/ExamIndex.test.tsx` — rewritten against the new contract (start-link
  hrefs + chips, empty history, consolidated rows with absolute review
  indexes, no-exams empty state).
- `src/app-flow.test.tsx` — exam journey click scoped inside the Practice-set
  card (the whole card is no longer one link; "Start exam" is).

## Verification

ExamIndex tests 4/4; full suite 583/583; `oxlint`, `tsc --noEmit`, `vite
build` clean (pre-existing >500kB chunk warning only). Headless-Chrome
screenshot of `#/subject/dp-800/exams` checked against the reference —
grid, chips, CTA, and history card all match; hub shell (rail/hero/tabs)
correctly unchanged. Dev server on :5173 is the user's own and was reused,
not restarted.

## Notes

`exam-head` is an unstyled semantic wrapper (title + lead grouping), matching
the donor's bare `<header>`. Chip pass-mark now reads `Pass 700/1000` where
the old pill showed `pass 700`.
