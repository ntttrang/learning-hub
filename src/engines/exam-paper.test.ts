import { describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import type { Exam, SubjectContent } from '../sdk/types';
import { assemblePaper } from './exam-paper';
import { sampleExam } from './sampling';

const { content, index } = loadSubjectWithIndex('fixture');
const byId = (id: string): Exam => index.getExam(id)!;

describe('assemblePaper', () => {
  it('serves a fixed selection in its authored order', () => {
    const paper = assemblePaper(content, byId('exam-case-study'));
    expect(paper.map((question) => question.id)).toEqual(['q-single', 'q-multi']);
  });

  it('serves the seeded sample for a sampled selection, deterministically', () => {
    const exam = byId('exam-practice');
    const paper = assemblePaper(content, exam);
    expect(paper).toHaveLength(4); // domainPlan d1:2 + d2:2
    expect(paper.map((question) => question.id)).toEqual(
      sampleExam(exam, content.questions).map((question) => question.id),
    );
    expect(assemblePaper(content, exam).map((question) => question.id)).toEqual(
      paper.map((question) => question.id),
    );
  });

  it('excludes the questions of every exam named in excludeExamIds', () => {
    const excluded = new Set(assemblePaper(content, byId('exam-case-study')).map((q) => q.id));
    const sampler: Exam = {
      ...byId('exam-practice'),
      id: 'exam-exclusive',
      selection: {
        kind: 'sampled',
        domainPlan: { d1: 2, d2: 2 },
        seed: 42,
        excludeExamIds: ['exam-case-study'],
      },
    };
    const pack: SubjectContent = { ...content, exams: [...content.exams, sampler] };

    const paper = assemblePaper(pack, sampler);
    expect(paper).toHaveLength(4);
    // The d1 pool is q-single/q-multi/q-order/q-matching; excluding the fixed
    // exam's q-single/q-multi leaves exactly q-order/q-matching to draw.
    expect(
      paper.filter((question) => question.domainId === 'd1').map((q) => q.id).sort(),
    ).toEqual(['q-matching', 'q-order']);
    for (const question of paper) {
      expect(excluded.has(question.id)).toBe(false);
    }
  });

  it('survives cyclic exclusion chains without looping', () => {
    const a: Exam = {
      id: 'exam-a',
      title: 'A',
      durationMinutes: 5,
      selection: {
        kind: 'sampled',
        domainPlan: { d1: 1 },
        seed: 1,
        excludeExamIds: ['exam-b'],
      },
    };
    const b: Exam = {
      id: 'exam-b',
      title: 'B',
      durationMinutes: 5,
      selection: {
        kind: 'sampled',
        domainPlan: { d1: 1 },
        seed: 2,
        excludeExamIds: ['exam-a'],
      },
    };
    const pack: SubjectContent = { ...content, exams: [a, b] };

    // a excludes b and b excludes a; the cycle serves nothing as exclusion and
    // both papers still draw from the full pool.
    expect(assemblePaper(pack, a)).toHaveLength(1);
    expect(assemblePaper(pack, b)).toHaveLength(1);
  });
});
