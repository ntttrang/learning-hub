import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Comparison } from '../../sdk/types';
import { registeredBlockKinds, renderBlock } from '../../sdk/registry/blocks';
// The module under test — importing it IS the registration side effect.
import './renderers';

/* The figure renderer lazily imports mermaid; in jsdom the boundary is always
 * mocked (the real library cannot run there — see Mermaid.test.tsx). */
vi.mock('mermaid', () => ({
  default: {
    initialize: () => undefined,
    render: async () => ({ svg: '<svg data-testid="mermaid-svg">diagram</svg>' }),
  },
}));

function draw(block: Parameters<typeof renderBlock>[0]) {
  return render(<div data-testid="host">{renderBlock(block)}</div>);
}

/* ---------------------------------- tests ---------------------------------- */

describe('dp-800 block renderers', () => {
  it('registers exactly the seven extension kinds without touching core kinds', () => {
    const kinds = registeredBlockKinds();
    for (const kind of [
      'objectives',
      'keyTerms',
      'sourced',
      'figure',
      'sideBySide',
      'mistakes',
      'examTips',
    ]) {
      expect(kinds).toContain(kind);
    }
    // Core ids are structurally disjoint from the seven (CORE_BLOCK_KINDS in
    // sdk/validate.ts); this only pins that they remain present in the
    // registry — a same-id overwrite would need a dedicated fixture to catch.
    for (const core of ['md', 'heading', 'list', 'code', 'tip', 'table']) {
      expect(kinds).toContain(core);
    }
  });

  it('objectives: renders the donor section title and every item', () => {
    draw({ kind: 'objectives', items: ['Model star schemas', 'Choose a distribution style'] });
    expect(screen.getByRole('heading', { name: 'Learning objectives' })).toBeInTheDocument();
    const list = screen.getByLabelText('Learning objectives');
    expect(list.textContent).toContain('Model star schemas');
    expect(list.textContent).toContain('Choose a distribution style');
  });

  it('keyTerms: renders the donor section title and term/definition cards', () => {
    draw({
      kind: 'keyTerms',
      terms: [
        { term: 'Star schema', definition: 'Fact table surrounded by dimensions.' },
        { term: 'Distribution', definition: 'How rows spread across nodes.' },
      ],
    });
    expect(screen.getByRole('heading', { name: 'Key terminology' })).toBeInTheDocument();
    const section = screen.getByLabelText('Key terminology');
    expect(section.textContent).toContain('Star schema');
    expect(section.textContent).toContain('How rows spread across nodes.');
  });

  it('sourced: renders each of the four source badges, with and without a heading', () => {
    const cases: [source: string, label: string][] = [
      ['official', 'Official Microsoft'],
      ['explanation', 'Explanation'],
      ['recommendation', 'Recommendation'],
      ['examTip', 'Exam tip'],
    ];
    for (const [source, label] of cases) {
      const { unmount } = draw({
        kind: 'sourced',
        source,
        heading: source === 'official' ? 'Docs say' : undefined,
        body: `Body for ${source}.`,
      });
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(`Body for ${source}.`)).toBeInTheDocument();
      if (source === 'official') {
        expect(screen.getByText('Docs say')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Docs say')).toBeNull();
      }
      unmount();
    }
  });

  it('figure without mermaid: caption only, no diagram and no fallback source', () => {
    draw({ kind: 'figure', caption: 'Layers of the medallion architecture.' });
    expect(screen.getByRole('heading', { name: 'Visual explanation' })).toBeInTheDocument();
    expect(screen.getByText('Layers of the medallion architecture.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Diagram source')).toBeNull();
  });

  it('figure with mermaid: renders the diagram above the caption', async () => {
    draw({ kind: 'figure', caption: 'Bronze → Silver → Gold.', mermaid: 'flowchart LR\n  A --> B' });
    expect(screen.getByRole('heading', { name: 'Visual explanation' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('mermaid-svg')).toBeInTheDocument();
    });
    expect(screen.getByText('Bronze → Silver → Gold.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Diagram source')).toBeNull();
  });

  it('sideBySide: renders table, sample tabs, and the full migration grid through the shared body', () => {
    const comparison: Comparison = {
      id: 'cmp-inline',
      title: 'Inline comparison',
      columns: [
        { id: 'mssql', label: 'Microsoft SQL' },
        { id: 'fabric', label: 'Fabric Warehouse' },
      ],
      rows: [
        { aspect: 'Table creation', cells: { mssql: 'CREATE TABLE', fabric: 'CREATE TABLE AS SELECT' } },
        { aspect: 'Distribution', cells: { fabric: 'HASH / REPLICATE / ROUND_ROBIN' } },
      ],
      samples: [
        {
          label: 'Count rows',
          code: { mssql: 'SELECT COUNT(*) FROM t;', fabric: 'SELECT COUNT(*) FROM t;' },
        },
      ],
      migration: {
        equivalent: 'Both count rows.',
        different: 'Distribution options.',
        directMigration: 'Mostly.',
        syntaxChanges: 'CTAS instead of INSERT SELECT.',
        limitations: 'No in-place ALTER on distribution.',
        whenToUse: 'Fabric for lakehouse scale.',
      },
    };
    const { container } = draw({ kind: 'sideBySide', comparison });

    // Table through the same body the Compare page uses.
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Table creation/ }).textContent).toContain('CREATE TABLE');
    expect(screen.getByRole('row', { name: /Distribution/ }).textContent).toContain('—'); // mssql cell missing

    // Sample tabs.
    expect(screen.getAllByRole('tab').map((t) => t.textContent).join('|')).toBe(
      'Microsoft SQL|Fabric Warehouse',
    );
    expect(container.textContent).toContain('SELECT COUNT(*) FROM t;');

    // Full six-field migration grid.
    expect(screen.getByText('Migration guidance')).toBeInTheDocument();
    for (const body of [
      'Both count rows.',
      'Distribution options.',
      'Mostly.',
      'CTAS instead of INSERT SELECT.',
      'No in-place ALTER on distribution.',
      'Fabric for lakehouse scale.',
    ]) {
      expect(screen.getByText(body)).toBeInTheDocument();
    }
  });

  it('mistakes: multi-item pairs under the donor section title with Fix labels', () => {
    draw({
      kind: 'mistakes',
      items: [
        { mistake: 'Using ROUND_ROBIN by default', fix: 'Pick HASH on the join key.' },
        { mistake: 'Treating views as materialized', fix: 'Materialize with CTAS.' },
      ],
    });
    expect(screen.getByRole('heading', { name: 'Common mistakes' })).toBeInTheDocument();
    const section = screen.getByLabelText('Common mistakes');
    expect(section.textContent).toContain('Using ROUND_ROBIN by default');
    expect(section.textContent).toContain('Pick HASH on the join key.');
    expect(screen.getAllByText('Fix:')).toHaveLength(2);
  });

  it('examTips: renders the donor section title and every tip', () => {
    draw({ kind: 'examTips', tips: ['HASH wins for large joins.', 'CTAS is the migration verb.'] });
    expect(screen.getByRole('heading', { name: 'Exam tips' })).toBeInTheDocument();
    const section = screen.getByLabelText('Exam tips');
    expect(section.textContent).toContain('HASH wins for large joins.');
    expect(section.textContent).toContain('CTAS is the migration verb.');
  });

  it('tolerates unknown fields on extension payloads — the shapes are open', () => {
    draw({
      kind: 'objectives',
      items: ['One objective'],
      futureField: 'added by a later pack revision',
    });
    expect(screen.getByText('One objective')).toBeInTheDocument();
  });
});
