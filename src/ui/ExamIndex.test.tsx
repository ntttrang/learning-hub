import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import type { ExamAttempt, SubjectContent } from '../sdk/types';
import { ExamIndex } from './ExamIndex';

const { content, index } = loadSubjectWithIndex('fixture');

function draw(pack: SubjectContent = content) {
  return render(<ExamIndex subjectId="fixture" content={pack} index={index} />);
}

function attempt(overrides: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: 'attempt',
    examId: 'exam-case-study',
    date: '2026-08-20T10:00:00.000Z',
    durationSeconds: 240,
    timed: true,
    scaledScore: 550,
    passed: false,
    perDomain: [{ domainId: 'd1', correct: 1, total: 2 }],
    answers: {},
    results: [],
    ...overrides,
  };
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
  window.location.hash = '';
});

describe('ExamIndex', () => {
  it('renders one card per exam with its contract', () => {
    draw();

    const caseStudyCard = screen.getByRole('link', { name: /Case-study set/ });
    expect(caseStudyCard.getAttribute('href')).toBe('#/subject/fixture/exams/exam-case-study');
    expect(screen.getByText('Fixed')).toBeInTheDocument();
    expect(screen.getByText('Sampled')).toBeInTheDocument();
    expect(screen.getByText('2 questions')).toBeInTheDocument(); // fixed [q-single, q-multi]
    expect(screen.getByText('4 questions')).toBeInTheDocument(); // sampled d1:2 + d2:2
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getAllByText('Pass 700').length).toBe(2);
  });

  it('shows no history until an exam is attempted', () => {
    draw();
    expect(screen.queryByText('Review')).toBeNull();
  });

  it('lists per-exam history newest first with absolute review indexes', () => {
    useSubjectDataStore.setState({
      subjects: {
        fixture: {
          lessons: {},
          completedLabs: [],
          quizAttempts: [],
          examAttempts: [
            attempt({ id: 'newer', examId: 'exam-practice', scaledScore: 1000, passed: true }),
            attempt({ id: 'older', examId: 'exam-case-study', scaledScore: 550, passed: false }),
            attempt({ id: 'other-exam', examId: 'exam-unrelated' }),
          ],
          srs: {},
          notes: [],
          bookmarks: [],
        },
      },
    });
    draw();

    // Each history link keeps the attempt's absolute index in the stored array.
    const links = screen.getAllByRole('link', { name: 'Review' });
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#/subject/fixture/exams/exam-practice/review/0',
      '#/subject/fixture/exams/exam-case-study/review/1',
    ]);

    // The attempt for an exam not in the pack renders no orphan history block.
    expect(screen.getByText('1000/1000')).toBeInTheDocument();
    expect(screen.getByText('550/1000')).toBeInTheDocument();
    expect(screen.queryByText(/exam-unrelated/)).toBeNull();
  });

  it('renders an honest empty state when the pack has no exams', () => {
    draw({ ...content, exams: [] });
    expect(screen.getByText('No exams in this pack yet')).toBeInTheDocument();
  });
});
