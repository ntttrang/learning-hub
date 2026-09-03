import { useEffect, useState } from 'react';
import { CompareTable } from '../components/CompareTable';
import { loadCompare } from '../lib/data';
import type { CompareTopic } from '../lib/types';

export function Compare() {
  const [topics, setTopics] = useState<CompareTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadCompare()
      .then((file) => {
        if (!cancelled) setTopics(file.topics);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <p className="kicker">Compare</p>
        <h1>Languages side by side</h1>
        <p className="muted">
          Mental models across Java, Go, Python, and Ruby — loaded from `/data/compare/topics.json`.
        </p>
      </div>

      {loading && <div className="loading">Loading comparisons…</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && <CompareTable topics={topics} />}
    </div>
  );
}
