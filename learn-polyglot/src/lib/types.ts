export type LangId = 'java' | 'go' | 'python' | 'ruby';

export type SectionId = 'learn' | 'lab' | 'practice' | 'framework' | 'quiz' | 'compare';

export type Difficulty = 'junior' | 'mid' | 'senior';

export type QuizType = 'mcq' | 'multi' | 'output' | 'fill' | 'coding';

export interface LanguageMeta {
  id: LangId;
  label: string;
  accent: string;
  blurb: string;
  monaco: string;
}

export interface SectionMeta {
  id: SectionId;
  label: string;
  path: string;
  blurb: string;
}

export interface Manifest {
  title: string;
  subtitle: string;
  languages: LanguageMeta[];
  sections: SectionMeta[];
}

export interface CodeSample {
  title: string;
  language: string;
  code: string;
}

export interface DocLink {
  title: string;
  url: string;
  note?: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: Difficulty;
  tags: string[];
  estMinutes: number;
  body: string;
  codeSamples?: CodeSample[];
  docs?: DocLink[];
}

export interface LearnFile {
  language: LangId;
  resources?: DocLink[];
  lessons: Lesson[];
}

export interface Lab {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput: string;
  docs?: DocLink[];
}

export interface LabFile {
  language: LangId;
  labs: Lab[];
}

export interface PracticeProblem {
  id: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  hints: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput?: string;
}

export interface PracticeFile {
  language: LangId;
  problems: PracticeProblem[];
}

export interface FrameworkChallenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  concept: string;
  goal: string;
  steps: string[];
  hints: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput?: string;
}

export interface FrameworkMeta {
  name: string;
  tagline: string;
  overview: string;
  docs?: DocLink[];
}

export interface FrameworkFile {
  language: LangId;
  framework: FrameworkMeta;
  challenges: FrameworkChallenge[];
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizBase {
  id: string;
  type: QuizType;
  prompt: string;
  explanation: string;
  tags?: string[];
}

export interface McqQuestion extends QuizBase {
  type: 'mcq';
  options: QuizOption[];
  answer: string;
}

export interface MultiQuestion extends QuizBase {
  type: 'multi';
  options: QuizOption[];
  answers: string[];
}

export interface OutputQuestion extends QuizBase {
  type: 'output';
  code: string;
  language: string;
  answer: string;
}

export interface FillQuestion extends QuizBase {
  type: 'fill';
  template: string;
  answer: string;
  accept?: string[];
}

export interface CodingQuestion extends QuizBase {
  type: 'coding';
  starterCode: string;
  language: string;
  referenceSolution: string;
  expectedOutput: string;
}

export type QuizQuestion =
  | McqQuestion
  | MultiQuestion
  | OutputQuestion
  | FillQuestion
  | CodingQuestion;

export interface QuizFile {
  language: LangId;
  questions: QuizQuestion[];
}

export interface CompareCell {
  summary: string;
  snippet?: string;
  language?: string;
}

export interface CompareTopic {
  id: string;
  title: string;
  dimension: string;
  cells: Record<LangId, CompareCell>;
}

export interface CompareFile {
  topics: CompareTopic[];
}
