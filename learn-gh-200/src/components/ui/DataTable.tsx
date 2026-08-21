import { InlineText } from './InlineText';

interface DataTableProps {
  headers: string[];
  rows: string[][];
  /** Accessible caption announced before the header row. */
  caption?: string;
}

/**
 * Lesson and comparison tables. Sharp 90° corners per the clay rule — tables
 * and code are the two exceptions. Cells run through the inline renderer so
 * `code` and doc links work inside tables too.
 */
export function DataTable({ headers, rows, caption }: DataTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
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
