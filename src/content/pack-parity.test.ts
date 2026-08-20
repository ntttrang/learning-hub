/**
 * Parity pins for the two extracted GitHub packs — the things only a
 * cross-repo comparison against learn-gh-200 can prove:
 *
 *   1. Golden exam papers: the hub's assemblePaper serves exactly the lists
 *      the donor's fixed seeds produce (snapshots copied verbatim from
 *      learn-gh-200/src/content/exams.test.ts — pins, never recomputed).
 *   2. Extraction counts: pack inventories match the donor's authored sizes.
 *   3. Inline doc links: every [label](docId) the hub's own tokenizer finds
 *      in pack prose resolves in that pack's docs registry — the one content
 *      invariant the load-time validator does not check.
 *
 * What the validator already enforces (schema shape, graph refs, exam
 * feasibility) is deliberately not re-asserted here; `content:check` owns it.
 * A golden mismatch is an ordering bug first: the order contract is the
 * path-sorted file buckets in createFileContentSource, not glob emission.
 */
import { describe, expect, it } from 'vitest';
import { assemblePaper } from '../engines/exam-paper';
import type { CoreBlock, SubjectContent } from '../sdk/types';
import { extractDocIds } from '../ui/InlineText';
import { contentSource } from './registry';

const PACK_IDS = ['gh-900', 'gh-200'] as const;
type PackId = (typeof PACK_IDS)[number];

function loadPack(id: PackId): SubjectContent {
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
  for (const packId of PACK_IDS) {
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
const EXPECTED: Record<PackId, Record<string, number>> = {
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
  for (const packId of PACK_IDS) {
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
  for (const packId of PACK_IDS) {
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
