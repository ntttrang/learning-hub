import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { emptySubjectData, useSubjectDataStore } from '../engines/subject-store';
import type { SrsCard } from '../sdk/types';
import ReviewQueue from './ReviewQueue';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const dueCard = (questionId: string, overdueDays: number): SrsCard => ({
  questionId,
  box: 2,
  due: daysAgo(overdueDays),
  lastSeen: daysAgo(10),
  timesCorrect: 1,
  timesWrong: 0,
});

const fixtureDeck = (cards: SrsCard[]) => ({
  fixture: {
    ...emptySubjectData(),
    srs: Object.fromEntries(cards.map((card) => [card.questionId, card])),
  },
});

describe('ReviewQueue', () => {
  beforeEach(() => {
    useSubjectDataStore.setState({
      streak: { current: 0, longest: 0 },
      achievements: [],
      subjects: {},
    });
  });

  it('shows the empty state when nothing is due', () => {
    useSubjectDataStore.setState({ subjects: fixtureDeck([]) });
    render(<ReviewQueue />);
    expect(screen.getByText('Nothing due right now')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the hub' })).toHaveAttribute('href', '#/');
  });

  it('runs due fixture cards to a finish and records one hub-review attempt', () => {
    useSubjectDataStore.setState({
      subjects: fixtureDeck([dueCard('q-single', 2), dueCard('q-fill', 1)]),
    });
    render(<ReviewQueue />);

    // First card: the most overdue one, badged with the owning subject code.
    expect(screen.getByText('In a lakehouse, what physically stores the data?')).toBeInTheDocument();
    expect(screen.getByText('FX-100')).toBeInTheDocument();

    // Answer the single-choice question correctly.
    fireEvent.click(screen.getByRole('button', { name: /Files in object storage/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    // Second card: fill both blanks, then finish.
    expect(screen.getByText(/counts trips per city/)).toBeInTheDocument();
    const blanks = screen.getAllByRole('textbox');
    fireEvent.change(blanks[0], { target: { value: 'COUNT' } });
    fireEvent.change(blanks[1], { target: { value: 'GROUP BY' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));

    expect(screen.getByText('Review session complete')).toBeInTheDocument();
    expect(screen.getByText('2 of 2 correct (100%)')).toBeInTheDocument();

    const attempts = useSubjectDataStore.getState().subjects.fixture.quizAttempts;
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      scope: 'hub-review',
      total: 2,
      correct: 2,
    });
    expect(attempts[0].questionResults.map((r) => r.questionId).sort()).toEqual([
      'q-fill',
      'q-single',
    ]);

    // And the reviewed cards moved up a box in the persisted deck.
    const deck = useSubjectDataStore.getState().subjects.fixture.srs;
    expect(deck['q-single'].box).toBe(3);
  });

  it('records one attempt per subject on a mixed two-subject session', () => {
    useSubjectDataStore.setState({
      subjects: {
        ...fixtureDeck([dueCard('q-single', 3)]),
        // A second subject's deck — due 1 day later so fixture's card leads.
        'gh-200': {
          ...emptySubjectData(),
          srs: { 'gh200-d1-q01': dueCard('gh200-d1-q01', 1) },
        },
      },
    });
    render(<ReviewQueue />);

    // Subject-sorted interleave puts fixture first; answer its card correctly.
    expect(screen.getByText('In a lakehouse, what physically stores the data?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Files in object storage/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    // GH-200's card: pick the wrong option, then finish (unanswered would
    // also count wrong — this proves cross-subject grading is per-card).
    expect(screen.getByText(/release team wants a workflow/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /timer: 03:30 weekdays/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));

    expect(screen.getByText('Review session complete')).toBeInTheDocument();
    expect(screen.getByText('1 of 2 correct (50%)')).toBeInTheDocument();

    const state = useSubjectDataStore.getState().subjects;
    expect(state.fixture!.quizAttempts).toHaveLength(1);
    expect(state['gh-200']!.quizAttempts).toHaveLength(1);
    expect(state.fixture!.quizAttempts[0]).toMatchObject({ scope: 'hub-review', total: 1, correct: 1 });
    expect(state['gh-200']!.quizAttempts[0]).toMatchObject({ scope: 'hub-review', total: 1, correct: 0 });
    // Each deck graded its own card: fixture's moved up, gh-200's reset to box 1.
    expect(state.fixture!.srs['q-single']!.box).toBe(3);
    expect(state['gh-200']!.srs['gh200-d1-q01']!.box).toBe(1);
  });
});
