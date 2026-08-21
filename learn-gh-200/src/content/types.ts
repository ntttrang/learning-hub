/**
 * Content type system for the whole site.
 *
 * One set of shapes carries every phase: domains/sub-skills for Learn,
 * labs for Lab, the question union for Practice, exam configs for Mock
 * exams, and comparison tables for Compare. Content files only produce
 * these types; UI never guesses at raw shapes.
 */

/** The two certifications this site prepares you for. */
export type CertId = 'gh900' | 'gh200';

/** A measurable skill inside a domain, traced to 1–3 official doc pages. */
export interface SubSkill {
  id: string;
  title: string;
  /** Keys into the DOCS registry in content/docs.ts. */
  docIds: string[];
}

/** An exam domain: weighted topic area carrying one lesson and its labs. */
export interface Domain {
  id: string;
  cert: CertId;
  /** Domain number on the official study guide (1-based). */
  number: number;
  title: string;
  /** Official exam weight range in percent. */
  weightMin: number;
  weightMax: number;
  summary: string;
  subSkills: SubSkill[];
  /** One lesson page per domain, rendered at #/learn/:domainId. */
  lesson: Lesson;
}

/** Blocks a lesson is built from; renderer switches on `kind`. */
export type LessonBlock =
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'tip'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface Lesson {
  id: string;
  domainId: string;
  title: string;
  /** Estimated reading time in minutes. */
  minutes: number;
  blocks: LessonBlock[];
}

/** A hands-on exercise with ordered tasks, expected outcomes, and self-checks. */
export interface Lab {
  id: string;
  domainId: string;
  title: string;
  minutes: number;
  /** One-sentence promise of what the learner will have done by the end. */
  summary: string;
  /** Numbered imperative tasks, executed in the learner's own repo. */
  steps: string[];
  /** Observable end states after the tasks are done. */
  outcomes: string[];
  /** Self-check steps: verify a specific setting, log line, or merged state. */
  checks: string[];
}

/** Fields every question carries regardless of kind. */
interface QuestionBase {
  id: string;
  cert: CertId;
  domainId: string;
  subSkillId: string;
  stem: string;
  explanation: string;
  docId: string;
}

/** One blank in a fill question: exact answer plus accepted spellings. */
export interface FillBlank {
  answer: string;
  alternatives: string[];
}

/**
 * The question union (frozen in the plan; Practice and exams both consume it).
 *
 * - single: one correct option out of four
 * - multi: several correct options, all required
 * - fill: YAML codeTemplate with `___` placeholders, one per blank; graded
 *   case-sensitively after trimming and collapsing whitespace, matching the
 *   answer or any alternative
 * - bug: pick the line number that breaks the workflow
 * - order: arrange shuffled items into the listed (correct) order
 */
export type Question = QuestionBase &
  (
    | { kind: 'single'; options: string[]; answerIndex: number }
    | { kind: 'multi'; options: string[]; answerIndexes: number[] }
    | { kind: 'fill'; codeTemplate: string; blanks: FillBlank[] }
    | { kind: 'bug'; codeLines: string[]; buggyLineIndex: number }
    | { kind: 'order'; items: string[] }
  );

/** A mock exam: fixed seed and per-domain counts drive reproducible sampling. */
export interface ExamConfig {
  id: string;
  cert: CertId;
  title: string;
  durationMin: number;
  totalQuestions: number;
  /** domainId -> number of questions to draw. */
  domainPlan: Record<string, number>;
  seed: number;
}

/**
 * One row of a Compare table: how GitHub Actions maps onto another tool.
 * Each side's cell may carry `[label](docId)` inline links — the citation
 * for that side, resolved and rendered like every other doc link on the
 * site.
 */
export interface ComparisonRow {
  dimension: string;
  github: string;
  other: string;
}

/** A whole comparison table (GitHub Actions vs Jenkins, vs AWS, …). */
export interface CompareData {
  id: string;
  title: string;
  /** The tool being compared against (e.g. "Jenkins"). */
  counterpart: string;
  /** Intro prose: when each tool fits, stated as fit — never ranking. */
  description: string;
  rows: ComparisonRow[];
}
