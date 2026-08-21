/**
 * Parity pins for the extracted packs — the things only a cross-repo
 * comparison against the donors can prove:
 *
 *   1. Golden exam papers: the hub's assemblePaper serves exactly the lists
 *      the donor's fixed seeds produce (snapshots copied verbatim from
 *      learn-gh-200/src/content/exams.test.ts and learn-dp-800/src/content/
 *      exams.ts — pins, never recomputed).
 *   2. Extraction counts: pack inventories match the donor's authored sizes.
 *   3. Inline doc links: every [label](docId) the hub's own tokenizer finds
 *      in pack prose resolves in that pack's docs registry — the one content
 *      invariant the load-time validator does not check.
 *
 * The gh sections below stay gh-scoped on purpose: dp-800 has no docs.json,
 * its domains are uneven by design (41/40/23, not 20-each), and its exam ids
 * do not follow the -mock-a/-mock-b convention. dp-800's own section pins
 * inventory, pools, fixed papers, sideBySide↔comparisons identity, authored
 * sets, block order, engine labels, and the donor's lab-coding hygiene
 * contract.
 *
 * What the validator already enforces (schema shape, graph refs, exam
 * feasibility) is deliberately not re-asserted here; `content:check` owns it.
 * A golden mismatch is an ordering bug first: the order contract is the
 * path-sorted file buckets in createFileContentSource, not glob emission.
 */
import { describe, expect, it } from 'vitest';
import { assemblePaper } from '../engines/exam-paper';
import type { Comparison, CoreBlock, SubjectContent } from '../sdk/types';
import { extractDocIds } from '../ui/InlineText';
import { engineLabel } from '../ui/engine-labels';
import { contentSource } from './registry';

const GH_PACK_IDS = ['gh-900', 'gh-200'] as const;
type GhPackId = (typeof GH_PACK_IDS)[number];

function loadPack(id: GhPackId): SubjectContent {
  return contentSource.loadSubject(id);
}

/* ------------------------------ golden papers ------------------------------ */

/** Donor snapshots, seeds 9001/9002/2001/2002 — verbatim, never recompute. */
const GOLDEN_IDS: Record<string, string[]> = {
  'gh900-mock-a': [
    'gh900-d6-q03', 'gh900-d1-q12', 'gh900-d4-q12', 'gh900-d5-q10', 'gh900-d2-q02',
    'gh900-d3-q05', 'gh900-d1-q04', 'gh900-d3-q15', 'gh900-d4-q10', 'gh900-d3-q14',
    'gh900-d1-q16', 'gh900-d2-q14', 'gh900-d1-q11', 'gh900-d1-q05', 'gh900-d2-q16',
    'gh900-d6-q16', 'gh900-d6-q06', 'gh900-d3-q03', 'gh900-d6-q02', 'gh900-d5-q03',
    'gh900-d4-q20', 'gh900-d2-q09', 'gh900-d4-q07', 'gh900-d2-q01', 'gh900-d5-q15',
    'gh900-d1-q01', 'gh900-d7-q13', 'gh900-d1-q08', 'gh900-d1-q17', 'gh900-d1-q13',
    'gh900-d4-q11', 'gh900-d1-q19', 'gh900-d6-q07', 'gh900-d3-q09', 'gh900-d7-q14',
  ],
  'gh900-mock-b': [
    'gh900-d3-q07', 'gh900-d1-q10', 'gh900-d1-q14', 'gh900-d3-q19', 'gh900-d5-q16',
    'gh900-d6-q08', 'gh900-d4-q01', 'gh900-d1-q15', 'gh900-d3-q11', 'gh900-d4-q09',
    'gh900-d6-q11', 'gh900-d2-q06', 'gh900-d1-q09', 'gh900-d1-q03', 'gh900-d1-q06',
    'gh900-d4-q05', 'gh900-d6-q17', 'gh900-d6-q10', 'gh900-d2-q11', 'gh900-d6-q15',
    'gh900-d2-q13', 'gh900-d3-q01', 'gh900-d4-q14', 'gh900-d5-q13', 'gh900-d2-q03',
    'gh900-d1-q20', 'gh900-d2-q12', 'gh900-d3-q08', 'gh900-d7-q02', 'gh900-d5-q14',
    'gh900-d1-q02', 'gh900-d4-q19', 'gh900-d1-q18', 'gh900-d7-q11', 'gh900-d1-q07',
  ],
  'gh200-mock-a': [
    'gh200-d3-q05', 'gh200-d2-q03', 'gh200-d3-q18', 'gh200-d4-q08', 'gh200-d3-q19',
    'gh200-d2-q12', 'gh200-d4-q11', 'gh200-d5-q09', 'gh200-d5-q05', 'gh200-d4-q20',
    'gh200-d4-q18', 'gh200-d4-q04', 'gh200-d1-q16', 'gh200-d1-q07', 'gh200-d1-q13',
    'gh200-d4-q17', 'gh200-d3-q17', 'gh200-d3-q04', 'gh200-d5-q18', 'gh200-d5-q08',
    'gh200-d2-q07', 'gh200-d2-q18', 'gh200-d1-q19', 'gh200-d4-q19', 'gh200-d2-q10',
    'gh200-d1-q08', 'gh200-d3-q13', 'gh200-d3-q08', 'gh200-d1-q17', 'gh200-d1-q15',
    'gh200-d2-q01', 'gh200-d5-q15', 'gh200-d2-q15', 'gh200-d4-q16', 'gh200-d1-q18',
  ],
  'gh200-mock-b': [
    'gh200-d1-q09', 'gh200-d4-q02', 'gh200-d2-q08', 'gh200-d2-q02', 'gh200-d2-q19',
    'gh200-d1-q06', 'gh200-d2-q05', 'gh200-d5-q12', 'gh200-d1-q02', 'gh200-d3-q11',
    'gh200-d4-q10', 'gh200-d2-q13', 'gh200-d5-q16', 'gh200-d3-q15', 'gh200-d5-q06',
    'gh200-d4-q06', 'gh200-d1-q20', 'gh200-d2-q16', 'gh200-d1-q01', 'gh200-d1-q12',
    'gh200-d1-q10', 'gh200-d3-q03', 'gh200-d4-q15', 'gh200-d4-q07', 'gh200-d5-q02',
    'gh200-d4-q01', 'gh200-d1-q05', 'gh200-d3-q16', 'gh200-d4-q12', 'gh200-d4-q09',
    'gh200-d3-q12', 'gh200-d3-q14', 'gh200-d2-q14', 'gh200-d5-q19', 'gh200-d3-q07',
  ],
};

describe('parity — golden exam papers', () => {
  for (const packId of GH_PACK_IDS) {
    const content = loadPack(packId);

    for (const exam of content.exams) {
      it(`${exam.id} serves the donor's golden paper`, () => {
        expect(assemblePaper(content, exam).map((question) => question.id)).toEqual(
          GOLDEN_IDS[exam.id],
        );
      });
    }

    it(`${packId}: mock A and mock B share no question`, () => {
      const paperA = new Set(
        assemblePaper(content, content.exams.find((exam) => exam.id.endsWith('-mock-a'))!).map(
          (question) => question.id,
        ),
      );
      const paperB = assemblePaper(
        content,
        content.exams.find((exam) => exam.id.endsWith('-mock-b'))!,
      ).map((question) => question.id);
      expect(paperB.filter((id) => paperA.has(id))).toEqual([]);
    });
  }
});

/* --------------------------------- counts --------------------------------- */

/** Donor-authored inventory per pack; docs sizes are the extractor partition. */
const EXPECTED: Record<GhPackId, Record<string, number>> = {
  'gh-900': {
    domains: 7, modules: 34, lessons: 7, questions: 140, labs: 7, exams: 2,
    comparisons: 0, docs: 60,
  },
  'gh-200': {
    domains: 5, modules: 41, lessons: 5, questions: 100, labs: 6, exams: 2,
    comparisons: 2, docs: 49,
  },
};

describe('parity — extraction counts', () => {
  for (const packId of GH_PACK_IDS) {
    it(`${packId}: pack inventory matches the donor source`, () => {
      const content = loadPack(packId);
      const expected = EXPECTED[packId];
      expect(content.domains, 'domains').toHaveLength(expected.domains);
      expect(content.modules, 'modules').toHaveLength(expected.modules);
      expect(content.lessons, 'lessons').toHaveLength(expected.lessons);
      expect(content.questions, 'questions').toHaveLength(expected.questions);
      expect(content.labs, 'labs').toHaveLength(expected.labs);
      expect(content.exams, 'exams').toHaveLength(expected.exams);
      expect(content.comparisons, 'comparisons').toHaveLength(expected.comparisons);
      expect(Object.keys(content.docs), 'docs').toHaveLength(expected.docs);
    });

    it(`${packId}: every domain carries exactly 20 questions`, () => {
      const content = loadPack(packId);
      const byDomain = new Map<string, number>();
      for (const question of content.questions) {
        byDomain.set(question.domainId, (byDomain.get(question.domainId) ?? 0) + 1);
      }
      expect([...byDomain.entries()].every(([, count]) => count === 20)).toBe(true);
    });
  }
});

/* ----------------------------- inline doc links ---------------------------- */

/** One prose string plus where it lives — enough to point at a bad link. */
type Prose = { where: string; text: string };

/**
 * Lesson blocks that can carry links; code blocks never link. Extracted packs
 * emit core kinds only, so the scan is typed against CoreBlock — extension
 * kinds have no prose contract here (and content:check gates what ships).
 */
function blockProse(where: string, blocks: CoreBlock[]): Prose[] {
  const out: Prose[] = [];
  blocks.forEach((block, index) => {
    const at = `${where} block ${index}`;
    switch (block.kind) {
      case 'md':
        out.push({ where: at, text: block.body });
        break;
      case 'heading':
      case 'tip':
        out.push({ where: at, text: block.text });
        break;
      case 'list':
        out.push(...block.items.map((text, item) => ({ where: `${at} item ${item}`, text })));
        break;
      case 'table':
        out.push(
          ...block.headers.map((text, column) => ({ where: `${at} header ${column}`, text })),
          ...block.rows.flatMap((row, r) =>
            row.map((text, column) => ({ where: `${at} row ${r} col ${column}`, text })),
          ),
        );
        break;
      default:
        break;
    }
  });
  return out;
}

/** Every prose surface a pack renders through the inline tokenizer. */
function packProse(content: SubjectContent): Prose[] {
  const out: Prose[] = [];
  for (const lesson of content.lessons) {
    out.push(...blockProse(lesson.id, lesson.blocks as CoreBlock[]));
  }
  for (const lab of content.labs) {
    out.push(
      { where: `${lab.id} summary`, text: lab.summary },
      ...lab.steps.map((step, index) => ({ where: `${lab.id} step ${index + 1}`, text: step.instructions })),
      ...(lab.outcomes ?? []).map((text, index) => ({ where: `${lab.id} outcome ${index + 1}`, text })),
      ...(lab.checks ?? []).map((text, index) => ({ where: `${lab.id} check ${index + 1}`, text })),
    );
  }
  for (const comparison of content.comparisons) {
    if (comparison.description) {
      out.push({ where: `${comparison.id} description`, text: comparison.description });
    }
    for (const row of comparison.rows) {
      for (const column of comparison.columns) {
        out.push({ where: `${comparison.id}: ${row.aspect} / ${column.label}`, text: row.cells[column.id] });
      }
    }
  }
  return out;
}

describe('parity — inline doc links resolve', () => {
  for (const packId of GH_PACK_IDS) {
    it(`${packId}: every inline link the renderer tokenizes resolves in the docs registry`, () => {
      const content = loadPack(packId);
      const missing: string[] = [];
      let links = 0;
      for (const { where, text } of packProse(content)) {
        for (const docId of extractDocIds(text)) {
          links += 1;
          if (!(docId in content.docs)) missing.push(`${where} -> ${docId}`);
        }
      }
      expect(missing).toEqual([]);
      expect(links, 'the scan must exercise real prose').toBeGreaterThan(0);
    });
  }
});

/* --------------------------------- dp-800 --------------------------------- */

/**
 * dp-800 sits outside the three shared loops above (no docs.json, uneven
 * domains, mock-1/mock-2 ids) and gets its own integrity pins instead.
 *
 * Inherent and deliberately NOT asserted here — `content:check` owns them:
 * id resolution and graph refs, self-gradeability, case ids ⊆ exam ids,
 * ≥2 knowledge-check questions per lesson, mode-content backing, and exam
 * feasibility.
 */
const DP800_ID = 'dp-800';

function loadDp800(): SubjectContent {
  return contentSource.loadSubject(DP800_ID);
}

/** Donor snapshot from learn-dp-800/src/content/exams.ts — verbatim pin;
 *  mock-1 is EXAM1_STANDALONE (45) ++ EXAM1_CASE (5) in the donor's spread
 *  order, mock-2 is the EXAM2 array as authored. Never recompute from the
 *  pack — a mismatch is an extractor bug. */
const DP800_GOLDEN_IDS: Record<string, string[]> = {
  'mock-1': [
    // EXAM1_STANDALONE — Domain 1 (17)
    'q-ex1-1', 'q-ex1-2', 'q-ex1-10',
    'q-l0101-1', 'q-l0102-1', 'q-l0103-2', 'q-l0103-3', 'q-l0104-2',
    'q-l0105-1', 'q-l0106-1', 'q-l0201-1', 'q-l0202-1', 'q-l0203-1',
    'q-l0301-1', 'q-l0302-2', 'q-l0304-1', 'q-l0305-1',
    // Domain 2 (17)
    'q-ex1-3', 'q-ex1-4', 'q-ex1-5', 'q-ex1-9',
    'q-l0501-1', 'q-l0502-1', 'q-l0503-1', 'q-l0503-4', 'q-l0503-5',
    'q-l0504-2', 'q-l0505-1', 'q-l0602-2', 'q-l0603-1', 'q-l0604-1',
    'q-l0701-1', 'q-l0801-1', 'q-l0804-1',
    // Domain 3 (11)
    'q-ex1-6', 'q-ex1-7', 'q-ex1-8',
    'q-l0901-1', 'q-l0902-1', 'q-l0903-1', 'q-l1001-1',
    'q-l1002-2', 'q-l1002-3', 'q-l1003-1', 'q-l1101-1',
    // EXAM1_CASE (5)
    'q-cs1-1', 'q-cs1-2', 'q-cs1-3', 'q-cs1-4', 'q-cs1-5',
  ],
  'mock-2': [
    // Domain 1 (11)
    'q-l0101-2', 'q-l0103-1', 'q-l0103-4', 'q-l0103-5', 'q-l0104-1',
    'q-l0105-2', 'q-l0106-2', 'q-l0302-1', 'q-l0302-3', 'q-l0303-1', 'q-l0402-1',
    // Domain 2 (11)
    'q-l0501-2', 'q-l0501-3', 'q-l0503-2', 'q-l0503-3', 'q-l0602-1',
    'q-l0603-2', 'q-l0603-3', 'q-l0701-2', 'q-l0704-2', 'q-l0802-1', 'q-l0803-1',
    // Domain 3 (8)
    'q-l0901-2', 'q-l0902-2', 'q-l0903-2', 'q-l1001-2',
    'q-l1002-1', 'q-l1002-5', 'q-l1101-3', 'q-l1102-1',
  ],
};

/** The one extension shape this file reads — Lesson.blocks is core-typed. */
type SideBySideBlock = { kind: 'sideBySide'; comparison: Comparison };

describe('dp-800 parity — inventory and pools', () => {
  it('pack inventory matches the donor source', () => {
    const content = loadDp800();
    expect(content.domains, 'domains').toHaveLength(3);
    expect(content.modules, 'modules').toHaveLength(11);
    expect(content.lessons, 'lessons').toHaveLength(43);
    expect(content.questions, 'questions').toHaveLength(179);
    expect(content.labs, 'labs').toHaveLength(3);
    expect(content.exams, 'exams').toHaveLength(2);
    expect(content.comparisons, 'comparisons').toHaveLength(4);
    expect(Object.keys(content.docs), 'docs').toHaveLength(0);
  });

  it('the 179 questions partition into 104 knowledge-check + 15 exam + 60 lab-coding', () => {
    const content = loadDp800();
    const referenced = new Map<string, number>();
    for (const lesson of content.lessons) {
      for (const id of lesson.questionIds ?? []) {
        referenced.set(id, (referenced.get(id) ?? 0) + 1);
      }
    }
    // Every knowledge-check id is referenced by exactly one lesson.
    expect([...referenced.values()].every((count) => count === 1)).toBe(true);

    const knowledgeCheck = content.questions.filter((question) => referenced.has(question.id));
    const labCoding = content.questions.filter((question) =>
      (question.tags ?? []).includes('lab-coding'),
    );
    const examPool = content.questions.filter(
      (question) => !referenced.has(question.id) && !(question.tags ?? []).includes('lab-coding'),
    );
    expect(knowledgeCheck).toHaveLength(104);
    expect(examPool).toHaveLength(15);
    expect(labCoding).toHaveLength(60);

    // Knowledge-check pool by domain: 41 + 40 + 23.
    for (const [domainId, expected] of [['d1', 41], ['d2', 40], ['d3', 23]] as const) {
      const count = knowledgeCheck.filter((question) => question.domainId === domainId).length;
      expect(count, `knowledge-check pool for ${domainId}`).toBe(expected);
    }

    // Exam pool: 10 standalone + 5 case-study questions, all on mock-1's paper.
    expect(examPool.filter((question) => question.id.startsWith('q-ex1-'))).toHaveLength(10);
    expect(examPool.filter((question) => question.id.startsWith('q-cs1-'))).toHaveLength(5);

    // Lab-coding pool groups into the 11 module-sets by lab-NN tag, exactly.
    const sets = new Map<string, number>();
    for (const question of labCoding) {
      const setTag = question.tags?.find((tag) => /^lab-\d{2}$/.test(tag));
      expect(setTag, `${question.id} carries a lab-NN set tag`).toBeDefined();
      sets.set(setTag!, (sets.get(setTag!) ?? 0) + 1);
    }
    expect([...sets.keys()].sort()).toHaveLength(11);
    // The donor's own per-set floor (content.test.ts minCount default 4).
    for (const [setTag, count] of sets) {
      expect(count, `${setTag} set too thin`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('dp-800 parity — fixed papers', () => {
  const content = loadDp800();

  for (const exam of content.exams) {
    it(`${exam.id} serves the donor's authored paper in order`, () => {
      expect(assemblePaper(content, exam).map((question) => question.id)).toEqual(
        DP800_GOLDEN_IDS[exam.id],
      );
    });
  }
});

describe('dp-800 parity — inline comparisons are the registry entries', () => {
  it('each of the 4 sideBySide blocks deep-equals its comparisons.json twin', () => {
    const content = loadDp800();
    const byId = new Map(content.comparisons.map((comparison) => [comparison.id, comparison]));
    const inline = content.lessons.flatMap((lesson) =>
      (lesson.blocks as (CoreBlock | SideBySideBlock)[]).filter(
        (block): block is SideBySideBlock => block.kind === 'sideBySide',
      ),
    );
    expect(inline).toHaveLength(4);
    for (const block of inline) {
      expect(block.comparison).toEqual(byId.get(block.comparison.id));
    }
  });
});

describe('dp-800 parity — authored pins', () => {
  it('flagship lessons are exactly the donor three, with l0403 explicitly false', () => {
    const content = loadDp800();
    const flagged = content.lessons.filter((lesson) => lesson.flagship).map((lesson) => lesson.id);
    expect(flagged).toEqual(['l0103', 'l0503', 'l1002']);
    const l0403 = content.lessons.find((lesson) => lesson.id === 'l0403');
    expect(l0403?.flagship).toBe(false);
  });

  it("l0103's block sequence is the donor's fixed section order", () => {
    const content = loadDp800();
    const l0103 = content.lessons.find((lesson) => lesson.id === 'l0103');
    expect(l0103?.blocks.map((block) => block.kind)).toEqual([
      'objectives', 'heading', 'md', 'keyTerms', 'heading', 'sourced', 'sourced', 'sourced',
      'figure', 'heading', 'sourced', 'sourced', 'heading', 'sourced', 'sourced', 'sourced',
      'sideBySide', 'heading', 'sourced', 'mistakes', 'heading', 'sourced', 'examTips',
      'heading', 'md',
    ]);
  });

  it('every comparison column label equals engineLabel(id) — labels cannot drift from the module', () => {
    const content = loadDp800();
    for (const comparison of content.comparisons) {
      for (const column of comparison.columns) {
        expect(column.label, `${comparison.id} column ${column.id}`).toBe(engineLabel(column.id));
      }
    }
  });
});

describe('dp-800 parity — lab-coding hygiene (the donor contract)', () => {
  const content = loadDp800();
  const labQuestions = content.questions.filter((question) =>
    (question.tags ?? []).includes('lab-coding'),
  );

  it('every item is four-option A/B/C/D, advanced-or-challenge, with a real stem', () => {
    expect(labQuestions).toHaveLength(60);
    for (const question of labQuestions) {
      // undefined for non-option kinds (matching/fill) — the pin fails loudly
      // rather than passing vacuously.
      const optionIds = 'options' in question ? question.options.map((option) => option.id) : undefined;
      expect(optionIds, question.id).toEqual(['a', 'b', 'c', 'd']);
      expect(['advanced', 'challenge'], question.id).toContain(question.difficulty);
      expect(question.prompt.length, `${question.id} stem too short`).toBeGreaterThan(120);
    }
  });

  it('each of the 11 module-sets carries at least one multi question', () => {
    const multisBySet = new Map<string, number>();
    for (const question of labQuestions) {
      const setTag = question.tags?.find((tag) => /^lab-\d{2}$/.test(tag)) ?? 'none';
      if (question.kind === 'multi') {
        multisBySet.set(setTag, (multisBySet.get(setTag) ?? 0) + 1);
      }
    }
    expect([...multisBySet.keys()].sort()).toHaveLength(11);
  });

  it('carries no Microsoft lab identifiers anywhere in the scanned text', () => {
    const blob = labQuestions
      .map((question) =>
        [
          question.prompt,
          'code' in question ? question.code : '',
          question.explanation,
          ...('options' in question ? question.options.map((option) => option.text) : []),
        ].join('\n'),
      )
      .join('\n');
    for (const forbidden of ['EcommerceDB', 'AdventureWorksLT', 'AddOrderLineItem', 'SecurityLabDB']) {
      expect(blob.includes(forbidden), forbidden).toBe(false);
    }
  });
});
