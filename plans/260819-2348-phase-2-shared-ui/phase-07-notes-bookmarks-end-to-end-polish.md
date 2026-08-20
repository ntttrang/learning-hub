---
title: "Phase 7: Notes, bookmarks, end-to-end polish"
status: done
---

# Phase 7: Notes, bookmarks, end-to-end polish

## Overview

Close user data (notes + bookmarks views, lesson-embedded notes), turn on the
fixture's `notes` mode, then run the acceptance sweep: every enabled mode
end-to-end, themes + a11y across the new surface, docs touched where
user-visible behavior changed.

## Requirements

- [x] `ui/LessonNotes.tsx` (dp-800 NotesPanel port): one note per lesson, draft editing, save (`upsertNote`) / delete (`deleteNote`), updated stamp; empty-body save deletes.
- [x] LessonViewer gains its Notes section (mounted with lesson context).
- [x] `ui/Notes.tsx` tab view: all notes (linked to their lessons via the index) + Bookmarks section — bookmarked lessons with links into Learn and un-bookmark action; honest empty states for both.
- [x] Fixture `subject.json` `enabledModes` gains `"notes"`; `content:check` + validators stay green.
- [x] End-to-end sweep test: home → fixture card → workspace; each enabled mode renders real fixture content (learn lesson incl. knowledge check, lab, practice run, exam sitting, compare table, notes tab).
- [x] a11y pass over all new views: keyboard-operable tabs/navigator/ordering controls, visible focus (`--ring-focus`), labeled controls, reduced-motion honored; fix what the sweep finds.
- [x] README updated where user-visible behavior changed (live modes, fixture subject, route shapes) — smallest owning surface only.

## Architecture

Notes and bookmarks read/write through `useSubjectDataStore`
(`upsertNote`/`deleteNote`/`toggleBookmark`) — no new persistence, no engine
changes. The Notes tab is a pure projection of the subject's user-data slice
joined against `SubjectIndex` for lesson titles/links.

## Related Code Files

- Create: `src/ui/LessonNotes.tsx`, `src/ui/Notes.tsx` (+ tests)
- Modify: `src/ui/LessonViewer.tsx` (notes section),
  `src/shell/tool-views.tsx`, `content/fixture/subject.json`,
  `src/shell/views.test.tsx` (or a new `src/app-flow.test.tsx` for the sweep),
  `README.md`
- Reference donors: `learn-dp-800/src/components/NotesPanel.tsx`,
  `learn-dp-800/src/app/{notes,bookmarks}/page.tsx`

## Implementation Steps

1. `LessonNotes` port (draft state keyed to the existing note; save/delete per dp-800 semantics).
2. Mount in `LessonViewer` above the completion footer.
3. `Notes` tab: notes list (title → lesson link, updated stamp, delete) + bookmarks section (lesson links via index, un-bookmark).
4. Add `"notes"` to the fixture's `enabledModes`; confirm validator + `content:check` pass (notes rides on user data — no content requirement).
5. Write the end-to-end sweep (App-level render, hash navigation, memory-adapter store): one flowing test per mode plus the cross-mode journey (lesson bookmark → notes tab shows it).
6. a11y audit pass: tablist arrow keys, navigator cells reachable+labeled, ordering up/down in tab order, focus rings on every interactive element, `prefers-reduced-motion` disables view transitions; fix findings.
7. README pass: update what the app now does (modes live for installed packs, fixture subject, routes); verify claims against source.
8. Final gates: `npm test && npm run lint && npm run build && npm run content:check`; mark phase/plan complete via `ak plan check`.

## Todo

- [x] LessonNotes + tests
- [x] Notes tab (notes + bookmarks) + tests
- [x] Fixture enabledModes += notes; content gates green
- [x] End-to-end sweep test across all six modes
- [x] a11y pass + fixes
- [x] README update (verified claims)
- [x] Final gates green; plan marked complete

## Success Criteria

- Roadmap Phase 2's done-when holds: the fixture pack renders end-to-end through every mode it enables.
- Notes taken on a lesson appear in the Notes tab and survive store round-trips; bookmarks made in a lesson appear there too.
- The a11y sweep reports no unlabeled controls, no keyboard traps, no focus loss on route change, and no motion when reduced-motion is set.
- All four gates green; plan files' checkboxes reflect reality.

## Risk Assessment

**Risk:** the e2e sweep becomes a brittle mega-test. **Signal:** unrelated UI
tweaks break it. **Response:** keep it as small per-mode tests + one
cross-mode journey, asserting on roles/labels (not DOM structure). **Risk:**
README scope creep into roadmap documentation. **Signal:** edits beyond
current-app behavior. **Response:** README describes only what the app does
today; the roadmap stays in `docs/unified-learning-hub-plan.md`.

## Close-out notes (2026-08-20)

Delivered: `LessonNotes` (dp-800 NotesPanel semantics preserved — one note per
lesson via `note-<lessonId>`, draft-null disabled Save, empty-body save
deletes, updated stamp) mounted in `LessonViewer` above the completion footer;
the combined `Notes` tab (notes with lesson links + bookmarks with Learn links
and un-bookmark, honest empty states, unknown lesson ids degrade away);
fixture `enabledModes` += `notes`; the `app-flow.test.tsx` sweep (per-mode
flows + the cross-mode bookmark/note journey, roles/labels only); the a11y
pass; and the README refresh (modes, routes, persistence — roadmap stays in
docs/).

a11y pass shipped: confirm-dialog focus lands on "Keep working" (`Button`
gained buttons-only `autoFocus` forwarding), Escape keeps working through a
window-level listener (survives a backdrop click dropping focus to body), and
`AppShell`'s content region became a `<main>` landmark that parks focus when a
route change unmounts the focused element — never stealing focus that survived
on shell chrome. Tabs/navigator/ordering were already keyboard-operable from
phases 4–6; focus rings and reduced-motion are the global token rules.

Verification: tester (DONE_WITH_CONCERNS) and code-reviewer
(DONE_WITH_CONCERNS) ran the full gates — final state 402/402 tests, oxlint
clean, tsc+build clean, content:check 3/3. Reports:
`reports/phase-07-tester.md`, `reports/phase-07-review.md`. Both risks held:
the sweep stayed role/label-based (no structural selectors), and the README
kept to current-app behavior.

Bugs caught between the two reviews and fixed:
- D1/F1 (HIGH, found independently by both agents): an unsaved `LessonNotes`
  draft bled into the next lesson because the learn path stays mounted across
  lesson hops — `key={lesson.id}` now remounts the editor per lesson, with a
  regression test driving the real App through the Next link.
- F2: dialog Escape moved to a window-level listener so it survives a
  backdrop click.
- F5: the store round-trip test now covers notes and bookmarks (the success
  criterion's letter), not just lessons/SRS/streak.

Deferred (with reasons, see reports): `aria-modal` without full focus
containment (donor parity; future dialog primitive); duplicate accessible
names when two lessons share a title (already stricter than the donor's bare
"Delete note").
