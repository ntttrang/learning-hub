import { GitCompareArrows } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import type { SubjectContent } from '../content/registry';
import type { Comparison } from '../sdk/types';
import { CodeBlock } from './CodeBlock';
import { EmptyState } from './EmptyState';
import { InlineText } from './InlineText';
import { Pill } from './Pill';

interface CompareProps {
  subjectId: string;
  content: SubjectContent;
  /** Route segment: comparison id. Omitted shows a picker (or the only one). */
  id?: string;
}

/**
 * Side-by-side comparisons: N-column aspect table from the unified schema,
 * tabbed code samples keyed by column, and the six-card migration grid when
 * the pack carries one. Any column count renders — nothing is engine-coded.
 */
export function Compare({ subjectId, content, id }: CompareProps) {
  const comparisons = content.comparisons;

  if (comparisons.length === 0) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="No comparisons in this pack yet"
        message="This subject ships no side-by-side comparisons — the mode stays honest about it until content lands."
      />
    );
  }

  const active =
    comparisons.find((cmp) => cmp.id === id) ??
    (comparisons.length === 1 ? comparisons[0] : undefined);

  if (!active) {
    return <ComparePicker subjectId={subjectId} comparisons={comparisons} />;
  }

  return (
    <article className="cmp">
      <a className="back-link" href={`#/subject/${subjectId}/compare`}>
        ← All comparisons
      </a>
      <header className="lesson-head">
        <h2 className="lesson-title">{active.title}</h2>
        {active.description && <p className="lesson-summary">{active.description}</p>}
      </header>

      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              <th scope="col">Aspect</th>
              {active.columns.map((column) => (
                <th key={column.id} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.rows.map((row) => (
              <tr key={row.aspect}>
                <th scope="row">{row.aspect}</th>
                {active.columns.map((column) => (
                  <td key={column.id}>
                    <InlineText text={row.cells[column.id] ?? '—'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active.samples && active.samples.length > 0 && (
        <section className="cmp-samples" aria-label="Code samples">
          {active.samples.map((sample) => (
            <SampleTabs key={sample.label} sample={sample} columns={active.columns} />
          ))}
        </section>
      )}

      {active.migration && <MigrationCards migration={active.migration} />}
    </article>
  );
}

/** Landing list when the pack carries more than one comparison. */
function ComparePicker({ subjectId, comparisons }: { subjectId: string; comparisons: Comparison[] }) {
  return (
    <div className="cmp-picker">
      <p className="practice-lead">Pick a comparison to open.</p>
      <div className="practice-grid">
        {comparisons.map((cmp) => (
          <a
            key={cmp.id}
            className="practice-card"
            href={`#/subject/${subjectId}/compare/${cmp.id}`}
          >
            <div className="practice-card-head">
              <h3 className="practice-card-title">{cmp.title}</h3>
              <Pill tone="accent">{cmp.columns.length} ways</Pill>
            </div>
            <p>{cmp.description ?? `${cmp.rows.length} aspects compared.`}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

/** One sample: tabs per column that has code, CodeBlock under the active tab. */
function SampleTabs({
  sample,
  columns,
}: {
  sample: NonNullable<Comparison['samples']>[number];
  columns: Comparison['columns'];
}) {
  const available = columns.filter((column) => sample.code[column.id]);
  const [activeId, setActiveId] = useState(available[0]?.id ?? '');

  const tabRefs = new Map<string, HTMLButtonElement>();

  // ARIA tabs pattern: arrow keys move selection with focus (one tab stop).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = available.findIndex((column) => column.id === activeId);
    if (current === -1) return;
    const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (dir === 0) return;
    event.preventDefault();
    const nextTab = available[(current + dir + available.length) % available.length];
    setActiveId(nextTab.id);
    tabRefs.get(nextTab.id)?.focus();
  };

  return (
    <div className="cmp-sample">
      <p className="cmp-sample-label">{sample.label}</p>
      <div className="cmp-tabs" role="tablist" aria-label={sample.label} onKeyDown={onKeyDown}>
        {available.map((column) => (
          <button
            key={column.id}
            type="button"
            role="tab"
            aria-selected={column.id === activeId}
            className={`cmp-tab${column.id === activeId ? ' on' : ''}`}
            onClick={() => setActiveId(column.id)}
            ref={(node) => {
              if (node) tabRefs.set(column.id, node);
            }}
          >
            {column.label}
          </button>
        ))}
      </div>
      {sample.code[activeId] && (
        <CodeBlock code={sample.code[activeId]} language="sql" label={available.find((c) => c.id === activeId)?.label} />
      )}
    </div>
  );
}

/** DP-800's six migration-guidance cards; each card renders only real text. */
function MigrationCards({ migration }: { migration: NonNullable<Comparison['migration']> }) {
  const cards: [label: string, body: string][] = [
    ["What's equivalent", migration.equivalent],
    ["What's different", migration.different],
    ['Direct migration?', migration.directMigration],
    ['Syntax changes', migration.syntaxChanges],
    ['Limitations', migration.limitations],
    ['When to use each', migration.whenToUse],
  ];
  return (
    <section className="cmp-migration" aria-label="Migration guidance">
      <h3 className="lab-section-title">Migration guidance</h3>
      <div className="cmp-migration-grid">
        {cards.map(([label, body]) => (
          <div key={label} className="cmp-migration-card">
            <p className="cmp-migration-label">{label}</p>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
