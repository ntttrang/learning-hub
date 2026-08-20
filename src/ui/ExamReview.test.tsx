import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { assemblePaper } from '../engines/exam-paper';
import { useSubjectDataStore } from '../engines/subject-store';
import type { ExamAttempt } from '../sdk/types';
import { DocResolverProvider, registryResolver } from './doc-context';
import { ExamReview } from './ExamReview';

const { content, index } = loadSubjectWithIndex('fixture');

/**
 * One attempt on the fixed exam: q-single answered correctly, q-multi left
 * blank. 1 of 2 correct → scaled 550, failed at 700.
 */
const attempt: ExamAttempt = {
  id: 'attempt-1',
  examId: 'exam-case-study',
  date: '2026-08-20T10:00:00.000Z',
  durationSeconds: 240,
  timed: true,
  scaledScore: 550,
  passed: false,
  perDomain: [{ domainId: 'd1', correct: 1, total: 2 }],
  answers: { 'q-single': ['files'] },
  results: [
    { questionId: 'q-single', correct: true },
    { questionId: 'q-multi', correct: false },
  ],
};

function draw(examId = 'exam-case-study', attemptIndex = '0', stored = attempt) {
  if (stored) {
    useSubjectDataStore.setState({
      subjects: {
        fixture: {
          lessons: {},
          completedLabs: [],
          quizAttempts: [],
          examAttempts: [stored],
          srs: {},
          notes: [],
          bookmarks: [],
        },
      },
    });
  }
  return render(
    <DocResolverProvider resolveDoc={registryResolver(content.docs)}>
      <ExamReview
        subjectId="fixture"
        content={content}
        index={index}
        examId={examId}
        attemptIndex={attemptIndex}
      />
    </DocResolverProvider>,
  );
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
  window.location.hash = '';
});

/* ---------------------------------- tests ---------------------------------- */

describe('ExamReview', () => {
  it('renders the verdict card with the certification-scale numbers', () => {
    draw();

    expect(screen.getByText('550')).toBeInTheDocument();
    expect(screen.getByText('/1000')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 correct \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Passing mark 700/)).toBeInTheDocument();
    expect(screen.getByText(/Timed/)).toBeInTheDocument();
    expect(screen.getByText(/4:00/)).toBeInTheDocument(); // 240 seconds
    expect(screen.getByRole('link', { name: 'Sit again' }).getAttribute('href')).toBe(
      '#/subject/fixture/exams/exam-case-study',
    );
  });

  it('breaks the score down by domain against the official weight', () => {
    draw();

    expect(screen.getByText('D1 · Core concepts')).toBeInTheDocument();
    expect(screen.getByText('35-40%')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('replays the deterministic paper with the stored answers marked', () => {
    draw();

    // Paper identity: the fixed selection serves q-single then q-multi, and
    // the review replays exactly that order.
    const replayOrder = assemblePaper(content, index.getExam('exam-case-study')!).map(
      (question) => question.id,
    );
    expect(replayOrder).toEqual(['q-single', 'q-multi']);
    expect(screen.getAllByText(/^Question \d$/).map((pill) => pill.textContent)).toEqual([
      'Question 1',
      'Question 2',
    ]);

    // q-single: answered correctly — the verdict pill and the revealed
    // option state both say so (pill + feedback verdict match the word).
    expect(screen.getAllByText('Correct').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /Files in object storage/ }).className,
    ).toContain('q-opt-correct');

    // q-multi: left blank — the unanswered verdict, not a wrong pick.
    expect(screen.getByText('Unanswered')).toBeInTheDocument();
    expect(screen.getByText('Left blank')).toBeInTheDocument();
    expect(screen.getByText(/Parquet and Delta are columnar/)).toBeInTheDocument(); // explanation

    // Doc trail for q-single (the only question carrying docIds), and lesson
    // links for both questions — they share the storage-models lesson.
    expect(screen.getByRole('link', { name: /Lakehouse architecture documentation/ })).toHaveAttribute(
      'href',
      'https://example.com/docs/lakehouse',
    );
    const lessonLinks = screen.getAllByRole('link', {
      name: /Review the lesson: Storage models/,
    });
    expect(lessonLinks).toHaveLength(2);
    expect(lessonLinks[0]).toHaveAttribute('href', '#/subject/fixture/learn/storage-models');
  });

  it('marks a wrong (but answered) question as Missed', () => {
    draw('exam-case-study', '0', {
      ...attempt,
      answers: { 'q-single': ['rowstore'], 'q-multi': ['parquet'] },
      results: [
        { questionId: 'q-single', correct: false },
        { questionId: 'q-multi', correct: false },
      ],
    });

    expect(screen.getAllByText('Missed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not quite').length).toBeGreaterThan(0);
    expect(screen.queryByText('Unanswered')).toBeNull();
  });

  it('renders an honest empty state for a bad attempt index', () => {
    draw('exam-case-study', '9');
    expect(screen.getByText('No such attempt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to exams' }).getAttribute('href')).toBe(
      '#/subject/fixture/exams',
    );
  });

  it('renders an honest empty state for a non-numeric attempt index', () => {
    draw('exam-case-study', 'latest');
    expect(screen.getByText('No such attempt')).toBeInTheDocument();
  });

  it('renders an honest empty state when the index points at another exam', () => {
    // The stored attempt belongs to exam-case-study; asking for it under
    // exam-practice must not fabricate a review.
    draw('exam-practice', '0');
    expect(screen.getByText('No such attempt')).toBeInTheDocument();
  });

  it('renders an honest empty state for an unknown exam', () => {
    draw('nope');
    expect(screen.getByText('No such exam')).toBeInTheDocument();
  });
});
