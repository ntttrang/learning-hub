import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSubjectDataStore } from '../engines/subject-store';
import { createSubjectIndex } from '../sdk/content-source';
import type { Domain, Question, SubjectContent } from '../sdk/types';
import { PracticeIndex } from './PracticeIndex';

/* -------------------------------- fixtures --------------------------------- */

const question = (id: string, domainId: string): Question => ({
  id,
  domainId,
  kind: 'single',
  prompt: `Prompt ${id}`,
  explanation: 'x',
  options: [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
  ],
  correct: 'a',
});

const domain = (id: string, title: string, order: number): Domain => ({
  id,
  title,
  order,
  summary: `The ${title} material`,
});

function makeContent(questions: Question[], domains: Domain[]): SubjectContent {
  return {
    subject: {
      id: 'fixture',
      code: 'FX-100',
      title: 'Fixture',
      accent: 'deep-teal',
      enabledModes: ['practice'],
    },
    docs: {},
    domains,
    modules: [],
    lessons: [],
    questions,
    labs: [],
    exams: [],
    comparisons: [],
  };
}

function draw(questions: Question[], domains: Domain[]) {
  const content = makeContent(questions, domains);
  return render(
    <PracticeIndex subjectId="fixture" content={content} index={createSubjectIndex(content)} />,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  // Drop recorded attempts so stats start clean between tests.
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
});

/* ---------------------------------- tests ---------------------------------- */

describe('PracticeIndex', () => {
  it('renders an honest empty state when the pack has no questions', () => {
    draw([], [domain('d1', 'Tables', 1)]);
    expect(screen.getByText('No question bank yet')).toBeInTheDocument();
    expect(screen.queryByText('Everything, shuffled')).toBeNull();
  });

  it('lists the all-run plus one card per practiceable domain with counts', () => {
    draw(
      [question('q1', 'd1'), question('q2', 'd1'), question('q3', 'd2')],
      [domain('d1', 'Tables', 1), domain('d2', 'Pipelines', 2), domain('d3', 'Empty', 3)],
    );

    const all = screen.getByRole('link', { name: /Everything, shuffled/ });
    expect(all.getAttribute('href')).toBe('#/subject/fixture/practice/all');
    expect(screen.getByText('3 questions')).toBeInTheDocument(); // all-run pill

    const tables = screen.getByRole('link', { name: /Tables/ });
    expect(tables.getAttribute('href')).toBe('#/subject/fixture/practice/d1');
    expect(screen.getByText('2 questions')).toBeInTheDocument(); // domain pill
    expect(screen.getByRole('link', { name: /Pipelines/ }).getAttribute('href')).toBe(
      '#/subject/fixture/practice/d2',
    );
    expect(screen.queryByText('Empty')).toBeNull(); // zero-question domains drop out
    expect(screen.getByText(/3 questions across 2 practiceable domains/)).toBeInTheDocument();
    expect(screen.queryByText(/Focus/)).toBeNull();
  });

  it('flags weak domains from exam accuracy with a Focus pill', () => {
    const store = useSubjectDataStore;
    // weakDomains reads exam per-domain accuracy (worst-first); the lead line
    // counts quiz runs — seed one of each.
    store.getState().recordExam('fixture', {
      id: 'exam-1',
      examId: 'exam-a',
      date: '2026-08-20T09:00:00.000Z',
      durationSeconds: 300,
      timed: false,
      scaledScore: 500,
      passed: false,
      perDomain: [{ domainId: 'd1', correct: 0, total: 2 }],
      answers: {},
      results: [
        { questionId: 'q1', correct: false },
        { questionId: 'q2', correct: false },
      ],
    });
    store.getState().recordQuiz('fixture', {
      id: 'quiz-1',
      scope: 'd1',
      date: '2026-08-20T09:05:00.000Z',
      total: 1,
      correct: 1,
      questionResults: [{ questionId: 'q1', correct: true }],
    });
    draw(
      [question('q1', 'd1'), question('q3', 'd2')],
      [domain('d1', 'Tables', 1), domain('d2', 'Pipelines', 2)],
    );

    const tablesCard = screen.getByRole('link', { name: /Tables/ });
    expect(tablesCard.textContent).toContain('Focus');
    expect(screen.getByRole('link', { name: /Pipelines/ }).textContent).not.toContain('Focus');
    expect(screen.getByText(/1 run recorded so far/)).toBeInTheDocument();
  });
});
