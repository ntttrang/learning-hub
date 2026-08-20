import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectIndex } from '../sdk/content-source';
import type { Question } from '../sdk/types';
import { DocResolverProvider, registryResolver } from './doc-context';
import { QuizRunner } from './QuizRunner';

/* -------------------------------- fixtures --------------------------------- */

const q = (id: string, correct: string, extra: Partial<Question> = {}): Question => ({
  id,
  domainId: 'd1',
  kind: 'single',
  prompt: `Prompt ${id}`,
  explanation: `Because ${id}`,
  options: [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
  ],
  correct,
  ...extra,
} as Question);

const bank = [q('qA', 'a', { lessonId: 'lesson-1', docIds: ['doc-1'] }), q('qB', 'b')];

/** Minimal lesson lookup: lesson ids sluggify to `<id>-page`. */
const index = {
  getLesson: (id: string) => ({ id, slug: `${id}-page` }),
} as unknown as SubjectIndex;

const docs = registryResolver({
  'doc-1': { title: 'COPY INTO docs', url: 'https://example.com/copy-into' },
});

/** The store's real action, captured before any spy touches the state. */
const realRecordQuiz = useSubjectDataStore.getState().recordQuiz;

function draw(questions = bank) {
  return render(
    <DocResolverProvider resolveDoc={docs}>
      <QuizRunner subjectId="fixture" scope="all" questions={questions} index={index} />
    </DocResolverProvider>,
  );
}

beforeEach(() => {
  // Fisher–Yates draws Math.random once per pair; 0.99 keeps the given order,
  // 0 swaps — deterministic shuffles we can assert on.
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
  // zustand's setState merge copies the spy onto each new state object, so
  // restoreAllMocks alone never reaches the live store — force the real
  // action back or the next test's spy inherits this test's calls.
  useSubjectDataStore.setState({ recordQuiz: realRecordQuiz });
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
});

/* ---------------------------------- tests ---------------------------------- */

describe('QuizRunner: the practice loop', () => {
  it('checks, verdicts, advances, and records exactly one attempt at the end', () => {
    const recordQuiz = vi.spyOn(useSubjectDataStore.getState(), 'recordQuiz');
    draw();

    // Question 1: unchecked — Check answer stays disabled until an option lands.
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Prompt qA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Because qA')).toBeInTheDocument();
    const docLink = screen.getByRole('link', { name: 'Read the docs: COPY INTO docs' });
    expect(docLink.getAttribute('href')).toBe('https://example.com/copy-into');
    expect(screen.getByRole('link', { name: 'Review the lesson' }).getAttribute('href')).toBe(
      '#/subject/fixture/learn/lesson-1-page',
    );
    expect(recordQuiz).not.toHaveBeenCalled();

    // Question 2: answered wrong.
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    expect(screen.getByText('Prompt qB')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();

    // Finish: score, misses with lesson links, one recorded attempt.
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    expect(screen.getByText('1 of 2 correct (50%)')).toBeInTheDocument();
    // qB has no lessonId, so its miss row is plain text, not a link.
    expect(screen.getByText('Prompt qB').closest('a')).toBeNull();
    expect(recordQuiz).toHaveBeenCalledTimes(1);
    const [subjectId, attempt] = recordQuiz.mock.calls[0];
    expect(subjectId).toBe('fixture');
    expect(attempt).toMatchObject({
      scope: 'all',
      total: 2,
      correct: 1,
      questionResults: [
        { questionId: 'qA', correct: true },
        { questionId: 'qB', correct: false },
      ],
    });
    expect(typeof attempt.id).toBe('string');
    expect(typeof attempt.date).toBe('string');
  });

  it('restart reshuffles, clears progress, and does not double-record', () => {
    const recordQuiz = vi.spyOn(useSubjectDataStore.getState(), 'recordQuiz');
    draw();

    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));
    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    expect(recordQuiz).toHaveBeenCalledTimes(1);

    // New run: reshuffled order (Math.random now swaps) and a fresh question 1.
    vi.mocked(Math.random).mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Prompt qB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    expect(screen.queryByText('Not quite')).toBeNull();
    expect(recordQuiz).toHaveBeenCalledTimes(1);
  });

  it('renders an honest empty state for an empty bank', () => {
    draw([]);
    expect(screen.getByText('No questions in this scope')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to practice' }).getAttribute('href')).toBe(
      '#/subject/fixture/practice',
    );
  });

  it('an order question checked without moving records the same verdict it showed', () => {
    // Option order === correct: the seeded answer is submit-ready without any
    // onAnswer ever firing. Verdict and the recorded attempt must agree.
    const orderBank: Question[] = [
      {
        id: 'q-order',
        domainId: 'd1',
        kind: 'order',
        prompt: 'Order it',
        explanation: 'seeded order is correct',
        options: [
          { id: 'a', text: 'First' },
          { id: 'b', text: 'Second' },
        ],
        correct: ['a', 'b'],
      },
    ];
    const recordQuiz = vi.spyOn(useSubjectDataStore.getState(), 'recordQuiz');
    draw(orderBank);

    fireEvent.click(screen.getByRole('button', { name: 'Check answer' })); // enabled from the seed
    expect(screen.getByText('Correct')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));
    expect(screen.getByText('1 of 1 correct (100%)')).toBeInTheDocument();
    expect(screen.queryByText('To revisit')).toBeNull();
    const [, attempt] = recordQuiz.mock.calls[0];
    expect(attempt.questionResults).toEqual([{ questionId: 'q-order', correct: true }]);
  });
});
