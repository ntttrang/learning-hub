/**
 * Unified content SDK schema — the contract every subject pack satisfies.
 *
 * Generalizes `learn-dp-800/src/lib/types.ts` (the richest model) with
 * `learn-gh-200/src/content/types.ts` (block union + question union) into one
 * subject-agnostic type system:
 *
 *   1. Lessons are ordered blocks, not fixed named sections. DP-800's
 *      specialized sections become registered block kinds (Phase 4 pack work).
 *   2. Comparison is generic N-column, not DB-only.
 *   3. The question union is unified with normalized kind names, id-based
 *      options, and `Answer = string[]` everywhere (option ids, ordered ids,
 *      `leftIdx::right` tokens, blank strings, line-index strings).
 *
 * Content ships as data files (`content/<subject>/**`) validated by the Zod
 * schemas in `validate.ts`; this file is the TypeScript mirror the UI and
 * engines program against. Never import from `learn-*` here.
 */

/* ----------------------------- Brand accents ----------------------------- */

/** Locked brand accent token names — never free-form hex. */
export const ACCENT_TOKENS = [
  'sky-cyan',
  'hub-green',
  'corgi-orange',
  'hub-coral',
  'petal-pink',
  'deep-teal',
  'captain-red',
] as const;

export type AccentToken = (typeof ACCENT_TOKENS)[number];

/* ------------------------------ Learning tools --------------------------- */

/**
 * Learning modes a subject can expose. Tools register metadata + components in
 * `sdk/registry/tools.ts`; `enabledModes` validates against these ids.
 */
export const TOOL_IDS = [
  'learn',
  'labs',
  'practice',
  'exams',
  'compare',
  'notes',
  'revision',
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

/* --------------------------------- Subject ------------------------------- */

/** Top-level pack metadata (`content/<subject>/subject.json`). */
export interface Subject {
  id: string; // kebab-case, also the storage namespace
  code: string; // display code, e.g. "DP-800"
  title: string;
  subtitle?: string;
  description?: string;
  accent: AccentToken;
  disclaimers?: string[];
  /** Only modes with backing content should be listed; validators enforce it. */
  enabledModes: ToolId[];
}

/* --------------------------- Curriculum entities -------------------------- */

export type DifficultyTier = 'beginner' | 'intermediate' | 'advanced' | 'challenge';

/** Certification skill domain (top-level, weighted). */
export interface Domain {
  id: string;
  order: number;
  code?: string; // e.g. "D1"
  title: string;
  /** Official exam weight — a range ("35-40%") or min/max percent numbers. */
  weight?: string | { min: number; max: number };
  summary?: string;
}

/** A module groups related lessons that map to one official sub-skill. */
export interface Module {
  id: string;
  domainId: string;
  order: number;
  code?: string; // e.g. "01"
  title: string;
  summary?: string;
  /** Official sub-skill bullets this module maps to (verbatim, when traced). */
  officialSkills?: string[];
  docIds?: string[];
}

/* --------------------------------- Lessons -------------------------------- */

/**
 * Core lesson blocks. Renderers register per `kind` in
 * `sdk/registry/blocks.tsx`; packs extend the set by registering new kinds —
 * never by editing core code.
 */
export type CoreBlock =
  | { kind: 'md'; body: string } // whole-markdown prose (the .mdx body)
  | { kind: 'heading'; text: string; level?: number }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'tip'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

/**
 * Extension block: any registered kind with its own payload shape. Dispatch is
 * registry-based (runtime), so extension payloads stay intentionally open.
 */
export interface ExtensionBlock {
  kind: string;
  [field: string]: unknown;
}

export type Block = CoreBlock | ExtensionBlock;

export interface Lesson {
  id: string;
  domainId: string;
  moduleId?: string;
  order?: number;
  /** Legacy-friendly URL slug; defaults to the id when omitted. */
  slug?: string;
  title: string;
  summary?: string;
  minutes: number;
  difficulty?: DifficultyTier;
  /** True when the lesson has full flagship-depth content (DP-800 badge). */
  flagship?: boolean;
  /** Ordered content; `.mdx` bodies arrive as one leading `md` block. */
  blocks: Block[];
  labId?: string;
  /** Knowledge-check question ids rendered at the lesson's end. */
  questionIds?: string[];
  references?: Reference[];
  docIds?: string[];
}

/** A citation, inline on lessons or centralized in the pack's docs registry. */
export interface Reference {
  title: string;
  url: string;
  publisher?: string;
  accessed?: string; // ISO date
}

/** Pack-level citation registry (`docs.json`): docId -> reference. */
export type DocRegistry = Record<string, Reference>;

/* ---------------------------------- Labs ---------------------------------- */

/**
 * One hands-on lab step. GH-200's plain-string steps normalize to
 * `{ instructions }`; DP-800's rich SQL steps keep their optional fields.
 */
export interface LabStep {
  title?: string;
  instructions: string; // markdown
  starterSql?: string;
  hint?: string;
  solution?: string;
  expectedOutput?: string; // markdown (often a table)
  validation?: string; // self-check query or rule (markdown)
}

export interface Lab {
  id: string;
  domainId: string;
  lessonId?: string;
  title: string;
  minutes: number;
  summary: string;
  steps: LabStep[];
  /** Observable end states after the steps are done. */
  outcomes?: string[];
  /** Self-check steps verifying a specific setting, log line, or state. */
  checks?: string[];
  /* DP-800 rich-lab fields — optional, rendered by later pack phases. */
  difficulty?: DifficultyTier;
  scenario?: string;
  objective?: string;
  prerequisites?: string[];
  engines?: string[]; // engine ids this lab can run on (e.g. "postgresql")
  schemaSql?: string;
  seedSql?: string;
  engineNotes?: Record<string, string>;
  solutionExplanation?: string;
}

/* -------------------------------- Questions ------------------------------- */

export type QuestionKind =
  | 'single'
  | 'multi'
  | 'order'
  | 'matching'
  | 'fill'
  | 'codeReading'
  | 'bug';

export interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionBase {
  id: string;
  domainId: string;
  moduleId?: string;
  lessonId?: string;
  difficulty?: DifficultyTier;
  /** Markdown stem. */
  prompt: string;
  /** Markdown — why the answer is what it is. */
  explanation: string;
  tags?: string[];
  docIds?: string[];
}

/**
 * The question union. Learner answers are ALWAYS `string[]`:
 *   - single/codeReading/bug: one id / index-as-string
 *   - multi: correct option id set; order: full id sequence
 *   - matching: `${leftIndex}::${right}` tokens
 *   - fill: one string per blank
 */
export type Question = QuestionBase &
  (
    | { kind: 'single'; options: QuestionOption[]; correct: string }
    | { kind: 'multi'; options: QuestionOption[]; correct: string[] }
    | { kind: 'order'; options: QuestionOption[]; correct: string[] }
    | { kind: 'matching'; pairs: { left: string; right: string }[] }
    | {
        kind: 'fill';
        /** Code/text with `___` placeholders, one per blank. */
        template: string;
        blanks: { answer: string; alternatives?: string[] }[];
      }
    | { kind: 'codeReading'; code: string; options: QuestionOption[]; correct: string }
    | { kind: 'bug'; codeLines: string[]; buggyLineIndex: number }
  );

/** The learner-answer shape every grader and persisted attempt uses. */
export type Answer = string[];

/* ---------------------------------- Exams --------------------------------- */

export interface CaseStudy {
  id: string;
  title: string;
  /** Markdown scenario shared by this case study's questions. */
  background: string;
  questionIds: string[];
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  /** Scaled pass mark out of 1000; defaults to 700. */
  passingScore?: number;
  selection:
    | { kind: 'fixed'; questionIds: string[] }
    | {
        kind: 'sampled';
        /** domainId -> number of questions to draw. */
        domainPlan: Record<string, number>;
        seed: number;
        /** Exams whose questions must not be re-served. */
        excludeExamIds?: string[];
      };
  caseStudies?: CaseStudy[];
}

/* ------------------------------- Comparisons ------------------------------ */

/**
 * Generic N-column comparison. DP-800 supplies 4 engine columns; GH-200
 * supplies "GitHub vs Jenkins/AWS"; future subjects supply their own.
 */
export interface Comparison {
  id: string;
  title: string;
  description?: string;
  columns: { id: string; label: string }[];
  rows: { aspect: string; cells: Record<string, string> }[];
  /** Side-by-side code samples keyed by column id (DP-800 engine samples). */
  samples?: { label: string; code: Record<string, string> }[];
  /** DP-800 migration guidance; optional elsewhere. */
  migration?: {
    equivalent: string;
    different: string;
    directMigration: string;
    syntaxChanges: string;
    limitations: string;
    whenToUse: string;
  };
}

/* --------------------- Assembled pack (loader output) --------------------- */

/** A fully loaded, validated subject pack. */
export interface SubjectContent {
  subject: Subject;
  docs: DocRegistry;
  domains: Domain[];
  modules: Module[];
  lessons: Lesson[];
  questions: Question[];
  labs: Lab[];
  exams: Exam[];
  comparisons: Comparison[];
}

/* ------------------------- User data (per subject) ------------------------ */
/*
 * Persisted under `subjects[subjectId]` in the subject-data store — the
 * namespacing makes cross-subject key collisions impossible by construction.
 */

export interface LessonProgress {
  status: 'not-started' | 'in-progress' | 'completed';
  lastVisited?: string; // ISO
  scrollPct?: number;
}

export interface QuizAttempt {
  id: string;
  scope: string; // practice scope: domainId, moduleId, "all", or "review"
  date: string;
  total: number;
  correct: number;
  questionResults: { questionId: string; correct: boolean }[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  date: string;
  durationSeconds: number;
  timed: boolean;
  scaledScore: number;
  passed: boolean;
  perDomain: { domainId: string; correct: number; total: number }[];
  answers: Record<string, Answer>; // questionId -> chosen ids/tokens/blanks
  results: { questionId: string; correct: boolean }[];
}

/** Spaced-repetition record for a single question (Leitner-style). */
export interface SrsCard {
  questionId: string;
  box: number; // 1..5, higher = better known
  due: string; // ISO date next due
  lastSeen: string;
  timesCorrect: number;
  timesWrong: number;
}

export interface Note {
  id: string;
  lessonId?: string;
  title: string;
  body: string;
  updated: string; // ISO
}

export interface StreakState {
  current: number;
  longest: number;
  lastActive?: string; // ISO
}

/** A hub-level badge, earned once and kept (see engines/achievements). */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string; // ISO
}

/** One subject's persisted user data. */
export interface SubjectUserData {
  lessons: Record<string, LessonProgress>;
  completedLabs: string[];
  quizAttempts: QuizAttempt[];
  examAttempts: ExamAttempt[];
  srs: Record<string, SrsCard>;
  notes: Note[];
  bookmarks: string[]; // lesson ids
  lastLessonId?: string;
}
