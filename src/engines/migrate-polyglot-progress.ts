/**
 * One-time progress migration from the donor Polyglot Revision Hub: its
 * hand-rolled localStorage payload (`prh-progress`,
 * learn-polyglot/src/lib/progress.ts, donor SHA fa0019eb) becomes hub user
 * data under `subjects['languages']` of `cc-subject-data`. One-way and
 * one-shot; the donor repo is archived after the pack ships, so the key is
 * never consumed — the sibling guard key is the only one-time marker.
 *
 * Donor shape: `{lessons, labs, practice, framework, quiz, lastLang}` where
 * the first four are `Record<id, boolean>` completion flags and `quiz` maps
 * question ids to `{correct, answeredAt}`. Donor learn lessons/labs/practice/
 * framework completions map to hub lessons/completedLabs (all three donor
 * exercise sections became labs in the pack). Quiz results branch by pack
 * destination — coding questions became labs, so a quiz id that resolves to a
 * lab lands in `completedLabs`; real question ids seed SRS cards (correct →
 * box 2, wrong → box 1) with `answeredAt` as last-seen/due, resurfacing overdue
 * cards in the hub review queue. `lastLang` has no hub equivalent and is
 * dropped, named here.
 *
 * The blob is untrusted client data: referential-integrity filters drop ids
 * that are not in the installed pack (after the shared `plg-` prefix rule),
 * size/count bounds abort pathological blobs, and the one-shot guard is armed
 * only after the merge is verified persisted (the store's storage adapter can
 * swallow setItem failures). The call must run only after the persisted store
 * rehydrated — same rehydration trap as the other migrate engines.
 */
import type { SrsCard, SubjectContent, SubjectUserData } from '../sdk/types';
import { polyglotId } from './polyglot-ids';
import { contentSource, type ContentSource } from '../content/registry';
import {
  createSubjectDataStore,
  emptySubjectData,
  SUBJECT_DATA_STORE_KEY,
  useSubjectDataStore,
} from './subject-store';

/** Donor key (learn-polyglot/src/lib/progress.ts). */
export const LEGACY_POLYGLOT_KEY = 'prh-progress';
/**
 * Sibling guard key marking the import done. Lives outside `cc-subject-data`
 * on purpose: the persist merge whitelist would strip an in-store flag on
 * every reload. The donor key is never deleted — after the donor repo is
 * archived it is the only remaining copy of this progress.
 */
export const POLYGLOT_MIGRATED_KEY = 'cc-polyglot-progress-migrated';

const SUBJECT_ID = 'languages';

/** Bound on the untrusted raw key; the donor blob is small by construction. */
const RAW_KEY_MAX_CHARS = 2_000_000;
/** Per-section entry caps, far above anything the donor can legitimately hold. */
const SECTION_CAP = 5_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* ------------------------------ donor narrowing ---------------------------- */

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
    // Swallowed on purpose: the caller verifies the merge persisted instead.
  }
}

/** Completion flag: only an explicit `true` counts (untrusted data). */
function donorDone(section: Record<string, unknown>, id: string): boolean {
  return section[id] === true;
}

function validIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

/* --------------------------------- mapper ---------------------------------- */

export interface PolyglotMigration {
  data: Partial<SubjectUserData>;
  /** Entries dropped because their id has no home in the installed pack. */
  unknownIds: number;
  /** Entries skipped for invalid payloads (bad dates, wrong value types). */
  invalidEntries: number;
}

export function migratePolyglotProgress(
  raw: unknown,
  current: SubjectUserData,
  content: SubjectContent,
): PolyglotMigration | null {
  if (!isRecord(raw)) return null;
  const lessonsIn = raw.lessons;
  const labsIn = raw.labs;
  const practiceIn = raw.practice;
  const frameworkIn = raw.framework;
  const quizIn = raw.quiz;
  if (
    !isRecord(lessonsIn) || !isRecord(labsIn) || !isRecord(practiceIn) ||
    !isRecord(frameworkIn) || !isRecord(quizIn)
  ) {
    return null;
  }

  const lessonIds = new Set(content.lessons.map((l) => l.id));
  const labIds = new Set(content.labs.map((l) => l.id));
  const questionIds = new Set(content.questions.map((q) => q.id));

  const data: Partial<SubjectUserData> = {};
  const completedLabs = new Set(current.completedLabs);
  const srs: Record<string, SrsCard> = {};
  let unknownIds = 0;
  let invalidEntries = 0;

  const adoptLab = (donorId: string): void => {
    const id = polyglotId(donorId);
    if (!labIds.has(id)) {
      unknownIds += 1;
      return;
    }
    completedLabs.add(id);
  };

  let lessonCount = 0;
  for (const [donorId, done] of Object.entries(lessonsIn)) {
    if (lessonCount >= SECTION_CAP) { invalidEntries += 1; continue; }
    if (done !== true) { invalidEntries += 1; continue; }
    const id = polyglotId(donorId);
    if (!lessonIds.has(id)) { unknownIds += 1; continue; }
    data.lessons = { ...data.lessons, [id]: { status: 'completed' } };
    lessonCount += 1;
  }

  // Per-entry cap-and-continue (mirrors the lessons/quiz loops): an
  // over-cap blob loses only its over-cap entries, never whole sections.
  let labCount = 0;
  const adoptSection = (section: Record<string, unknown>): void => {
    for (const donorId of Object.keys(section)) {
      if (labCount >= SECTION_CAP) { invalidEntries += 1; continue; }
      if (donorDone(section, donorId)) { adoptLab(donorId); labCount += 1; }
    }
  };
  adoptSection(labsIn);
  adoptSection(practiceIn);
  adoptSection(frameworkIn);

  let quizCount = 0;
  for (const [donorId, entry] of Object.entries(quizIn)) {
    if (quizCount >= SECTION_CAP) { invalidEntries += 1; continue; }
    if (!isRecord(entry) || typeof entry.correct !== 'boolean') { invalidEntries += 1; continue; }
    const answeredAt = validIso(entry.answeredAt);
    if (answeredAt === null) { invalidEntries += 1; continue; }
    const id = polyglotId(donorId);
    if (questionIds.has(id)) {
      const existing = current.srs[id];
      // The donor stores one last-state boolean per question, never history —
      // so counters take the max against any existing card instead of
      // accumulating. This keeps overlapping imports (dev StrictMode's double
      // effect, a guard race) idempotent rather than inflating counters.
      srs[id] = {
        questionId: id,
        box: Math.max(existing?.box ?? 0, entry.correct ? 2 : 1),
        due: answeredAt,
        lastSeen: answeredAt,
        timesCorrect: Math.max(existing?.timesCorrect ?? 0, entry.correct ? 1 : 0),
        timesWrong: Math.max(existing?.timesWrong ?? 0, entry.correct ? 0 : 1),
      };
      quizCount += 1;
    } else if (labIds.has(id)) {
      adoptLab(donorId);
      quizCount += 1;
    } else {
      unknownIds += 1;
    }
  }

  if (Object.keys(srs).length > 0) data.srs = srs;
  const newLabs = [...completedLabs].filter((id) => !current.completedLabs.includes(id));
  if (newLabs.length > 0) data.completedLabs = newLabs;
  // data.lessons only carries genuinely new completions? current may already
  // mark some; overwriting an existing completed status with 'completed' is a
  // no-op, so keep every adopted lesson (idempotent merge semantics).

  if (unknownIds === 0 && invalidEntries === 0 && Object.keys(data).length === 0) return null;
  return { data, unknownIds, invalidEntries };
}

/* ------------------------------ persistence check -------------------------- */

async function mergePersisted(store: ReturnType<typeof createSubjectDataStore>): Promise<boolean> {
  const storage = store.persist.getOptions().storage;
  if (!storage) return false;
  try {
    const persisted = (await storage.getItem(SUBJECT_DATA_STORE_KEY)) as
      | { state?: { subjects?: Record<string, unknown> } }
      | null
      | undefined;
    return (
      JSON.stringify(persisted?.state?.subjects?.[SUBJECT_ID]) ===
      JSON.stringify(store.getState().subjects[SUBJECT_ID])
    );
  } catch {
    return false;
  }
}

/* --------------------------------- entry ----------------------------------- */

export interface PolyglotImportSummary {
  lessons: number;
  labs: number;
  srsCards: number;
  unknownIds: number;
  invalidEntries: number;
}

/**
 * One-shot import of `prh-progress` into the `languages` subject. Safe to call
 * on every boot: the sibling guard key short-circuits, unreadable blobs stay
 * retryable (never consumed), and the guard arms only after the merge is
 * verified persisted.
 */
export async function importPolyglotProgress(
  store: ReturnType<typeof createSubjectDataStore> = useSubjectDataStore,
  source: ContentSource = contentSource,
): Promise<PolyglotImportSummary | null> {
  if (safeGet(POLYGLOT_MIGRATED_KEY) !== null) return null;

  const raw = safeGet(LEGACY_POLYGLOT_KEY);
  if (raw === null) return null;
  if (raw.length > RAW_KEY_MAX_CHARS) {
    console.warn('legacy import: prh-progress exceeds the raw size bound — skipped, key left in place');
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('legacy import: prh-progress is unreadable JSON — skipped, key left in place');
    return null;
  }
  if (!isRecord(parsed)) {
    console.warn('legacy import: prh-progress has an unexpected shape — skipped, key left in place');
    return null;
  }

  // The pack must be installed for the data to have a home; without it the
  // key stays retryable so a later install still picks it up.
  if (!source.listSubjectIds().includes(SUBJECT_ID)) {
    console.warn(`legacy import: ${SUBJECT_ID} is not installed — prh-progress left for a later start`);
    return null;
  }
  let content: SubjectContent;
  try {
    content = source.loadSubject(SUBJECT_ID);
  } catch (error) {
    console.error(
      `legacy import: ${SUBJECT_ID} pack failed to load — prh-progress left for a later start`,
      error,
    );
    return null;
  }

  const current = store.getState().subjects[SUBJECT_ID] ?? emptySubjectData();
  const migration = migratePolyglotProgress(parsed, current, content);
  if (!migration) {
    // The payload was examined and holds nothing adoptable: done, no writes.
    safeSet(POLYGLOT_MIGRATED_KEY, new Date().toISOString());
    console.info(
      'legacy import: prh-progress held nothing to import — lastLang has no hub home and was not imported',
    );
    return null;
  }

  store.getState().importLegacyData(SUBJECT_ID, migration.data);

  // The store's storage adapter can swallow setItem failures, so "merge
  // returned" ≠ "merge persisted". Arm the one-shot guard only after the
  // persisted slice matches; otherwise the next start retries.
  if (!(await mergePersisted(store))) {
    console.warn('legacy import: languages merge did not persist — will retry on the next start');
    return null;
  }
  safeSet(POLYGLOT_MIGRATED_KEY, new Date().toISOString());

  const data = migration.data;
  const summary: PolyglotImportSummary = {
    lessons: Object.keys(data.lessons ?? {}).length,
    labs: (data.completedLabs ?? []).length,
    srsCards: Object.keys(data.srs ?? {}).length,
    unknownIds: migration.unknownIds,
    invalidEntries: migration.invalidEntries,
  };
  console.info(
    `legacy import: prh-progress → ${SUBJECT_ID} (${summary.lessons} lessons, ${summary.labs} labs, ` +
      `${summary.srsCards} SRS cards)` +
      (summary.unknownIds > 0
        ? ` — ${summary.unknownIds} entr${summary.unknownIds === 1 ? 'y' : 'ies'} with unknown ids dropped`
        : '') +
      (summary.invalidEntries > 0
        ? ` — ${summary.invalidEntries} entr${summary.invalidEntries === 1 ? 'y' : 'ies'} with invalid payloads skipped`
        : '') +
      ' — lastLang has no hub home and was not imported',
  );
  return summary;
}
