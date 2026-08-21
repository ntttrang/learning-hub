/**
 * One-time progress migration from the donor GH-600 study companion: its
 * localStorage payloads (`gh600sp_html` / `gh600sp_captain_corgi_html` — the
 * same app saved under two file names) become completed hub lessons under
 * `cc-subject-data`. One-way and one-shot; the donor stays deployed untouched.
 *
 * The donor's progress model is domain-granular (`passed: [0..5]` marks whole
 * domains), so a passed domain maps to every lesson of its hub domain — the
 * closest honest mapping, not a claim of per-topic reads.
 *
 * The call must run only after the persisted store rehydrated (the
 * hydration-gated `run()` in App.tsx): a pre-hydration write lands in
 * in-memory state that the persist merge then overwrites wholesale while the
 * guard flag is already set — silent, permanent loss.
 */
import { contentSource, type ContentSource } from '../content/registry';
import type { SubjectUserData } from '../sdk/types';
import {
  createSubjectDataStore,
  emptySubjectData,
  useSubjectDataStore,
} from './subject-store';

/** Donor keys (gh600 study-plan storage; either may hold the newest state). */
export const LEGACY_GH600_KEYS = ['gh600sp_html', 'gh600sp_captain_corgi_html'] as const;
/**
 * Sibling guard key marking the import done. Lives outside `cc-subject-data`
 * on purpose: the persist merge whitelist would strip an in-store flag on
 * every reload.
 */
export const GH600_MIGRATED_KEY = 'cc-gh600-progress-migrated';

const SUBJECT_ID = 'gh-600';

/* ------------------------------- the mapper -------------------------------- */

/** One parsed legacy payload: donor shape is `{ cur, tab, passed: [0..5] }`. */
function narrowLegacyPayload(value: unknown): Set<number> | null {
  if (typeof value !== 'object' || value === null) return null;
  const passed = (value as Record<string, unknown>).passed;
  if (!Array.isArray(passed)) return null;
  const domains = new Set<number>();
  for (const entry of passed) {
    if (typeof entry !== 'number' || !Number.isInteger(entry) || entry < 0 || entry > 5) {
      return null; // malformed entry: treat the whole payload as unreadable
    }
    domains.add(entry);
  }
  return domains;
}

export interface Gh600Migration {
  /** Merged passed-domain numbers (donor 0-based), sorted. */
  passedDomains: number[];
  /** New completed-lesson entries only — ids already present stay untouched. */
  lessons: SubjectUserData['lessons'];
}

/**
 * Pure transform of the legacy payloads. `lessonsByDomain[n]` lists the hub
 * lesson ids of donor domain `n` (0-based). Returns null when no payload is
 * readable — the runner then warns and leaves the keys retryable.
 */
export function migrateGh600Passed(
  payloads: unknown[],
  current: Pick<SubjectUserData, 'lessons'>,
  lessonsByDomain: string[][],
): Gh600Migration | null {
  const merged = new Set<number>();
  let readable = 0;
  for (const payload of payloads) {
    const domains = narrowLegacyPayload(payload);
    if (!domains) continue;
    readable += 1;
    for (const domain of domains) merged.add(domain);
  }
  if (readable === 0) return null;

  const lessons: SubjectUserData['lessons'] = {};
  for (const domain of [...merged].sort((a, b) => a - b)) {
    for (const lessonId of lessonsByDomain[domain] ?? []) {
      if (current.lessons[lessonId]) continue; // hub data wins
      lessons[lessonId] = { status: 'completed', lastVisited: new Date().toISOString() };
    }
  }
  return { passedDomains: [...merged].sort((a, b) => a - b), lessons };
}

/* -------------------------------- the runner ------------------------------- */

export interface Gh600ImportSummary {
  domains: number[];
  lessons: number;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Blocked storage: nothing to mark — stay silent.
  }
}

type Parsed = { ok: true; value: unknown } | { ok: false; key: string };

/**
 * Import the donor's passed domains once. Returns null whenever it did not
 * run (already migrated, no legacy keys, nothing readable); the guard is set
 * only after a successful merge, so failures stay retryable.
 */
export function importGh600Progress(
  store: ReturnType<typeof createSubjectDataStore> = useSubjectDataStore,
  source: Pick<ContentSource, 'listSubjectIds' | 'loadSubject'> = contentSource,
): Gh600ImportSummary | null {
  if (safeGet(GH600_MIGRATED_KEY) !== null) return null;

  const parsed: Parsed[] = LEGACY_GH600_KEYS.map((key) => {
    const raw = safeGet(key);
    if (raw === null) return { ok: false, key };
    try {
      return { ok: true as const, value: JSON.parse(raw) };
    } catch {
      console.warn(`legacy import: ${key} is unreadable JSON — skipped`);
      return { ok: false, key };
    }
  });
  if (parsed.every((entry) => !entry.ok)) {
    // Nothing readable: a silent no-op when the donor app was never used here
    // (no keys at all); unreadable JSON already warned above and the keys
    // stay retryable — either way, no guard is set.
    return null;
  }

  // The pack must be installed for the mapping to have a home; without it the
  // keys stay retryable so a later install still picks them up.
  if (!source.listSubjectIds().includes(SUBJECT_ID)) {
    console.warn(`legacy import: ${SUBJECT_ID} is not installed — gh600sp keys left for a later start`);
    return null;
  }
  let lessonIds: string[][]; // per donor domain 0..5
  try {
    const content = source.loadSubject(SUBJECT_ID);
    lessonIds = [1, 2, 3, 4, 5, 6].map(
      (n) =>
        content.lessons
          .filter((lesson) => lesson.domainId === `gh600-d${n}`)
          .map((lesson) => lesson.id),
    );
  } catch (error) {
    console.error(`legacy import: ${SUBJECT_ID} pack failed to load — gh600sp keys left for a later start`, error);
    return null;
  }

  const current = store.getState().subjects[SUBJECT_ID] ?? emptySubjectData();
  const migration = migrateGh600Passed(
    parsed.filter((entry): entry is { ok: true; value: unknown } => entry.ok).map((entry) => entry.value),
    current,
    lessonIds,
  );
  if (!migration) {
    console.warn('legacy import: gh600sp payloads have an unexpected shape — skipped');
    return null;
  }

  if (Object.keys(migration.lessons).length > 0) {
    store.getState().importLegacyData(SUBJECT_ID, { lessons: migration.lessons });
  }
  safeSet(GH600_MIGRATED_KEY, new Date().toISOString());
  console.info(
    `legacy import: gh600sp → ${SUBJECT_ID} (${migration.passedDomains.length} passed domain(s), ` +
      `${Object.keys(migration.lessons).length} lesson(s) completed)`,
  );
  return { domains: migration.passedDomains, lessons: Object.keys(migration.lessons).length };
}
