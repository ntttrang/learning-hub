---
phase: 5
title: "Progress migration"
status: completed
priority: P1
effort: 0.5d
dependencies: [1, 3]
---

# Phase 5: Progress migration

## Overview

One-time import of the donor app's user data from localStorage `dp800-store`
into `subjects['dp-800']` of the hub store `cc-subject-data` — a close clone of
the phase-3 gh shim skeleton (`src/engines/migrate-gh-progress.ts`) with the
DP-800 deltas: the donor payload is a **zustand persist envelope**
`{state:{…}, version:1}` (unwrap first), it is **single-subject** (no prefix
partitioning), and — unlike the gh donor — its user-data shapes are
**field-identical to the hub's** (`SubjectUserData` family, donor
`src/lib/types.ts:230-274` vs hub `src/sdk/types.ts:327-389`) and its exam
attempts already carry `answers: Record<qid, string[]>` + `results[]`. Donor
option ids (`"a".."d"`) ship verbatim in the pack (phase 3), so migrated
answers stay valid with **no translation and no grading pass**. The full-field
`importLegacyData` from phase 1 receives notes/bookmarks/quizAttempts/srs/
lastLessonId in addition to the original three keys; hub wins on collision;
theme/achievements/streak are dropped with one logged note. Import hardening
over the gh skeleton: referential-integrity filters against the pack's ids,
size/count bounds on the untrusted blob, and a verify-persisted check before
the one-shot guard key (the storage adapter swallows quota errors,
`src/engines/storage.ts:61-67`).

## Requirements

### Functional

- `src/engines/migrate-dp800-progress.ts`:
  - `LEGACY_PROGRESS_KEY = 'dp800-store'`; `LEGACY_MIGRATED_KEY =
    'cc-dp800-progress-migrated'` (sibling key outside the persist blob — the
    merge whitelist strips in-store flags, gh finding D precedent).
  - Narrowers: envelope `{state: object, version}` → narrow `state` per field:
    `lessons: Record<string, LessonProgress>`, `completedLabs: string[]`,
    `quizAttempts: unknown[]` (per-attempt narrow mirroring donor `QuizAttempt`
    — id/date/scope/questionResults, `learn-dp-800/src/lib/types.ts`),
    `examAttempts: unknown[]` (per-attempt narrow:
    id/examId/date/durationSeconds/timed/scaledScore/passed/perDomain/answers/
    results), `srs: Record<string, SrsCard>`, `notes: unknown[]` (id, lessonId?,
    title, body, updated), `bookmarks: string[]`, `lastLessonId?: string`.
    Anything unreadable → skip that entry, keep the rest, one `console.warn`
    (never throw, never block app start).
  - Pure mapper `(legacy, current: SubjectUserData) => Partial<SubjectUserData> | null`:
    every field verbatim (ids, dates, perDomain, questionResults, SrsCard
    fields); `null` when nothing mappable. Donor attempt/note ids are kept
    **verbatim** — the unchanged source payload plus `importLegacyData`'s
    skip-if-present merge makes re-runs write nothing.
  - Referential-integrity filters (gh-shim guards reused — the blob was
    written by whatever donor version the user ran, which may not match the
    extracted pack snapshot): examAttempts whose `examId` is not a pack exam
    dropped (gh precedent exam-lookup guard in `migrate-gh-progress.ts`); exam
    answers, quizAttempts' questionResults, and srs entries whose question ids
    are outside the 179-id pack dropped; notes whose lessonId does not resolve
    dropped; every drop counted in the summary log.
  - Bounds (the blob is untrusted client data; the hub's own writes cap
    history — `subject-store.ts:167` slices examAttempts to 50, donor caps
    quiz 200 / exam 50 at `store.ts:140,152`): skip entries beyond the donor
    caps, drop oversized note bodies, abort the whole import with one warn if
    the raw key exceeds a few hundred KB.
  - Durability before the guard: the storage adapter swallows setItem
    failures (`src/engines/storage.ts:61-67`), so "merge returned" ≠ "merge
    persisted". After `importLegacyData`, re-read
    `localStorage['cc-subject-data']` and confirm a known imported marker id
    is present in the serialized blob; only then set the guard. On mismatch:
    one warn, guard left unset — the next start retries.
  - Rehydration default-fill (phase-1 review hand-off): the persist `merge`
    rehydrates subject entries verbatim, so an entry missing an array key
    makes `importLegacyData`'s spreads throw inside the boot-time effect —
    and the unset guard retries the crash every boot. Default-fill every
    rehydrated entry in `merge` via `{ ...emptySubjectData(), ...entry }`
    (this shim is the first caller passing the full key set, so the hardening
    lands here).
  - Runner `importLegacyDp800Progress(store, source)`: guard key present →
    no-op; old key absent → no-op; unreadable JSON → one warn, no-op; load
    `dp-800` content (skip with error if the pack is invalid — per-pack
    isolation, gh precedent at `migrate-gh-progress.ts:330-335`); call the pure
    mapper; `importLegacyData('dp-800', partial)`; **set the guard key only
    after the merge is verified persisted** (durability above); log one summary
    line naming the dropped
    fields (theme: global not per-subject; achievements: no hub home until
    Phase 6 — donor has 8 defs, 3 unreachable; streak: hub-global, gh-shim
    precedent ignores it).
- Wiring in `src/App.tsx`: extend the existing hydration-gated one-shot effect
  (`:16-25`) to run `importLegacyGhProgress()` then
  `importLegacyDp800Progress()` — both idempotent, independent keys; still
  gated on `useSubjectDataStore.persist.hasHydrated()` /
  `onFinishHydration`, never at store-create time.
- Unit tests (mirror `migrate-gh-progress.test.ts` patterns): happy path with a
  realistic envelope asserting ALL 8 fields land (incl. notes, bookmarks, srs,
  lastLessonId, quizAttempts with donor scope strings like `lab-01` preserved);
  envelope-without-state / corrupt JSON / absent key → clean no-op; unreadable
  attempt entry dropped not crashed; hub-wins collisions (existing lesson id,
  attempt id, note id, srs questionId, lastLessonId); double-run → second run
  writes nothing (guard + verbatim ids); rehydration path (persist → reload →
  run → no writes); dropped-fields note logged once; unknown-id hygiene
  (examAttempt with a foreign examId, answer with a foreign qid, note with a
  foreign lessonId → dropped + counted); bounds (over-cap quiz list skipped
  beyond the cap, multi-hundred-KB raw key → aborted import); durability
  (simulated setItem failure on the persist adapter → guard NOT set, next run
  retries).

### Non-functional

- No store-action additions beyond phase 1's `importLegacyData` (the runner
  writes only through it — never `recordQuiz`/`recordExam`/`markLesson`, which
  cap history, bump streaks, and feed SRS: imported history must not look like
  fresh activity).
- Donor key never written; one-way, one-time.
- Mapper stays pure (no localStorage inside it) so it is unit-testable.

## Architecture

```
App.tsx effect (hasHydrated)
  ├─ importLegacyGhProgress()        (existing, untouched semantics)
  └─ importLegacyDp800Progress()
        guard 'cc-dp800-progress-migrated'? → no-op
        read 'dp800-store' → unwrap {state} → narrow → pure mapper
        → store.importLegacyData('dp-800', partial)   (phase 1 full-field merge)
        → set guard key → console.info summary (+ dropped: theme/achievements/streak)
```

## Related Code Files

### Create

- `src/engines/migrate-dp800-progress.ts`
- `src/engines/migrate-dp800-progress.test.ts`

### Modify

- `src/App.tsx` — run both imports in the hydration-gated effect

### Delete

- (none)

## Implementation Steps

1. Re-verify the donor payload against source before coding (gh phase-5
   precedent, its step 1): `learn-dp-800/src/lib/store.ts:186-190` (persist
   envelope, key, version) and every write site's field usage; diff against
   the narrowers above; update this file's list if the donor drifted.
2. Implement narrowers + pure mapper; unit-test the mapper alone first
   (purity, all 8 fields, collisions, drop-not-crash).
3. Implement the runner (guard, per-pack isolation, summary log incl. dropped
   fields); wire App.tsx.
4. Tests: idempotency (double-run), absent/corrupt key no-ops, rehydration
   path.
5. Manual devtools round-trip: seed a realistic `dp800-store` envelope →
   refresh → dp-800 workspace shows lessons/labs/exams/notes/bookmarks; SRS
   cards verified via the store/devtools (no hub surface renders SRS yet) →
   refresh → unchanged; `cc-dp800-progress-migrated` present.
6. Gates: `npm test`, `npm run content:check`, `npm run lint`, `npm run build`.

## Success Criteria

- [x] Realistic seeded envelope → hub shows completed lessons, completed labs,
      quiz + exam history (with answers/results), notes, bookmarks,
      lastLessonId resume — all under `subjects['dp-800']`; SRS cards land in
      `subjects['dp-800'].srs` (store assertion — no surface renders SRS yet);
      entries with unknown exam/question/lesson ids dropped with a logged count
- [x] Second load mutates nothing (guard key + verbatim ids both hold); absent
      or corrupt old key → clean no-op with at most one warn
- [x] Theme, achievements, streak dropped with exactly one logged note; nothing
      is written to the donor key; the gh import still runs and its tests stay
      green
- [x] `npm test` / `npm run content:check` / `npm run lint` / `npm run build` green

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| Donor store shape drifted since the scout | step 1 diff disagrees with the narrowers | Update narrowers to the re-verified shape before coding; envelope-version bump (≠1) → treat as unmigrated-shape, warn + no-op rather than guess |
| Donor quiz `scope` strings (`lab-01` set ids) confuse hub history rendering | manual round-trip shows odd scope labels | Accepted: scope is a display string (`types.ts:335`); lab-set ids read naturally; do not invent a remap |
| User already used the hub dp-800 pack before the shim lands | collision test red / old data silently lost | Hub-wins per key is the locked semantic (phase 1 merge): worst case legacy loses, never clobbers — document in the summary log |
| Runner wiring duplicates or races the gh import | double import or missed hydration in devtools | One effect, sequential calls, single hydration gate — exactly the gh shape; the rehydration test pins the ordering |
| SRS cards reference question ids the pack dropped | dangling srs keys after import | Integrity filters are in scope now (requirements above): entries with unknown ids are dropped and counted at map time — dangling state cannot land |
| Two tabs start concurrently; both pass the guard check before either writes | one tab's post-hydration writes reverted by the other's stale-base persist | Accepted + documented window (the gh shim has the same exposure): single-user study app, seconds-wide on first hub visit; an in-flight guard value would narrow it — hub-wide candidate, not this plan's scope |
