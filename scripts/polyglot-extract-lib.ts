/**
 * Pure extraction library for the polyglot donor — no I/O, no side effects, so
 * the extractor entry and the parity test import it freely (the dp-800-style
 * unguarded entry would execute an extraction mid-test; see the GH-600 flow
 * this structure mirrors).
 *
 * Everything the donor's content becomes is decided here: builders, the
 * derivation log (every authored transformation is counted, never silent), and
 * the quiz-id remap map the progress engine uses to route quiz results to
 * questions vs labs.
 *
 * Donor source of truth: `learn-polyglot/src/lib/types.ts` + `data/**`
 * (vendored at donor SHA fa0019eb).
 */
import { readFileSync } from 'node:fs';
import { polyglotId } from '../src/engines/polyglot-ids';

/* ------------------------------ donor shapes ----------------------------- */

export type LangId = 'java' | 'go' | 'python' | 'ruby';
export type DonorDifficulty = 'junior' | 'mid' | 'senior';
export type DonorQuizType = 'mcq' | 'multi' | 'output' | 'fill' | 'coding';

export interface DonorDocLink {
  title: string;
  url: string;
  note?: string;
}

export interface DonorCodeSample {
  title: string;
  language: string;
  code: string;
}

export interface DonorLesson {
  id: string;
  title: string;
  level: DonorDifficulty;
  tags: string[];
  estMinutes: number;
  body: string;
  codeSamples?: DonorCodeSample[];
  docs?: DonorDocLink[];
}

export interface DonorLearnFile {
  language: LangId;
  resources?: DonorDocLink[];
  lessons: DonorLesson[];
}

export interface DonorLab {
  id: string;
  title: string;
  goal: string;
  steps: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput: string;
  docs?: DonorDocLink[];
}

export interface DonorLabFile {
  language: LangId;
  labs: DonorLab[];
}

export interface DonorPracticeProblem {
  id: string;
  title: string;
  prompt: string;
  difficulty: DonorDifficulty;
  hints: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput?: string;
}

export interface DonorPracticeFile {
  language: LangId;
  problems: DonorPracticeProblem[];
}

export interface DonorFrameworkMeta {
  name: string;
  tagline: string;
  overview: string;
  docs?: DonorDocLink[];
}

export interface DonorFrameworkChallenge {
  id: string;
  title: string;
  difficulty: DonorDifficulty;
  concept: string;
  goal: string;
  steps: string[];
  hints: string[];
  starterCode: string;
  language: string;
  solution: string;
  expectedOutput?: string;
}

export interface DonorFrameworkFile {
  language: LangId;
  framework: DonorFrameworkMeta;
  challenges: DonorFrameworkChallenge[];
}

export interface DonorQuizOption {
  id: string;
  text: string;
}

export interface DonorMcqQuestion {
  id: string;
  type: 'mcq';
  prompt: string;
  explanation: string;
  tags?: string[];
  options: DonorQuizOption[];
  answer: string;
}

export interface DonorMultiQuestion {
  id: string;
  type: 'multi';
  prompt: string;
  explanation: string;
  tags?: string[];
  options: DonorQuizOption[];
  answers: string[];
}

export interface DonorOutputQuestion {
  id: string;
  type: 'output';
  prompt: string;
  explanation: string;
  tags?: string[];
  code: string;
  language: string;
  answer: string;
}

export interface DonorFillQuestion {
  id: string;
  type: 'fill';
  prompt: string;
  explanation: string;
  tags?: string[];
  template: string;
  answer: string;
  accept?: string[];
}

export interface DonorCodingQuestion {
  id: string;
  type: 'coding';
  prompt: string;
  explanation: string;
  tags?: string[];
  starterCode: string;
  language: string;
  referenceSolution: string;
  expectedOutput: string;
}

export type DonorQuizQuestion =
  | DonorMcqQuestion
  | DonorMultiQuestion
  | DonorOutputQuestion
  | DonorFillQuestion
  | DonorCodingQuestion;

export interface DonorQuizFile {
  language: LangId;
  questions: DonorQuizQuestion[];
}

export interface DonorCompareCell {
  summary: string;
  snippet?: string;
  language?: string;
}

export interface DonorCompareTopic {
  id: string;
  title: string;
  dimension: string;
  cells: Record<LangId, DonorCompareCell>;
}

export interface DonorCompareFile {
  topics: DonorCompareTopic[];
}

export interface DonorManifestLanguage {
  id: LangId;
  label: string;
  accent: string;
  blurb: string;
  monaco: string;
}

export interface DonorManifest {
  title: string;
  subtitle: string;
  languages: DonorManifestLanguage[];
  sections: DonorManifestSection[];
}

export interface DonorManifestSection {
  id: string;
  label: string;
  path: string;
  blurb: string;
}

/* -------------------- authored constants (each marked) -------------------- */

export const LANG_ORDER: LangId[] = ['java', 'go', 'python', 'ruby'];

/** Authored: lab `minutes` — the donor has no duration metadata. */
export const AUTHORED_LAB_MINUTES = 20;
/** Authored: practice-problem and framework-challenge lab `minutes`. */
export const AUTHORED_PRACTICE_MINUTES = 15;
/** Authored: coding-quiz-turned-lab `minutes`. */
export const AUTHORED_CODING_LAB_MINUTES = 10;
/** Authored: framework-overview lesson `minutes` (donor has none). */
export const AUTHORED_FRAMEWORK_LESSON_MINUTES = 10;
/** Authored: fixed seed so the sampled exam is replayable. */
export const EXAM_SEED = 20260903;

export const DOMAIN_IDS: Record<LangId, string> = {
  java: 'plg-java',
  go: 'plg-go',
  python: 'plg-python',
  ruby: 'plg-ruby',
};

export const CORE_MODULE_IDS: Record<LangId, string> = {
  java: 'plg-java-core',
  go: 'plg-go-core',
  python: 'plg-python-core',
  ruby: 'plg-ruby-core',
};

export const FRAMEWORK_MODULE_IDS: Record<LangId, string> = {
  java: 'plg-java-framework',
  go: 'plg-go-framework',
  python: 'plg-python-framework',
  ruby: 'plg-ruby-framework',
};

export const CODING_LAB_CHECKS = [
  "Self-check: compare your program's output with the expected output.",
];

/** Authored difficulty map — closest hub tiers, `challenge` reserved/unused. */
export const DIFFICULTY_MAP: Record<DonorDifficulty, 'beginner' | 'intermediate' | 'advanced'> = {
  junior: 'beginner',
  mid: 'intermediate',
  senior: 'advanced',
};

/* --------------------------- derivation accounting ------------------------ */

/**
 * Every authored transformation the extractor applies, counted. The parity
 * test asserts donor-vs-derived numbers against this log so a silent loss is
 * impossible.
 */
export interface DerivationLog {
  /** Donor lesson `tags` (no hub Lesson field) — decision 11. */
  droppedLessonTags: number;
  /** Donor `DocLink.note` strings (hub ReferenceSchema is strict) — decision 11. */
  droppedDocNotes: number;
  /** Donor `codeSamples[].title` (hub code blocks carry no caption). */
  droppedCodeSampleTitles: number;
  /** Donor output-question `language` (hub fill templates are plain text). */
  droppedOutputLanguages: number;
  /** Donor compare-cell `snippet.language` (samples carry no language). */
  droppedSnippetLanguages: number;
  /** `_____`→`___` marker collapses applied to fill templates. */
  fillMarkerRewrites: number;
  /** Extra blanks created when one donor answer fills several markers. */
  blankReplications: number;
  /** Authored `minutes` stamped onto labs/lessons missing donor durations. */
  authoredMinutes: number;
  /** Authored self-check `checks` lines on coding labs. */
  authoredSelfChecks: number;
}

export function emptyDerivationLog(): DerivationLog {
  return {
    droppedLessonTags: 0,
    droppedDocNotes: 0,
    droppedCodeSampleTitles: 0,
    droppedOutputLanguages: 0,
    droppedSnippetLanguages: 0,
    fillMarkerRewrites: 0,
    blankReplications: 0,
    authoredMinutes: 0,
    authoredSelfChecks: 0,
  };
}

/**
 * The donor fill blank marker is `_____` (5 underscores); the hub validator
 * and renderer split templates on exactly `___`. Collapse every underscore run
 * of ≥3 to `___` and count the rewrites. Verified donor case needing the
 * replication path: `<_____>test</_____>` — two markers, one answer (the
 * donor's replace-all semantics mean both blanks take the same answer).
 */
export function collapseFillMarkers(
  template: string,
  log: DerivationLog,
): { template: string; markers: number } {
  const runs = template.match(/_{3,}/g) ?? [];
  log.fillMarkerRewrites += runs.length;
  const collapsed = template.replace(/_{3,}/g, '___');
  return { template: collapsed, markers: collapsed.split('___').length - 1 };
}

/* ------------------------------ doc registry ------------------------------ */

export interface BuiltDocs {
  docs: Record<string, { title: string; url: string }>;
  docIdsByLesson: Map<string, string[]>;
}

/**
 * Build the pack docs registry from donor DocLinks. `note` strings are DROPPED
 * (hub ReferenceSchema is strict) and counted in the derivation log; lab docs
 * are not registered here — they are inlined into lab step instructions by
 * the lab builder so the text stays visible.
 */
export function buildDocRegistry(
  learnByLang: Record<LangId, DonorLearnFile>,
  frameworkByLang: Record<LangId, DonorFrameworkFile>,
  manifest: DonorManifest,
  log: DerivationLog,
): BuiltDocs {
  const docs: Record<string, { title: string; url: string }> = {};
  const docIdsByLesson = new Map<string, string[]>();
  const keyByUrl = new Map<string, string>();
  const usedKeys = new Set<string>();

  // Authored: manifest blurbs carry no DocLinks; walk languages in lockstep.
  const keyFor = (link: DonorDocLink): string => {
    const existing = keyByUrl.get(link.url);
    if (existing) return existing;
    const slug = link.url.split('#')[0].split('?')[0].split('/').filter(Boolean).pop() ?? '';
    const base = slug.replace(/\.html?$/, '') || link.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let key = base;
    let n = 2;
    while (usedKeys.has(key)) key = `${base}-${n++}`;
    usedKeys.add(key);
    keyByUrl.set(link.url, key);
    return key;
  };

  const takeLinks = (links: DonorDocLink[]): string[] =>
    links.map((link) => {
      if (link.note) log.droppedDocNotes += 1;
      const key = keyFor(link);
      docs[key] = { title: link.title, url: link.url };
      return key;
    });

  for (const lang of LANG_ORDER) {
    const learn = learnByLang[lang];
    // File-level resources have no lesson to attach to — registry-only
    // (authored touch, marked in the plan).
    takeLinks(learn.resources ?? []);
    for (const lesson of learn.lessons) {
      docIdsByLesson.set(polyglotId(lesson.id), takeLinks(lesson.docs ?? []));
    }
    takeLinks(frameworkByLang[lang].framework.docs ?? []);
  }
  void manifest;
  return { docs, docIdsByLesson };
}

/* ------------------------------ lesson builders --------------------------- */

export interface BuiltLesson {
  id: string;
  domainId: string;
  moduleId: string;
  order: number;
  title: string;
  minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  blocks: { kind: string;[key: string]: unknown }[];
  docIds?: string[];
}

export function buildLessons(
  learnByLang: Record<LangId, DonorLearnFile>,
  frameworkByLang: Record<LangId, DonorFrameworkFile>,
  manifestByLabel: Record<string, string>,
  docIdsByLesson: Map<string, string[]>,
  log: DerivationLog,
): BuiltLesson[] {
  const lessons: BuiltLesson[] = [];
  for (const lang of LANG_ORDER) {
    const label = manifestByLabel[lang];
    for (const [i, donor] of learnByLang[lang].lessons.entries()) {
      log.droppedLessonTags += donor.tags.length;
      const blocks: BuiltLesson['blocks'] = [{ kind: 'md', body: donor.body }];
      for (const sample of donor.codeSamples ?? []) {
        log.droppedCodeSampleTitles += 1;
        blocks.push({ kind: 'code', language: sample.language, code: sample.code });
      }
      const docIds = docIdsByLesson.get(polyglotId(donor.id));
      lessons.push({
        id: polyglotId(donor.id),
        domainId: DOMAIN_IDS[lang],
        moduleId: CORE_MODULE_IDS[lang],
        order: i + 1,
        title: donor.title,
        minutes: donor.estMinutes,
        difficulty: DIFFICULTY_MAP[donor.level],
        blocks,
        ...(docIds && docIds.length > 0 ? { docIds } : {}),
      });
    }
    // Framework overview lesson (authored minutes, marked).
    const fw = frameworkByLang[lang].framework;
    lessons.push({
      id: polyglotId(`${lang}-framework-overview`),
      domainId: DOMAIN_IDS[lang],
      moduleId: FRAMEWORK_MODULE_IDS[lang],
      order: 1,
      title: `${label} · ${fw.name}`,
      minutes: AUTHORED_FRAMEWORK_LESSON_MINUTES,
      difficulty: 'intermediate',
      blocks: [{ kind: 'md', body: `**${fw.tagline}**\n\n${fw.overview}` }],
    });
  }
  return lessons;
}

/* ------------------------------- lab builders ----------------------------- */

export interface BuiltLab {
  id: string;
  domainId: string;
  title: string;
  minutes: number;
  summary: string;
  steps: { instructions: string }[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  checks?: string[];
}

const fence = (language: string, code: string) => `\`\`\`${language}\n${code}\n\`\`\``;

const orderedList = (steps: string[]) => steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

/**
 * Donor lab → hub Lab. All meaning-bearing text lands in step instructions
 * (guaranteed rendered): step 1 = the donor's ordered steps, step 2 = starter
 * code + solution + expected output. `summary = goal` is an authored
 * derivation (the hub requires a lab summary; the donor has a goal instead).
 */
export function buildDonorLab(donor: DonorLab, lang: LangId, log: DerivationLog): BuiltLab {
  log.authoredMinutes += AUTHORED_LAB_MINUTES;
  const solutionSection = `## Solution\n\n${fence(donor.language, donor.solution)}`;
  const expectedSection = donor.expectedOutput
    ? `\n\n## Expected output\n\n\`\`\`\n${donor.expectedOutput}\n\`\`\``
    : '';
  return {
    id: polyglotId(donor.id),
    domainId: DOMAIN_IDS[lang],
    title: donor.title,
    minutes: AUTHORED_LAB_MINUTES,
    summary: donor.goal,
    steps: [
      { instructions: orderedList(donor.steps) },
      {
        instructions: `Run against this starter code:\n\n${fence(donor.language, donor.starterCode)}${
          donor.docs?.length
            ? `\n\nReferences: ${donor.docs
                .map((d) => `[${d.title}](${d.url})${d.note ? ` — ${d.note}` : ''}`)
                .join(' · ')}`
            : ''
        }\n\n${solutionSection}${expectedSection}`,
      },
    ],
  };
}

export function buildPracticeLab(donor: DonorPracticeProblem, lang: LangId, log: DerivationLog): BuiltLab {
  log.authoredMinutes += AUTHORED_PRACTICE_MINUTES;
  const parts = [donor.prompt, fence(donor.language, donor.starterCode)];
  if (donor.hints.length > 0) {
    parts.push(`## Hints\n\n${donor.hints.map((h) => `- ${h}`).join('\n')}`);
  }
  parts.push(`## Solution\n\n${fence(donor.language, donor.solution)}`);
  if (donor.expectedOutput) {
    parts.push(`## Expected output\n\n\`\`\`\n${donor.expectedOutput}\n\`\`\``);
  }
  return {
    id: polyglotId(donor.id),
    domainId: DOMAIN_IDS[lang],
    title: donor.title,
    minutes: AUTHORED_PRACTICE_MINUTES,
    summary: donor.prompt,
    steps: [{ instructions: parts.join('\n\n') }],
    difficulty: DIFFICULTY_MAP[donor.difficulty],
  };
}

export function buildChallengeLab(donor: DonorFrameworkChallenge, lang: LangId, log: DerivationLog): BuiltLab {
  log.authoredMinutes += AUTHORED_PRACTICE_MINUTES;
  const parts = [
    `**Concept:** ${donor.concept}`,
    donor.goal,
    `## Steps\n\n${orderedList(donor.steps)}`,
  ];
  if (donor.hints.length > 0) {
    parts.push(`## Hints\n\n${donor.hints.map((h) => `- ${h}`).join('\n')}`);
  }
  parts.push(`## Starter\n\n${fence(donor.language, donor.starterCode)}`);
  parts.push(`## Solution\n\n${fence(donor.language, donor.solution)}`);
  if (donor.expectedOutput) {
    parts.push(`## Expected output\n\n\`\`\`\n${donor.expectedOutput}\n\`\`\``);
  }
  return {
    id: polyglotId(donor.id),
    domainId: DOMAIN_IDS[lang],
    title: donor.title,
    minutes: AUTHORED_PRACTICE_MINUTES,
    summary: donor.goal,
    steps: [{ instructions: parts.join('\n\n') }],
    difficulty: DIFFICULTY_MAP[donor.difficulty],
  };
}

export function buildCodingLab(donor: DonorCodingQuestion, lang: LangId, log: DerivationLog): BuiltLab {
  log.authoredMinutes += AUTHORED_CODING_LAB_MINUTES;
  log.authoredSelfChecks += CODING_LAB_CHECKS.length;
  return {
    id: polyglotId(donor.id),
    domainId: DOMAIN_IDS[lang],
    title: donor.prompt.length > 80 ? `${donor.prompt.slice(0, 77)}…` : donor.prompt,
    minutes: AUTHORED_CODING_LAB_MINUTES,
    summary: donor.prompt,
    steps: [
      {
        instructions: [
          donor.prompt,
          `## Starter\n\n${fence(donor.language, donor.starterCode)}`,
          `## Reference solution\n\n${fence(donor.language, donor.referenceSolution)}`,
          `## Expected output\n\n\`\`\`\n${donor.expectedOutput}\n\`\`\``,
        ].join('\n\n'),
      },
    ],
    checks: [...CODING_LAB_CHECKS],
  };
}

export function buildAllLabs(
  labFiles: Record<LangId, DonorLabFile>,
  practiceFiles: Record<LangId, DonorPracticeFile>,
  frameworkFiles: Record<LangId, DonorFrameworkFile>,
  quizFiles: Record<LangId, DonorQuizFile>,
  log: DerivationLog,
): { labs: BuiltLab[]; quizRemap: Record<string, 'question' | 'lab'> } {
  const labs: BuiltLab[] = [];
  const quizRemap: Record<string, 'question' | 'lab'> = {};
  for (const lang of LANG_ORDER) {
    for (const donor of labFiles[lang].labs) labs.push(buildDonorLab(donor, lang, log));
    for (const donor of practiceFiles[lang].problems) labs.push(buildPracticeLab(donor, lang, log));
    for (const donor of frameworkFiles[lang].challenges) labs.push(buildChallengeLab(donor, lang, log));
    for (const donor of quizFiles[lang].questions) {
      quizRemap[donor.id] = donor.type === 'coding' ? 'lab' : 'question';
      if (donor.type === 'coding') labs.push(buildCodingLab(donor, lang, log));
    }
  }
  return { labs, quizRemap };
}

/* ----------------------------- question builders --------------------------- */

export interface BuiltQuestion {
  id: string;
  domainId: string;
  prompt: string;
  explanation: string;
  tags?: string[];
  kind: 'single' | 'multi' | 'fill';
  options?: { id: string; text: string }[];
  correct?: string | string[];
  template?: string;
  blanks?: { answer: string; alternatives?: string[] }[];
}

function requireExplanation(id: string, explanation: string): string {
  if (!explanation.trim()) {
    throw new Error(`question ${id}: donor explanation is empty — refusing to author content`);
  }
  return explanation;
}

export function buildQuestions(
  quizFiles: Record<LangId, DonorQuizFile>,
  log: DerivationLog,
): BuiltQuestion[] {
  const questions: BuiltQuestion[] = [];
  for (const lang of LANG_ORDER) {
    for (const donor of quizFiles[lang].questions) {
      if (donor.type === 'coding') continue; // became a lab (buildAllLabs)
      const base = {
        id: polyglotId(donor.id),
        domainId: DOMAIN_IDS[lang],
        prompt: donor.prompt,
        explanation: requireExplanation(donor.id, donor.explanation),
        ...(donor.tags && donor.tags.length > 0 ? { tags: donor.tags } : {}),
      };
      if (donor.type === 'mcq') {
        questions.push({
          ...base,
          kind: 'single',
          options: donor.options.map((o) => ({ id: o.id, text: o.text })),
          correct: donor.answer,
        });
      } else if (donor.type === 'multi') {
        questions.push({
          ...base,
          kind: 'multi',
          options: donor.options.map((o) => ({ id: o.id, text: o.text })),
          correct: donor.answers,
        });
      } else if (donor.type === 'output') {
        log.droppedOutputLanguages += 1;
        questions.push({
          ...base,
          kind: 'fill',
          template: `${donor.code}\n\nPredicted output: ___`,
          blanks: [{ answer: donor.answer }],
        });
      } else {
        const { template, markers } = collapseFillMarkers(donor.template, log);
        if (markers < 1) {
          throw new Error(`question ${donor.id}: fill template has no blank marker`);
        }
        const alternatives = donor.accept ?? [];
        const blanks = Array.from({ length: markers }, () => ({
          answer: donor.answer,
          ...(alternatives.length > 0 ? { alternatives } : {}),
        }));
        log.blankReplications += markers - 1;
        questions.push({ ...base, kind: 'fill', template, blanks });
      }
    }
  }
  return questions;
}

/* ---------------------------- comparison builders -------------------------- */

export interface BuiltComparison {
  id: string;
  title: string;
  description?: string;
  columns: { id: string; label: string }[];
  rows: { aspect: string; cells: Record<string, string> }[];
  samples?: { label: string; code: Record<string, string> }[];
}

export function buildComparisons(
  compareFile: DonorCompareFile,
  manifestLanguages: Record<LangId, string>,
  log: DerivationLog,
): BuiltComparison[] {
  const columns = LANG_ORDER.map((lang) => ({ id: DOMAIN_IDS[lang], label: manifestLanguages[lang] }));
  return compareFile.topics.map((topic) => {
    const cells: Record<string, string> = {};
    for (const lang of LANG_ORDER) cells[DOMAIN_IDS[lang]] = topic.cells[lang].summary;
    const snippets: Record<string, string> = {};
    for (const lang of LANG_ORDER) {
      const cell = topic.cells[lang];
      if (cell.snippet !== undefined) {
        if (cell.language !== undefined) log.droppedSnippetLanguages += 1;
        snippets[DOMAIN_IDS[lang]] = cell.snippet;
      }
    }
    return {
      id: polyglotId(topic.id),
      title: topic.title,
      columns,
      rows: [{ aspect: topic.dimension, cells }],
      ...(Object.keys(snippets).length > 0 ? { samples: [{ label: topic.title, code: snippets }] } : {}),
    };
  });
}

/* ------------------------------- exam builder ------------------------------ */

export interface BuiltExam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  selection: { kind: 'sampled'; domainPlan: Record<string, number>; seed: number };
}

export function buildExam(manifestLanguages: Record<LangId, string>): BuiltExam {
  const domainPlan: Record<string, number> = {};
  for (const lang of LANG_ORDER) domainPlan[DOMAIN_IDS[lang]] = 10;
  return {
    id: 'plg-exam-1',
    title: 'Languages knowledge check',
    description: `Sampled evenly across ${LANG_ORDER.map((l) => manifestLanguages[l]).join(', ')} — fixed seed ${EXAM_SEED}, replayable.`,
    durationMinutes: 60,
    selection: { kind: 'sampled', domainPlan, seed: EXAM_SEED },
  };
}

/* ------------------------------- pack assembly ----------------------------- */

export interface DonorData {
  manifest: DonorManifest;
  learn: Record<LangId, DonorLearnFile>;
  labs: Record<LangId, DonorLabFile>;
  practice: Record<LangId, DonorPracticeFile>;
  framework: Record<LangId, DonorFrameworkFile>;
  quiz: Record<LangId, DonorQuizFile>;
  compare: DonorCompareFile;
}

export interface PackFiles {
  files: Record<string, unknown>;
  derivations: DerivationLog;
  quizRemap: Record<string, 'question' | 'lab'>;
}

export const SUBJECT_ID = 'languages';
export const SUBJECT_CODE = 'LANG';

export function buildPack(donor: DonorData): PackFiles {
  const log = emptyDerivationLog();
  const labels: Record<LangId, string> = {} as Record<LangId, string>;
  for (const l of donor.manifest.languages) labels[l.id] = l.label;

  const { docs, docIdsByLesson } = buildDocRegistry(donor.learn, donor.framework, donor.manifest, log);
  const lessons = buildLessons(donor.learn, donor.framework, labels, docIdsByLesson, log);
  const { labs, quizRemap } = buildAllLabs(donor.labs, donor.practice, donor.framework, donor.quiz, log);
  const questions = buildQuestions(donor.quiz, log);
  const comparisons = buildComparisons(donor.compare, labels, log);
  const exam = buildExam(labels);

  const domains = LANG_ORDER.map((lang, i) => ({
    id: DOMAIN_IDS[lang],
    order: i + 1,
    code: lang.toUpperCase(),
    title: labels[lang],
    summary: donor.manifest.languages.find((l) => l.id === lang)?.blurb ?? '',
  }));

  const modules = LANG_ORDER.flatMap((lang, i) => {
    const fwName = donor.framework[lang].framework.name;
    return [
      { id: CORE_MODULE_IDS[lang], domainId: DOMAIN_IDS[lang], order: 2 * i + 1, title: `${labels[lang]} core language` },
      { id: FRAMEWORK_MODULE_IDS[lang], domainId: DOMAIN_IDS[lang], order: 2 * i + 2, title: `Framework: ${fwName}` },
    ];
  });

  const subject = {
    id: SUBJECT_ID,
    code: SUBJECT_CODE,
    title: 'Languages',
    subtitle: 'Java · Go · Python · Ruby — senior-level revision',
    description:
      'Senior-engineer revision across four stacks: core language, one flagship framework per stack, labs, practice, knowledge checks, and cross-language comparisons — ported from the donor Polyglot Revision Hub.',
    accent: 'captain-red',
    disclaimers: ['Content ported verbatim from the donor Polyglot Revision Hub (ntttrang/polyglot-hub).'],
    enabledModes: ['learn', 'labs', 'practice', 'exams', 'compare', 'notes', 'revision'],
  };

  const files: Record<string, unknown> = {
    [`content/${SUBJECT_ID}/subject.json`]: subject,
    [`content/${SUBJECT_ID}/domains.json`]: domains,
    [`content/${SUBJECT_ID}/modules.json`]: modules,
    [`content/${SUBJECT_ID}/docs.json`]: docs,
    [`content/${SUBJECT_ID}/labs.json`]: labs,
    [`content/${SUBJECT_ID}/exams.json`]: [exam],
    [`content/${SUBJECT_ID}/comparisons.json`]: comparisons,
  };
  for (const lesson of lessons) {
    files[`content/${SUBJECT_ID}/lessons/${lesson.id}.json`] = lesson;
  }
  for (const question of questions) {
    files[`content/${SUBJECT_ID}/questions/${question.id}.json`] = question;
  }
  return { files, derivations: log, quizRemap };
}

/* ------------------------------- donor reading ----------------------------- */

/**
 * Read the vendored donor data tree. Kept beside the builders (instead of in
 * the entry) so the parity test can reuse the exact same reader.
 */
export function readDonorData(root: string): DonorData {
  const p = (rel: string) => `${root}/learn-polyglot/data/${rel}`;
  const json = <T>(rel: string): T => JSON.parse(readFileSync(p(rel), 'utf8')) as T;

  const learn = {} as DonorData['learn'];
  const labs = {} as DonorData['labs'];
  const practice = {} as DonorData['practice'];
  const framework = {} as DonorData['framework'];
  const quiz = {} as DonorData['quiz'];
  for (const lang of LANG_ORDER) {
    learn[lang] = json(`${lang}/learn.json`);
    labs[lang] = json(`${lang}/lab.json`);
    practice[lang] = json(`${lang}/practice.json`);
    framework[lang] = json(`${lang}/framework.json`);
    quiz[lang] = json(`${lang}/quiz.json`);
  }
  return {
    manifest: json('manifest.json'),
    learn,
    labs,
    practice,
    framework,
    quiz,
    compare: json('compare/topics.json'),
  };
}
