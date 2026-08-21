import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LearnIndex } from './components/learn/LearnIndex';
import { LessonView } from './components/learn/LessonView';
import { LabIndex } from './components/lab/LabIndex';
import { LabView } from './components/lab/LabView';
import { PracticeIndex } from './components/practice/PracticeIndex';
import { QuizRunner } from './components/practice/QuizRunner';
import { CompareIndex } from './components/compare/CompareIndex';
import { ExamIndex } from './components/exams/ExamIndex';
import { ExamReview } from './components/exams/ExamReview';
import { ExamRunner } from './components/exams/ExamRunner';
import { DOCS } from './content/docs';
import { domainById } from './content/domains';
import { labById } from './content/labs';
import { byCert, byDomain } from './content/questions';

describe('Learn views', () => {
  it('lists all twelve domains across both certs with weight and unread state', () => {
    render(<LearnIndex />);
    // Domain 1 exists on both certs — one badge each.
    expect(screen.getAllByText('Domain 1')).toHaveLength(2);
    expect(screen.getByText(/7 domains/i)).toBeTruthy();
    expect(screen.getByText(/5 domains/i)).toBeTruthy();
    expect(screen.getByText(/0 of 12 read/i)).toBeTruthy();
    // Weight range appears on a card.
    expect(screen.getAllByText(/25–30%/)).toHaveLength(1);
    // Nothing read yet: no done flags.
    expect(screen.queryByText('Read')).toBeNull();
  });

  it('renders a GH-200 lesson with its checklist and cert prev/next', () => {
    const domain = domainById('gh200-d1');
    expect(domain).toBeDefined();
    render(<LessonView domainId="gh200-d1" />);

    expect(screen.getByText('Author and manage workflows')).toBeTruthy();
    // First GH-200 domain: no previous within its cert, next is domain 2.
    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.getByText('Consume and troubleshoot workflows')).toBeTruthy();

    // Checklist doc links resolve through the registry.
    const skill = domain!.subSkills[0];
    const links = screen
      .getAllByText(DOCS[skill.docIds[0]].title)
      .map((node) => node.closest('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link?.href).toBe(DOCS[skill.docIds[0]].url);
    }
  });

  it('renders a lesson with blocks, checklist, and working doc links', () => {
    const domain = domainById('gh900-d1');
    expect(domain).toBeDefined();
    render(<LessonView domainId="gh900-d1" />);

    // Prose blocks made it to the page.
    expect(screen.getByText('Understand Git and GitHub basics')).toBeTruthy();
    expect(screen.getByText(/distributed version control|distributed/i)).toBeTruthy();

    // Code block carries its language chip.
    expect(screen.getByText('bash')).toBeTruthy();

    // Sub-skill checklist resolves registry links to real URLs. The same
    // page may also be linked from prose, so assert on all its occurrences.
    const skill = domain!.subSkills[0];
    const links = screen
      .getAllByText(DOCS[skill.docIds[0]].title)
      .map((node) => node.closest('a'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link?.href).toBe(DOCS[skill.docIds[0]].url);
    }

    // Prev/next: domain 1 has no previous, but domain 2 is next.
    expect(screen.getByText('Work with GitHub repositories')).toBeTruthy();
    expect(screen.queryByText('Previous')).toBeNull();
  });

  it('marks a lesson read and survives a remount (localStorage)', () => {
    const { unmount } = render(<LessonView domainId="gh900-d1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(screen.getByText(/Read on/)).toBeTruthy();
    unmount();

    render(<LessonView domainId="gh900-d1" />);
    expect(screen.getByText(/Read on/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark as read' })).toBeNull();

    // And the index now reflects it.
    render(<LearnIndex />);
    expect(screen.getByText(/1 of 12 read/i)).toBeTruthy();
    expect(screen.getByText('Read')).toBeTruthy();
  });

  it('shows a friendly empty state for an unknown domain id', () => {
    render(<LessonView domainId="gh900-d99" />);
    expect(screen.getByText('No such lesson')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Learn' })).toBeTruthy();
  });
});

describe('Lab views', () => {
  it('lists all thirteen labs in domain order, GH-900 first', () => {
    render(<LabIndex />);
    const lab = labById('gh900-lab-01');
    expect(lab).toBeDefined();
    expect(screen.getByText(lab!.title)).toBeTruthy();
    const living = labById('gh200-lab-06');
    expect(living).toBeDefined();
    expect(screen.getByText(living!.title)).toBeTruthy();
    expect(screen.getByText(/0 of 13 done/i)).toBeTruthy();
  });

  it('renders the living lab with its two repo links resolving', () => {
    render(<LabView labId="gh200-lab-06" />);
    expect(
      screen.getByText('.github/workflows/deploy.yml', { exact: false }).closest('a')?.href,
    ).toBe(DOCS['repo-deploy-workflow'].url);
    expect(
      screen.getByText('Actions runs', { exact: false }).closest('a')?.href,
    ).toBe(DOCS['repo-actions-runs'].url);
  });

  it('renders tasks, outcomes, and self-checks; done persists', () => {
    const lab = labById('gh900-lab-03');
    expect(lab).toBeDefined();
    const { unmount } = render(<LabView labId="gh900-lab-03" />);

    expect(screen.getByText(lab!.title)).toBeTruthy();
    expect(screen.getByText('Tasks')).toBeTruthy();
    expect(screen.getByText('Expected outcomes')).toBeTruthy();
    expect(screen.getByText('Self-check')).toBeTruthy();
    // A doc link inside a step resolves through the registry.
    expect(
      screen.getByText('linking a pull request to an issue', { exact: false }).closest('a')?.href,
    ).toBe(DOCS['linking-pr-to-issue'].url);

    fireEvent.click(screen.getByRole('button', { name: 'Mark as done' }));
    expect(screen.getByText(/Done on/)).toBeTruthy();
    unmount();

    render(<LabView labId="gh900-lab-03" />);
    expect(screen.getByText(/Done on/)).toBeTruthy();
  });
});

describe('Practice views', () => {
  it('lists all twelve domains as playable, with both banks driving the headers', () => {
    render(<PracticeIndex />);

    // Both certs, with the bank driving the headers.
    expect(screen.getByText('GH-900 · GitHub Foundations')).toBeTruthy();
    expect(screen.getByText('GH-200 · GitHub Actions')).toBeTruthy();
    expect(screen.getByText('140 questions')).toBeTruthy();
    expect(screen.getByText('100 questions')).toBeTruthy();
    expect(screen.getByText(/240 original questions/i)).toBeTruthy();
    expect(screen.getByText(/0 answered so far across 12 playable domains/i)).toBeTruthy();

    // Every domain card offers its bank size and a fresh stat line.
    expect(screen.getAllByText('20 questions')).toHaveLength(12);
    expect(screen.getAllByText('Not started')).toHaveLength(12);
    expect(screen.queryByText('Coming soon')).toBeNull();
  });

  it('runs every GH-900 domain quiz, records stats, and restarts', () => {
    const domainIds = [...new Set(byCert('gh900').map((question) => question.domainId))];
    expect(domainIds).toHaveLength(7);
    for (const domainId of domainIds) {
      const total = byDomain(domainId).length;
      expect(total).toBe(20);
      const { container } = render(<QuizRunner domainId={domainId} />);
      expect(screen.getByText('Question 1 of 20')).toBeTruthy();

      // Answer every question kind the runner can show: detect the kind pill,
      // leave a shaped answer (first option / nope / all chips placed), then
      // check and advance. Scores vary with shuffle; the loop shape does not.
      for (let i = 0; i < total; i++) {
        if (screen.queryByText('Single choice')) {
          fireEvent.click(screen.getAllByRole('radio')[0]);
        } else if (screen.queryByText('Spot the bug')) {
          fireEvent.click(screen.getByRole('button', { name: 'Mark line 1 as the bug' }));
        } else if (screen.queryByText('Choose all that apply')) {
          fireEvent.click(screen.getAllByRole('checkbox')[0]);
        } else if (screen.queryByText('Fill in the blank')) {
          for (const input of screen.getAllByRole('textbox')) {
            fireEvent.change(input, { target: { value: 'nope' } });
          }
        } else {
          // Order: place every chip until the pool runs dry.
          for (;;) {
            const chip = container.querySelector('button.order-chip');
            if (!chip) break;
            fireEvent.click(chip);
          }
        }

        fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
        expect(screen.getByText(/^Correct$|^Not quite$/)).toBeTruthy();
        fireEvent.click(
          screen.getByRole('button', { name: i + 1 < total ? 'Next question' : 'See results' }),
        );
      }

      // Finish screen: full score line and a docs trail of misses.
      expect(screen.getByText(/of 20 correct/)).toBeTruthy();
      const stored = JSON.parse(window.localStorage.getItem('gh-site-progress-v1') ?? '{}');
      expect(stored.practiceStats[domainId].seen).toBe(20);
      expect(stored.practiceStats[domainId].correct).toBeLessThanOrEqual(20);

      // Restart reshuffles into a fresh run.
      fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
      expect(screen.getByText('Question 1 of 20')).toBeTruthy();
      cleanup();
    }
  });

  it('runs every GH-200 domain quiz through all five kinds and records stats', () => {
    const domainIds = [...new Set(byCert('gh200').map((question) => question.domainId))];
    expect(domainIds).toHaveLength(5);
    for (const domainId of domainIds) {
      const total = byDomain(domainId).length;
      expect(total).toBe(20);
      const { container } = render(<QuizRunner domainId={domainId} />);
      expect(screen.getByText('Question 1 of 20')).toBeTruthy();

      // Same answering loop as the GH-900 run: shape an answer per kind,
      // check it, advance. Scores vary with shuffle and option positions.
      for (let i = 0; i < total; i++) {
        if (screen.queryByText('Single choice')) {
          fireEvent.click(screen.getAllByRole('radio')[0]);
        } else if (screen.queryByText('Spot the bug')) {
          fireEvent.click(screen.getByRole('button', { name: 'Mark line 1 as the bug' }));
        } else if (screen.queryByText('Choose all that apply')) {
          fireEvent.click(screen.getAllByRole('checkbox')[0]);
        } else if (screen.queryByText('Fill in the blank')) {
          for (const input of screen.getAllByRole('textbox')) {
            fireEvent.change(input, { target: { value: 'nope' } });
          }
        } else {
          for (;;) {
            const chip = container.querySelector('button.order-chip');
            if (!chip) break;
            fireEvent.click(chip);
          }
        }

        fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
        expect(screen.getByText(/^Correct$|^Not quite$/)).toBeTruthy();
        fireEvent.click(
          screen.getByRole('button', { name: i + 1 < total ? 'Next question' : 'See results' }),
        );
      }

      expect(screen.getByText(/of 20 correct/)).toBeTruthy();
      const stored = JSON.parse(window.localStorage.getItem('gh-site-progress-v1') ?? '{}');
      expect(stored.practiceStats[domainId].seen).toBe(20);
      expect(stored.practiceStats[domainId].correct).toBeLessThanOrEqual(20);
      cleanup();
    }
  });

  it('shows the unknown-domain empty state', () => {
    render(<QuizRunner domainId="gh200-d99" />);
    expect(screen.getByText('No such domain')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Practice' })).toBeTruthy();
  });
});

describe('Compare views', () => {
  it('renders the Jenkins table by default with resolving doc links', () => {
    render(<CompareIndex />);

    expect(screen.getByText('Actions vs the classics')).toBeTruthy();
    // Switch offers both comparisons, Jenkins pressed first.
    expect(screen.getByRole('button', { name: 'vs Jenkins' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'vs AWS CI/CD services' }).getAttribute('aria-pressed')).toBe('false');

    // Column headers and a row from the Jenkins table.
    expect(screen.getByText('GitHub Actions')).toBeTruthy();
    expect(screen.getByText('Jenkins')).toBeTruthy();
    expect(screen.getByText('Hosting model')).toBeTruthy();
    expect(screen.getByText('When it fits')).toBeTruthy();

    // A cell link resolves through the registry.
    expect(
      screen.getByText('Jenkinsfile', { exact: false }).closest('a')?.href,
    ).toBe(DOCS['jenkins-pipeline-syntax'].url);
  });

  it('switches to the AWS comparison on the segmented control', () => {
    render(<CompareIndex />);
    fireEvent.click(screen.getByRole('button', { name: 'vs AWS CI/CD services' }));

    expect(screen.getByRole('button', { name: 'vs Jenkins' }).getAttribute('aria-pressed')).toBe('false');
    // The AWS-only rows appear, the Jenkins-only ones step aside.
    expect(screen.getByText('Related AWS services')).toBeTruthy();
    expect(screen.queryByText('Hosting model')).toBeNull();

    // The related-services note cites CodeArtifact through the registry.
    expect(
      screen.getByText('CodeArtifact', { exact: false }).closest('a')?.href,
    ).toBe(DOCS['aws-codeartifact'].url);
  });
});

describe('Exam views', () => {
  it('lists the four mock exams with duration, size, and an empty history', () => {
    render(<ExamIndex />);
    for (const title of [
      'GH-900 mock exam A',
      'GH-900 mock exam B',
      'GH-200 mock exam A',
      'GH-200 mock exam B',
    ]) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.getAllByText('100 minutes')).toHaveLength(4);
    expect(screen.getAllByText('35 questions')).toHaveLength(4);
    expect(screen.getByText(/No attempts recorded yet/)).toBeTruthy();
  });

  it('shows the friendly empty state for an unknown exam id', () => {
    render(<ExamRunner examId="nope-mock" />);
    expect(screen.getByText('No such exam')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to Mock exams' })).toBeTruthy();
  });

  it('runs an exam: begin, answer, submit, review, and persists the attempt', async () => {
    const { unmount } = render(<ExamRunner examId="gh900-mock-a" />);
    // Begin screen: the clock has not started and no questions are shown.
    expect(screen.getByText('Before you begin')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Begin — 100 minutes/ }));

    // Running: timer at the full 100:00, first question of 35 on screen.
    expect(screen.getByRole('timer').textContent).toBe('100:00');
    expect(screen.getByText('Question 1 of 35')).toBeTruthy();
    // No feedback chrome during the sitting — only at review.
    expect(screen.queryByText('Check answer')).toBeNull();

    // The paper's first question is a single (golden: gh900-d6-q03); answer it.
    fireEvent.click(screen.getAllByRole('radio')[0]);

    // Submit straight from the confirmation dialog.
    fireEvent.click(screen.getByRole('button', { name: 'Submit exam' }));
    expect(screen.getByText(/34 questions are still unanswered/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Submit and score' }));

    // The attempt is recorded with 1/35 correct → round(100 + 900/35) = 126.
    const stored = JSON.parse(window.localStorage.getItem('gh-site-progress-v1') ?? '{}');
    expect(stored.examAttempts).toHaveLength(1);
    expect(stored.examAttempts[0]).toMatchObject({
      examId: 'gh900-mock-a',
      scaledScore: 126,
      passed: false,
    });
    // In-flight sitting is cleared after submit.
    expect(window.localStorage.getItem('gh-site-exam-inflight-v1')).toBeNull();
    unmount();

    // Review screen replays the exact paper with the learner's answer.
    render(<ExamReview examId="gh900-mock-a" attemptIndex={0} />);
    expect(screen.getByText('126')).toBeTruthy();
    expect(screen.getByText(/1 of 35 correct/)).toBeTruthy();
    expect(screen.getByText(/Q35/)).toBeTruthy();
    // Q1 was answered correctly: its item shows the ok verdict, not Unanswered.
    expect(screen.getAllByText('Correct').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unanswered').length).toBeGreaterThan(0);
    // Breakdown links out to practice and the lesson.
    expect(screen.getAllByText('Practice this domain').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reread the lesson').length).toBeGreaterThan(0);

    // The index now carries the attempt in its history.
    render(<ExamIndex />);
    expect(screen.getByText('126 · Fail')).toBeTruthy();
  });

  it('resumes an in-flight sitting across a remount', () => {
    const { unmount } = render(<ExamRunner examId="gh200-mock-a" />);
    fireEvent.click(screen.getByRole('button', { name: /Begin — 100 minutes/ }));
    fireEvent.click(screen.getAllByRole('radio')[0]);
    unmount();

    // Remount: straight back into the sitting, no begin screen.
    render(<ExamRunner examId="gh200-mock-a" />);
    expect(screen.queryByText('Before you begin')).toBeNull();
    expect(screen.getByText('Question 1 of 35')).toBeTruthy();
    expect(window.localStorage.getItem('gh-site-exam-inflight-v1')).toContain('gh200-mock-a');
  });

  it('auto-submits an expired sitting on return', async () => {
    window.localStorage.setItem(
      'gh-site-exam-inflight-v1',
      JSON.stringify({
        examId: 'gh200-mock-b',
        deadline: Date.now() - 1000,
        answers: {},
        flags: [],
      }),
    );
    render(<ExamRunner examId="gh200-mock-b" />);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('gh-site-progress-v1') ?? '{}');
      expect(stored.examAttempts).toHaveLength(1);
      expect(stored.examAttempts[0]).toMatchObject({
        examId: 'gh200-mock-b',
        scaledScore: 100,
        passed: false,
      });
    });
    expect(window.localStorage.getItem('gh-site-exam-inflight-v1')).toBeNull();
  });

  it('discards a corrupt in-flight record instead of crashing the runner', () => {
    const records = [
      // `answers: null` passes `typeof === 'object'` but crashes on lookup.
      JSON.stringify({
        examId: 'gh900-mock-a',
        deadline: Date.now() + 60_000,
        answers: null,
        flags: [],
      }),
      // `1e999` parses to Infinity — `typeof 'number'`, but a dead clock.
      '{"examId":"gh900-mock-a","deadline":1e999,"answers":{},"flags":[]}',
    ];
    for (const record of records) {
      window.localStorage.setItem('gh-site-exam-inflight-v1', record);
      const { unmount } = render(<ExamRunner examId="gh900-mock-a" />);
      // Rejected shapes restart at begin; they never reach the sitting.
      expect(screen.getByText('Before you begin')).toBeTruthy();
      expect(screen.queryByRole('timer')).toBeNull();
      unmount();
    }
    window.localStorage.removeItem('gh-site-exam-inflight-v1');
  });

  it('flags a question for review from the runner', () => {
    render(<ExamRunner examId="gh900-mock-b" />);
    fireEvent.click(screen.getByRole('button', { name: /Begin — 100 minutes/ }));
    const flag = screen.getByRole('button', { name: 'Flag for review' });
    fireEvent.click(flag);
    expect(screen.getByRole('button', { name: 'Flagged' })).toBeTruthy();
    // The navigator marks question 1 as flagged.
    expect(screen.getByRole('button', { name: /Question 1, flagged/ })).toBeTruthy();
  });
});
