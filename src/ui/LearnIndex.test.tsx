import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import { createSubjectIndex } from '../sdk/content-source';
import type { Domain, Lesson, SubjectContent } from '../sdk/types';
import { LearnIndex } from './LearnIndex';

/* ------------------------------- the real pack ------------------------------ */

// The on-disk fixture pack, loaded through the same source the app uses —
// the index renders whatever a pack carries, so prove it on real content.
const { content, index } = loadSubjectWithIndex('fixture');

function draw() {
  return render(<LearnIndex subjectId="fixture" content={content} index={index} />);
}

afterEach(() => {
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

/* ---------------------------------- tests ---------------------------------- */

describe('LearnIndex', () => {
  it('renders the fixture curriculum: domains, weights, skills, and lesson rows', () => {
    draw();

    // Domains in registry order, weights from both schema shapes.
    expect(screen.getByRole('heading', { name: 'Core concepts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Applied skills' })).toBeInTheDocument();
    expect(screen.getByText('Weight 35-40%')).toBeInTheDocument(); // string weight
    expect(screen.getByText('Weight 20–25%')).toBeInTheDocument(); // min/max weight

    // Module metadata: official skills + lab/question counts.
    expect(screen.getByText('Describe storage models for analytical workloads')).toBeInTheDocument();
    expect(screen.getByText('1 lab · 3 questions')).toBeInTheDocument();
    expect(screen.getByText('1 question')).toBeInTheDocument();

    // Lesson rows link by slug and carry their meta.
    const storage = screen.getByRole('link', { name: /Storage models/ });
    expect(storage.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    expect(storage.textContent).toContain('Flagship');
    expect(storage.textContent).toContain('beginner');
    expect(storage.textContent).toContain('12 min');
    expect(screen.getByRole('link', { name: /Query shapes/ }).getAttribute('href')).toBe(
      '#/subject/fixture/learn/query-shapes',
    );
  });

  it('shows the continue card for the last visited lesson', () => {
    useSubjectDataStore.getState().visitLesson('fixture', 'lesson-query-shapes');
    draw();

    const card = screen.getByRole('link', { name: /Continue where you left off/ });
    expect(card.getAttribute('href')).toBe('#/subject/fixture/learn/query-shapes');
    expect(card.textContent).toContain('Query shapes');
  });

  it('ticks lessons the store marks completed', () => {
    useSubjectDataStore.getState().markLesson('fixture', 'lesson-storage-models', 'completed');
    const { container } = draw();

    const rows = container.querySelectorAll('.learn-row');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('.learn-tick.done')).not.toBeNull();
    expect(rows[1].querySelector('.learn-tick.done')).toBeNull();
  });

  it('renders orphan lessons (no module) under their domain, linking by id', () => {
    const orphan: Lesson = {
      id: 'lesson-orphan',
      domainId: 'd1',
      order: 9,
      title: 'Orphan lesson',
      summary: 'No module claims this one.',
      minutes: 4,
      blocks: [{ kind: 'md', body: 'A lesson can stand alone.' }],
    };
    const ghost: Domain = { id: 'd3', order: 3, title: 'Empty domain', code: 'D3' };
    const pack: SubjectContent = {
      ...content,
      domains: [...content.domains, ghost],
      lessons: [...content.lessons, orphan],
    };
    render(<LearnIndex subjectId="fixture" content={pack} index={createSubjectIndex(pack)} />);

    const row = screen.getByRole('link', { name: /Orphan lesson/ });
    expect(row.getAttribute('href')).toBe('#/subject/fixture/learn/lesson-orphan'); // slugless → id
    expect(row.textContent).toContain('4 min');

    // A domain with no modules and no lessons renders nothing at all.
    expect(screen.queryByText('Empty domain')).toBeNull();
  });

  it('renders an honest empty state when the pack has no lessons', () => {
    const empty: SubjectContent = { ...content, lessons: [] };
    render(<LearnIndex subjectId="fixture" content={empty} index={createSubjectIndex(empty)} />);
    expect(screen.getByText('No lessons in this pack yet')).toBeInTheDocument();
  });
});
