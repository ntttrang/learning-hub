import { describe, expect, it } from 'vitest';
import { domainsByCert } from './domains';
import { EXAMS, examById, examQuestions } from './exams';
import { QUESTIONS } from './questions';

/** Each exam's per-domain counts, summed — must equal the paper size. */
function planTotal(domainPlan: Record<string, number>): number {
  return Object.values(domainPlan).reduce((sum, count) => sum + count, 0);
}

describe('exam configs', () => {
  it('defines exactly the four mock exams, two per cert', () => {
    expect(EXAMS.map((exam) => exam.id)).toEqual([
      'gh900-mock-a',
      'gh900-mock-b',
      'gh200-mock-a',
      'gh200-mock-b',
    ]);
    expect(examById('gh900-mock-a')?.cert).toBe('gh900');
    expect(examById('gh200-mock-b')?.cert).toBe('gh200');
    expect(examById('nope')).toBeUndefined();
  });

  it('gives every exam 100 minutes and a 35-question domain plan', () => {
    for (const exam of EXAMS) {
      expect(exam.durationMin, exam.id).toBe(100);
      expect(exam.totalQuestions, exam.id).toBe(35);
      expect(planTotal(exam.domainPlan), exam.id).toBe(35);
    }
  });

  it('plans every domain of its cert, and only those, inside the official weight range', () => {
    for (const exam of EXAMS) {
      const domains = domainsByCert(exam.cert);
      expect(Object.keys(exam.domainPlan), exam.id).toEqual(domains.map((d) => d.id));
      for (const domain of domains) {
        const count = exam.domainPlan[domain.id]!;
        const share = (count / exam.totalQuestions) * 100;
        expect(share, `${exam.id} ${domain.id}`).toBeGreaterThanOrEqual(domain.weightMin);
        expect(share, `${exam.id} ${domain.id}`).toBeLessThanOrEqual(domain.weightMax);
      }
    }
  });
});

describe('exam sampling', () => {
  /** Golden snapshots: seeds are constants, so these papers never change. */
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

  it('serves exactly the golden paper for each fixed seed', () => {
    for (const exam of EXAMS) {
      expect(examQuestions(exam).map((q) => q.id), exam.id).toEqual(GOLDEN_IDS[exam.id]);
    }
  });

  it('is deterministic: the same exam sampled twice is the same paper', () => {
    for (const exam of EXAMS) {
      const first = examQuestions(exam).map((q) => q.id);
      const second = examQuestions(exam).map((q) => q.id);
      expect(first, exam.id).toEqual(second);
    }
  });

  it('draws every paper from the bank, 35 questions with the planned per-domain counts', () => {
    for (const exam of EXAMS) {
      const paper = examQuestions(exam);
      expect(paper, exam.id).toHaveLength(35);
      const byId = new Map(QUESTIONS.map((q) => [q.id, q] as const));
      for (const [domainId, planned] of Object.entries(exam.domainPlan)) {
        const drawn = paper.filter((q) => byId.get(q.id)!.domainId === domainId).length;
        expect(drawn, `${exam.id} ${domainId}`).toBe(planned);
      }
    }
  });

  it("shares no question between a cert's mock A and mock B", () => {
    for (const cert of ['gh900', 'gh200'] as const) {
      const paperA = new Set(examQuestions(examById(`${cert}-mock-a`)!).map((q) => q.id));
      const paperB = examQuestions(examById(`${cert}-mock-b`)!).map((q) => q.id);
      expect(paperB.filter((id) => paperA.has(id)), cert).toEqual([]);
    }
  });
});
