import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import type { Lab, SubjectContent } from '../sdk/types';
import { createSubjectIndex } from '../sdk/content-source';
import { LabViewer } from './LabViewer';

const { content, index } = loadSubjectWithIndex('fixture');

function draw(id: string, pack: SubjectContent = content, idx = index) {
  return render(<LabViewer subjectId="fixture" content={pack} index={idx} id={id} />);
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

/* ---------------------------------- tests ---------------------------------- */

describe('LabViewer', () => {
  it('renders every rich section the fixture lab carries', () => {
    const { container } = draw('lab-explore');

    // Scenario & objective panel with prereqs and engines.
    expect(screen.getByText(/dumps raw trips into the lake hourly/)).toBeInTheDocument();
    expect(screen.getByText('Prove you can read lake files through SQL.')).toBeInTheDocument();
    expect(screen.getByText('Prerequisites')).toBeInTheDocument();
    // The prereq names a lesson id — it resolves to a titled link, not raw id.
    expect(screen.queryByText('lesson-storage-models')).toBeNull();
    const prereqLink = screen.getByRole('link', { name: 'Storage models' });
    expect(prereqLink.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    // Known engines render pretty labels; unknown ids (fabric) stay raw.
    expect(screen.getByText('Runs on: PostgreSQL, fabric')).toBeInTheDocument();

    // Schema + seed code blocks (hljs splits text; assert on aggregates).
    expect(container.textContent).toContain('CREATE TABLE trips');
    expect(container.textContent).toContain('INSERT INTO trips VALUES');

    // Numbered steps with titles and instructions.
    expect(screen.getByText('Count the trips')).toBeInTheDocument();
    expect(screen.getByText('Per-city counts')).toBeInTheDocument();
    expect(screen.getByText(/Count all rows in the/)).toBeInTheDocument();
    expect(screen.getByText('Starter SQL')).toBeInTheDocument();
    expect(screen.getByText('Expected output')).toBeInTheDocument();
    expect(screen.getByText(/Exactly one row with one column/)).toBeInTheDocument();

    // Engine notes, outcomes, checks, and the explanation.
    expect(screen.getByText('Other engines')).toBeInTheDocument();
    expect(screen.getByText('Any version 14+ works for this lab.')).toBeInTheDocument();
    // Note headers use the same labels as the engines line.
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('fabric')).toBeInTheDocument();
    expect(screen.getByText('Expected outcomes')).toBeInTheDocument();
    expect(screen.getByText('Self-check')).toBeInTheDocument();
    expect(screen.getByText('Solution explanation')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Mark lab complete' })).toBeInTheDocument();
  });

  it('reveals hints and solutions only on demand', () => {
    const { container } = draw('lab-explore');

    // Both steps carry hints; step 1 is the first card in DOM order.
    expect(screen.queryByText('COUNT(*) counts every row.')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Show hint' })[0]);
    expect(screen.getByText('COUNT(*) counts every row.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Hide hint' })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Show hint' })[0]).toBeInTheDocument(); // step 2 untouched

    // Solution stays hidden until asked for, then shows its code.
    expect(container.textContent).not.toContain('SELECT COUNT(*) FROM trips;');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reveal solution' })[0]);
    expect(container.textContent).toContain('SELECT COUNT(*) FROM trips;');
    expect(screen.getAllByRole('button', { name: 'Hide solution' })[0]).toBeInTheDocument();
  });

  it('records completion through the store', () => {
    draw('lab-explore');

    fireEvent.click(screen.getByRole('button', { name: 'Mark lab complete' }));
    expect(screen.getByText('Lab completed')).toBeInTheDocument();
    expect(useSubjectDataStore.getState().subjects.fixture?.completedLabs).toContain('lab-explore');
    expect(screen.queryByRole('button', { name: 'Mark lab complete' })).toBeNull();
  });

  it('renders a plain lab without empty rich-section headers', () => {
    const plain: Lab = {
      id: 'lab-plain',
      domainId: 'd1',
      title: 'Plain lab',
      minutes: 5,
      summary: 'A gh-200-style lab: steps and nothing else.',
      steps: [{ title: 'Look around', instructions: 'List the tables.' }],
    };
    const pack: SubjectContent = { ...content, labs: [plain] };
    const { container } = draw('lab-plain', pack, createSubjectIndex(pack));

    expect(screen.getByRole('heading', { name: 'Plain lab' })).toBeInTheDocument();
    expect(screen.getByText('Look around')).toBeInTheDocument();
    expect(screen.getByText('List the tables.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark lab complete' })).toBeInTheDocument();

    // No orphan headers for sections the lab does not carry.
    expect(screen.queryByText(/Scenario & objective/)).toBeNull();
    expect(screen.queryByText(/Schema & sample data/)).toBeNull();
    expect(screen.queryByText('Other engines')).toBeNull();
    expect(screen.queryByText('Expected outcomes')).toBeNull();
    expect(screen.queryByText('Self-check')).toBeNull();
    expect(screen.queryByText('Solution explanation')).toBeNull();
    expect(container.querySelectorAll('.lab-step-actions')).toHaveLength(0); // no hint/solution buttons
  });

  it('renders free-text prerequisites as plain text, not broken links', () => {
    const advised: Lab = {
      id: 'lab-advised',
      domainId: 'd1',
      title: 'Advised lab',
      minutes: 5,
      summary: 'Prerequisites that are advice, not lesson ids.',
      prerequisites: ['Basic SQL familiarity'],
      steps: [{ instructions: 'Do the thing.' }],
    };
    const pack: SubjectContent = { ...content, labs: [advised] };
    draw('lab-advised', pack, createSubjectIndex(pack));

    expect(screen.getByText('Prerequisites')).toBeInTheDocument();
    const item = screen.getByText('Basic SQL familiarity');
    expect(item.closest('a')).toBeNull(); // advice stays text; only ids link
  });

  it('falls back honestly for an unknown lab id', () => {
    draw('nope');
    expect(screen.getByText('No such lab')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to labs' }).getAttribute('href')).toBe(
      '#/subject/fixture/labs',
    );
  });
});
