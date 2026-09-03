import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CodeEditor } from '../components/CodeEditor';
import { Markdown } from '../components/Markdown';
import { loadPractice } from '../lib/data';
import { loadProgress, markPractice } from '../lib/progress';
import { useApp } from '../lib/AppContext';
import type { PracticeProblem } from '../lib/types';

export function Practice() {
  const { lang } = useApp();
  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setHintCount(0);
    setShowSolution(false);
    loadPractice(lang)
      .then((file) => {
        if (cancelled) return;
        setProblems(file.problems);
        const first = file.problems[0];
        setActiveId(first?.id ?? null);
        setCode(first?.starterCode ?? '');
        setDone(loadProgress().practice);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const active = problems.find((p) => p.id === activeId) ?? null;

  const select = (p: PracticeProblem) => {
    setActiveId(p.id);
    setCode(p.starterCode);
    setHintCount(0);
    setShowSolution(false);
  };

  return (
    <div>
      <div className="page-header row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Practice</p>
          <h1>Problems</h1>
          <p className="muted">Hints unlock one at a time. Solutions stay hidden until you ask.</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="split">
        <div className="side-list">
          {problems.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`side-item${p.id === activeId ? ' active' : ''}`}
              onClick={() => select(p)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{p.title}</strong>
                {done[p.id] && <span className="badge success">done</span>}
              </div>
              <small className="muted">{p.difficulty}</small>
            </button>
          ))}
        </div>

        <div className="stack">
          {!active && <div className="empty">Pick a problem.</div>}
          {active && (
            <>
              <div className="card stack">
                <div className="row">
                  <span className="badge warning">{active.difficulty}</span>
                </div>
                <h2>{active.title}</h2>
                <Markdown source={active.prompt} />
                {hintCount > 0 && (
                  <div className="feedback">
                    <p className="kicker">Hints</p>
                    <ul>
                      {active.hints.slice(0, hintCount).map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <CodeEditor language={active.language} value={code} onChange={setCode} height="360px" />
              <div className="row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={hintCount >= active.hints.length}
                  onClick={() => setHintCount((n) => Math.min(n + 1, active.hints.length))}
                >
                  Show hint ({hintCount}/{active.hints.length})
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowSolution(true)}
                >
                  Reveal solution
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setDone(markPractice(active.id).practice)}
                >
                  Mark complete
                </button>
              </div>
              {showSolution && (
                <div className="card stack">
                  {active.expectedOutput && (
                    <p>
                      <strong>Expected output:</strong> <code>{active.expectedOutput}</code>
                    </p>
                  )}
                  <CodeEditor
                    language={active.language}
                    value={active.solution}
                    readOnly
                    height="320px"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
