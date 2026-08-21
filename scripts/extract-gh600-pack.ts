/**
 * One-off pack extractor: learn-gh-600's embedded HTML data → hub JSON pack.
 *
 * Provenance record for the generated files committed under content/gh-600 —
 * re-run manually to regenerate after donor changes. All donor values are
 * copied verbatim; this script changes representation, never content.
 * Embedded donor JS evaluates in a bare node:vm sandbox (gh600-extract-lib).
 *
 * Usage: npm run content:extract-gh600 -- --part curriculum|questions|exams|labs|all [--dry-run]
 *
 * Import-safe: parsing helpers live in gh600-extract-lib / gh600-blocks;
 * the CLI body below only runs when this file is the executed entry.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Block, Domain, Exam, Lab, LabStep, Lesson, Module, Question } from '../src/sdk/types';
import { convertBody, decodeEntities } from './gh600-blocks';
import { loadDonorConst, readDonorFile } from './gh600-extract-lib';

const PACK_DIR = 'content/gh-600';
const STUDY_PLAN = 'gh600-study-plan-captain-corgi.html';
const MOCK_SOURCE = 'gh600-mock-exam-captain-corgi-1.html';
// Every other Q-bearing mock file is a byte-copy of the source; the extractor
// reads only MOCK_SOURCE and string-equality-asserts the copies below.
const MOCK_COPIES = [
  'gh600-mock-exam-captain-corgi-2.html',
  'gh600-mock-exam-captain-corgi-3.html',
  'gh600-mock-exam-captain-corgi-4.html',
  'gh600-mock-exam-captain-corgi-5.html',
  'gh600-mock-exam-captain-corgi.html',
  'gh600-mock-exam.html',
];
const PRACTICE_FILES = [1, 2, 3, 4, 5, 6, 7].map((n) => `gh600-practice-exam-captain-corgi-${n}.html`);

/* ------------------------------ donor shapes ------------------------------- */

interface DonorTopic {
  id: string;
  name: string;
  icon: string;
  body: string;
}

interface DonorDomain {
  id: number; // 0-based
  name: string;
  desc: string;
  topics: DonorTopic[];
  quiz: DonorQuizQ[];
}

/** Study-plan quiz entry (domain comes from the parent DOMAINS element). */
interface DonorQuizQ {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

/** Mock/practice exam entry — `d` is 1-based here. */
interface DonorExamQ {
  d: number;
  dt: string;
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

/**
 * Hand-authored subject metadata. Title/description follow the donor app;
 * the disclaimer carries the donor's "GH-600 beta" badge note. enabledModes
 * lists every tool the pack's emitted content backs.
 */
const SUBJECT = {
  id: 'gh-600',
  code: 'GH-600',
  title: 'Agentic AI Developer',
  subtitle: 'Agentic AI Developer · 6 domains',
  description:
    'Agent architecture, MCP tool use, memory & state, evaluation, multi-agent orchestration, and guardrails — ported from the donor GH-600 study companion.',
  accent: 'deep-teal',
  disclaimers: ['GH-600 beta — content ported verbatim from the donor study companion.'],
  enabledModes: ['learn', 'labs', 'practice', 'exams', 'notes', 'revision'],
};

/** Official domain titles + weights, parsed from the practice-example headers (locked provenance). */
function officialDomainMeta(): { title: string; weight: { min: number; max: number } }[] {
  const md = readDonorFile(join('docs', 'practice-example-1.md'));
  const headers = [...md.matchAll(/^## Domain (\d): (.+) \((\d+)[–-](\d+)%\)$/gm)];
  if (headers.length !== 6) {
    throw new Error(`donor drift: expected 6 domain headers in practice-example-1.md, got ${headers.length}`);
  }
  return headers.map((m) => ({ title: m[2], weight: { min: Number(m[3]), max: Number(m[4]) } }));
}

/* ------------------------------ curriculum part ---------------------------- */

async function extractCurriculum(dryRun: boolean): Promise<void> {
  const html = readDonorFile(STUDY_PLAN);
  const domains = loadDonorConst<DonorDomain[]>(html, 'DOMAINS');

  // Shape assertions pin the donor contract the parity suite re-checks.
  if (domains.length !== 6) throw new Error(`donor drift: expected 6 domains, got ${domains.length}`);
  const topicCount = domains.reduce((n, d) => n + d.topics.length, 0);
  if (topicCount !== 23) throw new Error(`donor drift: expected 23 topics, got ${topicCount}`);
  const quizCount = domains.reduce((n, d) => n + d.quiz.length, 0);
  if (quizCount !== 30) throw new Error(`donor drift: expected 30 quiz entries, got ${quizCount}`);

  const official = officialDomainMeta();

  const domainRecords: Domain[] = domains.map((d, i) => ({
    id: `gh600-d${d.id + 1}`,
    order: d.id + 1,
    code: `D${d.id + 1}`,
    title: official[i].title,
    weight: official[i].weight,
    summary: d.desc,
  }));

  const moduleRecords: Module[] = domains.map((d) => ({
    id: `gh600-d${d.id + 1}-mod`,
    domainId: `gh600-d${d.id + 1}`,
    order: 1,
    title: d.name, // donor's short domain name; the official title lives on the domain
  }));

  const lessons: [string, Lesson][] = domains.flatMap((d) =>
    d.topics.map((t, i) => {
      const blocks: Block[] = convertBody(t.body);
      return [
        `lessons/lesson-gh600-${t.id}.json`,
        {
          id: `lesson-gh600-${t.id}`,
          domainId: `gh600-d${d.id + 1}`,
          moduleId: `gh600-d${d.id + 1}-mod`,
          order: i + 1,
          title: t.name,
          summary: d.desc, // donor has no per-topic summary
          minutes: 8, // uniform estimate — donor carries none
          blocks,
        } satisfies Lesson,
      ] as [string, Lesson];
    }),
  );

  const rootFiles: [string, unknown][] = [
    ['subject.json', SUBJECT],
    ['domains.json', domainRecords],
    ['modules.json', moduleRecords],
  ];

  console.log(`gh-600 curriculum → ${PACK_DIR}${dryRun ? ' (dry run)' : ''}`);
  console.log(`  domains: ${domainRecords.length}  modules: ${moduleRecords.length}  lessons: ${lessons.length}`);

  if (dryRun) return;
  await mkdir(join(PACK_DIR, 'lessons'), { recursive: true });
  for (const [name, data] of rootFiles) {
    await writeJson(join(PACK_DIR, name), data);
  }
  for (const [name, data] of lessons) {
    await writeJson(join(PACK_DIR, name), data);
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/* ------------------------- questions + exams engine ------------------------ */

/** Whitespace-collapsed text — the dedup key never depends on formatting. */
const normalize = (s: string): string => s.replace(/\s+/g, ' ').trim();

function assertExamQ(q: DonorExamQ, source: string): void {
  if (!Number.isInteger(q.d) || q.d < 1 || q.d > 6) throw new Error(`donor drift: ${source} bad domain ${q.d}`);
  if (q.opts.length !== 4) throw new Error(`donor drift: ${source} "${q.q.slice(0, 50)}" has ${q.opts.length} options`);
  if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) {
    throw new Error(`donor drift: ${source} "${q.q.slice(0, 50)}" ans=${q.ans}`);
  }
  if (!q.q.trim() || !q.exp.trim()) throw new Error(`donor drift: ${source} empty q/exp`);
}

/** Capture `const PASS=…,MINS=…;` alongside the Q array it gates. */
function examConfig(html: string, source: string): { pass: number; minutes: number } {
  const m = html.match(/const PASS=(\d+),MINS=(\d+);/);
  if (!m) throw new Error(`donor drift: no PASS/MINS in ${source}`);
  return { pass: Number(m[1]), minutes: Number(m[2]) };
}

interface BankedQuestion {
  file: string;
  record: Question;
}

interface QuestionBank {
  /** Unique questions in first-occurrence order (quizzes → mock → practice 1..7). */
  banked: BankedQuestion[];
  /** examId → donor-authored-order question ids. */
  examIds: Map<string, string[]>;
  instances: number;
  collapses: number;
}

function buildQuestionBank(): QuestionBank {
  const keyToId = new Map<string, string>();
  const quizKeys = new Set<string>();
  const banked: BankedQuestion[] = [];
  const domainCounter = new Map<number, number>();
  const examIds = new Map<string, string[]>();
  let instances = 0;
  let collapses = 0;

  const intern = (domainNumber: number, q: string, opts: string[], ans: number, exp: string, src: string): string => {
    instances += 1;
    const key = JSON.stringify([normalize(q), opts.map(normalize), ans]);
    const existing = keyToId.get(key);
    if (existing) {
      collapses += 1;
      console.log(`  dedup: ${src} → ${existing}`);
      return existing;
    }
    const n = (domainCounter.get(domainNumber) ?? 0) + 1;
    domainCounter.set(domainNumber, n);
    const id = `gh600-d${domainNumber}-q${String(n).padStart(2, '0')}`;
    keyToId.set(key, id);
    banked.push({
      file: `questions/${id}.json`,
      record: {
        id,
        domainId: `gh600-d${domainNumber}`,
        moduleId: `gh600-d${domainNumber}-mod`, // module practice serves the domain's full bank
        prompt: q,
        explanation: exp,
        kind: 'single',
        options: opts.map((text, i) => ({ id: `o${i + 1}`, text })),
        correct: `o${ans + 1}`,
      },
    });
    return id;
  };

  // 1. Study-plan quizzes — 5 per domain, domain order follows DOMAINS.
  const domains = loadDonorConst<DonorDomain[]>(readDonorFile(STUDY_PLAN), 'DOMAINS');
  const quizIds: string[] = [];
  for (const d of domains) {
    if (d.quiz.length !== 5) throw new Error(`donor drift: domain ${d.id + 1} quiz has ${d.quiz.length} entries`);
    for (const [i, q] of d.quiz.entries()) {
      if (q.opts.length !== 4 || q.ans < 0 || q.ans > 3) {
        throw new Error(`donor drift: domain ${d.id + 1} quiz[${i}] malformed`);
      }
      quizKeys.add(JSON.stringify([normalize(q.q), q.opts.map(normalize), q.ans]));
      quizIds.push(intern(d.id + 1, q.q, q.opts, q.ans, q.exp, `quiz d${d.id + 1}[${i}]`));
    }
  }

  // 2. Mock exam — read only MOCK_SOURCE; assert every copy stayed identical.
  const mockHtml = readDonorFile(MOCK_SOURCE);
  const mockQ = loadDonorConst<DonorExamQ[]>(mockHtml, 'Q');
  const mockCfg = examConfig(mockHtml, MOCK_SOURCE);
  if (mockCfg.pass !== 700 || mockCfg.minutes !== 120) {
    throw new Error(`donor drift: mock PASS/MINS = ${mockCfg.pass}/${mockCfg.minutes}, expected 700/120`);
  }
  const mockJson = JSON.stringify(mockQ);
  for (const copy of MOCK_COPIES) {
    if (JSON.stringify(loadDonorConst<DonorExamQ[]>(readDonorFile(copy), 'Q')) !== mockJson) {
      throw new Error(`donor drift: ${copy} Q array diverged from ${MOCK_SOURCE}`);
    }
  }
  if (mockQ.length !== 60) throw new Error(`donor drift: mock has ${mockQ.length} questions, expected 60`);
  const perDomain = [10, 14, 7, 10, 10, 9];
  const mockCounts = [0, 0, 0, 0, 0, 0];
  mockQ.forEach((q) => {
    assertExamQ(q, MOCK_SOURCE);
    mockCounts[q.d - 1] += 1;
  });
  if (mockCounts.join() !== perDomain.join()) {
    throw new Error(`donor drift: mock per-domain counts ${mockCounts.join()}, expected ${perDomain.join()}`);
  }
  examIds.set(
    'gh600-mock-1',
    mockQ.map((q, i) => intern(q.d, q.q, q.opts, q.ans, q.exp, `mock[${i}]`)),
  );

  // 3. Practice exams 1–7 — 50 questions each, donor-authored order.
  for (const [n, file] of PRACTICE_FILES.entries()) {
    const html = readDonorFile(file);
    const questions = loadDonorConst<DonorExamQ[]>(html, 'Q');
    const cfg = examConfig(html, file);
    if (cfg.pass !== 700 || cfg.minutes !== 90) {
      throw new Error(`donor drift: practice ${n + 1} PASS/MINS = ${cfg.pass}/${cfg.minutes}, expected 700/90`);
    }
    if (questions.length !== 50) {
      throw new Error(`donor drift: practice ${n + 1} has ${questions.length} questions, expected 50`);
    }
    questions.forEach((q) => assertExamQ(q, file));
    examIds.set(
      `gh600-practice-${n + 1}`,
      questions.map((q, i) => intern(q.d, q.q, q.opts, q.ans, q.exp, `practice-${n + 1}[${i}]`)),
    );
  }

  // Volume contract: 440 instances → 390 unique, quiz↔exam overlap zero,
  // every collapse intra-practice (mock ids appear in exactly one exam).
  if (instances !== 440) throw new Error(`donor drift: ${instances} instances, expected 440`);
  if (banked.length !== 390) throw new Error(`donor drift: ${banked.length} unique questions, expected 390`);
  if (collapses !== 50) throw new Error(`donor drift: ${collapses} collapses, expected 50`);
  const examIdLists = [...examIds.values()];
  const mockIds = new Set(examIds.get('gh600-mock-1'));
  const quizIdSet = new Set(quizIds);
  for (const ids of examIdLists) {
    if (ids.some((id) => quizIdSet.has(id))) {
      throw new Error('donor drift: quiz ↔ exam overlap is no longer zero');
    }
  }
  const mockRepeats = examIdLists.filter((ids) => ids.some((id) => mockIds.has(id)));
  if (mockRepeats.length !== 1) {
    throw new Error(`donor drift: mock questions appear in ${mockRepeats.length} exams, expected 1`);
  }

  return { banked, examIds, instances, collapses };
}

async function extractQuestions(dryRun: boolean): Promise<QuestionBank> {
  const bank = buildQuestionBank();
  console.log(
    `gh-600 questions → ${PACK_DIR}/questions${dryRun ? ' (dry run)' : ''}`,
  );
  console.log(
    `  instances: ${bank.instances}  unique: ${bank.banked.length}  collapses: ${bank.collapses}`,
  );
  if (!dryRun) {
    await mkdir(join(PACK_DIR, 'questions'), { recursive: true });
    for (const { file, record } of bank.banked) {
      await writeJson(join(PACK_DIR, file), record);
    }
  }
  return bank;
}

async function extractExams(dryRun: boolean, bank?: QuestionBank): Promise<void> {
  const { examIds } = bank ?? buildQuestionBank();
  const exams: Exam[] = [
    {
      id: 'gh600-mock-1',
      title: 'GH-600 full mock exam',
      durationMinutes: 120,
      passingScore: 700,
      selection: { kind: 'fixed', questionIds: examIds.get('gh600-mock-1')! },
    },
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
      id: `gh600-practice-${n}`,
      title: `GH-600 practice exam ${n}`,
      durationMinutes: 90,
      passingScore: 700,
      selection: { kind: 'fixed' as const, questionIds: examIds.get(`gh600-practice-${n}`)! },
    })),
  ];
  console.log(`gh-600 exams → ${PACK_DIR}/exams.json${dryRun ? ' (dry run)' : ''}`);
  console.log(`  exams: ${exams.length} (mock 60q/120min; practice 50q/90min each)`);
  if (!dryRun) {
    await writeJson(join(PACK_DIR, 'exams.json'), exams);
  }
}

/* --------------------------------- labs part -------------------------------- */

const LAB_INDEX = 'gh600-labs-captain-corgi.html';

interface LabSpec {
  n: string; // '00'…'07' — id suffix
  file: string;
  domain: number; // 1-based domain pin
  minutes: number; // estimate — donor carries none
  shape: 'A' | 'B' | 'C' | 'D';
  hubSteps: number; // step-count formula pin: `###` count + 1 context (+1 anti-patterns)
}

const LABS: LabSpec[] = [
  { n: '00', file: 'lab-00-bootstrap.md', domain: 1, minutes: 30, shape: 'A', hubSteps: 7 },
  { n: '01', file: 'lab-01-sdlc-architecture.md', domain: 1, minutes: 30, shape: 'B', hubSteps: 9 },
  { n: '02', file: 'lab-02-tools-and-mcp.md', domain: 2, minutes: 30, shape: 'C', hubSteps: 8 },
  { n: '03', file: 'lab-03-memory-and-state.md', domain: 3, minutes: 30, shape: 'C', hubSteps: 7 },
  { n: '04', file: 'lab-04-evaluation-and-tuning.md', domain: 4, minutes: 30, shape: 'C', hubSteps: 7 },
  { n: '05', file: 'lab-05-multi-agent.md', domain: 5, minutes: 30, shape: 'C', hubSteps: 8 },
  { n: '06', file: 'lab-06-guardrails.md', domain: 6, minutes: 30, shape: 'C', hubSteps: 8 },
  { n: '07', file: 'lab-07-capstone.md', domain: 6, minutes: 60, shape: 'D', hubSteps: 9 },
];

/** Verified section inventory per shape — every file asserts against its shape, not a template. */
const LAB_SHAPE_SECTIONS: Record<LabSpec['shape'], string[]> = {
  A: ['Objective', 'Scenario', 'GitHub product path', 'Alternative tools', 'Steps', 'Validation checklist', 'Exam practice connection'],
  B: ['Objective', 'Scenario', 'Domain objectives', 'GitHub product path', 'Alternative tools', 'Steps', 'Validation checklist', 'Common anti-patterns to avoid', 'Self-check'],
  C: ['Objective', 'Scenario', 'Domain objectives', 'GitHub product path', 'Alternative tools', 'Steps', 'Validation checklist', 'Self-check'],
  D: ['Objective', 'Scenario', 'Required artifacts', 'Steps', 'Validation checklist', 'Completion criteria'],
};

/** Relative md links → inline code paths; hub UI never sees a donor-relative URL. */
function rewriteRelativeLinks(md: string): string {
  return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label: string, url: string) => {
    if (/^https?:/.test(url)) return match;
    return label.startsWith('`') ? label : `\`${label}\``;
  });
}

/** Split a lab file into its `# ` title plus `## ` sections, asserted against the shape. */
function splitLabSections(md: string, spec: LabSpec): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = md.split(/^## /m);
  const h1 = parts[0].match(/^# (Lab \d+: .+)$/m);
  if (!h1) throw new Error(`donor drift: ${spec.file} has no "# Lab N:" heading`);
  sections.set('title', h1[1]);
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n');
    const name = (nl === -1 ? part : part.slice(0, nl)).trim();
    if (sections.has(name)) throw new Error(`donor drift: ${spec.file} repeats section "${name}"`);
    sections.set(name, nl === -1 ? '' : part.slice(nl + 1));
  }
  const actual = [...sections.keys()].filter((k) => k !== 'title');
  const expected = LAB_SHAPE_SECTIONS[spec.shape];
  if (actual.join(';') !== expected.join(';')) {
    throw new Error(`donor drift: ${spec.file} sections [${actual.join('; ')}] do not match shape ${spec.shape} [${expected.join('; ')}]`);
  }
  return sections;
}

/** `### k. Title` sections → steps; numbering must be sequential from 1. */
function parseSteps(body: string, spec: LabSpec): LabStep[] {
  const parts = body.split(/^### /m).slice(1);
  return parts.map((part, i) => {
    const nl = part.indexOf('\n');
    const head = (nl === -1 ? part : part.slice(0, nl)).trim();
    const m = head.match(/^(\d+)\. (.+)$/);
    if (!m || Number(m[1]) !== i + 1) {
      throw new Error(`donor drift: ${spec.file} step ${i + 1} heading "${head}" breaks sequential numbering`);
    }
    return {
      title: m[2],
      instructions: rewriteRelativeLinks((nl === -1 ? '' : part.slice(nl + 1)).trim()),
    };
  });
}

/** Checklist bodies are pure `- [ ] …` lines; anything else is drift. */
function parseChecklist(body: string, spec: LabSpec): string[] {
  const items: string[] = [];
  for (const line of body.split('\n')) {
    if (!line.trim()) continue;
    const m = line.match(/^- \[ \] (.+)$/);
    if (!m) throw new Error(`donor drift: ${spec.file} checklist line is not a checkbox: "${line.slice(0, 60)}"`);
    items.push(rewriteRelativeLinks(m[1]));
  }
  if (items.length === 0) throw new Error(`donor drift: ${spec.file} has an empty validation checklist`);
  return items;
}

/** Index cards from the labs HTML are the only per-lab summary source. */
function labCardSummaries(): Map<string, string> {
  const html = readDonorFile(LAB_INDEX);
  const cards = [
    ...html.matchAll(/<a class="card" href="docs\/labs\/(lab-\d+-[^"]+\.md)">[\s\S]*?<h3>([^<]*)<\/h3>\s*<p>([^<]*)<\/p>/g),
  ];
  if (cards.length !== 8) throw new Error(`donor drift: labs index has ${cards.length} cards, expected 8`);
  return new Map(cards.map((m) => [m[1], decodeEntities(m[3])]));
}

async function extractLabs(dryRun: boolean): Promise<void> {
  const summaries = labCardSummaries();
  const records: Lab[] = LABS.map((spec) => {
    const sections = splitLabSections(readDonorFile(join('docs', 'labs', spec.file)), spec);

    // Exactly one leading context step for every lab (product path or artifacts).
    const steps: LabStep[] =
      spec.shape === 'D'
        ? [
            {
              title: 'Context — required artifacts',
              instructions: rewriteRelativeLinks(sections.get('Required artifacts')!.trim()),
            },
          ]
        : [
            {
              title: 'Context — GitHub product path',
              instructions: rewriteRelativeLinks(
                [
                  '**GitHub product path**',
                  '',
                  sections.get('GitHub product path')!.trim(),
                  '',
                  '**Alternative tools**',
                  '',
                  sections.get('Alternative tools')!.trim(),
                ].join('\n'),
              ),
            },
          ];
    steps.push(...parseSteps(sections.get('Steps')!, spec));
    if (spec.shape === 'B') {
      steps.push({
        title: 'Review common anti-patterns',
        instructions: rewriteRelativeLinks(sections.get('Common anti-patterns to avoid')!.trim()),
      });
    }
    if (steps.length !== spec.hubSteps) {
      throw new Error(`donor drift: ${spec.file} → ${steps.length} hub steps, formula says ${spec.hubSteps}`);
    }

    const checks = parseChecklist(sections.get('Validation checklist')!, spec);
    if (spec.shape === 'A') {
      const mentions = [...sections.get('Exam practice connection')!.matchAll(/docs\/practice-example-(\d+)\.md/g)];
      if (mentions.length !== 1) {
        throw new Error(`donor drift: ${spec.file} exam-connection mentions ${mentions.length} practice files`);
      }
      checks.push(`Self-check: warm up with practice exam ${mentions[0][1]} baseline questions in Practice.`);
    } else if (spec.shape !== 'D') {
      const m = sections
        .get('Self-check')!
        .trim()
        .match(/^Review `docs\/practice-example-(\d+)\.md` questions (.+)\.$/);
      if (!m) throw new Error(`donor drift: ${spec.file} self-check does not match the "Review … questions …." pattern`);
      checks.push(`Self-check: answer practice exam ${m[1]} questions ${m[2]} in Practice.`);
    } else {
      checks.push(rewriteRelativeLinks(sections.get('Completion criteria')!.trim()));
    }

    const summary = summaries.get(spec.file);
    if (!summary) throw new Error(`donor drift: labs index has no card for ${spec.file}`);
    return {
      id: `gh600-lab-${spec.n}`,
      domainId: `gh600-d${spec.domain}`,
      title: sections.get('title')!.replace(/`/g, ''), // h1 code spans → plain text field
      minutes: spec.minutes,
      summary,
      steps,
      checks,
      objective: rewriteRelativeLinks(sections.get('Objective')!.trim()),
      scenario: rewriteRelativeLinks(sections.get('Scenario')!.trim()),
      // Domain objectives stay in the curriculum (the domain module owns them);
      // outcomes ride on the validation checklist instead of a fabricated list.
    };
  });

  console.log(`gh-600 labs → ${PACK_DIR}/labs.json${dryRun ? ' (dry run)' : ''}`);
  console.log(`  labs: ${records.length}  hub steps: ${records.map((l) => l.steps.length).join('/')}`);
  if (!dryRun) {
    await writeJson(join(PACK_DIR, 'labs.json'), records);
  }
}

/* ----------------------------------- cli ----------------------------------- */

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const partIndex = args.indexOf('--part');
  const part = partIndex >= 0 ? args[partIndex + 1] : 'all';
  if (!['curriculum', 'questions', 'exams', 'labs', 'all'].includes(part)) {
    throw new Error(`unknown --part "${part}" — expected curriculum, questions, exams, labs, or all`);
  }

  if (part === 'curriculum' || part === 'all') await extractCurriculum(dryRun);
  const bank = part === 'all' ? await extractQuestions(dryRun) : undefined;
  if (part === 'questions') await extractQuestions(dryRun);
  if (part === 'exams' || part === 'all') await extractExams(dryRun, bank);
  if (part === 'labs' || part === 'all') await extractLabs(dryRun);
}

// Entry guard: importing this module (e.g. from tests) must not run the CLI.
if (process.argv[1]?.endsWith('extract-gh600-pack.ts')) {
  await main();
}
