import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import { useSubjectDataStore } from '../engines/subject-store';
import { createSubjectIndex } from '../sdk/content-source';
import type { SubjectContent } from '../sdk/types';
import { DocResolverProvider, registryResolver } from './doc-context';
import { LessonViewer } from './LessonViewer';

/* ------------------------------- the real pack ------------------------------ */

// The fixture pack carries one .mdx lesson (frontmatter + markdown body) and
// one JSON lesson (registered block kinds) — both must render through the
// same viewer, proving the Phase 3 pipeline feeds the Phase 5 viewer.
const { content, index } = loadSubjectWithIndex('fixture');

function draw(id: string) {
  const view = render(
    <DocResolverProvider resolveDoc={registryResolver(content.docs)}>
      <LessonViewer subjectId="fixture" content={content} index={index} id={id} />
    </DocResolverProvider>,
  );
  return view;
}

afterEach(() => {
  vi.restoreAllMocks();
  const { fixture: _drop, ...subjects } = useSubjectDataStore.getState().subjects;
  useSubjectDataStore.setState({ subjects });
  window.localStorage.clear();
});

/* ---------------------------------- tests ---------------------------------- */

describe('LessonViewer', () => {
  it('renders the mdx lesson end to end: body, check, lab link, references, visit', () => {
    draw('storage-models');

    // Markdown body flows through the block pipeline.
    expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument();
    expect(screen.getByText(/where do the bytes live\?/)).toBeInTheDocument();

    // Breadcrumb names the domain.
    expect(screen.getByText('Core concepts')).toBeInTheDocument();

    // Knowledge check mounts with the lesson's three questions. The section
    // heading and the runner title share the label, so pin the section level.
    expect(screen.getByRole('heading', { name: 'Knowledge check', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();

    // Lab card, external reference, and resolved doc chip.
    expect(screen.getByRole('link', { name: /Explore a lakehouse table/ }).getAttribute('href')).toBe(
      '#/subject/fixture/labs/lab-explore',
    );
    expect(screen.getByRole('link', { name: 'Lakehouse docs' }).getAttribute('href')).toBe(
      'https://example.com/docs/lakehouse',
    );
    expect(
      screen.getByRole('link', { name: 'Lakehouse architecture documentation' }).getAttribute('href'),
    ).toBe('https://example.com/docs/lakehouse');

    // The mount effect recorded the visit.
    expect(useSubjectDataStore.getState().subjects.fixture?.lastLessonId).toBe(
      'lesson-storage-models',
    );
  });

  it('renders the JSON lesson’s registered block kinds', () => {
    const { container } = draw('query-shapes');

    expect(screen.getByRole('heading', { name: 'The analytic core' })).toBeInTheDocument();
    expect(screen.getByText('Aggregate — collapse rows into a metric')).toBeInTheDocument(); // list item
    expect(screen.getByText(/Filter before you aggregate/)).toBeInTheDocument(); // tip
    expect(screen.getByText('Shape')).toBeInTheDocument(); // table header
    expect(screen.getByText('How many per group?')).toBeInTheDocument(); // table cell
    // hljs token spans split code text, so assert on the aggregated text.
    expect(container.textContent).toContain('GROUP BY city');
    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument(); // single-question check
    // This lesson owns no lab — no orphan lab card may render.
    expect(screen.queryByRole('link', { name: /^Lab:/ })).toBeNull();
  });

  it('records the knowledge-check attempt scoped to the lesson’s module', () => {
    // 0.99 keeps the Fisher–Yates shuffle from reordering the three questions.
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    draw('storage-models');

    // Embedded check, not a practice run: no scope back-link inside the lesson.
    expect(screen.queryByRole('link', { name: '← All scopes' })).toBeNull();

    // q-single: files in object storage.
    fireEvent.click(screen.getByRole('button', { name: 'Files in object storage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    // q-multi: Parquet + Delta.
    fireEvent.click(screen.getByRole('button', { name: 'Parquet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    // q-order: the seeded order (bronze, silver, gold) is already correct.
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See results' }));

    // Embedded finish screens have nowhere to go "back" to — no dead button.
    expect(screen.queryByRole('button', { name: 'Back to practice' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Practice again' })).toBeInTheDocument();

    expect(screen.getByText('3 of 3 correct (100%)')).toBeInTheDocument();
    const attempts = useSubjectDataStore.getState().subjects.fixture?.quizAttempts ?? [];
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ scope: 'm-storage', total: 3, correct: 3 });
    expect(attempts[0].questionResults.map((r) => r.questionId)).toEqual([
      'q-single',
      'q-multi',
      'q-order',
    ]);
  });

  it('keeps the knowledge check on its question across store-driven re-renders', () => {
    // A bookmark toggle re-renders the lesson; the check's question bank must
    // keep its identity or QuizRunner reshuffles mid-run. Flip the shuffle
    // seed after mount — a stable bank ignores it entirely.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    draw('storage-models');
    expect(screen.getByText('In a lakehouse, what physically stores the data?')).toBeInTheDocument();

    random.mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: /Bookmark/ }));
    expect(screen.getByText('In a lakehouse, what physically stores the data?')).toBeInTheDocument();
  });

  it('drops the References section when the single-href policy filters everything out', () => {
    // A lesson whose only reference is a non-http url and whose docId resolves
    // to nothing: no link survives the policy filter, so no empty header may
    // render — the same guarantee plain labs already have.
    const pack: SubjectContent = {
      ...content,
      lessons: content.lessons.map((lesson) =>
        lesson.id === 'lesson-storage-models'
          ? {
              ...lesson,
              references: [{ title: 'Sketchy ref', url: 'javascript:alert(1)' }],
              docIds: ['missing-doc'],
            }
          : lesson,
      ),
    };
    render(
      <DocResolverProvider resolveDoc={registryResolver(pack.docs)}>
        <LessonViewer subjectId="fixture" content={pack} index={createSubjectIndex(pack)} id="storage-models" />
      </DocResolverProvider>,
    );

    expect(screen.queryByRole('heading', { name: 'References' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Sketchy ref' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument(); // body intact
  });

  it('resolves a lesson by raw id when the slug lookup misses', () => {
    draw('lesson-storage-models');
    expect(screen.getByRole('heading', { name: 'Storage models', level: 2 })).toBeInTheDocument();
  });

  it('persists bookmark and completion through the store', () => {
    draw('storage-models');

    const bookmark = screen.getByRole('button', { name: /Bookmark/ });
    expect(bookmark.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(bookmark);
    expect(bookmark.getAttribute('aria-pressed')).toBe('true');
    expect(useSubjectDataStore.getState().subjects.fixture?.bookmarks).toContain(
      'lesson-storage-models',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark as completed' }));
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(
      useSubjectDataStore.getState().subjects.fixture?.lessons['lesson-storage-models']?.status,
    ).toBe('completed');

    fireEvent.click(screen.getByRole('button', { name: 'Mark as in progress' }));
    expect(
      useSubjectDataStore.getState().subjects.fixture?.lessons['lesson-storage-models']?.status,
    ).toBe('in-progress');
  });

  it('walks prev/next along the lesson sequence', () => {
    const first = draw('storage-models');
    const next = screen.getByRole('link', { name: /Next/ });
    expect(next.getAttribute('href')).toBe('#/subject/fixture/learn/query-shapes');
    expect(screen.queryByText('Previous')).toBeNull();
    first.unmount();

    draw('query-shapes');
    const prev = screen.getByRole('link', { name: /Previous/ });
    expect(prev.getAttribute('href')).toBe('#/subject/fixture/learn/storage-models');
    expect(screen.queryByText('Next')).toBeNull();
  });

  it('falls back honestly for an unknown lesson id', () => {
    draw('nope');
    expect(screen.getByText('No such lesson')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Learn' }).getAttribute('href')).toBe(
      '#/subject/fixture/learn',
    );
  });
});
