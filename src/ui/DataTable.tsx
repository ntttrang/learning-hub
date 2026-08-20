import { InlineText } from './InlineText';

interface DataTableProps {
  headers: string[];
  rows: string[][];
  /** Accessible caption announced before the header row. */
  caption?: string;
}

/**
 * Lesson and comparison tables, ported from the gh-200 donor. Sharp corners
 * per the clay rule — tables and code are the two exceptions. Cells run
 * through the inline renderer so `code` and doc links work inside tables.
 * Ragged rows are normalized to the header width — a short row pads, an
 * overlong row truncates, and neither crashes the lesson.
 */
export function DataTable({ headers, rows, caption }: DataTableProps) {
  const safeRows = rows.map((row) => {
    const copy = row.slice(0, headers.length);
    while (copy.length < headers.length) copy.push('');
    return copy;
  });

  return (
    <div className="table-scroll">
      <table className="data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`col-${index}`} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    <InlineText text={cell} />
                  </th>
                ) : (
                  <td key={cellIndex}>
                    <InlineText text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
