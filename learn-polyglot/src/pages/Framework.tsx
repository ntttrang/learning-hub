import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CodeEditor } from '../components/CodeEditor';
import { Markdown } from '../components/Markdown';
import { loadFramework } from '../lib/data';
import { loadProgress, markFramework } from '../lib/progress';
import { useApp } from '../lib/AppContext';
import type { FrameworkChallenge, FrameworkMeta } from '../lib/types';

export function Framework() {
  const { lang } = useApp();
  const [meta, setMeta] = useState<FrameworkMeta | null>(null);
  const [challenges, setChallenges] = useState<FrameworkChallenge[]>([]);
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
    loadFramework(lang)
      .then((file) => {
        if (cancelled) return;
        setMeta(file.framework);
        setChallenges(file.challenges);
        const first = file.challenges[0];
        setActiveId(first?.id ?? null);
        setCode(first?.starterCode ?? '');
        setDone(loadProgress().framework);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const active = challenges.find((c) => c.id === activeId) ?? null;
  const completed = challenges.filter((c) => done[c.id]).length;

  const select = (c: FrameworkChallenge) => {
    setActiveId(c.id);
    setCode(c.starterCode);
    setHintCount(0);
    setShowSolution(false);
  };

  return (
    <div>
      <div className="page-header row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Framework</p>
          <h1>{meta ? `Master ${meta.name}` : 'Framework mastery'}</h1>
          <p className="muted">
            {meta?.tagline ?? 'One popular framework per language, step by step.'}
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="error">{error}</div>}

      {meta && (
        <div className="card stack" style={{ marginBottom: '1rem' }}>
          <Markdown source={meta.overview} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <small className="muted">
              {completed}/{challenges.length} challenges complete
            </small>
            {meta.docs && meta.docs.length > 0 && (
              <div className="row">
                {meta.docs.map((d) => (
                  <a key={d.url} href={d.url} target="_blank" rel="noreferrer">
                    {d.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="split">
        <div className="side-list">
          {challenges.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`side-item${c.id === activeId ? ' active' : ''}`}
              onClick={() => select(c)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{c.title}</strong>
                {done[c.id] && <span className="badge success">done</span>}
              </div>
              <small className="muted">{c.difficulty}</small>
            </button>
          ))}
        </div>

        <div className="stack">
          {!active && <div className="empty">Pick a challenge.</div>}
          {active && (
            <>
              <div className="card stack">
                <div className="row">
                  <span className="badge warning">{active.difficulty}</span>
                </div>
                <h2>{active.title}</h2>
                <Markdown source={active.concept} />
                <p>
                  <strong>Goal:</strong> {active.goal}
                </p>
                {active.steps.length > 0 && (
                  <div>
                    <p className="kicker">Steps</p>
                    <ol>
                      {active.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
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
                  onClick={() => setDone(markFramework(active.id).framework)}
                >
                  Mark complete
                </button>
              </div>
              {showSolution && (
                <div className="card stack">
                  {active.expectedOutput && (
                    <p>
                      <strong>Expected:</strong> <code>{active.expectedOutput}</code>
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
