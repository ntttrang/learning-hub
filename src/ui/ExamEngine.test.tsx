import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { assemblePaper } from '../engines/exam-paper';
import {
  clearInflight,
  EXAM_INFLIGHT_KEY,
  loadInflight,
  type InflightSitting,
} from '../engines/exam-inflight';
import { useSubjectDataStore } from '../engines/subject-store';
import type { Question } from '../sdk/types';
import { ExamEngine, sittingSeconds } from './ExamEngine';

const { content, index } = loadSubjectWithIndex('fixture');

function draw(examId = 'exam-practice') {
  return render(
    <ExamEngine subjectId="fixture" content={content} index={index} examId={examId} />,
  );
}

/** The deterministic sampled paper for exam-practice, in serving order. */
function servedPaper(): Question[] {
  return assemblePaper(content, index.getExam('exam-practice')!);
}

/** Answer the currently shown question correctly, whatever its kind. */
function answerCurrent(question: Question) {
  switch (question.kind) {
    case 'single':
    case 'codeReading': {
      const option = question.options.find((candidate) => candidate.id === question.correct)!;
      fireEvent.click(screen.getByRole('button', { name: option.text }));
      break;
    }
    case 'bug': {
      fireEvent.click(
        screen.getByRole('button', { name: question.codeLines[question.buggyLineIndex] }),
      );
      break;
    }
    case 'multi': {
      for (const id of question.correct) {
        const option = question.options.find((candidate) => candidate.id === id)!;
        fireEvent.click(screen.getByRole('button', { name: option.text }));
      }
      break;
    }
    case 'order': {
      // The seeded order is already correct; move the first item down and
      // back so the sequence is committed as an explicit answer.
      const first = question.options[0];
      fireEvent.click(screen.getByRole('button', { name: `Move ${first.text} down` }));
      fireEvent.click(screen.getByRole('button', { name: `Move ${first.text} up` }));
      break;
    }
    case 'matching': {
      for (const pair of question.pairs) {
        fireEvent.change(screen.getByRole('combobox', { name: pair.left }), {
          target: { value: pair.right },
        });
      }
      break;
    }
    case 'fill': {
      question.blanks.forEach((blank, position) => {
        fireEvent.change(
          screen.getByRole('textbox', {
            name: `Blank ${position + 1} of ${question.blanks.length}`,
          }),
          { target: { value: blank.answer } },
        );
      });
      break;
    }
  }
}

function seedInflight(sitting: InflightSitting) {
  window.localStorage.setItem(EXAM_INFLIGHT_KEY, JSON.stringify(sitting));
}

function recordedAttempts() {
  return useSubjectDataStore.getState().subjects.fixture?.examAttempts ?? [];
}

afterEach(() => {
  clearInflight();
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
  window.location.hash = '';
});

/* ---------------------------------- tests ---------------------------------- */

describe('ExamEngine', () => {
  it('shows the contract intro with the timed/untimed toggle', () => {
    draw('exam-case-study');

    expect(screen.getByRole('heading', { name: 'Case-study set' })).toBeInTheDocument();
    expect(screen.getByText('2 questions')).toBeInTheDocument();
    expect(screen.getByText('Pass 700/1000')).toBeInTheDocument();
    expect(screen.getByText('Before you begin')).toBeInTheDocument();
    expect(screen.getByText(/Unanswered questions score as wrong/)).toBeInTheDocument();

    const timed = screen.getByRole('button', { name: 'Timed' });
    const untimed = screen.getByRole('button', { name: 'Untimed' });
    expect(timed.getAttribute('aria-pressed')).toBe('true');
    expect(untimed.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: /Begin — 10 minutes/ })).toBeInTheDocument();

    fireEvent.click(untimed);
    expect(untimed.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Begin untimed' })).toBeInTheDocument();
    expect(screen.getByText(/Untimed counts up and never auto-submits/)).toBeInTheDocument();
  });

  it('runs a full untimed sitting to one recorded attempt and its review', () => {
    const view = draw();

    fireEvent.click(screen.getByRole('button', { name: 'Untimed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begin untimed' }));

    const served = servedPaper();
    expect(served).toHaveLength(4);
    for (const [position, question] of served.entries()) {
      expect(screen.getByText(`Question ${position + 1} of ${served.length}`)).toBeInTheDocument();
      answerCurrent(question);
      if (position + 1 < served.length) {
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      }
    }

    // On the last question the card action joins the head's submit button.
    fireEvent.click(screen.getAllByRole('button', { name: 'Submit exam' })[0]);
    expect(screen.getByText('Every question is answered.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit and score' }));

    const attempts = recordedAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      examId: 'exam-practice',
      timed: false,
      scaledScore: 1000, // 4 of 4 correct: 100 + 900
      passed: true,
    });
    expect(attempts[0].perDomain).toEqual([
      { domainId: 'd1', correct: 2, total: 2 },
      { domainId: 'd2', correct: 2, total: 2 },
    ]);
    expect(attempts[0].results.every((result) => result.correct)).toBe(true);
    expect(Object.keys(attempts[0].answers)).toHaveLength(4);
    expect(attempts[0].durationSeconds).toBeGreaterThanOrEqual(0);

    expect(loadInflight()).toBeNull(); // the sitting is cleared
    expect(window.location.hash).toBe('#/subject/fixture/exams/exam-practice/review/0');
    view.unmount();
  });

  it('flags, navigates, and shows the case study on the fixed exam', () => {
    draw('exam-case-study');
    fireEvent.click(screen.getByRole('button', { name: /Begin — 10 minutes/ }));

    // Case study card for q-single (question 1).
    expect(screen.getByText(/Contoso lands taxi trips/)).toBeInTheDocument();
    expect(screen.getByText("Contoso's lakehouse")).toBeInTheDocument();

    // Flag it; the flag state shows on the button and the navigator cell.
    const flag = screen.getByRole('button', { name: 'Flag for review' });
    fireEvent.click(flag);
    expect(flag.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('Question 1, flagged')).toBeInTheDocument();

    // Answer, then hop to question 2 via the navigator.
    fireEvent.click(screen.getByRole('button', { name: 'Files in object storage' }));
    expect(screen.getByText('1/2 answered')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Question 2' }));
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();

    // Question 2 (q-multi) carries no case study.
    expect(screen.queryByText(/Contoso lands taxi trips/)).toBeNull();
  });

  it('confirms before submitting and counts the unanswered', () => {
    draw('exam-case-study');
    fireEvent.click(screen.getByRole('button', { name: /Begin — 10 minutes/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Submit exam' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('2 questions are still unanswered — each scores as wrong.'),
    ).toBeInTheDocument();

    // Keep working returns to the sitting; the dialog is gone.
    fireEvent.click(screen.getByRole('button', { name: 'Keep working' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Reopen: focus lands on the safe action, and Escape also keeps working.
    fireEvent.click(screen.getByRole('button', { name: 'Submit exam' }));
    expect(document.activeElement?.textContent).toBe('Keep working');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    // Submit for real: exactly one attempt, scored on the 100–1000 scale.
    fireEvent.click(screen.getByRole('button', { name: 'Submit exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit and score' }));

    const attempts = recordedAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      examId: 'exam-case-study',
      timed: true,
      scaledScore: 100, // nothing answered: 100 + 900 * 0/2
      passed: false,
    });
    expect(attempts[0].results.map((result) => result.questionId)).toEqual([
      'q-single',
      'q-multi',
    ]);
    expect(attempts[0].durationSeconds).toBeLessThanOrEqual(600); // capped at 10 min
    expect(loadInflight()).toBeNull();
    expect(window.location.hash).toBe('#/subject/fixture/exams/exam-case-study/review/0');
  });

  it('resumes an in-flight sitting with answers, flags, and clock', () => {
    seedInflight({
      subjectId: 'fixture',
      examId: 'exam-case-study',
      timed: true,
      startedAt: Date.now() - 60_000,
      deadline: Date.now() + 9 * 60_000,
      answers: { 'q-single': ['files'] },
      flags: ['q-single'],
    });
    draw('exam-case-study');

    // Straight into the sitting, not the intro.
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('1/2 answered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flagged' })).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(loadInflight()?.answers).toEqual({ 'q-single': ['files'] });
  });

  it('auto-submits on mount when the stored deadline has passed', () => {
    seedInflight({
      subjectId: 'fixture',
      examId: 'exam-case-study',
      timed: true,
      startedAt: Date.now() - 2 * 60 * 60_000,
      deadline: Date.now() - 60 * 60_000,
      answers: { 'q-single': ['files'] },
      flags: [],
    });
    draw('exam-case-study');

    const attempts = recordedAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ examId: 'exam-case-study', timed: true });
    // Duration is reconstructed from the deadline and capped at the exam length.
    expect(attempts[0].durationSeconds).toBe(600);
    expect(loadInflight()).toBeNull();
    expect(window.location.hash).toBe('#/subject/fixture/exams/exam-case-study/review/0');
  });

  it('discards a stored sitting for a different exam on visit', () => {
    seedInflight({
      subjectId: 'fixture',
      examId: 'exam-practice',
      timed: true,
      startedAt: Date.now(),
      deadline: Date.now() + 15 * 60_000,
      answers: {},
      flags: [],
    });
    draw('exam-case-study');

    expect(screen.getByRole('heading', { name: 'Case-study set' })).toBeInTheDocument(); // intro
    expect(loadInflight()).toBeNull();
  });

  it('falls back honestly for an unknown exam id', () => {
    draw('nope');
    expect(screen.getByText('No such exam')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to exams' }).getAttribute('href')).toBe(
      '#/subject/fixture/exams',
    );
  });
});

describe('sittingSeconds', () => {
  const examCase = index.getExam('exam-case-study')!;

  it('caps a timed sitting at the exam duration and never goes negative', () => {
    const deadline = 10_000_000;
    // 30 seconds before the deadline = duration minus 30 on the clock.
    expect(sittingSeconds(examCase, true, 0, deadline, deadline - 30_000)).toBe(570);
    // Any submit after the deadline records the cap, never more.
    expect(sittingSeconds(examCase, true, 0, deadline, deadline + 99 * 60_000)).toBe(600);
    // A clock that jumped past the deadline never records negative time.
    expect(sittingSeconds(examCase, true, 0, deadline, deadline - 5 * 60_000)).toBe(300);
  });

  it('records raw elapsed time for untimed sittings', () => {
    expect(sittingSeconds(examCase, false, 1_000_000, undefined, 1_000_000 + 125_000)).toBe(125);
  });
});
