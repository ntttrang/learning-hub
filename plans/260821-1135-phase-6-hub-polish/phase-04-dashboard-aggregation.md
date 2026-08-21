---
title: "Phase 4: Dashboard Aggregation"
status: todo
priority: P1
effort: 5h
dependencies: [phase-02, phase-03]
---

# Phase 4: Dashboard Aggregation

## Overview

Turn the hub home from a static card list into a real dashboard: per-subject
progress (lessons, labs, best exam), due-review counts, streak band, earned
achievements strip, and continue-where-you-left-off links — aggregated across
every installed pack from the store + content, with honest zeros for a fresh
browser.

## Context

- `HubHome.tsx` currently renders hero + merged subject cards (installed +
  placeholders) with no user data at all.
- All inputs exist: `cc-subject-data → subjects[id]` (lesson statuses,
  completedLabs, attempts, `lastLessonId`, srs decks), `content` totals via
  `loadSubjectWithIndex`, hub `streak` + `achievements` (Phase 2), due counts
  (Phase 3's engine), and the topbar streak chip (Phase 1).
- Roadmap wording: "Dashboard aggregation across subjects … achievements/streaks".
- Placeholder cards must stay honest: no stats for uninstalled subjects.

## Requirements

- [x] `src/engines/hub-stats.ts` (pure, tested):
  - `buildSubjectStats(content, data, now)` → `{ lessonsDone, lessonsTotal,
    labsDone, labsTotal, bestExamPct, quizzesTaken, dueCount }`
    (dueCount via Phase 3's queue engine; `null`-safe for empty data).
  - `buildHubOverview(...)` composing per-installed-subject stats + hub totals
    (lessons done/total across subjects, labs, total due, achievements earned
    count vs total, streak current/longest).
- [x] `HubHome.tsx` upgrades, keeping the existing hero + card grid:
  - each **installed** card gains a progress row: lessons x/y (bar), labs x/y,
    best exam %, and a due-count chip linking `#/review` when > 0;
  - a hub stats band: streak (current/longest), total lessons done, total due
    (link to `#/review`), achievements earned n/8;
  - an achievements strip: latest earned with title + date, unearned shown
    dimmed with title only (no spoilers beyond the definition's own text);
  - "Continue" affordance per installed subject using `lastLessonId` (resolves
    through the subject index; hidden when unset);
  - placeholder cards unchanged ("Pack not installed").
- [x] Fresh-browser state: all zeros render deliberately (0-day streak, 0/8
      achievements, no bars) — no NaN, no missing layout.
- [x] New `src/shell/HubHome.test.tsx` covering: stats per installed card,
      placeholder has none, due chip links `#/review`, fresh-store zeros,
      continue link resolves `lastLessonId`.

## Implementation Steps

1. Write `src/engines/hub-stats.ts` + `hub-stats.test.ts` (empty store,
   partial progress, imported-data shape, one-subject-only).
2. Rework `HubHome.tsx`: pull store state, build the overview once per render
   (content totals are static; reuse the `listSubjectCards` memo pattern —
   don't re-load packs per keystroke-level render).
3. Styles in `src/styles/app.css`: stats band, progress rows, achievements
   strip — follow the mockup's stat-band and chip language; all four themes +
   reduced motion.
4. Tests for `HubHome` (jsdom; mock store state per scenario).
5. Run `npm test`, `npm run lint`.

## Todo

- [x] Stats engine + tests
- [x] HubHome redesign + styles
- [x] HubHome tests (incl. zero-state)
- [x] Gates green

## Success Criteria

- A browser with migrated + fresh activity shows accurate aggregated progress
  per subject and hub-wide; a fresh profile shows honest zeros; the
  achievements strip reflects Phase 2 persistence; nothing about placeholder
  cards changes.

## Risk Assessment

- **Risk:** loading five packs per home render is slow. *Signal:* noticeable
  home-mount jank. *Response:* pack-derived totals are computed once
  (module-level memo keyed like `subjects.ts`); store-derived numbers stay
  live. Packs are already statically imported (bundle), so this is render
  cost, not network.
- **Risk:** imported legacy data lacks fields the stats assume (e.g.
  `lastLessonId`). *Signal:* hub-stats tests with `importLegacyData` output
  shapes. *Response:* every stat null-safe; continue link hidden when the
  lesson id no longer resolves in the pack.
- **Risk:** stats band becomes a "chart dashboard" scope creep. *Response:*
  text + bars only (roadmap says aggregation, not visualization); no charts.
