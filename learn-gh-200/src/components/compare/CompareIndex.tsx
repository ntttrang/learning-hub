import { useState } from 'react';
import { COMPARISONS } from '../../content/compare';
import { DataTable } from '../ui/DataTable';

/**
 * Compare landing page: a segmented switch between the two comparison
 * tables, each rendered by the generic DataTable. Every claim inside a
 * cell carries its own doc link, so the table doubles as a reading list.
 */
export function CompareIndex() {
  const [activeId, setActiveId] = useState(COMPARISONS[0]!.id);
  const active = COMPARISONS.find((comparison) => comparison.id === activeId) ?? COMPARISONS[0]!;

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Compare</span>
        <h2>Actions vs the classics</h2>
        <p className="lead">
          GitHub Actions beside two established ways to run a pipeline — Jenkins,
          and the AWS CI/CD family. Each row cites the vendor doc it rests on,
          and each table closes with when the tool fits, not who wins.
        </p>
      </div>

      <div className="compare-switch" role="group" aria-label="Choose a comparison">
        {COMPARISONS.map((comparison) => (
          <button
            key={comparison.id}
            type="button"
            aria-pressed={comparison.id === active.id}
            onClick={() => setActiveId(comparison.id)}
          >
            vs {comparison.counterpart}
          </button>
        ))}
      </div>

      <section aria-label={active.title}>
        <p className="lead compare-intro">{active.description}</p>
        <DataTable
          caption={active.title}
          headers={['Dimension', 'GitHub Actions', active.counterpart]}
          rows={active.rows.map((row) => [row.dimension, row.github, row.other])}
        />
      </section>
    </>
  );
}
