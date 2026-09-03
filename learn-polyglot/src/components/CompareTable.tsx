import { CodeBlock } from './CodeBlock';
import type { CompareTopic, LangId } from '../lib/types';

const LANGS: LangId[] = ['java', 'go', 'python', 'ruby'];
const LABELS: Record<LangId, string> = {
  java: 'Java',
  go: 'Go',
  python: 'Python',
  ruby: 'Ruby',
};

export function CompareTable({ topics }: { topics: CompareTopic[] }) {
  return (
    <div className="stack" style={{ overflowX: 'auto' }}>
      {topics.map((topic) => (
        <article key={topic.id} className="card stack">
          <div>
            <p className="kicker">{topic.dimension}</p>
            <h3>{topic.title}</h3>
          </div>
          <table className="compare-table">
            <thead>
              <tr>
                {LANGS.map((lang) => (
                  <th key={lang}>{LABELS[lang]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {LANGS.map((lang) => {
                  const cell = topic.cells[lang];
                  return (
                    <td key={lang}>
                      <p style={{ marginBottom: 0 }}>{cell.summary}</p>
                      {cell.snippet && (
                        <CodeBlock
                          language={cell.language ?? lang}
                          code={cell.snippet}
                          title="snippet"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </article>
      ))}
    </div>
  );
}
