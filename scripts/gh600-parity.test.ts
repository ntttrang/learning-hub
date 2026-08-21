/**
 * Donor-anchored parity suite for content/gh-600: expectations are re-derived
 * from learn-gh-600/ at test time and compared against the emitted JSON, so
 * editing or deleting any generated file fails a named assertion while any
 * donor change forces a conscious re-extraction.
 *
 * Reads the donor through gh600-extract-lib only — never the extractor CLI
 * (which would regenerate content/ before assertions run and neutralize
 * parity). A missing donor submodule fails closed with the init command in
 * the error, never a skipped test.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadDonorConst, readDonorFile, REPO_ROOT } from './gh600-extract-lib';

/* --------------------------------- donor ----------------------------------- */

interface DonorQuizQ {
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

interface DonorTopic {
  id: string;
  name: string;
  body: string;
}

interface DonorDomain {
  id: number; // 0-based
  topics: DonorTopic[];
  quiz: DonorQuizQ[];
}

interface DonorExamQ {
  d: number;
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

const MOCK_SOURCE = 'gh600-mock-exam-captain-corgi-1.html';
const MOCK_COPIES = [
  'gh600-mock-exam-captain-corgi-2.html',
  'gh600-mock-exam-captain-corgi-3.html',
  'gh600-mock-exam-captain-corgi-4.html',
  'gh600-mock-exam-captain-corgi-5.html',
  'gh600-mock-exam-captain-corgi.html',
  'gh600-mock-exam.html',
];
const practiceFile = (n: number) => `gh600-practice-exam-captain-corgi-${n}.html`;

// Fail-closed donor loads: readDonorFile throws with the
// `git submodule update --init` guidance when the submodule is absent.
const donorDomains = loadDonorConst<DonorDomain[]>(
  readDonorFile('gh600-study-plan-captain-corgi.html'),
  'DOMAINS',
);
const donorMock = loadDonorConst<DonorExamQ[]>(readDonorFile(MOCK_SOURCE), 'Q');
const donorPractice = [1, 2, 3, 4, 5, 6, 7].map((n) =>
  loadDonorConst<DonorExamQ[]>(readDonorFile(practiceFile(n)), 'Q'),
);

/* --------------------------------- emitted ---------------------------------- */

const PACK = join(REPO_ROOT, 'content/gh-600');
const readPack = <T,>(rel: string): T => JSON.parse(readFileSync(join(PACK, rel), 'utf8')) as T;

const exams = readPack<
  { id: string; durationMinutes: number; passingScore: number; selection: { questionIds: string[] } }[]
>('exams.json');
const questions = readdirSync(join(PACK, 'questions'))
  .map((file) => readPack<{ id: string; prompt: string; explanation: string; options: { id: string; text: string }[]; correct: string }>(`questions/${file}`));
const questionsById = new Map(questions.map((q) => [q.id, q]));
const examById = new Map(exams.map((e) => [e.id, e]));
const domainsOut = readPack<{ title: string; weight: { min: number; max: number } }[]>('domains.json');
const labsOut = readPack<
  { id: string; steps: unknown[]; checks: string[] }[]
>('labs.json');

/* ------------------------------ shared derivation --------------------------- */

const normalize = (s: string): string => s.replace(/\s+/g, ' ').trim();
const dedupKey = (q: string, opts: string[], ans: number) =>
  JSON.stringify([normalize(q), opts.map(normalize), ans]);

/** Donor questions in first-occurrence order: quizzes → mock → practice 1..7. */
const donorInstances: { key: string; source: 'quiz' | 'mock' | `practice-${number}`; donor: DonorQuizQ | DonorExamQ; domain: number }[] = [
  ...donorDomains.flatMap((domain) =>
    domain.quiz.map((quiz) => ({
      key: dedupKey(quiz.q, quiz.opts, quiz.ans),
      source: 'quiz' as const,
      donor: quiz,
      domain: domain.id + 1,
    })),
  ),
  ...donorMock.map((q) => ({ key: dedupKey(q.q, q.opts, q.ans), source: 'mock' as const, donor: q, domain: q.d })),
  ...donorPractice.flatMap((questions, i) =>
    questions.map((q) => ({
      key: dedupKey(q.q, q.opts, q.ans),
      source: `practice-${i + 1}` as `practice-${number}`,
      donor: q,
      domain: q.d,
    })),
  ),
];

const firstKeySource = new Map<string, string>();
for (const instance of donorInstances) {
  if (!firstKeySource.has(instance.key)) firstKeySource.set(instance.key, instance.source);
}
const uniqueKeys = new Set(donorInstances.map((i) => i.key));

/* -------------------------------- questions --------------------------------- */

describe('gh-600 parity — donor fail-closed', () => {
  it('an unreadable donor path throws with the submodule init command — never a silent skip', () => {
    expect(() => readDonorFile('definitely-not-a-donor-file.html')).toThrow(
      /git submodule update --init/,
    );
  });
});

describe('gh-600 parity — questions', () => {
  const papers: [string, DonorExamQ[]][] = [
    ['gh600-mock-1', donorMock],
    ...donorPractice.map((qs, i) => [`gh600-practice-${i + 1}`, qs] as [string, DonorExamQ[]]),
  ];

  it('every exam serves its donor paper verbatim, in donor order', () => {
    for (const [examId, donor] of papers) {
      const exam = examById.get(examId);
      if (!exam || exam.selection.questionIds.length !== donor.length) {
        throw new Error(`parity: ${examId} length drifted from donor (${donor.length})`);
      }
      donor.forEach((dq, i) => {
        const id = exam.selection.questionIds[i];
        const q = questionsById.get(id);
        if (!q) throw new Error(`parity: ${examId}[${i}] → ${id} has no question file`);
        expect(q.prompt, `${examId}[${i}] prompt`).toBe(dq.q);
        expect(q.options.map((o) => o.text), `${examId}[${i}] options`).toEqual(dq.opts);
        expect(q.correct, `${examId}[${i}] correct`).toBe(`o${dq.ans + 1}`);
        expect(q.explanation, `${examId}[${i}] explanation`).toBe(dq.exp);
      });
    }
  });

  it('quiz questions land in the bank with the donor stem/answer/explanation', () => {
    donorDomains.forEach((domain, di) => {
      domain.quiz.forEach((dq, qi) => {
        const match = questions.find(
          (q) => q.prompt === dq.q && q.correct === `o${dq.ans + 1}` && q.explanation === dq.exp,
        );
        expect(match, `quiz d${di + 1}[${qi}] present in the bank`).toBeDefined();
      });
    });
  });

  it('exam metadata comes from the donor (60q/120min mock, 50q/90min practice, pass 700)', () => {
    const mock = examById.get('gh600-mock-1')!;
    expect(mock.durationMinutes).toBe(120);
    expect(mock.passingScore).toBe(700);
    for (let n = 1; n <= 7; n++) {
      const practice = examById.get(`gh600-practice-${n}`)!;
      expect(practice.durationMinutes).toBe(90);
      expect(practice.passingScore).toBe(700);
    }
  });

  it('every Q-bearing mock file still carries the identical paper', () => {
    const canonical = JSON.stringify(donorMock);
    for (const copy of MOCK_COPIES) {
      const other = loadDonorConst<DonorExamQ[]>(readDonorFile(copy), 'Q');
      expect(JSON.stringify(other), copy).toBe(canonical);
    }
  });

  it('per-domain instance counts: mock 10/14/7/10/10/9, practices 50 each, quizzes 5×6', () => {
    expect([1, 2, 3, 4, 5, 6].map((d) => donorMock.filter((q) => q.d === d).length)).toEqual([
      10, 14, 7, 10, 10, 9,
    ]);
    for (const qs of donorPractice) expect(qs.length).toBe(50);
    for (const domain of donorDomains) expect(domain.quiz.length).toBe(5);
  });
});

/* ---------------------------------- dedup ----------------------------------- */

describe('gh-600 parity — dedup accounting', () => {
  it('donor instances collapse to exactly 390 unique questions (literal pin)', () => {
    expect(donorInstances.length).toBe(440);
    expect(uniqueKeys.size).toBe(390);
    expect(questions.length).toBe(390);
    expect(questionsById.size).toBe(390); // ids are unique too
  });

  it('all 50 collapses are intra-practice; quiz ↔ exam overlap is zero', () => {
    const collapses = donorInstances.filter((i) => firstKeySource.get(i.key) !== i.source);
    expect(collapses.length).toBe(50);
    expect(collapses.every((c) => c.source.startsWith('practice'))).toBe(true);

    const quizKeys = new Set(
      donorInstances.filter((i) => i.source === 'quiz').map((i) => i.key),
    );
    const examKeys = new Set(
      donorInstances.filter((i) => i.source !== 'quiz').map((i) => i.key),
    );
    expect([...quizKeys].filter((k) => examKeys.has(k))).toEqual([]);
  });

  it('id stability: every emitted id is the deterministic first-occurrence id', () => {
    // Recompute the extractor's id assignment and compare the full list —
    // catches id churn in both directions (rename or reorder).
    const keyToId = new Map<string, string>();
    const counter = new Map<number, number>();
    const expectedIds: string[] = [];
    for (const instance of donorInstances) {
      const existing = keyToId.get(instance.key);
      if (existing) continue;
      const n = (counter.get(instance.domain) ?? 0) + 1;
      counter.set(instance.domain, n);
      const id = `gh600-d${instance.domain}-q${String(n).padStart(2, '0')}`;
      keyToId.set(instance.key, id);
      expectedIds.push(id);
    }
    expect([...questionsById.keys()].sort()).toEqual([...expectedIds].sort());
  });
});

/* -------------------------------- curriculum -------------------------------- */

describe('gh-600 parity — curriculum', () => {
  const md1 = readDonorFile(join('docs', 'practice-example-1.md'));
  const headers = [...md1.matchAll(/^## Domain (\d): (.+) \((\d+)[–-](\d+)%\)$/gm)];

  it('six domains with official titles and weights parsed from the practice md', () => {
    expect(headers.length).toBe(6);
    headers.forEach((m, i) => {
      expect(domainsOut[i].title).toBe(m[2]);
      expect(domainsOut[i].weight).toEqual({ min: Number(m[3]), max: Number(m[4]) });
    });
  });

  it('23 lessons carry donor topic titles under deterministic ids', () => {
    for (const domain of donorDomains) {
      for (const topic of domain.topics) {
        const lesson = readPack<{ title: string }>(`lessons/lesson-gh600-${topic.id}.json`);
        expect(lesson.title).toBe(topic.name);
      }
    }
    expect(donorDomains.reduce((n, d) => n + d.topics.length, 0)).toBe(23);
  });

  it('block-kind sequences pinned for one topic per domain (converter regression net)', () => {
    const pinned: Record<string, string[]> = {
      d1t1: ['md', 'tip', 'tip', 'tip', 'list', 'tip'],
      d2t1: ['tip', 'table', 'code', 'tip'],
      d3t3: ['tip', 'code', 'tip'],
      d4t1: ['table', 'tip'],
      d5t1: ['table', 'tip'],
      d6t1: ['table', 'tip'],
    };
    for (const [topicId, kinds] of Object.entries(pinned)) {
      const lesson = readPack<{ blocks: { kind: string }[] }>(`lessons/lesson-gh600-${topicId}.json`);
      expect(lesson.blocks.map((b) => b.kind), topicId).toEqual(kinds);
    }
  });
});

/* ----------------------------------- labs ----------------------------------- */

describe('gh-600 parity — labs', () => {
  const labFiles = [
    'lab-00-bootstrap.md',
    'lab-01-sdlc-architecture.md',
    'lab-02-tools-and-mcp.md',
    'lab-03-memory-and-state.md',
    'lab-04-evaluation-and-tuning.md',
    'lab-05-multi-agent.md',
    'lab-06-guardrails.md',
    'lab-07-capstone.md',
  ];

  it('eight labs; step counts follow the donor formula (### + 1 context + 1 anti-patterns for lab-01)', () => {
    expect(labsOut.length).toBe(8);
    labFiles.forEach((file, i) => {
      const md = readDonorFile(join('docs', 'labs', file));
      const donorSteps = (md.match(/^### /gm) ?? []).length;
      const expected = donorSteps + 1 + (file === 'lab-01-sdlc-architecture.md' ? 1 : 0);
      expect(labsOut[i].steps.length, file).toBe(expected);
    });
  });

  it('every donor validation-checklist item survives into the lab checks', () => {
    labFiles.forEach((file, i) => {
      const md = readDonorFile(join('docs', 'labs', file));
      const section = md.split(/^## /m).find((part) => part.startsWith('Validation checklist'))!;
      const items = section
        .split('\n')
        .filter((line) => line.startsWith('- [ ] '))
        .map((line) => line.slice('- [ ] '.length));
      expect(items.length, file).toBeGreaterThan(0);
      for (const item of items) {
        expect(labsOut[i].checks, file).toContain(item);
      }
    });
  });
});

/* --------------------------- practice md cross-check -------------------------- */

describe('gh-600 parity — practice md files', () => {
  it('each of the 7 practice mds holds exactly 50 sequentially numbered questions', () => {
    for (let n = 1; n <= 7; n++) {
      const md = readDonorFile(`docs/practice-example-${n}.md`);
      const numbers = [...md.matchAll(/^\*\*(\d+)\.\*\*/gm)].map((m) => Number(m[1]));
      expect(numbers.length, `practice-example-${n}.md`).toBe(50);
      expect(numbers, `practice-example-${n}.md`).toEqual(
        Array.from({ length: 50 }, (_, i) => i + 1),
      );
    }
  });

  it('every practice md pins the same six domain weights (titles where the donor spells them out)', () => {
    // md 1–3 use the full titled header — the locked provenance for domain
    // titles; md 4–7 use the short weight-only form.
    const full = /^## Domain (\d): (.+) \((\d+)[–-](\d+)%\)$/;
    const short = /^## Domain (\d) \((\d+)[–-](\d+)%\)$/;
    for (let n = 1; n <= 7; n++) {
      const md = readDonorFile(`docs/practice-example-${n}.md`);
      const rows = [...md.matchAll(/^## Domain .*$/gm)];
      expect(rows.length, `practice-example-${n}.md`).toBe(6);
      rows.forEach((row, i) => {
        const titled = row[0].match(full);
        const brief = row[0].match(short);
        expect(Boolean(titled) || Boolean(brief), `practice-example-${n}.md "${row[0]}"`).toBe(true);
        const m = (titled ?? brief)!;
        expect(Number(m[1]), `practice-example-${n}.md row ${i}`).toBe(i + 1);
        expect(domainsOut[i].weight, `practice-example-${n}.md D${m[1]}`).toEqual({
          min: Number(titled ? m[3] : m[2]),
          max: Number(titled ? m[4] : m[3]),
        });
        if (titled) {
          expect(domainsOut[i].title, `practice-example-${n}.md D${m[1]}`).toBe(titled[2]);
        }
      });
    }
  });
});

/* -------------------------------- integrity ---------------------------------- */

describe('gh-600 parity — integrity invariants', () => {
  it('every exam question id resolves to a bank file', () => {
    for (const exam of exams) {
      for (const id of exam.selection.questionIds) {
        expect(questionsById.has(id), `${exam.id} → ${id}`).toBe(true);
      }
    }
  });

  it('orphans (never served by an exam) are exactly the 30 quiz questions', () => {
    const served = new Set(exams.flatMap((e) => e.selection.questionIds));
    const orphans = [...questionsById.keys()].filter((id) => !served.has(id));
    expect(orphans.length).toBe(30);

    // The orphan set must be precisely the quiz-derived first occurrences:
    // quiz keys are never exam keys, and exams serve all 360 exam uniques.
    const quizDomainTotals = new Map<number, number>();
    for (const instance of donorInstances) {
      if (instance.source !== 'quiz') continue;
      if (firstKeySource.get(instance.key) === 'quiz') {
        quizDomainTotals.set(instance.domain, (quizDomainTotals.get(instance.domain) ?? 0) + 1);
      }
    }
    const quizIdCount = [...orphans].filter((id) => {
      const q = questionsById.get(id)!;
      return donorDomains.some(
        (d, i) =>
          quizDomainTotals.get(i + 1) &&
          d.quiz.some((dq) => dq.q === q.prompt && dq.exp === q.explanation),
      );
    }).length;
    expect(quizIdCount).toBe(30);
    expect(served.size).toBe(360);
  });
});
