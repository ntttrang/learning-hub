/**
 * dp-800 surface smokes: one render + presence assertions per mode against
 * the real extracted pack. The LessonViewer test is the payload contract
 * between extractor and renderers — Zod is payload-blind for the extension
 * kinds and the coverage gate resolves kind strings only, so nothing else
 * catches a one-word field-name slip between the two sides. Generic per-mode
 * behavior stays covered by the fixture-based component tests; assert
 * presence and content here, not styling.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assemblePaper } from '../engines/exam-paper';
import { useSubjectDataStore } from '../engines/subject-store';
import type { Question } from '../sdk/types';
import { Compare } from '../ui/Compare';
import { DocResolverProvider, registryResolver } from '../ui/doc-context';
import { ExamEngine } from '../ui/ExamEngine';
import { LabViewer } from '../ui/LabViewer';
import { LessonViewer } from '../ui/LessonViewer';
import { PracticeIndex } from '../ui/PracticeIndex';
import { loadSubjectWithIndex } from './registry';
// The dp-800 extension renderers register through this side-effect import.
import './dp-800/renderers';

/* The figure renderer lazily imports mermaid; jsdom always mocks the
 * boundary (the real library cannot run there — see Mermaid.test.tsx). */
vi.mock('mermaid', () => ({
  default: {
    initialize: () => undefined,
    render: async () => ({ svg: '<svg data-testid="mermaid-svg">diagram</svg>' }),
  },
}));

const { content, index } = loadSubjectWithIndex('dp-800');

afterEach(() => {
  const { 'dp-800': _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

/* --------------------------- payload contract ------------------------------ */

describe('dp-800 lesson payload contract', () => {
  it('l0103 renders every donor section through the extension renderers', () => {
    const { container } = render(
      <DocResolverProvider resolveDoc={registryResolver(content.docs)}>
        <LessonViewer subjectId="dp-800" content={content} index={index} id="l0103" />
      </DocResolverProvider>,
    );
    const text = container.textContent ?? '';

    // Titled sections in the donor viewer's fixed order.
    for (const title of [
      'Learning objectives',
      'Overview',
      'Key terminology',
      'Official Microsoft concepts',
      'Microsoft SQL implementation',
      'Cross-database comparison',
      'Real-world scenario',
      'Performance & security considerations',
      'Summary',
    ]) {
      expect(screen.getAllByRole('heading', { name: title }).length, title).toBeGreaterThan(0);
    }

    // One probe per extension kind — the extractor↔renderer field contract.
    expect(screen.getByLabelText('Learning objectives').textContent).toContain(
      'Store JSON in SQL Server using the native',
    );
    expect(screen.getByLabelText('Key terminology').textContent).toContain('json data type');
    expect(text).toContain('SQL Server 2025 introduces the native'); // sourced body
    expect(text).toContain('How OPENJSON shreds'); // figure caption
    expect(text).toContain('Native type'); // sideBySide aspect row
    expect(text).toContain('Oracle Database'); // sideBySide engine column label
    expect(text).toContain('Expecting a JSON path predicate'); // mistakes item
    expect(text).toContain('OPENJSON with an explicit WITH clause'); // exam tip
  });
});

/* ------------------------------- practice ---------------------------------- */

describe('dp-800 practice mode', () => {
  it('leads with the full 179-question bank and every module scope resolves', () => {
    const { container } = render(
      <PracticeIndex subjectId="dp-800" content={content} index={index} />,
    );

    expect(screen.getByText('179 questions')).toBeInTheDocument();
    const everything = screen.getByRole('link', { name: /Everything, shuffled/ });
    expect(everything.getAttribute('href')).toBe('#/subject/dp-800/practice/all');
    for (const domainId of ['d1', 'd2', 'd3']) {
      const link = container.querySelector(`a[href="#/subject/dp-800/practice/${domainId}"]`);
      expect(link, `domain card ${domainId}`).not.toBeNull();
    }

    // The lab-coding drill path: every module scope serves real questions.
    expect(content.modules).toHaveLength(11);
    for (const module of content.modules) {
      expect(index.questionsForModule(module.id).length, module.id).toBeGreaterThan(0);
    }
    // Module chips are spans inside the domain anchor (nested <a> is invalid);
    // the runs themselves resolve at /practice/<moduleId>.
    expect(container.textContent).toContain(content.modules[0]!.title);
  });
});

/* -------------------------------- compare ---------------------------------- */

describe('dp-800 compare mode', () => {
  it('offers all four comparisons and renders the full body of one', () => {
    // No id with several comparisons → the picker lists every entry.
    const picker = render(<Compare subjectId="dp-800" content={content} />);
    for (const id of ['cmp-json', 'cmp-identity', 'cmp-rls', 'cmp-vector']) {
      const entry = picker.container.querySelector(`a[href="#/subject/dp-800/compare/${id}"]`);
      expect(entry, `picker entry ${id}`).not.toBeNull();
    }
    picker.unmount();

    render(
      <Compare subjectId="dp-800" content={content} id="cmp-json" />,
    );

    // Four engine columns in the comparison table.
    const table = screen.getByRole('table');
    for (const label of ['Microsoft SQL', 'PostgreSQL', 'MySQL', 'Oracle Database']) {
      expect(table.textContent).toContain(label);
    }

    // Tabbed code sample, one tab per engine, in column order.
    expect(screen.getByText("Extract a scalar field 'color'")).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Microsoft SQL',
      'PostgreSQL',
      'MySQL',
      'Oracle Database',
    ]);

    // The six migration-guidance cards.
    const migration = screen.getByRole('region', { name: 'Migration guidance' });
    for (const label of [
      "What's equivalent",
      "What's different",
      'Direct migration?',
      'Syntax changes',
      'Limitations',
      'When to use each',
    ]) {
      expect(migration.textContent).toContain(label);
    }
  });
});

/* --------------------------------- exams ----------------------------------- */

describe('dp-800 exam mode', () => {
  /** Answer the currently shown question, whatever its kind on this paper. */
  function answerCurrent(question: Question) {
    if (question.kind === 'single' || question.kind === 'codeReading') {
      const option = question.options.find((candidate) => candidate.id === question.correct)!;
      fireEvent.click(screen.getByRole('button', { name: option.text }));
      return;
    }
    if (question.kind === 'multi') {
      for (const id of question.correct) {
        const option = question.options.find((candidate) => candidate.id === id)!;
        fireEvent.click(screen.getByRole('button', { name: option.text }));
      }
    }
  }

  it('mock-1 serves its fixed 50-question paper and mounts the case study', () => {
    render(<ExamEngine subjectId="dp-800" content={content} index={index} examId="mock-1" />);
    // The intro gate: start untimed so no wall-clock deadline arms.
    expect(screen.getByText('Before you begin')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Untimed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begin untimed' }));
    expect(screen.getByText('Question 1 of 50')).toBeInTheDocument();

    // Walk to the first case-study question (paper position 46).
    const paper = assemblePaper(content, index.getExam('mock-1')!);
    for (let position = 0; position < 45; position += 1) {
      answerCurrent(paper[position]!);
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    expect(screen.getByText('Question 46 of 50')).toBeInTheDocument();

    const panel = screen.getByRole('region', { name: /Contoso Support semantic search/ });
    expect(panel.textContent).toContain('knowledge-base articles');
  });
});

/* --------------------------------- labs ------------------------------------ */

describe('dp-800 lab mode', () => {
  it('lab-rls renders its rich surface with working reveal toggles', () => {
    const { container } = render(
      <LabViewer subjectId="dp-800" content={content} index={index} id="lab-rls" />,
    );
    // textContent is a live read — re-read after interactions, never snapshot.
    const text = () => container.textContent ?? '';

    // Scenario & objective panel with prerequisites and pretty engine labels.
    expect(text()).toContain('A SaaS app stores every customer');
    expect(text()).toContain('Implement an RLS predicate function');
    expect(screen.getByText('Prerequisites')).toBeInTheDocument();
    expect(text()).toContain('A running SQL Server 2025 container.');
    expect(screen.getByText('Runs on: Microsoft SQL, PostgreSQL, Oracle Database')).toBeInTheDocument();

    // Schema and seed code.
    expect(text()).toContain('CREATE TABLE dbo.Orders');
    expect(text()).toContain('INSERT dbo.Orders (TenantId, Product, Amount)');

    // All four steps, titled.
    for (const title of [
      'Beginner — set the tenant context (guided)',
      'Intermediate — create the predicate function (complete the SQL)',
      'Advanced — bind the policy and verify isolation (solve independently)',
      'Challenge — port the policy to PostgreSQL',
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }

    // Reveal toggles disclose content; steps 2-4 carry hint and solution.
    expect(screen.getAllByRole('button', { name: 'Show hint' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Reveal solution' })).toHaveLength(3);
    expect(text()).not.toContain('The function that returns the current principal id');
    fireEvent.click(screen.getAllByRole('button', { name: 'Show hint' })[0]!);
    expect(text()).toContain('The function that returns the current principal id');
    fireEvent.click(screen.getAllByRole('button', { name: 'Reveal solution' })[0]!);
    expect(screen.getAllByRole('button', { name: 'Hide solution' })[0]!).toBeInTheDocument();

    // Engine notes with pretty labels, and the solution explanation.
    expect(screen.getByText('Other engines')).toBeInTheDocument();
    expect(screen.getByText('Solution explanation')).toBeInTheDocument();
    expect(text()).toContain('RLS pushes tenant isolation into the engine');

    expect(screen.getByRole('button', { name: 'Mark lab complete' })).toBeInTheDocument();
  });
});
