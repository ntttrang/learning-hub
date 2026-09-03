import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CodeEditor } from '../components/CodeEditor';
import { loadLab } from '../lib/data';
import { loadProgress, markLab } from '../lib/progress';
import { useApp } from '../lib/AppContext';
import type { Lab as LabItem } from '../lib/types';

export function Lab() {
  const { lang } = useApp();
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setShowSolution(false);
    loadLab(lang)
      .then((file) => {
        if (cancelled) return;
        setLabs(file.labs);
        const first = file.labs[0];
        setActiveId(first?.id ?? null);
        setCode(first?.starterCode ?? '');
        setDone(loadProgress().labs);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const active = labs.find((l) => l.id === activeId) ?? null;

  const select = (lab: LabItem) => {
    setActiveId(lab.id);
    setCode(lab.starterCode);
    setShowSolution(false);
  };

  return (
    <div>
      <div className="page-header row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Lab</p>
          <h1>Guided labs</h1>
          <p className="muted">Write in the editor, then reveal the reference — no live execution.</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="split">
        <div className="side-list">
          {labs.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`side-item${l.id === activeId ? ' active' : ''}`}
              onClick={() => select(l)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{l.title}</strong>
                {done[l.id] && <span className="badge success">done</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="stack">
          {!active && <div className="empty">Pick a lab.</div>}
          {active && (
            <>
              <div className="card stack">
                <h2>{active.title}</h2>
                <p>
                  <strong>Goal:</strong> {active.goal}
                </p>
                <ol>
                  {active.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                {active.docs && active.docs.length > 0 && (
                  <div className="stack" style={{ gap: '4px' }}>
                    <strong>Reference</strong>
                    <ul>
                      {active.docs.map((d) => (
                        <li key={d.url}>
                          <a href={d.url} target="_blank" rel="noreferrer">
                            {d.title}
                          </a>
                          {d.note && <span className="muted"> — {d.note}</span>}
                        </li>
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
                  onClick={() => setCode(active.starterCode)}
                >
                  Reset starter
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
                  onClick={() => setDone(markLab(active.id).labs)}
                >
                  Mark complete
                </button>
              </div>
              {showSolution && (
                <div className="card stack">
                  <p>
                    <strong>Expected output:</strong> <code>{active.expectedOutput}</code>
                  </p>
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
