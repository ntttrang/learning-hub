import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { emptySubjectData, useSubjectDataStore } from '../engines/subject-store';
import type { SrsCard } from '../sdk/types';
import HubHome from './HubHome';

const NOW = Date.now();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const dueCard = (questionId: string): SrsCard => ({
  questionId,
  box: 1,
  due: daysAgo(1),
  lastSeen: daysAgo(2),
  timesCorrect: 0,
  timesWrong: 1,
});

const fixtureData = (overrides: Partial<ReturnType<typeof emptySubjectData>> = {}) => ({
  ...emptySubjectData(),
  ...overrides,
});

describe('HubHome', () => {
  beforeEach(() => {
    useSubjectDataStore.setState({
      streak: { current: 0, longest: 0 },
      achievements: [],
      subjects: {},
    });
  });

  it('renders honest zeros on a fresh store', () => {
    render(<HubHome />);
    const band = screen.getByLabelText('Your hub at a glance');
    expect(band).toHaveTextContent('0cards due for review');
    expect(band).toHaveTextContent(/0 \/ \d+/);
    expect(screen.getByText('achievements earned')).toBeInTheDocument();
    expect(screen.getByText('0 of 8 earned')).toBeInTheDocument();
    // No NaN anywhere in the stats band.
    expect(band.textContent).not.toMatch(/NaN/);
  });

  it('shows per-subject progress on installed cards and none on placeholders', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: fixtureData({
          lessons: {
            'lesson-storage-models': { status: 'completed' },
            'lesson-query-shapes': { status: 'in-progress' },
          },
          completedLabs: ['lab-explore'],
          lastLessonId: 'lesson-storage-models',
        }),
      },
    });
    render(<HubHome />);

    const fixtureCard = screen.getByRole('link', { name: /FX-100/ }).closest('article');
    expect(fixtureCard).not.toBeNull();
    expect(fixtureCard).toHaveTextContent('Lessons');
    expect(fixtureCard).toHaveTextContent('1/2');
    expect(fixtureCard).toHaveTextContent('Labs 1/1');
    expect(fixtureCard).toHaveTextContent('No exams yet');
    expect(fixtureCard).toHaveTextContent('Continue →');

    // A subject with no store data keeps its card but shows honest zeros —
    // every roadmap pack is installed now, so no placeholder card exists.
    const quiet = screen.getByRole('link', { name: /DP-800/ }).closest('article');
    expect(quiet).toHaveTextContent('Lessons');
    expect(quiet).toHaveTextContent('0/43');
    expect(quiet).toHaveTextContent('No exams yet');
    expect(quiet).not.toHaveTextContent('Continue →');
    expect(quiet!.querySelector('.due-chip')).toBeNull();
  });

  it('links the due chip and the due stat to the review queue', () => {
    useSubjectDataStore.setState({
      subjects: { fixture: fixtureData({ srs: { q1: dueCard('q1'), q2: dueCard('q2') } }) },
    });
    render(<HubHome />);

    const chip = screen.getByRole('link', { name: '2 due' });
    expect(chip).toHaveAttribute('href', '#/review');
    expect(screen.getByRole('link', { name: /cards due for review/ })).toHaveAttribute(
      'href',
      '#/review',
    );
  });

  it('hides the due chip and shows zero due on a clean deck', () => {
    render(<HubHome />);
    expect(screen.queryByRole('link', { name: '0 due' })).toBeNull();
  });

  it('resolves the continue link through the last-visited lesson slug', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: fixtureData({ lastLessonId: 'lesson-query-shapes' }),
      },
    });
    render(<HubHome />);
    const card = screen.getByRole('link', { name: /FX-100/ }).closest('article');
    expect(card!.querySelector('.card-link')).toHaveAttribute(
      'href',
      '#/subject/fixture',
    );
    expect(card).toHaveTextContent('Continue →');
    // The continue hint only appears when lastLessonId resolves.
    const other = screen.getByRole('link', { name: /GH-200/ }).closest('article');
    expect(other).not.toHaveTextContent('Continue →');
  });

  it('marks earned achievements with their date and locks the rest', () => {
    useSubjectDataStore.setState({
      achievements: [
        {
          id: 'first-lesson',
          title: 'Cast off',
          description: 'Complete your first lesson.',
          earnedAt: '2026-08-20T10:00:00.000Z',
        },
      ],
    });
    render(<HubHome />);
    const earned = screen.getByText('Cast off').closest('li');
    expect(earned).toHaveClass('earned');
    expect(earned).not.toHaveTextContent('Locked');
    const locked = screen.getByText('Fair winds').closest('li');
    expect(locked).not.toHaveClass('earned');
    expect(locked).toHaveTextContent('Locked');
  });
});
