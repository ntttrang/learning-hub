# Phase 7 Review — Notes, bookmarks, end-to-end polish

Reviewer: code-reviewer agent. Date: 2026-08-20.
Scope: `src/ui/LessonNotes.tsx`, `src/ui/Notes.tsx` (+ tests), `src/app-flow.test.tsx`, `src/ui/LessonViewer.tsx`, `src/shell/tool-views.tsx`, `src/shell/AppShell.tsx`, `src/ui/Button.tsx`, `src/ui/ExamEngine.tsx` (dialog), `content/fixture/subject.json`, `src/styles/views.css` (notes block), `README.md`, `src/shell/views.test.tsx`, `src/shell/AppShell.test.tsx`.

## Checklist

### (a) Acceptance criteria — ✓ with one defect

1. **End-to-end sweep** ✓ — `src/app-flow.test.tsx` covers home → card → workspace tab list (lines 26–45), learn lesson incl. knowledge check + embedded notes (47–59), lab (61–69), practice run (71–78), exam sitting through the intro contract (80–92), compare (94–99), notes empty states (101–109), and the cross-mode bookmark+note journey (111–139). Assertions are on roles/labels, per the plan's brittleness mitigation.
2. **Notes appear in the Notes tab; bookmarks cross over** ✓ — `app-flow.test.tsx:111–139` takes a bookmark and a note in the lesson and asserts both render in the Notes tab with correct lesson links. Store round-trip is covered structurally (persist serializes the whole `subjects` slice; merge restores it wholesale) but has no notes-specific persistence test — see Finding 5.
3. **a11y** ✓ with edges — all interactive controls in the new views are labeled (`aria-label` on textarea `LessonNotes.tsx:54`, on delete/un-bookmark buttons `Notes.tsx:61,118`, sections `Notes.tsx:36,86`); visible focus comes from the global `.cc-body :focus-visible` rule (`tokens.css:454–456`, `--ring-focus`); no keyboard traps exist (dialogs are escapable/dismissable); reduced-motion is the global zero-duration block (`app.css:460–469`) and there is no JS-driven motion (`grep requestAnimationFrame|animate|scrollTo` → none). Edges: Findings 2 and 3.
4. **Gates** ✓ — verified locally, all green: `npm test` 44 files / 401 tests passed; `npm run lint` (oxlint) clean; `npx tsc --noEmit` exit 0; `npm run build` succeeds (pre-existing >500 kB chunk warning, not an error); `npm run content:check` 3/3 passed.

### (b) Blast radius — ✓

- `div.main` → `<main className="main">` (`AppShell.tsx:108`): the element keeps the `main` class, so the `.main` selector at `app.css:132` is unaffected; no `div.main` selectors exist anywhere in CSS or tests. The one tagName assertion (`AppShell.test.tsx:126`) was updated to `MAIN`.
- `Button` `autoFocus` (`Button.tsx:17,50`): additive optional prop; the anchor branch correctly does NOT forward it (nor `disabled`, per the documented "buttons only" contract). No existing call sites pass it.
- `ExamEngine` dialog: internal state/UI only; `ExamEngine.test.tsx:197–204` covers Keep working, focus landing, and Escape.
- `toolPlaceholder` remains only for `revision` (`tool-views.tsx:142`); every content-backed mode plus `notes` has a real view.
- Fixture `enabledModes += "notes"` (`subject/subject.json:9`): `notes` has `requiresContentKind: null` (`sdk/registry/tools.ts:52–57`), so the mode/content agreement check in `validate.ts:572–580` skips it — `content:check` green confirms. Views tests updated for the 7-tab list (`views.test.tsx:100–108`) and the revision fallback still verified (`views.test.tsx:218–224`).

### (c) Public contracts — ✓

- `sdk/types.ts`: `Note` (`id`, optional `lessonId`, `title`, `body`, `updated`) and `SubjectUserData.notes/bookmarks` match exactly what LessonNotes/Notes/store read and write; no type edits were needed by this phase's code.
- `ButtonProps`: extended additively (`autoFocus?`), backward compatible.
- `ToolViewProps` (`tool-views.tsx:27–35`): unchanged; `Notes` accepts it (extra props ignored).
- No signature changes in `AppShell` (props identical), `LessonViewer`, or the store; `upsertNote/deleteNote/toggleBookmark` used as-is (`subject-store.ts:105–142`).

### (d) Pattern conformance — ✓ with one violation-adjacent defect

- **Selector law**: both components select the stored array and default at the use site — `LessonNotes.tsx:20,24` and `Notes.tsx:21–24,26`. No `?? []` inside selectors. ✓
- **Fallback-never-blank**: unknown bookmark ids and departed lesson ids degrade away (`Notes.tsx:29–32,53`; tested `Notes.test.tsx:57–75`); both sections have honest empty states with CTA (`Notes.tsx:40–49,90–99`). ✓
- **Single href policy**: all new links are internal hash hrefs (`Notes.tsx:72,109`; empty-state buttons `Notes.tsx:46,96`); no external links added. ✓
- **Styling law**: the phase-7 CSS block (`views.css:1811–1954`) uses tokens and one `color-mix` (`views.css:1891`); grep for raw hex in that range → zero matches. All referenced tokens exist (`--danger`, `--link`, `--link-hover`, `--bg-sunken`, `--bg-elevated`, `--shadow-1`, `--space-*`, `--r-*`, `--bw`). ✓
- **dp-800 NotesPanel semantics**: compared line-by-line against `learn-dp-800/src/components/NotesPanel.tsx` — one note per lesson via `note-<lessonId>` id, draft-`null` disabled Save, empty-body save deletes, Delete clears the draft, updated stamp. All preserved (`LessonNotes.tsx:24–42,57–74`). ✓
- **Draft keyed to the lesson**: ✗ — see Finding 1. The donor got per-lesson draft reset for free from Next.js page remounts; the SPA port kept the component mounted across lesson switches and did not add a key.

### (e) Gates — ✓

See (a)4. Full suite, lint, tsc, build, content:check all run in this review, all green, twice for the test suite (targeted run + full run).

## Findings

### 1. HIGH — unsaved note draft carries over to the next lesson

- **Where**: `src/ui/LessonViewer.tsx:154` (no `key`), `src/ui/LessonNotes.tsx:25` (`useState` draft).
- **Scenario**: open lesson A, type into the notes textarea, then click the Next/Previous link — which sits directly below the notes editor (`LessonViewer.tsx:173–199`). The route changes only the `id` segment; the chain `SubjectWorkspace → LearnView → LessonViewer → LessonNotes` stays mounted (verified: no `key` anywhere on this path — `SubjectWorkspace.tsx:166–173`, `tool-views.tsx:89–92`, `App.tsx:11–19`). `LessonNotes` re-renders with the new `lessonId`, but its `draft` state survives, so `body = draft ?? existing?.body ?? ''` (`LessonNotes.tsx:26`) shows lesson A's unsaved text under lesson B's editor with Save enabled. Saving writes lesson A's text to `note-<B>`. The donor never had this bug (page components remount per route in Next.js), and the hub already established the fix convention for exactly this class: `tool-views.tsx:78` and `:126` key QuizRunner/ExamEngine with `key={subjectId:id}` so "a route hop … starts fresh".
- **Fix**: `<LessonNotes key={lesson.id} subjectId={subjectId} lessonId={lesson.id} lessonTitle={lesson.title} />` in `LessonViewer.tsx:154`. One-line change; matches the stated step-1 requirement "draft state keyed to the existing note".

### 2. LOW — exam dialog: Escape stops working after a backdrop click

- **Where**: `src/ui/ExamEngine.tsx:352–360`.
- **Scenario**: the dialog opens with focus on Keep working (autoFocus), so Escape bubbles through the dialog div and closes it. But clicking the non-focusable backdrop moves `activeElement` to `body`; a keydown there never reaches the dialog's `onKeyDown`, so Escape no longer dismisses. The user must click a button (no trap, just a dead key). Fix: while `confirming`, listen for Escape on `window` (the same pattern as the AppShell drawer, `AppShell.tsx:39–46`), or make the backdrop itself a click-to-close surface.

### 3. LOW (informational) — `aria-modal` dialog has no focus trap

- **Where**: `src/ui/ExamEngine.tsx:353–360`.
- **Scenario**: Tab from the dialog's last button moves focus into the page behind the modal (announced as modal to AT). The phase criterion is "no keyboard traps" — satisfied; the inverse (containment) is missing. Acceptable at this scope; noting for a future dialog-primitive pass. Not blocking.

### 4. LOW — duplicate accessible names when two lessons share a title

- **Where**: `src/ui/Notes.tsx:61` (`Delete note for ${note.title}`), same for the un-bookmark label at `:118`.
- **Scenario**: a pack with two identically-titled lessons (titles are not schema-unique; ids are) yields two delete buttons with identical accessible names, so AT users cannot disambiguate by name alone. The donor was worse (bare "Delete note" for every card), so this is an improvement, not a regression. Optional fix: append the saved date or lesson slug to the label.

### 5. LOW — "notes survive store round-trips" has no direct persistence test

- **Where**: `src/engines/subject-store.test.ts:125–139` round-trips lessons/SRS/streak but not notes/bookmarks; `Notes.test.tsx`/`LessonNotes.test.tsx` use `setState` directly, and `app-flow.test.tsx:111–139` stays within one store instance.
- **Scenario**: none today — the persist middleware serializes the whole `subjects` slice and the merge restores it wholesale, so notes structurally round-trip. This is a coverage gap against the success criterion's letter, not a defect. Suggested: extend the round-trip test with one `upsertNote`/`toggleBookmark` before rehydrate.

### 6. LOW (process) — phase checkboxes not yet reality

- **Where**: `plans/260819-2348-phase-2-shared-ui/phase-07-notes-bookmarks-end-to-end-polish.md` — `status: todo` and 14 unchecked boxes despite all gates green.
- **Fix**: run `ak plan check` for phase 7 after Finding 1 is resolved (success criterion: "plan files' checkboxes reflect reality"). Left to the lead per review rules.

## Patterns Conformance

Verified clean: selector law (both new components), fallback-never-blank (degradation + empty states, tested), single href policy (hash-only), styling law (tokens + color-mix only, zero raw hex), dp-800 semantics preserved, `note-<lessonId>` id makes one-note-per-lesson structurally guaranteed through the UI (`upsertNote` dedupes by id; `find` at `LessonNotes.tsx:24` tolerates hand-edited duplicates by picking the first — no crash), Notes tab deletes by `note.id` not lessonId (`Notes.tsx:62`), `useHashRoute` mints a fresh route object per hashchange (`router.ts:26–37,53`) so the `[route]` effect dep fires per navigation, and the focus rescue only touches focus when `activeElement === document.body` — typing in the notes textarea can never be stolen (no route change while typing, and a focused textarea is not `body`). App-flow tests avoid the documented exam title/index-heading race by asserting the intro contract (`app-flow.test.tsx:85–87`) and use `waitFor` appropriately throughout.

## Verdict

One HIGH finding (draft carryover across lesson switches, one-line key fix) plus LOW edges. Everything else meets the phase contract, project rules, and pattern laws; all five gates verified green in this review. Recommend fixing Finding 1 before marking the phase complete.

---

Status: DONE_WITH_CONCERNS
Summary: Phase 7 meets its acceptance criteria with all gates green, but LessonNotes keeps unsaved draft state when navigating between lessons (no remount key on the learn path), silently carrying lesson A's draft into lesson B's editor — a one-line `key={lesson.id}` fix.
Concerns/Blockers: Finding 1 (HIGH) should land before `ak plan check`; Findings 2–5 are optional polish.
