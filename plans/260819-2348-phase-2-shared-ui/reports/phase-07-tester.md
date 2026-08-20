# Phase 7 tester report — Notes, bookmarks, end-to-end polish

Date: 2026-08-20. Scope: plans/260819-2348-phase-2-shared-ui/phase-07-notes-bookmarks-end-to-end-polish.md.
All paths relative to repo root unless absolute. Verification ran on the working tree as found.

## Gates (exact results)

| Gate | Result | Detail |
|---|---|---|
| `npm test` | PASS, exit 0 | 44 test files, 401 tests, 0 failed/skipped. 6.1–9.1 s across two runs. Re-ran after probe cleanup: identical. |
| `npm run lint` | PASS, exit 0 | oxlint src, no findings. |
| `npm run build` | PASS, exit 0 | `tsc -b && vite build`, built in 289 ms. Two known/deferred warnings (phases 1–6 precedent): chunk 1,098.25 kB > 500 kB; direct `eval` in node_modules/gray-matter/lib/engines.js:43. |
| `npm run content:check` | PASS, exit 0 | 1 file, 3 tests. |

New suites counted in the 401: `src/ui/LessonNotes.test.tsx` (4), `src/ui/Notes.test.tsx` (4), `src/app-flow.test.tsx` (8).

## Acceptance Criteria

1. **Fixture renders end-to-end through every enabled mode — ✓**
   `content/fixture/subject.json:9` enables learn, labs, practice, exams, compare, notes. `src/app-flow.test.tsx` drives each: tabs list (26–45), learn incl. knowledge check + notes panel (47–59), labs (61–69), practice run (71–78), exam sitting incl. timer (80–92), compare (94–99), notes empty states (101–109), plus the cross-mode journey (111–139).

2. **Notes appear in the tab and survive store round-trips; bookmarks appear too — ✓ (round-trip proven by probe P5, not by the committed suite)**
   Cross-mode journey covers the visible half: bookmark (app-flow.test.tsx:120–121), note (124–127), both surfaced in the Notes tab with lesson links (130–138). Persistence through the real `StorageAdapter` → localStorage → rehydrate path is proven only by my throwaway probe P5 (see Probe Results); no committed test exercises that path.

3. **a11y sweep: no unlabeled controls, no keyboard traps, no focus loss on route change, no motion under reduced motion — ✓**
   - Labels: notes textarea labeled (LessonNotes.tsx:54); icon-only delete/un-bookmark buttons labeled (Notes.tsx:61, 118); bookmark chip carries visible text (LessonViewer.tsx:99–100).
   - No traps: exam dialog Tab forward/backward not intercepted (probe P7); Escape closes dialog (ExamEngine.tsx:358–360, test ExamEngine.test.tsx:204) and the mobile drawer (AppShell.tsx:39–46, test AppShell.test.tsx:93–104).
   - Focus loss: rescue parks on `<main tabIndex={-1}>` when the focused content link unmounts (AppShell.tsx:34–36, 108; test AppShell.test.tsx:108–127) and never steals chrome focus (test 129–144 uses the menu button; probe P6 extends to a rail link).
   - Reduced motion: global kill-switch app.css:460–469; the phase-7 notes block (views.css:1811 onward) adds no animation/transition of its own.
   - Visible focus: `.cc-body :focus-visible { box-shadow: var(--ring-focus) }` (tokens.css:454–457) applies app-wide via `<body class="cc-body">` (index.html:30), covering all new interactive elements; `.chip-toggle:focus-visible` (views.css:1029) additionally covers the bookmark chips.
   - Tabs keyboard: arrow-key navigation with focus-follows-selection (SubjectWorkspace.tsx:79–90; test views.test.tsx:132–133).

4. **All four gates green; plan checkboxes reflect reality — ✗ (gates yes; file state no)**
   Gates green above. But `phase-07-notes-bookmarks-end-to-end-polish.md` has `status: todo` with every Requirement and Todo checkbox unchecked, and `plan.md:79` still lists Phase 7 as Pending — while the implementation is observably complete (all files exist, all gates pass). The files under-claim, likely intentionally pending this verification + `ak plan check`; as written, criterion 4 is not met until they are updated.

## Probe Results

Throwaway file `src/__probe.test.tsx` (7 tests), deleted after the run (verified with `ls`). P2 was run twice: first asserting the desired behavior (failed — defect), then asserting observed behavior to document the full consequence chain.

| # | Probe | Outcome | Evidence |
|---|---|---|---|
| P1 | Editing a lesson note twice keeps ONE note (`note-<lessonId>` upsert) | PASS | Probe: 2 saves → store has 1 note, id `note-lesson-storage-models`, body = second edit. Store logic subject-store.ts:126–134 (replace by id, else prepend). Extends committed single-save test LessonNotes.test.tsx:51–67. |
| P2 | Switching lessons remounts notes with the other lesson's note (no draft bleed) | **FAIL — Defect D1** | Probe: typed draft on storage-models, clicked the Next lesson link; the next lesson's textarea shows the draft verbatim, and Save writes it under the NEW lesson id. Root cause: no `key` per route item — SubjectWorkspace.tsx:170 (`<ToolView … id={id} />`), tool-views.tsx:91 (LessonViewer unkeyed), LessonViewer.tsx:154 (LessonNotes unkeyed) — so `useState` draft survives the hop; LessonNotes.tsx:26 `body = draft ?? existing?.body` prefers the stale draft. |
| P3 | Notes tab lists newest note first | PASS | Probe: upsert older then newer → store order `[note-b, note-a]` (prepend, subject-store.ts:132) and rendered card order matches. Committed tests never assert ordering (Notes.test.tsx:45 lists two notes unordered). |
| P4 | A second subject's notes never leak into the fixture Notes tab | PASS | Probe: fixture + other-subject notes in store; Notes(fixture) renders only the fixture note. Namespacing per subject-store.ts:59–66. |
| P5 | Note + bookmark survive a persist/rehydrate cycle through localStorage (StorageAdapter path) | PASS | Probe: actions on `useSubjectDataStore` (default localStorage adapter) → raw `cc-subject-data` blob contains both → fresh `createSubjectDataStore()` rehydrates note body + bookmark. Exercises storage.ts:48–76 + persist merge subject-store.ts:169–184. No committed test covers this. |
| P6 | Route change with focus on a rail link does NOT steal focus | PASS | Probe: rail `FX-100` link focused, rerender with new route → still focused. Complements AppShell.test.tsx:129–144 (menu button). Guard is the `activeElement === body` check, AppShell.tsx:35. |
| P7 | Dialog a11y: Escape + autoFocus + Tab order reaches both actions, no trap | PASS | Probe: dialog contains exactly two focusable controls in DOM order `[Submit and score, Keep working]`, both enabled; Tab and Shift+Tab keydowns not default-prevented (natural order, no trap). Escape + autoFocus-on-safe-action already committed: ExamEngine.test.tsx:201–205, ExamEngine.tsx:358–360, 380. jsdom cannot move focus on synthesized Tab — DOM order + unprevented Tab is the strongest jsdom evidence. |

## Test-Quality Audit

- **e2e sweep is not brittle (Risk Assessment response honored).** `src/app-flow.test.tsx` asserts only roles/labels/text contracts: `getAllByRole('link', { name: … })`, `getByRole('tab'|'textbox'|'button'|'timer'|'heading', { name: … })`, `getByText`. Zero className/DOM-structure selectors — an unrelated CSS tweak cannot break it. It is sensitive to user-facing copy changes ('Before you begin', 'Three engines, one lake'), which is intended content-contract coupling. Comment block at lines 1–7 documents the rule; the exam test (85–87) even explains why it waits on the intro contract rather than a heading.
- **jsdom hygiene of the new files — clean.** `app-flow.test.tsx:13–23` resets hash, localStorage, and drops the `fixture` store key before and after every test. `LessonNotes.test.tsx:14–18` and `Notes.test.tsx:30–34` drop the fixture key + clear localStorage (they never touch the hash). Global `src/test-setup.ts` adds cleanup + localStorage clear between tests. Store assertions read `useSubjectDataStore.getState()` directly (no action spying), per the established convention.
- **Selector law respected** in both new components (LessonNotes.tsx:20–22, Notes.tsx:21–24 — stored arrays, defaults at use site), so no useSyncExternalStore loops.
- **Coverage gaps found (all probed green except P2):** double-edit stability, tab ordering, cross-subject isolation, and the localStorage round-trip have no committed tests. The round-trip (P5) is the most valuable to keep — it guards the actual persistence seam.

## Defects Found

### D1 (Moderate) — Unsaved notes draft bleeds across lessons and can be misattributed on save

- Path: `src/ui/LessonViewer.tsx:154` (mounts `<LessonNotes …>` without `key={lesson.id}`; likewise `src/shell/tool-views.tsx:91` and `src/shell/SubjectWorkspace.tsx:170` do not key by route item) + `src/ui/LessonNotes.tsx:25–26` (draft `useState` persists because the component is reused, not remounted, on a lesson hop; `body = draft ?? existing?.body ?? ''` then prefers lesson A's draft inside lesson B).
- Impact: type a draft on lesson A, click the Next-lesson link — the draft appears in lesson B's "Your notes" box. One more click on the now-enabled Save attaches lesson A's text to lesson B as `note-<lessonB>` (empirically confirmed by the probe: storage-models ends with zero notes, the next lesson owns the draft). Silent cross-lesson data misattribution on a completely realistic path.
- Why the port missed it: the donor `NotesPanel` lived under Next.js page routing, which remounts per page; the SPA port kept the state without the remount.
- Failing test (drop into `src/app-flow.test.tsx` after fixing):

```tsx
it('does not bleed an unsaved draft into the next lesson', async () => {
  window.location.hash = '#/subject/fixture/learn/storage-models';
  render(<App />);
  const box = await waitFor(() =>
    screen.getByRole('textbox', { name: 'Notes for Storage models' }),
  );
  fireEvent.change(box, { target: { value: 'unsaved draft about files' } });
  fireEvent.click(screen.getByRole('link', { name: /Next/ }));
  await waitFor(() =>
    expect(screen.queryByRole('textbox', { name: 'Notes for Storage models' })).toBeNull(),
  );
  expect(screen.getByRole('textbox', { name: /^Notes for / })).toHaveValue(''); // fails today
});
```

- Suggested fix (smallest, matches existing pattern): key the mount per lesson — `<LessonNotes key={lesson.id} subjectId={…} lessonId={lesson.id} … />` — mirroring the route-hop keys already used for QuizRunner/ExamEngine (tool-views.tsx:78, 126). An alternative (reset draft when `lessonId` changes inside LessonNotes) also works but adds state-lifecycle code.

### D2 (Low, process) — Plan file state does not reflect reality

- Path: `plans/260819-2348-phase-2-shared-ui/phase-07-notes-bookmarks-end-to-end-polish.md` (frontmatter `status: todo`; all Requirement/Todo boxes unchecked) and `plans/260819-2348-phase-2-shared-ui/plan.md:79` (Phase 7 "Pending"), while every requirement is implemented and all gates pass. Update both when closing the phase (criterion 4).

### Observations (not defects)

- Two buttons named "Submit exam" coexist during a sitting (sticky header ExamEngine.tsx:261 + last-question footer :346) — pre-existing, intentional, mild screen-reader redundancy.
- The exam dialog is not a focus trap (Tab exits it at the ends). The phase criteria demand no-trap + Escape + autoFocus — all satisfied; a strict ARIA-modal trap would be a future enhancement, not a phase gap.

## Recommendation

1. Fix D1 with the per-lesson `key` on `LessonNotes` (one line) and add the failing test above to `src/app-flow.test.tsx`.
2. Promote probe P5 (persist/rehydrate round-trip) into a committed store test — it is the only coverage of the real persistence seam; P3/P4 are cheap to keep as store-level assertions.
3. Run `ak plan check` to mark phase-07 checkboxes and update `plan.md` phase status (D2), then re-run the four gates.

Unresolved questions: none — D2's unchecked boxes look like a deliberate wait-for-verification state, but the plan owner should confirm.

Status: DONE_WITH_CONCERNS
Summary: All four gates green (401/401 tests, lint, build, content:check) and every acceptance criterion holds except plan-file state; probes confirmed 6 of 7 invariants, uncovering one moderate defect — an unsaved notes draft bleeds across lesson switches and saves under the wrong lesson.
Concerns/Blockers: D1 (LessonNotes draft bleed, LessonViewer.tsx:154 missing per-lesson key) should be fixed before the phase is marked complete; D2 checkboxes still unchecked.
