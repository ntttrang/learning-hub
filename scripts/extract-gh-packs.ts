/**
 * One-off pack extractor: learn-gh-200's typed-TS content → hub JSON packs.
 *
 * This script is the provenance record for the generated files committed
 * under content/gh-900 and content/gh-200 — re-run it manually to regenerate
 * after donor changes (one-shot by decision; there is no drift gate).
 *
 * Usage: npm run content:extract-gh -- --cert gh900|gh200|both [--dry-run]
 *
 * Runs under tsx rather than plain `node`: the donor's exams.ts imports
 * through extensionless internal paths (`./questions`, `../utils/sample`)
 * that Node's native ESM loader cannot resolve. All donor values are copied
 * verbatim — this script changes representation, never content.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { COMPARISONS } from '../learn-gh-200/src/content/compare';
import { DOCS } from '../learn-gh-200/src/content/docs';
import { DOMAINS } from '../learn-gh-200/src/content/domains';
import { EXAMS } from '../learn-gh-200/src/content/exams';
import { LABS } from '../learn-gh-200/src/content/labs';
import { QUESTIONS } from '../learn-gh-200/src/content/questions';
import type {
  CertId,
  CompareData,
  Domain,
  ExamConfig,
  Lab,
  LessonBlock,
  Question,
} from '../learn-gh-200/src/content/types';
import { extractDocIds } from '../learn-gh-200/src/utils/inline';

/* ------------------------------ pack metadata ------------------------------ */

/**
 * Hand-authored subject.json values. Titles are pinned here because the
 * roadmap placeholders carry no title field; subtitles are corrected, not
 * copied — the placeholder strings say "4 domains" for both subjects while
 * the real counts are 7 (gh-900) and 5 (gh-200). Descriptions are verbatim
 * from the placeholders.
 */
const PACKS: Record<CertId, { dir: string; subject: Record<string, unknown> }> = {
  gh900: {
    dir: 'content/gh-900',
    subject: {
      id: 'gh-900',
      code: 'GH-900',
      title: 'GitHub Foundations',
      subtitle: 'GitHub Foundations · 7 domains',
      description: 'Git, repos, collaboration & GitHub fundamentals — the on-ramp certification.',
      accent: 'corgi-orange',
      enabledModes: ['learn', 'labs', 'practice', 'exams', 'notes', 'revision'],
    },
  },
  gh200: {
    dir: 'content/gh-200',
    subject: {
      id: 'gh-200',
      code: 'GH-200',
      title: 'GitHub Actions',
      subtitle: 'GitHub Actions · 5 domains',
      description: 'CI/CD workflows, runners, secrets, and pipeline automation with hands-on labs.',
      accent: 'hub-green',
      enabledModes: ['learn', 'labs', 'practice', 'exams', 'compare', 'notes', 'revision'],
    },
  },
};

// The loader keys packs by directory name (subject.id must equal it).
for (const [cert, pack] of Object.entries(PACKS)) {
  if (pack.subject.id !== basename(pack.dir)) {
    throw new Error(`${cert}: subject id "${pack.subject.id}" must equal directory "${basename(pack.dir)}"`);
  }
}

/* -------------------------------- transforms ------------------------------- */

const optionId = (index: number) => `o${index + 1}`;

function mapDomain(domain: Domain) {
  return {
    id: domain.id,
    order: domain.number,
    title: domain.title,
    weight: { min: domain.weightMin, max: domain.weightMax },
    summary: domain.summary,
  };
}

function mapModules(domain: Domain) {
  return domain.subSkills.map((skill, index) => ({
    id: skill.id,
    domainId: domain.id,
    order: index + 1,
    title: skill.title,
    docIds: skill.docIds,
  }));
}

function mapBlocks(blocks: LessonBlock[]) {
  return blocks.map((block) => {
    switch (block.kind) {
      case 'h3':
        return { kind: 'heading', text: block.text, level: 3 };
      case 'p':
        return { kind: 'md', body: block.text };
      case 'list':
        return { kind: 'list', items: block.items };
      case 'code':
        return { kind: 'code', language: block.language, code: block.code };
      case 'tip':
        return { kind: 'tip', text: block.text };
      case 'table':
        return { kind: 'table', headers: block.headers, rows: block.rows };
    }
  });
}

function mapLesson(domain: Domain) {
  return {
    id: domain.lesson.id,
    domainId: domain.lesson.domainId,
    moduleId: domain.subSkills[0].id,
    title: domain.lesson.title,
    minutes: domain.lesson.minutes,
    blocks: mapBlocks(domain.lesson.blocks),
  };
}

function mapQuestion(question: Question) {
  const base = {
    id: question.id,
    domainId: question.domainId,
    moduleId: question.subSkillId,
    prompt: question.stem,
    explanation: question.explanation,
    docIds: [question.docId],
  };
  switch (question.kind) {
    case 'single':
      return {
        ...base,
        kind: 'single',
        options: question.options.map((text, index) => ({ id: optionId(index), text })),
        correct: optionId(question.answerIndex),
      };
    case 'multi':
      return {
        ...base,
        kind: 'multi',
        options: question.options.map((text, index) => ({ id: optionId(index), text })),
        correct: question.answerIndexes.map(optionId),
      };
    case 'order':
      return {
        ...base,
        kind: 'order',
        options: question.items.map((text, index) => ({ id: optionId(index), text })),
        correct: question.items.map((_, index) => optionId(index)),
      };
    case 'fill':
      return {
        ...base,
        kind: 'fill',
        template: question.codeTemplate,
        blanks: question.blanks.map((blank) =>
          blank.alternatives.length > 0
            ? { answer: blank.answer, alternatives: blank.alternatives }
            : { answer: blank.answer },
        ),
      };
    case 'bug':
      return { ...base, kind: 'bug', codeLines: question.codeLines, buggyLineIndex: question.buggyLineIndex };
  }
}

function mapLab(lab: Lab) {
  return {
    id: lab.id,
    domainId: lab.domainId,
    title: lab.title,
    minutes: lab.minutes,
    summary: lab.summary,
    steps: lab.steps.map((instructions) => ({ instructions })),
    outcomes: lab.outcomes,
    checks: lab.checks,
  };
}

function mapExam(exam: ExamConfig, cert: CertId) {
  return {
    id: exam.id,
    title: exam.title,
    durationMinutes: exam.durationMin,
    passingScore: 700,
    selection: {
      kind: 'sampled',
      domainPlan: exam.domainPlan,
      seed: exam.seed,
      // A mock B draws from what its cert's mock A left behind.
      ...(exam.id.endsWith('-mock-b') ? { excludeExamIds: [`${cert}-mock-a`] } : {}),
    },
  };
}

function mapComparison(comparison: CompareData) {
  return {
    id: comparison.id,
    title: comparison.title,
    description: comparison.description,
    columns: [
      { id: 'github', label: 'GitHub Actions' },
      { id: 'other', label: comparison.counterpart },
    ],
    rows: comparison.rows.map((row) => ({
      aspect: row.dimension,
      cells: { github: row.github, other: row.other },
    })),
  };
}

/* --------------------------- referenced-docs scan --------------------------- */

// The partition uses the donor's own tokenizer (utils/inline.ts extractDocIds)
// so link semantics cannot drift between the two apps: code/bold spans win at
// the position they open, and a `[label](docId)` link matches wherever the `[`
// is reached — including labels that themselves contain `code` spans, which a
// naive strip-spans-first scan would miss (gh200-lab-06 links this way).

/** Every prose string a lesson block carries — code blocks never link. */
function lessonProse(blocks: LessonBlock[]): string[] {
  return blocks.flatMap((block) => {
    switch (block.kind) {
      case 'p':
      case 'h3':
      case 'tip':
        return [block.text];
      case 'list':
        return block.items;
      case 'table':
        return [...block.headers, ...block.rows.flat()];
      case 'code':
        return [];
    }
  });
}

/** The docs partition for one pack: ids referenced by it, nothing else. */
function referencedDocIds(
  domains: Domain[],
  labs: Lab[],
  questions: Question[],
  comparisons: CompareData[],
): string[] {
  const ids = new Set<string>();
  for (const domain of domains) {
    for (const skill of domain.subSkills) {
      for (const id of skill.docIds) ids.add(id);
    }
    for (const text of lessonProse(domain.lesson.blocks)) {
      for (const id of extractDocIds(text)) ids.add(id);
    }
  }
  for (const lab of labs) {
    for (const text of [lab.summary, ...lab.steps, ...lab.outcomes, ...lab.checks]) {
      for (const id of extractDocIds(text)) ids.add(id);
    }
  }
  for (const question of questions) {
    ids.add(question.docId);
  }
  for (const comparison of comparisons) {
    const strings = [
      comparison.title,
      comparison.counterpart,
      comparison.description,
      ...comparison.rows.flatMap((row) => [row.dimension, row.github, row.other]),
    ];
    for (const text of strings) {
      for (const id of extractDocIds(text)) ids.add(id);
    }
  }
  return [...ids].sort();
}

/* -------------------------------- extraction ------------------------------- */

async function writeJson(path: string, data: unknown) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function extractCert(cert: CertId, dryRun: boolean) {
  const pack = PACKS[cert];
  const domains = DOMAINS.filter((domain) => domain.cert === cert).sort((a, b) => a.number - b.number);
  const domainIds = new Set(domains.map((domain) => domain.id));
  const labs = LABS.filter((lab) => domainIds.has(lab.domainId));
  const questions = QUESTIONS.filter((question) => question.cert === cert);
  const exams = EXAMS.filter((exam) => exam.cert === cert);
  const comparisons = cert === 'gh200' ? COMPARISONS : [];

  const docIds = referencedDocIds(domains, labs, questions, comparisons);
  const missing = docIds.filter((id) => !(id in DOCS));
  if (missing.length > 0) {
    throw new Error(`${cert}: docIds referenced but absent from DOCS: ${missing.join(', ')}`);
  }
  const docs = Object.fromEntries(docIds.map((id) => [id, DOCS[id]]));

  const rootFiles: [string, unknown][] = [
    ['subject.json', pack.subject],
    ['domains.json', domains.map(mapDomain)],
    ['modules.json', domains.flatMap(mapModules)],
    ['docs.json', docs],
    ['labs.json', labs.map(mapLab)],
    ['exams.json', exams.map((exam) => mapExam(exam, cert))],
  ];
  if (comparisons.length > 0) {
    rootFiles.push(['comparisons.json', comparisons.map(mapComparison)]);
  }
  const itemFiles: [string, unknown][] = [
    ...domains.map((domain) => [`lessons/${domain.lesson.id}.json`, mapLesson(domain)] as [string, unknown]),
    ...questions.map((question) => [`questions/${question.id}.json`, mapQuestion(question)] as [string, unknown]),
  ];

  const total = rootFiles.length + itemFiles.length;
  console.log(`${cert} → ${pack.dir}${dryRun ? ' (dry run)' : ''}`);
  console.log(
    `  root: ${rootFiles.length}  lessons: ${domains.length}  questions: ${questions.length}` +
      `  labs: ${labs.length}  exams: ${exams.length}  comparisons: ${comparisons.length}`,
  );
  console.log(`  docs partition: ${docIds.length} of ${Object.keys(DOCS).length} registry entries`);
  console.log(`  total files: ${total}`);

  if (dryRun) return;
  await mkdir(join(pack.dir, 'lessons'), { recursive: true });
  await mkdir(join(pack.dir, 'questions'), { recursive: true });
  for (const [name, data] of rootFiles) {
    await writeJson(join(pack.dir, name), data);
  }
  for (const [name, data] of itemFiles) {
    await writeJson(join(pack.dir, name), data);
  }
}

/* ----------------------------------- cli ----------------------------------- */

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const certIndex = args.indexOf('--cert');
const certFlag = certIndex >= 0 ? args[certIndex + 1] : 'both';
if (!['gh900', 'gh200', 'both'].includes(certFlag)) {
  throw new Error(`unknown --cert "${certFlag}" — expected gh900, gh200, or both`);
}
const certs: CertId[] = certFlag === 'both' ? ['gh900', 'gh200'] : [certFlag as CertId];

for (const cert of certs) {
  await extractCert(cert, dryRun);
}
