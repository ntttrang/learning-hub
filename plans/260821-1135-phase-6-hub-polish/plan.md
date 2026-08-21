---
title: "Phase 6 Hub Polish"
description: "Roadmap Phase 6 of docs/unified-learning-hub-plan.md: land the in-flight global ⌘K search + topbar redesign, add hub-level achievements, a cross-subject SRS review queue, dashboard aggregation across subjects, and an add-subject scaffolder that stamps a working starter pack."
status: completed
priority: P1
effort: 3d
tags: [feature, hub, polish, search, srs, achievements]
blockedBy: []
blocks: []
created: 2026-08-21
---

# Phase 6 Hub Polish

## Overview

Execute **roadmap Phase 6** of `docs/unified-learning-hub-plan.md` §7 — the last
content-free platform phase before CI/CD. Five deliverables: dashboard
aggregation across subjects, a cross-subject SRS review queue, global ⌘K search,
achievements/streaks surfacing, and an **add-subject scaffolder** that stamps a
new pack from the schema.

**Starting state (scouted 2026-08-21):** Phases 0–5 are complete and committed —
five packs installed (`dp-800`, `gh-200`, `gh-900`, `gh-600`, `fixture`), shared
UI + engines live, all prior plans closed. Part of Phase 6 **already exists
uncommitted in the working tree**: a complete, tested ⌘K search stack
(`src/engines/search.ts`, `src/shell/search-entries.ts`, `src/shell/TopbarSearch.tsx`
+ tests, 26 passing) wired into a redesigned topbar in `AppShell.tsx` (streak
chip, theme group, profile chip; styles in `app.css` / `theme-toggle.css`;
mockup updated). This plan **lands that work rather than rebuilding it**.

Also scouted: `cc-subject-data` store already tracks a hub-level streak
(`bumpStreak` rides every recording action); `srs.dueCards()` exists per deck;
donor `learn-dp-800/src/lib/store.ts` has an 8-entry `ACHIEVEMENTS` model;
`QuizRunner` is single-subject-coupled (records via `recordQuiz(subjectId, …)`),
so the cross-subject queue reuses the question-registry primitives instead.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Land the in-flight ⌘K search + topbar redesign as the verified baseline | P1 |
| 2 | Hub-level achievements: generalized from donor dp-800, persisted in `cc-subject-data`, earned from real **and** migrated history | P1 |
| 3 | Cross-subject SRS review queue at `#/review` that records back per-subject | P1 |
| 4 | Dashboard aggregation: per-subject progress, due counts, streak, achievements on the hub home | P1 |
| 5 | `npm run content:new` scaffolder stamps a valid, working starter pack (roadmap's done-when) | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Land Topbar + Search Baseline](./phase-01-start.md) | Pending |
| 2 | [Achievements Store](./phase-02-achievements-store.md) | Pending |
| 3 | [Review Queue](./phase-03-review-queue.md) | Pending |
| 4 | [Dashboard Aggregation](./phase-04-dashboard-aggregation.md) | Pending |
| 5 | [Subject Scaffolder](./phase-05-subject-scaffolder.md) | Pending |
| 6 | [End To End Verification](./phase-06-end-to-end-verification.md) | Pending |

Phase order rationale: achievements (2) before dashboard (4) because the
dashboard renders the achievements strip; review queue (3) before dashboard (4)
because the dashboard surfaces due counts produced by the queue engine.
Scaffolder (5) is independent of 2–4.

## Success Criteria

- [ ] ⌘K / Ctrl+K opens search from anywhere; subjects, lessons, and labs across
      all installed packs **and** roadmap placeholders are findable; results are
      keyboard-navigable (↑ ↓ Enter Esc) and jump to the target route.
- [ ] Achievements persist in `cc-subject-data`, award exactly once, and are
      earned by migrated legacy history too (no streak bump on import).
- [ ] `#/review` shows due cards from every subject with SRS decks, interleaved;
      finishing records one partial attempt per touched subject (scope
      `hub-review`), so SRS ingest + streak ride the existing store actions.
- [ ] Hub home shows per-subject progress (lessons/labs), due counts, streak,
      and earned achievements; a fresh browser shows honest zeros.
- [ ] `npm run content:new -- --id <id> --code <CODE> --title <T> --accent <token>`
      produces a pack that passes `content:check`, appears in the hub with
      exactly the modes it has content for, and whose sample lesson + question
      work end-to-end. **(Roadmap done-when.)**
- [ ] Full `npm test`, `npm run lint`, `npm run build` green; themes
      (Auto/Light/Dark/Night) + keyboard nav hold on every new surface.

## Constraints & Non-Goals

- **Constraints:** static-hostable client-only app; `localStorage` persistence
  behind the existing adapter; no core-code edits to add a subject (scaffolder
  only writes files under `content/` + docs); keep the Captain Corgi brand and
  the platform content-integrity contracts (`docs/unified-learning-hub-plan.md` §8).
- **Non-goals (roadmap):** backend/auth/cloud sync (Phase 7 territory: CI/CD);
  authoring real content for new subjects; changing exam scoring math; new
  learning tools in the tools registry.

## Key Decisions (pre-made, from scouting)

| Decision | Choice | Why |
| --- | --- | --- |
| Landing in-flight search | Verify + commit as-is (fix only real gaps) | 26 tests pass; rebuilding would waste done work |
| Achievements location | Hub level in `cc-subject-data`, not per-subject | Donor model generalized; computable from store state alone — no content lookups at award time |
| Achievement defs vs donor | Drop donor's 2 content-dependent entries (`domain-1`, `all-labs`); keep the store-computable 6 + add volume-based ones → 8 total | Store stays content-free (architecture line: shell/engines don't own content) |
| Import awards achievements | Yes — `importLegacyData` runs evaluation but never bumps streak | Migrated history is the user's real history; re-runs stay idempotent (skip-if-present import already guarantees this) |
| Review queue recording | Group results by subject → one `recordQuiz(subjectId, …)` per subject | Reuses SRS ingest, caps, and streak logic; no new store action |
| Queue UI | New hub-level `ReviewQueue` view over registry primitives (`renderQuestion`/`gradeQuestion`/`initialAnswer`/`answerReady`) | `QuizRunner` is coupled to one subject + one attempt; a thin sibling avoids refactoring a proven loop mid-phase |
| Scaffolder output | Minimal-but-real: 1 domain, 1 lesson, 1 question, empty labs/exams/comparisons, `enabledModes: [learn, practice]` | "Working empty pack" that satisfies the integrity contract (modes ↔ content) instead of a dead shell |
| Store version | Keep `SUBJECT_DATA_VERSION = 1`; `merge` default-fills the new `achievements` key | Merge is already tolerant; no migration needed |

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| `ExamAttempt`/`QuizAttempt` shapes constrain per-subject partial recording | Confirm required fields against `src/sdk/types.ts` before writing the queue recorder (phase 3 step 1) |
| Pass-mark detection for `mock-pass` achievement | Read how `ExamReview`/`scoring` derive pass/fail; reuse the same field, don't re-derive |
| Vite glob won't see scaffolder output until dev-server restart | Document in scaffolder output ("restart dev server"); `content:check` runs fresh via vitest |
| Due-badge re-render cost on every keystroke | Memoize due count; it derives from store decks, not search state |
| Scope creep into backend/sync (roadmap non-goal) | Storage adapter already swappable; nothing here touches it |

## Cross-Plan Dependencies

None. Plans for roadmap Phases 0–5 are all `completed`; this plan blocks
nothing. Roadmap Phase 7 (CI/CD) will follow separately.

<!-- slug: phase-6-hub-polish -->
