/**
 * Core data models for the DP-800 learning platform.
 * These types are the single source of truth used by content, UI, and persistence.
 */

export type DatabaseEngine = "sqlserver" | "postgresql" | "mysql" | "oracle";

export const ENGINE_LABELS: Record<DatabaseEngine, string> = {
  sqlserver: "Microsoft SQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  oracle: "Oracle Database",
};

export type DifficultyTier = "beginner" | "intermediate" | "advanced" | "challenge";

/** Certification skill domain (top-level, weighted). */
export interface Domain {
  id: string;
  order: number;
  code: string; // e.g. "D1"
  title: string;
  weight: string; // e.g. "35-40%"
  summary: string;
  accent: string; // css var name for theming, e.g. "--sky-cyan"
  moduleIds: string[];
}

/** A module groups a set of related lessons that map to an official sub-skill. */
export interface Module {
  id: string;
  domainId: string;
  order: number;
  code: string; // e.g. "01"
  title: string;
  summary: string;
  /** Official sub-skill bullets this module maps to (verbatim from skills outline). */
  officialSkills: string[];
  lessonIds: string[];
}

/**
 * Source classification — visually distinguished in the UI so learners always
 * know whether a statement is official Microsoft content or added guidance.
 */
export type SourceKind = "official" | "explanation" | "recommendation" | "examTip";

export interface SourceReference {
  title: string;
  url: string;
  publisher: string; // "Microsoft Learn", "PostgreSQL", etc.
  accessed: string; // ISO date the source was accessed
}

/** A markdown-bearing block tagged with its source classification. */
export interface ContentBlock {
  kind: SourceKind;
  /** Optional heading shown above the block. */
  heading?: string;
  /** Markdown body (GFM: tables, code fences, lists). */
  body: string;
}

/** Cross-database comparison used inside lessons and the /compare matrix. */
export interface DbComparison {
  id: string;
  concept: string;
  summary: string;
  /** Per-engine capability description. */
  rows: {
    aspect: string;
    sqlserver: string;
    postgresql: string;
    mysql: string;
    oracle: string;
  }[];
  /** Side-by-side code samples keyed by engine. */
  samples?: {
    label: string;
    code: Partial<Record<DatabaseEngine, string>>;
  }[];
  migration: {
    equivalent: string;
    different: string;
    directMigration: string;
    syntaxChanges: string;
    limitations: string;
    whenToUse: string;
  };
}

export interface KnowledgeCheck {
  questionIds: string[];
}

/**
 * A lesson follows the consistent 18-section structure. Sections that don't
 * apply to a given lesson can be omitted; the viewer renders what exists.
 */
export interface Lesson {
  id: string;
  moduleId: string;
  domainId: string;
  order: number;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: DifficultyTier;
  /** True when the lesson has full flagship-depth content. */
  flagship?: boolean;

  learningObjectives: string[];
  keyTerms: { term: string; definition: string }[];

  sections: {
    overview?: string;
    officialConcepts?: ContentBlock[];
    visualExplanation?: { caption: string; mermaid?: string; image?: string };
    sqlServerImplementation?: ContentBlock[];
    postgresComparison?: ContentBlock[];
    mysqlComparison?: ContentBlock[];
    oracleComparison?: ContentBlock[];
    sideBySide?: DbComparison;
    realWorldScenario?: ContentBlock[];
    commonMistakes?: { mistake: string; fix: string }[];
    performanceSecurity?: ContentBlock[];
    examTips?: string[];
    summary?: string;
  };

  labId?: string;
  knowledgeCheck: KnowledgeCheck;
  references: SourceReference[];
}

/* ------------------------------- Labs -------------------------------- */

export interface LabStep {
  title: string;
  instructions: string; // markdown
  starterSql?: string;
  hint?: string;
  solution?: string;
  expectedOutput?: string; // markdown (often a table)
  validation?: string; // a self-check query or rule (markdown)
}

export interface Lab {
  id: string;
  lessonId?: string;
  domainId: string;
  title: string;
  difficulty: DifficultyTier;
  estimatedMinutes: number;
  scenario: string;
  objective: string;
  prerequisites: string[];
  engines: DatabaseEngine[]; // engines this lab can run on
  schemaSql: string;
  seedSql: string;
  steps: LabStep[];
  /** Per-engine notes/alternatives where syntax differs. */
  engineNotes?: Partial<Record<DatabaseEngine, string>>;
  solutionExplanation: string; // markdown
}

/* ----------------------------- Questions ----------------------------- */

export type QuestionType =
  | "single" // one correct answer
  | "multi" // multiple correct answers
  | "ordering" // arrange options in correct order
  | "matching" // match left items to right items
  | "codeReading" // read a snippet, choose outcome
  | "debugging" // find the bug / fix
  | "sqlFill"; // complete ____ blanks in a T-SQL snippet

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  domainId: string;
  moduleId?: string;
  lessonId?: string;
  type: QuestionType;
  difficulty: DifficultyTier;
  prompt: string; // markdown
  code?: string; // optional SQL snippet shown with the prompt; for sqlFill, contains ____ blanks
  options?: QuestionOption[]; // for single/multi/codeReading/debugging/ordering
  /** correct option ids (single => length 1). For ordering, this is the correct order of option ids. For sqlFill, ordered blank tokens. */
  correct?: string[];
  /** For sqlFill: extra accepted tokens per blank index (same order as correct). */
  blankAliases?: string[][];
  /** For matching questions. */
  pairs?: MatchPair[];
  explanation: string; // markdown — detailed answer explanation
  tags?: string[];
}

/* ---------------------------- Mock exams ----------------------------- */

export interface CaseStudy {
  id: string;
  title: string;
  background: string; // markdown scenario/background shared by its questions
  questionIds: string[];
}

export interface MockExam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScore: number; // scaled, out of 1000
  questionIds: string[];
  caseStudies?: CaseStudy[];
}

/* --------------------------- User progress -------------------------- */

export interface LessonProgress {
  status: "not-started" | "in-progress" | "completed";
  lastVisited?: string; // ISO
  scrollPct?: number;
}

export interface QuizAttempt {
  id: string;
  scope: string; // moduleId or "review"
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
  answers: Record<string, string[]>; // questionId -> chosen option ids / order
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
  updated: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt?: string;
}

export interface RevisionRecommendation {
  lessonId: string;
  reason: string;
  priority: number; // higher = more urgent
}
