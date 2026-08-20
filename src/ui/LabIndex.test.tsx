import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent } from '../sdk/types';
import { createSubjectIndex } from '../sdk/content-source';
import { LabIndex } from './LabIndex';

const { content, index } = loadSubjectWithIndex('fixture');

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

describe('LabIndex', () => {
  it('cards link to the lab, show meta, and back-link to the owning lesson', () => {
    render(<LabIndex subjectId="fixture" content={content} index={index} />);

    const title = screen.getByRole('link', { name: 'Explore a lakehouse table' });
    expect(title.getAttribute('href')).toBe('#/subject/fixture/labs/lab-explore');
    expect(screen.getByText(/Query files through table semantics/)).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('beginner')).toBeInTheDocument();

    const lessonLink = screen.getByRole('link', { name: 'Lesson: Storage models' });
    expect(lessonLink.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
  });

  it('swaps the minutes pill for a completed pill once completeLab records', () => {
    useSubjectDataStore.getState().completeLab('fixture', 'lab-explore');
    const { container } = render(<LabIndex subjectId="fixture" content={content} index={index} />);

    expect(container.querySelector('.lab-card.done')).not.toBeNull();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('20 min')).toBeNull();
  });

  it('renders an honest empty state when the pack has no labs', () => {
    const empty: SubjectContent = { ...content, labs: [] };
    render(<LabIndex subjectId="fixture" content={empty} index={createSubjectIndex(empty)} />);
    expect(screen.getByText('No labs in this pack yet')).toBeInTheDocument();
  });
});
