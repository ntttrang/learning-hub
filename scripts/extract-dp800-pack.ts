/**
 * One-off pack extractor: learn-dp-800's typed TS content → the hub JSON pack.
 *
 * This script is the provenance record for the generated files committed under
 * content/dp-800 plus the donor docker environment copied verbatim under
 * public/dp-800/docker — re-run it manually to regenerate after donor changes
 * (one-shot by decision; there is no drift gate).
 *
 * Usage: npm run content:extract-dp800 [-- --dry-run]
 *
 * Runs under tsx: the donor modules import types through the `@/` alias
 * (type-only, so erased at transpile) and values only through relative paths —
 * the aggregator `src/lib/content.ts` is the one donor entry whose value-level
 * `@/` imports cannot resolve here, which is why this script imports the deep
 * per-file modules instead. All donor values are copied verbatim; the three
 * deliberate authored touches are marked inline (lab summary derivation, one
 * amended prerequisite string, the docker safety README).
 */
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { MOCK_EXAMS } from '../learn-dp-800/src/content/exams';
import { DOMAINS, MODULES } from '../learn-dp-800/src/content/curriculum';
import { DOMAIN1_LESSONS } from '../learn-dp-800/src/content/lessons/domain1';
import { DOMAIN2_LESSONS } from '../learn-dp-800/src/content/lessons/domain2';
import { DOMAIN3_LESSONS } from '../learn-dp-800/src/content/lessons/domain3';
import { LABS } from '../learn-dp-800/src/content/labs';
import { D1_QUESTIONS } from '../learn-dp-800/src/content/questions/domain1';
import { D2_QUESTIONS } from '../learn-dp-800/src/content/questions/domain2';
import { D3_QUESTIONS } from '../learn-dp-800/src/content/questions/domain3';
import { EXAM1_CASE_QUESTIONS, EXAM1_QUESTIONS } from '../learn-dp-800/src/content/questions/exam1';
import { LAB_CODING_QUESTIONS, LAB_CODING_SETS } from '../learn-dp-800/src/content/questions/lab-coding/index';
import type {
  ContentBlock,
  DbComparison,
  Lab,
  Lesson,
  Question,
} from '../learn-dp-800/src/lib/types';
import { ENGINE_LABELS } from '../src/ui/engine-labels';

/* ------------------------------ pack metadata ------------------------------ */

const PACK_DIR = 'content/dp-800';
const DOCKER_SRC = 'learn-dp-800/docker';
const DOCKER_DEST = 'public/dp-800/docker';
// compose + dab-config.json + 3 mssql seeds + postgres/mysql/oracle seeds.
const DOCKER_FILE_COUNT = 8;

/**
 * Hand-authored subject.json, pinned verbatim (strings from the donor's
 * EXAM_META and the hub roadmap placeholder at src/shell/subjects.ts —
 * copy-pasted once at implementation time, never retyped from memory).
 */
const SUBJECT = {
  id: 'dp-800',
  code: 'DP-800',
  title: 'Developing AI-Enabled Database Solutions',
  subtitle: 'SQL AI Developer · 3 domains',
  description: 'Databases, T-SQL, vector search — with cross-engine compare & Docker labs.',
  accent: 'sky-cyan',
  disclaimers: [
    'Microsoft Certified: SQL AI Developer Associate',
    'Skills outline as of March 12, 2026',
    'Platforms: SQL Server 2025 · Azure SQL · SQL databases in Microsoft Fabric',
  ],
  enabledModes: ['learn', 'labs', 'practice', 'exams', 'compare', 'notes', 'revision'],
};

// The loader keys packs by directory name (subject.id must equal it).
if (SUBJECT.id !== basename(PACK_DIR)) {
  throw new Error(`subject id "${SUBJECT.id}" must equal directory "${basename(PACK_DIR)}"`);
}

// The seven extension kinds registered in src/content/dp-800/renderers.tsx
// must never collide with the core block ids the SDK owns.
const CORE_BLOCK_KINDS = ['md', 'heading', 'list', 'code', 'tip', 'table'];
const EXTENSION_KINDS = [
  'objectives',
  'keyTerms',
  'sourced',
  'figure',
  'sideBySide',
  'mistakes',
  'examTips',
];
const collision = EXTENSION_KINDS.filter((kind) => CORE_BLOCK_KINDS.includes(kind));
if (collision.length > 0) {
  throw new Error(`extension kind ids collide with core kinds: ${collision.join(', ')}`);
}

/* --------------------------------- helpers -------------------------------- */

function fail(context: string, message: string): never {
  throw new Error(`extract-dp800: ${context}: ${message}`);
}

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

/** Every `sections` key the donor Lesson type defines — the transform table. */
const KNOWN_SECTIONS = new Set([
  'overview',
  'officialConcepts',
  'visualExplanation',
  'sqlServerImplementation',
  'postgresComparison',
  'mysqlComparison',
  'oracleComparison',
  'sideBySide',
  'realWorldScenario',
  'commonMistakes',
  'performanceSecurity',
  'examTips',
  'summary',
]);

/* Output-side payload shapes — the extractor's contract with the phase-2
 * renderers in src/content/dp-800/renderers.tsx (mirrored here because this
 * tsc project has no jsx flag; content:check plus the renderers' own tests
 * keep the two sides honest). */
interface ObjectivesBlock {
  kind: 'objectives';
  items: string[];
}
interface KeyTermsBlock {
  kind: 'keyTerms';
  terms: { term: string; definition: string }[];
}
interface SourcedBlock {
  kind: 'sourced';
  source: ContentBlock['kind'];
  heading?: string;
  body: string;
}
interface FigureBlock {
  kind: 'figure';
  caption: string;
  mermaid?: string;
}
interface ComparisonPayload {
  id: string;
  title: string;
  description?: string;
  columns: { id: string; label: string }[];
  rows: { aspect: string; cells: Record<string, string> }[];
  samples?: { label: string; code: Record<string, string> }[];
  migration?: DbComparison['migration'];
}
interface SideBySideBlock {
  kind: 'sideBySide';
  comparison: ComparisonPayload;
}
interface MistakesBlock {
  kind: 'mistakes';
  items: { mistake: string; fix: string }[];
}
interface ExamTipsBlock {
  kind: 'examTips';
  tips: string[];
}

type EmittedBlock =
  | { kind: 'heading'; text: string; level?: number }
  | { kind: 'md'; body: string }
  | ObjectivesBlock
  | KeyTermsBlock
  | SourcedBlock
  | FigureBlock
  | SideBySideBlock
  | MistakesBlock
  | ExamTipsBlock;

/** Section headings mirror the donor LessonViewer's labels. */
const H = (text: string): EmittedBlock => ({ kind: 'heading', text, level: 2 });

function sourced(blocks: ContentBlock[] | undefined): SourcedBlock[] {
  return (blocks ?? []).map((block) => ({
    kind: 'sourced',
    source: block.kind,
    heading: block.heading,
    body: block.body,
  }));
}

/* ------------------------------- comparisons ------------------------------- */

const ENGINE_IDS = ['sqlserver', 'postgresql', 'mysql', 'oracle'] as const;

/** Donor engine-keyed rows → hub N-column cells; columns from ENGINE_LABELS. */
function mapComparison(comparison: DbComparison): ComparisonPayload {
  return {
    id: comparison.id,
    title: comparison.concept,
    description: comparison.summary,
    columns: ENGINE_IDS.map((id) => ({ id, label: ENGINE_LABELS[id] })),
    rows: comparison.rows.map((row) => ({
      aspect: row.aspect,
      cells: {
        sqlserver: row.sqlserver,
        postgresql: row.postgresql,
        mysql: row.mysql,
        oracle: row.oracle,
      },
    })),
    samples: comparison.samples?.map((sample) => {
      // The donor type is Partial<Record<engine, string>>; a missing engine
      // would slip past Zod's record and render an empty cell — enforce the
      // full coverage here instead of trusting the cast below.
      const missing = ENGINE_IDS.filter((id) => sample.code[id] === undefined);
      if (missing.length > 0) {
        fail(`comparison/${comparison.id}`, `sample "${sample.label}" lacks code for: ${missing.join(', ')}`);
      }
      return { label: sample.label, code: sample.code as Record<string, string> };
    }),
    migration: comparison.migration,
  };
}

/* --------------------------------- lessons --------------------------------- */

/** Lessons in curriculum order: module position, then the donor lesson order. */
function orderedLessons(): Lesson[] {
  const modulePos = new Map(MODULES.map((module, index) => [module.id, index]));
  return [...DOMAIN1_LESSONS, ...DOMAIN2_LESSONS, ...DOMAIN3_LESSONS].sort((a, b) => {
    const posA = modulePos.get(a.moduleId ?? '');
    const posB = modulePos.get(b.moduleId ?? '');
    if (posA === undefined) fail(`lesson/${a.id}`, `unknown module "${a.moduleId}"`);
    if (posB === undefined) fail(`lesson/${b.id}`, `unknown module "${b.moduleId}"`);
    return posA - posB || a.order - b.order;
  });
}

/**
 * Sections → ordered blocks, in the donor viewer's fixed section order.
 * Array sections emit nothing when empty — the renderers draw the section
 * title unconditionally while the donor gates on `length > 0`.
 */
function mapLesson(lesson: Lesson) {
  const sections = lesson.sections;
  for (const key of Object.keys(sections)) {
    if (!KNOWN_SECTIONS.has(key)) {
      fail(`lesson/${lesson.id}`, `unknown section "${key}" — extend the transform table first`);
    }
  }

  const blocks: EmittedBlock[] = [];
  if (lesson.learningObjectives.length > 0) {
    blocks.push({ kind: 'objectives', items: lesson.learningObjectives });
  }
  if (sections.overview) {
    blocks.push(H('Overview'), { kind: 'md', body: sections.overview });
  }
  if (lesson.keyTerms.length > 0) {
    blocks.push({ kind: 'keyTerms', terms: lesson.keyTerms });
  }
  if ((sections.officialConcepts ?? []).length > 0) {
    blocks.push(H('Official Microsoft concepts'), ...sourced(sections.officialConcepts));
  }
  if (sections.visualExplanation) {
    const { caption, mermaid, image } = sections.visualExplanation;
    if (image) fail(`lesson/${lesson.id}`, 'visualExplanation.image has no hub mapping (0 in donor)');
    blocks.push({ kind: 'figure', caption, mermaid });
  }
  if ((sections.sqlServerImplementation ?? []).length > 0) {
    blocks.push(H('Microsoft SQL implementation'), ...sourced(sections.sqlServerImplementation));
  }
  const crossDatabase = [
    ...(sections.postgresComparison ?? []),
    ...(sections.mysqlComparison ?? []),
    ...(sections.oracleComparison ?? []),
  ];
  if (crossDatabase.length > 0) {
    blocks.push(H('Cross-database comparison'), ...sourced(crossDatabase));
  }
  if (sections.sideBySide) {
    blocks.push({ kind: 'sideBySide', comparison: mapComparison(sections.sideBySide) });
  }
  if ((sections.realWorldScenario ?? []).length > 0) {
    blocks.push(H('Real-world scenario'), ...sourced(sections.realWorldScenario));
  }
  const mistakes = sections.commonMistakes ?? [];
  if (mistakes.length > 0) {
    blocks.push({ kind: 'mistakes', items: mistakes });
  }
  if ((sections.performanceSecurity ?? []).length > 0) {
    blocks.push(H('Performance & security considerations'), ...sourced(sections.performanceSecurity));
  }
  const examTips = sections.examTips ?? [];
  if (examTips.length > 0) {
    blocks.push({ kind: 'examTips', tips: examTips });
  }
  if (sections.summary) {
    blocks.push(H('Summary'), { kind: 'md', body: sections.summary });
  }

  return {
    id: lesson.id,
    domainId: lesson.domainId,
    moduleId: lesson.moduleId,
    order: lesson.order,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    minutes: lesson.estimatedMinutes,
    difficulty: lesson.difficulty,
    flagship: lesson.flagship,
    blocks,
    labId: lesson.labId,
    questionIds: lesson.knowledgeCheck.questionIds,
    references: lesson.references,
  };
}

/* -------------------------------- questions -------------------------------- */

/**
 * The hub kind derives from `code` presence, not the donor type name: the hub
 * `codeReading` schema requires a snippet, while 16 donor-typed codeReading
 * and 3 donor-typed debugging questions carry none (plain scenario items).
 * Every one-correct option question grades identically in the hub.
 */
function mapQuestion(question: Question) {
  const base = {
    id: question.id,
    domainId: question.domainId,
    moduleId: question.moduleId,
    lessonId: question.lessonId,
    difficulty: question.difficulty,
    prompt: question.prompt,
    explanation: question.explanation,
    tags: question.tags,
  };

  if (question.type === 'matching' || question.type === 'sqlFill') {
    fail(
      `question/${question.id}`,
      `donor type "${question.type}" has 0 authored items — no extractor branch by decision`,
    );
  }
  if (question.type === 'multi' || question.type === 'ordering') {
    const options = question.options ?? [];
    const correct = question.correct ?? [];
    if (options.length < 2) fail(`question/${question.id}`, 'multi/ordering needs ≥2 options');
    return {
      ...base,
      kind: question.type === 'multi' ? ('multi' as const) : ('order' as const),
      options,
      correct,
    };
  }

  // single | codeReading | debugging — one-correct option questions.
  const options = question.options ?? [];
  const correct = question.correct ?? [];
  if (options.length < 2) fail(`question/${question.id}`, 'needs ≥2 options');
  if (correct.length !== 1) fail(`question/${question.id}`, `expected 1 correct id, got ${correct.length}`);
  return question.code
    ? { ...base, kind: 'codeReading' as const, code: question.code, options, correct: correct[0] }
    : { ...base, kind: 'single' as const, options, correct: correct[0] };
}

/** Pool order: domain1 → domain2 → domain3 → exam1 (standalone, case) → lab-coding. */
function orderedQuestions(): Question[] {
  const labNumber = new Map(LAB_CODING_SETS.flatMap((set) => set.questionIds.map((id) => [id, set.labNumber] as const)));
  return [
    ...D1_QUESTIONS,
    ...D2_QUESTIONS,
    ...D3_QUESTIONS,
    ...EXAM1_QUESTIONS,
    ...EXAM1_CASE_QUESTIONS,
    ...[...LAB_CODING_QUESTIONS].sort(
      (a, b) =>
        (labNumber.get(a.id) ?? 0) - (labNumber.get(b.id) ?? 0) || a.id.localeCompare(b.id),
    ),
  ];
}

/* ----------------------------------- labs ---------------------------------- */

/** The one authored string change in the whole extraction. */
const SETUP_PAGE_REF = '(see the Setup page)';
const SETUP_PAGE_REPLACEMENT = '(see the bundled Docker environment at /dp-800/docker/README.md)';

function mapLab(lab: Lab) {
  return {
    id: lab.id,
    domainId: lab.domainId,
    lessonId: lab.lessonId,
    title: lab.title,
    // The donor Lab type has no summary and its lab page opens straight into
    // "Scenario & objective"; the hub schema requires one, so the donor's
    // one-line purpose fills it verbatim.
    summary: lab.objective,
    minutes: lab.estimatedMinutes,
    difficulty: lab.difficulty,
    scenario: lab.scenario,
    objective: lab.objective,
    prerequisites: lab.prerequisites.map((prereq) =>
      prereq.includes(SETUP_PAGE_REF) ? prereq.replace(SETUP_PAGE_REF, SETUP_PAGE_REPLACEMENT) : prereq,
    ),
    engines: lab.engines,
    schemaSql: lab.schemaSql,
    seedSql: lab.seedSql,
    steps: lab.steps.map((step) => ({
      title: step.title,
      instructions: step.instructions,
      starterSql: step.starterSql,
      hint: step.hint,
      solution: step.solution,
      expectedOutput: step.expectedOutput,
      validation: step.validation,
    })),
    engineNotes: lab.engineNotes,
    solutionExplanation: lab.solutionExplanation,
  };
}

/* ----------------------------------- exams --------------------------------- */

function mapExam(exam: (typeof MOCK_EXAMS)[number]) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    durationMinutes: exam.durationMinutes,
    passingScore: exam.passingScore,
    selection: { kind: 'fixed' as const, questionIds: exam.questionIds },
    caseStudies: exam.caseStudies,
  };
}

/* ---------------------------------- docker --------------------------------- */

const DOCKER_README = `# DP-800 lab Docker environment

This directory is the donor app's local lab environment, copied verbatim by
the pack extractor (\`npm run content:extract-dp800\`). It stands up one
container per database engine plus Data API builder so the hands-on labs can
run anywhere Docker does.

## Read this before \`docker compose up\`

- The compose file, seed SQL, and \`dab-config.json\` bake in lab-local
  development credentials in plain text. The donor publishes them by design so
  the labs are copy-paste runnable. Treat them as throwaway dev values and
  change them before any shared or persistent deployment.
- \`dab-config.json\` configures no authentication (anonymous access) and runs
  in development host mode.
- Container ports are published on all interfaces. For local-only use, edit
  the compose file to bind each published port to \`127.0.0.1\`
  (\`"127.0.0.1:1433:1433"\` style) before starting the stack.
- \`seed/mssql/AdventureWorksLT2025.bak\` (~1.7 MB) restores the sample
  database the labs query.
`;

/** Recursive walk: every file under `dir`, as paths relative to it (sorted). */
async function listFiles(dir: string, prefix = ''): Promise<string[]> {
  const entries = [...(await readdir(join(dir, prefix), { withFileTypes: true }))].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const files: string[] = [];
  for (const entry of entries) {
    const rel = join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(dir, rel)));
    else files.push(rel);
  }
  return files;
}

/** Binary-safe copy of a pre-walked relative file list. The count guard runs
 *  on the walked list before this is called, so a drifted donor tree aborts
 *  before anything is written. */
async function copyFiles(src: string, dest: string, files: string[]): Promise<void> {
  for (const file of files) {
    const target = join(dest, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(src, file), target);
  }
}

/* -------------------------------- extraction ------------------------------- */

async function writeJson(path: string, data: unknown) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function extract(dryRun: boolean) {
  const donorLessons = orderedLessons();
  const lessons = donorLessons.map(mapLesson);
  const questions = orderedQuestions().map(mapQuestion);
  const labs = LABS.map(mapLab);
  const exams = MOCK_EXAMS.map(mapExam);
  const comparisons = donorLessons
    .filter((lesson) => lesson.sections.sideBySide)
    .map((lesson) => mapComparison(lesson.sections.sideBySide!));

  /* ---- sanity: abort before writing anything ---- */
  const questionIds = new Set(questions.map((question) => question.id));
  for (const [kind, ids] of [
    ['lesson id', lessons.map((lesson) => lesson.id)],
    ['lesson slug', lessons.map((lesson) => lesson.slug ?? '')],
    ['question id', questions.map((question) => question.id)],
    ['comparison id', comparisons.map((comparison) => comparison.id)],
  ] as const) {
    const dupes = duplicates(ids);
    if (dupes.length > 0) fail('sanity', `duplicate ${kind}s: ${dupes.join(', ')}`);
  }
  for (const lesson of lessons) {
    for (const id of lesson.questionIds) {
      if (!questionIds.has(id)) fail(`lesson/${lesson.id}`, `knowledge check references unknown question "${id}"`);
    }
  }
  for (const exam of exams) {
    for (const id of exam.selection.questionIds) {
      if (!questionIds.has(id)) fail(`exam/${exam.id}`, `references unknown question "${id}"`);
    }
    const fixed = new Set(exam.selection.questionIds);
    for (const study of exam.caseStudies ?? []) {
      for (const id of study.questionIds) {
        if (!fixed.has(id)) {
          fail(`exam/${exam.id}`, `case study "${study.id}" references "${id}" outside the exam's question list`);
        }
      }
    }
  }
  const labIds = new Set(labs.map((lab) => lab.id));
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  for (const lab of labs) {
    if (lab.lessonId && !lessonIds.has(lab.lessonId)) fail(`lab/${lab.id}`, `unknown lesson "${lab.lessonId}"`);
  }
  for (const lesson of lessons) {
    if (lesson.labId && !labIds.has(lesson.labId)) fail(`lesson/${lesson.id}`, `unknown lab "${lesson.labId}"`);
  }
  // Lab-coding sets must partition their question bank exactly (cross-check
  // only — the sets themselves are not emitted).
  const setCodingIds = LAB_CODING_SETS.flatMap((set) => set.questionIds);
  const bankCodingIds = new Set(LAB_CODING_QUESTIONS.map((question) => question.id));
  for (const id of setCodingIds) {
    if (!bankCodingIds.has(id)) fail('lab-coding', `set references "${id}" outside the lab-coding bank`);
  }
  if (setCodingIds.length !== bankCodingIds.size) {
    fail('lab-coding', 'sets do not cover the lab-coding bank exactly');
  }
  // Docker source inventory is walked and guarded before any write — a drifted
  // donor tree aborts the run (and the dry run) listing what was found.
  const dockerFiles = await listFiles(DOCKER_SRC);
  if (dockerFiles.length !== DOCKER_FILE_COUNT) {
    fail(
      'docker',
      `expected ${DOCKER_FILE_COUNT} files under ${DOCKER_SRC}, found ${dockerFiles.length}: ${dockerFiles.join(', ')}`,
    );
  }

  const kindCounts = questions.reduce<Record<string, number>>((acc, question) => {
    acc[question.kind] = (acc[question.kind] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`dp-800 → ${PACK_DIR}${dryRun ? ' (dry run)' : ''}`);
  console.log(
    `  root: 6  domains: ${DOMAINS.length}  modules: ${MODULES.length}` +
      `  lessons: ${lessons.length}  questions: ${questions.length}` +
      ` (${D1_QUESTIONS.length} + ${D2_QUESTIONS.length} + ${D3_QUESTIONS.length}` +
      ` + ${EXAM1_QUESTIONS.length + EXAM1_CASE_QUESTIONS.length} + ${LAB_CODING_QUESTIONS.length})`,
  );
  console.log(`  labs: ${labs.length}  exams: ${exams.length}  comparisons: ${comparisons.length}`);
  console.log(`  question kinds: ${Object.entries(kindCounts).map(([k, n]) => `${k} ${n}`).join('  ')}`);
  console.log(`  docker: ${dockerFiles.length} files copied verbatim + 1 authored safety README → ${DOCKER_DEST}`);
  console.log(`  total files: ${6 + lessons.length + questions.length}`);

  if (dryRun) return;

  await mkdir(join(PACK_DIR, 'lessons'), { recursive: true });
  await mkdir(join(PACK_DIR, 'questions'), { recursive: true });
  const rootFiles: [string, unknown][] = [
    ['subject.json', SUBJECT],
    ['domains.json', DOMAINS.map((domain) => ({
      id: domain.id,
      order: domain.order,
      code: domain.code,
      title: domain.title,
      weight: domain.weight,
      summary: domain.summary,
    }))],
    ['modules.json', MODULES.map((module) => ({
      id: module.id,
      domainId: module.domainId,
      order: module.order,
      title: module.title,
      summary: module.summary,
      officialSkills: module.officialSkills,
    }))],
    ['labs.json', labs],
    ['exams.json', exams],
    ['comparisons.json', comparisons],
  ];
  for (const [name, data] of rootFiles) {
    await writeJson(join(PACK_DIR, name), data);
  }
  for (const lesson of lessons) {
    await writeJson(join(PACK_DIR, 'lessons', `${lesson.id}.json`), lesson);
  }
  for (const question of questions) {
    await writeJson(join(PACK_DIR, 'questions', `${question.id}.json`), question);
  }

  await copyFiles(DOCKER_SRC, DOCKER_DEST, dockerFiles);
  await writeFile(join(DOCKER_DEST, 'README.md'), DOCKER_README, 'utf8');
}

/* ----------------------------------- cli ----------------------------------- */

const dryRun = process.argv.slice(2).includes('--dry-run');
await extract(dryRun);
