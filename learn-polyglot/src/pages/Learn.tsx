import { useEffect, useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Markdown } from '../components/Markdown';
import { CodeBlock } from '../components/CodeBlock';
import { loadLearn } from '../lib/data';
import { loadProgress, markLesson } from '../lib/progress';
import { useApp } from '../lib/AppContext';
import type { Difficulty, DocLink, Lesson } from '../lib/types';

const LEVEL_ORDER: Difficulty[] = ['junior', 'mid', 'senior'];
const LEVEL_LABELS: Record<Difficulty, string> = {
  junior: 'Junior · Fundamentals',
  mid: 'Mid · Core skills',
  senior: 'Senior · Advanced',
};

function DocsList({ title, links }: { title: string; links: DocLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="docs-panel">
      <p className="docs-panel-title">{title}</p>
      <ul className="docs-list">
        {links.map((d) => (
          <li key={d.url}>
            <a href={d.url} target="_blank" rel="noopener noreferrer">
              {d.title}
            </a>
            {d.note && <span className="muted"> — {d.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Learn() {
  const { lang } = useApp();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<DocLink[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadLearn(lang)
      .then((file) => {
        if (cancelled) return;
        setLessons(file.lessons);
        setResources(file.resources ?? []);
        setActiveId(file.lessons[0]?.id ?? null);
        setDone(loadProgress().lessons);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const active = lessons.find((l) => l.id === activeId) ?? null;

  return (
    <div>
      <div className="page-header row" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="kicker">Learn</p>
          <h1>Lessons</h1>
          <p className="muted">Senior-focused notes. Content loads from `/data/{lang}/learn.json`.</p>
        </div>
        <LanguageSwitcher />
      </div>

      {error && <div className="error">{error}</div>}

      <DocsList title="Official docs & guides" links={resources} />

      <div className="split">
        <div className="side-list">
          {LEVEL_ORDER.map((level) => {
            const group = lessons.filter((l) => l.level === level);
            if (group.length === 0) return null;
            return (
              <div key={level} className="side-group">
                <p className="side-group-title">
                  {LEVEL_LABELS[level]} <span className="muted">({group.length})</span>
                </p>
                {group.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`side-item${l.id === activeId ? ' active' : ''}`}
                    onClick={() => setActiveId(l.id)}
                  >
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <strong>{l.title}</strong>
                      {done[l.id] && <span className="badge success">done</span>}
                    </div>
                    <small className="muted">
                      {l.level} · {l.estMinutes} min
                    </small>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="card stack">
          {!active && <div className="empty">Pick a lesson.</div>}
          {active && (
            <>
              <div className="row">
                <span className="badge">{active.level}</span>
                {active.tags.map((t) => (
                  <span key={t} className="badge">
                    {t}
                  </span>
                ))}
              </div>
              <h2>{active.title}</h2>
              <Markdown source={active.body} />
              {active.codeSamples?.map((s) => (
                <CodeBlock key={s.title} title={s.title} language={s.language} code={s.code} />
              ))}
              <DocsList title="Further reading" links={active.docs ?? []} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setDone(markLesson(active.id).lessons)}
              >
                Mark as reviewed
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
