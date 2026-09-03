---
phase: 4
title: "Progress migration"
status: completed
priority: P1
effort: "3h"
dependencies: [2]
---

# Phase 4: Progress migration

## Overview

One-time import of progress the standalone polyglot app left in the browser,
following the DP-800 migrate engine's full pattern — the strongest of the three
existing engines, built for exactly this situation (red-team findings 1/2: a
naive mapper here would either orphan coding-quiz progress or risk destroying
the only copy of donor progress).

## Requirements

- Functional: on first hub load after the pack lands, `prh-progress` maps into the `languages` subject store behind a sibling guard key; re-loads import nothing; the donor key is never deleted.
- Non-functional: silent when the key is absent or the pack isn't installed; never blocks hub boot; untrusted-input hardening matches `migrate-dp800-progress.ts` (size bounds, referential-integrity filter, persisted read-back before arming the guard).

## Architecture

New engine `src/engines/migrate-polyglot-progress.ts` + shared id helper
`src/engines/polyglot-ids.ts` (imported from `../src/` by the Phase 2 extract
lib — one id rule everywhere), wired into the hydration-gated first-load chain
in `src/App.tsx` next to the three existing migrations.

**Hardening (dp-800 pattern, all required):**
- **Sibling guard key** `cc-polyglot-progress-migrated` — the established
  one-time semantics; none of the three existing engines deletes the donor key
  ("consume the raw key" was wrong and is dropped from this plan)
- **Pack-installed gate:** if the `languages` pack fails to load, skip and
  leave the key retryable (the runtime `loadSubjectsTolerant` path skips bad
  packs silently)
- **Size/count bounds** mirroring the dp-800 caps
- **Referential-integrity filter:** build the pack's lesson/lab/question id
  sets via the content source and drop imported ids with no pack home,
  accounting the drops in the result summary
- **Persist verification:** arm the guard only after reading the persisted
  store back and deep-comparing the merged slice (the storage adapter can
  swallow `setItem` failures)

**Data mapping:**
- `lessons{id:true}` → `lessons[id]: {status: 'completed'}` (ids via the shared helper)
- `labs/practice/framework {id:true}` → `completedLabs` (all three donor sections became labs)
- `quiz{id: {correct, answeredAt}}` → **branched by remap destination** (finding 2):
  donor quiz ids whose pack destination is a lab (the `coding` remap) →
  `completedLabs`; true question ids → SRS cards (correct → box 2, wrong →
  box 1, `lastSeen/due = answeredAt`, counters accumulated). The
  id→destination map is exported by `polyglot-extract-lib.ts`
- `lastLang` → no hub equivalent; dropped (noted in the engine header)

## Related Code Files

- Create: `src/engines/polyglot-ids.ts` — shared id helper (tested)
- Create: `src/engines/migrate-polyglot-progress.ts`
- Create: `src/engines/migrate-polyglot-progress.test.ts`
- Modify: `src/App.tsx` — call the engine in the first-load import chain
- Read-only: `scripts/polyglot-extract-lib.ts` (remap map), donor
  `learn-polyglot/src/lib/progress.ts` (cited in the engine header as the
  payload source: key `prh-progress`, shape
  `ProgressState{lessons, labs, practice, framework, quiz, lastLang}` —
  verified against the live donor during red team)

## Implementation Steps

1. `src/engines/polyglot-ids.ts`: the `plg-` prefix rule + uniqueness
   assertion, unit-tested. Extract lib re-exports it; engine imports it
   directly.
2. Pure mapper with the hardening above; invalid JSON → no-op (guard stays
   unarmed, donor key untouched); per-entity errors (bad ISO dates, unknown
   ids) → skip that entity and count it, never abort the import.
3. SRS seeding with the coding→labs branch from the extract lib's remap map.
4. Wire into `App.tsx`'s hydration-gated chain; guard arming follows the
   dp-800 verify-then-arm order.
5. Tests: empty state, full state, invalid JSON no-op, unknown-id drop +
   accounting, mixed quiz payload (coding + normal ids land in the right
   homes), SRS boxes/dates, size-bound rejection, guard armed only after
   verified persist, idempotency across reloads.
6. Manual devtools check with a seeded `prh-progress`: import fires once, learn
   progress shows completed lessons, coding completions appear under labs, the
   review queue resurfaces overdue cards, hub due-count badge reflects only
   real questions, second load imports nothing.
7. Full gate: `npm run lint && npm test && npm run content:check && npm run build`.

## Success Criteria

- [x] Mapping correct for empty/full/invalid donor states (unit-tested), including the coding→labs branch
- [x] Unknown ids dropped with accounting; hub due-count badge can never be inflated by junk SRS cards
- [x] Silent when the key is absent or the pack fails to load; donor key never deleted; guard arms only after verified persist
- [x] Full gate green

## Risk Assessment

Risk: dependency direction — engines must not import from `scripts/`.
**Signal:** vitest resolution failure or lint error on the engine's imports.
**Response:** pre-decided: the id helper lives in `src/engines/polyglot-ids.ts`;
the extract lib re-exports it, both sides share one tested rule.
