import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { loadSubjectWithIndex } from '../content/registry';
import type { Comparison, SubjectContent } from '../sdk/types';
import { Compare } from './Compare';

const { content } = loadSubjectWithIndex('fixture');

function draw(id?: string, pack: SubjectContent = content) {
  return render(<Compare subjectId="fixture" content={pack} id={id} />);
}

/* ---------------------------------- tests ---------------------------------- */

describe('Compare', () => {
  it('renders the fixture’s 3-column table and tabbed sample without migration', () => {
    const { container } = draw(); // single comparison auto-selects

    // Column headers + aspect rows.
    const table = screen.getByRole('table');
    expect(table.textContent).toContain('PostgreSQL');
    expect(table.textContent).toContain('Fabric Warehouse');
    expect(table.textContent).toContain('DuckDB');
    expect(screen.getByRole('row', { name: /Primary niche/ }).textContent).toContain(
      'Single-node embedded analytics',
    );

    // Sample tabs: first column selected, others switch the code.
    expect(screen.getByText('Count rows in a Parquet file')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent).join('|')).toBe(
      'PostgreSQL|Fabric Warehouse|DuckDB',
    );
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(container.textContent).toContain("FROM parquet_fdw('trips.parquet')"); // postgres first

    fireEvent.click(screen.getByRole('tab', { name: 'Fabric Warehouse' }));
    expect(container.textContent).toContain('OPENROWSET');

    // ARIA tabs pattern: arrow keys move selection and DOM focus together.
    fireEvent.keyDown(screen.getByRole('tablist', { name: 'Count rows in a Parquet file' }), {
      key: 'ArrowRight',
    });
    const focused = document.activeElement;
    expect(focused?.getAttribute('aria-selected')).toBe('true');
    expect(focused?.textContent).toBe('DuckDB');
    expect(container.textContent).toContain("FROM 'trips.parquet'");

    // The fixture comparison carries no migration block.
    expect(screen.queryByText('Migration guidance')).toBeNull();
  });

  it('shows a picker when the pack carries several comparisons', () => {
    const second: Comparison = {
      id: 'cmp-two',
      title: 'Second comparison',
      columns: [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ],
      rows: [{ aspect: 'Only aspect', cells: { a: 'one' } }], // b missing → em dash
    };
    const pack: SubjectContent = { ...content, comparisons: [content.comparisons[0], second] };

    draw(undefined, pack);
    const card = screen.getByRole('link', { name: /Second comparison/ });
    expect(card.getAttribute('href')).toBe('#/subject/fixture/compare/cmp-two');

    // Deep link straight to it: the missing cell renders an em dash.
    const { unmount } = draw('cmp-two', pack);
    expect(screen.getByRole('row', { name: /Only aspect/ }).textContent).toContain('—');
    unmount();
  });

  it('renders migration guidance cards when the pack carries one', () => {
    const pack: SubjectContent = {
      ...content,
      comparisons: [
        {
          ...content.comparisons[0],
          migration: {
            equivalent: 'Both read files.',
            different: 'Different planners.',
            directMigration: 'Yes.',
            syntaxChanges: 'Minor.',
            limitations: 'None.',
            whenToUse: 'Depends.',
          },
        },
      ],
    };
    draw(undefined, pack);
    expect(screen.getByText('Migration guidance')).toBeInTheDocument();
    expect(screen.getByText('Both read files.')).toBeInTheDocument();
    expect(screen.getByText('When to use each')).toBeInTheDocument();
  });

  it('renders an honest empty state when the pack has no comparisons', () => {
    const pack: SubjectContent = { ...content, comparisons: [] };
    draw(undefined, pack);
    expect(screen.getByText('No comparisons in this pack yet')).toBeInTheDocument();
  });
});
