/**
 * One-time progress migration from the donor learn-dp-800 app: its zustand
 * persist payload (localStorage `dp800-store`, envelope `{state, version: 1}`,
 * learn-dp-800/src/lib/store.ts) becomes hub user data under
 * `subjects['dp-800']` of `cc-subject-data`. One-way and one-shot; the donor
 * stays deployed and untouched.
 *
 * Unlike the gh shims, the donor's user-data shapes are field-identical to the
 * hub's (learn-dp-800/src/lib/types.ts vs src/sdk/types.ts) and its exam
 * attempts already carry `answers` as option-id arrays plus `results`, so
 * everything maps verbatim — no answer translation, no grading pass. Donor
 * option ids ("a".."d") ship verbatim in the extracted pack.
 *
 * The blob is untrusted client data written by whatever donor version ran
 * here, which may not match the extracted pack snapshot: referential-integrity
 * filters drop entries whose lesson/lab/question/exam ids are not in the
 * installed pack, size/count bounds mirror the donor's own write caps, and
 * the one-shot guard is armed only after the merge is verified persisted
 * (the store's storage adapter swallows setItem failures). Theme,
 * achievements, and streak have no per-subject hub home and are dropped,
 * named in the one summary log.
 *
 * The call must run only after the persisted store rehydrated (the
 * hydration-gated `run()` in App.tsx): a pre-hydration write lands in
 * in-memory state that the persist merge then overwrites wholesale while the
 * guard flag is already set — silent, permanent loss.
 */
import { contentSource, type ContentSource } from '../content/registry';
import type {
  ExamAttempt,
  LessonProgress,
  Note,
  QuizAttempt,
  SrsCard,
  SubjectContent,
  SubjectUserData,
} from '../sdk/types';
import {
  createSubjectDataStore,
  emptySubjectData,
  SUBJECT_DATA_STORE_KEY,
  useSubjectDataStore,
} from './subject-store';

/** Donor key (learn-dp-800 store persist name). */
export const LEGACY_DP800_KEY = 'dp800-store';
/**
 * Sibling guard key marking the import done. Lives outside `cc-subject-data`
 * on purpose: the persist merge whitelist only rehydrates streak/subjects and
 * would strip an in-store flag on every reload.
 */
export const DP800_MIGRATED_KEY = 'cc-dp800-progress-migrated';

const SUBJECT_ID = 'dp-800';

/** Donor log caps (learn-dp-800/src/lib/store.ts recordQuiz/recordExam). */
const QUIZ_ATTEMPT_CAP = 200;
const EXAM_ATTEMPT_CAP = 50;
/**
 * Bound on the untrusted raw key. The donor caps attempt counts but not note
 * bodies or note counts, so a heavy legitimate user reaches a few hundred KB;
 * the cap sits far above that and far below the ~5 MB localStorage quota —
 * only a pathological blob aborts the import.
 */
const RAW_KEY_MAX_CHARS = 2_000_000;
const NOTE_BODY_MAX_CHARS = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* ------------------------------ donor shapes -------------------------------- */

const LESSON_STATUSES = new Set(['not-started', 'in-progress', 'completed']);

function narrowLessonProgress(value: unknown): LessonProgress | null {
  if (!isRecord(value)) return null;
  const { status, lastVisited, scrollPct } = value;
  if (typeof status !== 'string' || !LESSON_STATUSES.has(status)) return null;
  if (lastVisited !== undefined && typeof lastVisited !== 'string') return null;
  if (scrollPct !== undefined && typeof scrollPct !== 'number') return null;
  return {
    status: status as LessonProgress['status'],
    ...(lastVisited !== undefined ? { lastVisited } : {}),
    ...(scrollPct !== undefined ? { scrollPct } : {}),
  };
}

/** Shared by quiz `questionResults` and exam `results` (same donor shape). */
function narrowQuestionResults(value: unknown): { questionId: string; correct: boolean }[] | null {
  if (!Array.isArray(value)) return null;
  const results: { questionId: string; correct: boolean }[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.questionId !== 'string' || typeof entry.correct !== 'boolean') return null;
    results.push({ questionId: entry.questionId, correct: entry.correct });
  }
  return results;
}

function narrowQuizAttempt(value: unknown): QuizAttempt | null {
  if (!isRecord(value)) return null;
  const { id, scope, date, total, correct, questionResults } = value;
  if (
    typeof id !== 'string' ||
    typeof scope !== 'string' ||
    typeof date !== 'string' ||
    typeof total !== 'number' ||
    typeof correct !== 'number'
  ) {
    return null;
  }
  const results = narrowQuestionResults(questionResults);
  if (!results) return null;
  return { id, scope, date, total, correct, questionResults: results };
}

function narrowPerDomain(value: unknown): ExamAttempt['perDomain'] | null {
  if (!Array.isArray(value)) return null;
  const rows: ExamAttempt['perDomain'] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    const { domainId, correct, total } = entry;
    if (
      typeof domainId !== 'string' ||
      typeof correct !== 'number' ||
      typeof total !== 'number'
    ) {
      return null;
    }
    rows.push({ domainId, correct, total });
  }
  return rows;
}

/** Donor exam answers are already `questionId -> chosen option-id array`. */
function narrowAnswers(value: unknown): Record<string, string[]> | null {
  if (!isRecord(value)) return null;
  const answers: Record<string, string[]> = {};
  for (const [questionId, answer] of Object.entries(value)) {
    if (!Array.isArray(answer) || !answer.every((option) => typeof option === 'string')) {
      return null;
    }
    answers[questionId] = answer;
  }
  return answers;
}

function narrowExamAttempt(value: unknown): ExamAttempt | null {
  if (!isRecord(value)) return null;
  const {
    id,
    examId,
    date,
    durationSeconds,
    timed,
    scaledScore,
    passed,
    perDomain,
    answers,
    results,
  } = value;
  if (
    typeof id !== 'string' ||
    typeof examId !== 'string' ||
    typeof date !== 'string' ||
    typeof durationSeconds !== 'number' ||
    typeof timed !== 'boolean' ||
    typeof scaledScore !== 'number' ||
    typeof passed !== 'boolean'
  ) {
    return null;
  }
  const domains = narrowPerDomain(perDomain);
  const mappedAnswers = narrowAnswers(answers);
  const mappedResults = narrowQuestionResults(results);
  if (!domains || !mappedAnswers || !mappedResults) return null;
  return {
    id,
    examId,
    date,
    durationSeconds,
    timed,
    scaledScore,
    passed,
    perDomain: domains,
    answers: mappedAnswers,
    results: mappedResults,
  };
}

function narrowSrsCard(value: unknown): SrsCard | null {
  if (!isRecord(value)) return null;
  const { questionId, box, due, lastSeen, timesCorrect, timesWrong } = value;
  if (
    typeof questionId !== 'string' ||
    typeof box !== 'number' ||
    !Number.isInteger(box) ||
    box < 1 ||
    typeof due !== 'string' ||
    typeof lastSeen !== 'string' ||
    typeof timesCorrect !== 'number' ||
    typeof timesWrong !== 'number'
  ) {
    return null;
  }
  return { questionId, box, due, lastSeen, timesCorrect, timesWrong };
}

function narrowNote(value: unknown): Note | null {
  if (!isRecord(value)) return null;
  const { id, lessonId, title, body, updated } = value;
  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    typeof body !== 'string' ||
    typeof updated !== 'string'
  ) {
    return null;
  }
  if (lessonId !== undefined && typeof lessonId !== 'string') return null;
  return { id, title, body, updated, ...(lessonId !== undefined ? { lessonId } : {}) };
}

/* -------------------------------- the mapper -------------------------------- */

export interface Dp800Migration {
  /** New entries only — ids already present in the hub are excluded (hub wins). */
  data: Partial<SubjectUserData>;
  /** Entries skipped because their shape was unreadable. */
  unreadable: number;
  /** Entries or id references dropped because the installed pack does not know them. */
  unknownIds: number;
  /** Entries skipped by the size/count bounds on the untrusted blob. */
  bounded: number;
}

/**
 * Pure transform of the donor's persisted `state`. Every field maps verbatim
 * (ids, dates, perDomain, questionResults, SrsCard fields); returns null when
 * nothing is mappable. Drop accounting: unreadable shapes warn once here,
 * unknown-id and bound drops are reported by the runner's summary log.
 */
export function migrateDp800Progress(
  legacyState: unknown,
  current: SubjectUserData,
  content: SubjectContent,
): Dp800Migration | null {
  const state = isRecord(legacyState) ? legacyState : {};
  const lessonIds = new Set(content.lessons.map((lesson) => lesson.id));
  const labIds = new Set(content.labs.map((lab) => lab.id));
  const questionIds = new Set(content.questions.map((question) => question.id));
  const examIds = new Set(content.exams.map((exam) => exam.id));
  const domainIds = new Set(content.domains.map((domain) => domain.id));
  let unreadable = 0;
  let unknownIds = 0;
  let bounded = 0;

  const lessons: SubjectUserData['lessons'] = {};
  if (isRecord(state.lessons)) {
    for (const [id, raw] of Object.entries(state.lessons)) {
      const progress = narrowLessonProgress(raw);
      if (!progress) {
        unreadable += 1;
        continue;
      }
      if (!lessonIds.has(id)) {
        unknownIds += 1;
        continue;
      }
      if (current.lessons[id]) continue; // hub wins per key
      lessons[id] = progress;
    }
  }

  const completedLabs: string[] = [];
  if (Array.isArray(state.completedLabs)) {
    for (const raw of state.completedLabs) {
      if (typeof raw !== 'string') {
        unreadable += 1;
        continue;
      }
      if (!labIds.has(raw)) {
        unknownIds += 1;
        continue;
      }
      if (current.completedLabs.includes(raw)) continue;
      completedLabs.push(raw);
    }
  }

  const quizAttempts: QuizAttempt[] = [];
  if (Array.isArray(state.quizAttempts)) {
    for (const raw of state.quizAttempts) {
      const attempt = narrowQuizAttempt(raw);
      if (!attempt) {
        unreadable += 1;
        continue;
      }
      if (current.quizAttempts.some((existing) => existing.id === attempt.id)) continue;
      // Question ids outside the pack snapshot cannot be reviewed here; the
      // recorded score stays verbatim, only the dangling references go.
      const questionResults = attempt.questionResults.filter((result) => {
        if (questionIds.has(result.questionId)) return true;
        unknownIds += 1;
        return false;
      });
      quizAttempts.push({ ...attempt, questionResults });
    }
    // The donor caps its own log at 200 (newest first); a longer list was not
    // written by the donor app — keep what the donor would have kept.
    if (quizAttempts.length > QUIZ_ATTEMPT_CAP) {
      bounded += quizAttempts.length - QUIZ_ATTEMPT_CAP;
      quizAttempts.length = QUIZ_ATTEMPT_CAP;
    }
  }

  const examAttempts: ExamAttempt[] = [];
  if (Array.isArray(state.examAttempts)) {
    for (const raw of state.examAttempts) {
      const attempt = narrowExamAttempt(raw);
      if (!attempt) {
        unreadable += 1;
        continue;
      }
      if (!examIds.has(attempt.examId)) {
        unknownIds += 1;
        continue;
      }
      if (current.examAttempts.some((existing) => existing.id === attempt.id)) continue;
      const answers: Record<string, string[]> = {};
      for (const [questionId, answer] of Object.entries(attempt.answers)) {
        if (!questionIds.has(questionId)) {
          unknownIds += 1;
          continue;
        }
        answers[questionId] = answer;
      }
      const results = attempt.results.filter((result) => {
        if (questionIds.has(result.questionId)) return true;
        unknownIds += 1;
        return false;
      });
      const perDomain = attempt.perDomain.filter((row) => {
        if (domainIds.has(row.domainId)) return true;
        unknownIds += 1;
        return false;
      });
      examAttempts.push({ ...attempt, answers, results, perDomain });
    }
    if (examAttempts.length > EXAM_ATTEMPT_CAP) {
      bounded += examAttempts.length - EXAM_ATTEMPT_CAP;
      examAttempts.length = EXAM_ATTEMPT_CAP;
    }
  }

  const srs: SubjectUserData['srs'] = {};
  if (isRecord(state.srs)) {
    for (const [key, raw] of Object.entries(state.srs)) {
      const card = narrowSrsCard(raw);
      if (!card) {
        unreadable += 1;
        continue;
      }
      if (key !== card.questionId) {
        // The donor keys every card by its questionId (ingestResults); a
        // mismatched pair is not donor-written data.
        unreadable += 1;
        continue;
      }
      if (!questionIds.has(card.questionId)) {
        unknownIds += 1;
        continue;
      }
      if (current.srs[key]) continue;
      srs[key] = card;
    }
  }

  const notes: Note[] = [];
  if (Array.isArray(state.notes)) {
    for (const raw of state.notes) {
      const note = narrowNote(raw);
      if (!note) {
        unreadable += 1;
        continue;
      }
      // Notes without a lessonId are general notes and stay portable.
      if (note.lessonId !== undefined && !lessonIds.has(note.lessonId)) {
        unknownIds += 1;
        continue;
      }
      if (note.body.length > NOTE_BODY_MAX_CHARS) {
        bounded += 1;
        continue;
      }
      if (current.notes.some((existing) => existing.id === note.id)) continue;
      notes.push(note);
    }
  }

  const bookmarks: string[] = [];
  if (Array.isArray(state.bookmarks)) {
    for (const raw of state.bookmarks) {
      if (typeof raw !== 'string') {
        unreadable += 1;
        continue;
      }
      if (!lessonIds.has(raw)) {
        unknownIds += 1;
        continue;
      }
      if (current.bookmarks.includes(raw)) continue;
      bookmarks.push(raw);
    }
  }

  let lastLessonId: string | undefined;
  if (state.lastLessonId !== undefined) {
    if (typeof state.lastLessonId !== 'string') {
      unreadable += 1;
    } else if (!lessonIds.has(state.lastLessonId)) {
      unknownIds += 1;
    } else if (!current.lastLessonId) {
      lastLessonId = state.lastLessonId; // the hub's own pointer wins
    }
  }

  if (unreadable > 0) {
    console.warn(
      `legacy import: dp800-store held ${unreadable} unreadable ` +
        `entr${unreadable === 1 ? 'y' : 'ies'} — skipped`,
    );
  }

  if (
    Object.keys(lessons).length === 0 &&
    completedLabs.length === 0 &&
    quizAttempts.length === 0 &&
    examAttempts.length === 0 &&
    notes.length === 0 &&
    bookmarks.length === 0 &&
    Object.keys(srs).length === 0 &&
    lastLessonId === undefined
  ) {
    return null;
  }

  const data: Partial<SubjectUserData> = {
    lessons,
    completedLabs,
    quizAttempts,
    examAttempts,
    srs,
    notes,
    bookmarks,
  };
  if (lastLessonId !== undefined) data.lastLessonId = lastLessonId;
  return { data, unreadable, unknownIds, bounded };
}

/* -------------------------------- the runner -------------------------------- */

export interface Dp800ImportSummary {
  lessons: number;
  labs: number;
  quizzes: number;
  exams: number;
  notes: number;
  bookmarks: number;
  srsCards: number;
  lastLessonId: boolean;
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

/**
 * Durability check: read the persisted envelope back through the store's own
 * storage seam and require the dp-800 slice to deep-equal the in-memory
 * slice. A substring probe would false-positive on a stale blob; comparing
 * the whole slice proves the merge itself landed, for every field including
 * lastLessonId.
 */
async function mergePersisted(store: ReturnType<typeof createSubjectDataStore>): Promise<boolean> {
  const storage = store.persist.getOptions().storage;
  if (!storage) return false;
  try {
    // The persist storage may be async; await covers both adapter families.
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

/**
 * Import the donor payload into `subjects['dp-800']` once, then mark the
 * import done. Reads `dp800-store`, never writes it. Returns null whenever it
 * did not complete (already migrated, no old key, unreadable or bounded
 * payload, pack not loadable, merge not persisted) — every such path leaves
 * the guard unset so the next start retries. Async because the durability
 * check reads the persist storage back, which may be an async adapter.
 */
export async function importLegacyDp800Progress(
  store: ReturnType<typeof createSubjectDataStore> = useSubjectDataStore,
  source: Pick<ContentSource, 'listSubjectIds' | 'loadSubject'> = contentSource,
): Promise<Dp800ImportSummary | null> {
  if (safeGet(DP800_MIGRATED_KEY) !== null) return null;

  const raw = safeGet(LEGACY_DP800_KEY);
  if (raw === null) return null;
  if (raw.length > RAW_KEY_MAX_CHARS) {
    console.warn(`legacy import: dp800-store exceeds ${RAW_KEY_MAX_CHARS} chars — skipped`);
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('legacy import: dp800-store is unreadable JSON — skipped');
    return null;
  }
  if (!isRecord(parsed)) {
    console.warn('legacy import: dp800-store has an unexpected shape — skipped');
    return null;
  }
  if (parsed.version !== 1) {
    // The donor persists version 1; a different envelope is a shape this shim
    // was never taught — leave it retryable rather than guess.
    console.warn(
      `legacy import: dp800-store envelope version ${String(parsed.version)} is unknown — skipped`,
    );
    return null;
  }
  if (!isRecord(parsed.state)) {
    console.warn('legacy import: dp800-store has an unexpected shape — skipped');
    return null;
  }

  // The pack must be installed for the data to have a home; without it the
  // key stays retryable so a later install still picks it up.
  if (!source.listSubjectIds().includes(SUBJECT_ID)) {
    console.warn(`legacy import: ${SUBJECT_ID} is not installed — dp800-store left for a later start`);
    return null;
  }
  let content: SubjectContent;
  try {
    content = source.loadSubject(SUBJECT_ID);
  } catch (error) {
    console.error(
      `legacy import: ${SUBJECT_ID} pack failed to load — dp800-store left for a later start`,
      error,
    );
    return null;
  }

  const current = store.getState().subjects[SUBJECT_ID] ?? emptySubjectData();
  const migration = migrateDp800Progress(parsed.state, current, content);
  if (!migration) {
    // The payload was examined and holds nothing adoptable (or only entries
    // the hub already has): done, and there are no writes to verify.
    safeSet(DP800_MIGRATED_KEY, new Date().toISOString());
    console.info(
      'legacy import: dp800-store held nothing to import — theme, achievements, ' +
        'and streak have no per-subject hub home and were not imported',
    );
    return null;
  }

  store.getState().importLegacyData(SUBJECT_ID, migration.data);

  // The store's storage adapter swallows setItem failures, so "merge
  // returned" ≠ "merge persisted". Arm the one-shot guard only after the
  // persisted slice matches; otherwise the next start retries.
  if (!(await mergePersisted(store))) {
    console.warn('legacy import: dp-800 merge did not persist — will retry on the next start');
    return null;
  }

  safeSet(DP800_MIGRATED_KEY, new Date().toISOString());

  const data = migration.data;
  const counts = {
    lessons: Object.keys(data.lessons ?? {}).length,
    labs: (data.completedLabs ?? []).length,
    quizzes: (data.quizAttempts ?? []).length,
    exams: (data.examAttempts ?? []).length,
    notes: (data.notes ?? []).length,
    bookmarks: (data.bookmarks ?? []).length,
    srsCards: Object.keys(data.srs ?? {}).length,
  };
  console.info(
    `legacy import: dp800-store → dp-800 (${counts.lessons} lessons, ${counts.labs} labs, ` +
      `${counts.quizzes} quizzes, ${counts.exams} exam attempts, ${counts.notes} notes, ` +
      `${counts.bookmarks} bookmarks, ${counts.srsCards} SRS cards)` +
      (migration.unknownIds > 0
        ? ` — ${migration.unknownIds} entr${migration.unknownIds === 1 ? 'y' : 'ies'} with unknown ids dropped`
        : '') +
      (migration.bounded > 0
        ? ` — ${migration.bounded} entr${migration.bounded === 1 ? 'y' : 'ies'} over the size/count bounds skipped`
        : '') +
      ' — theme, achievements, and streak have no per-subject hub home and were not imported',
  );
  return { ...counts, lastLessonId: data.lastLessonId !== undefined };
}
