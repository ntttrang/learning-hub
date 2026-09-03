import { Link } from 'react-router-dom';
import { BookOpen, Beaker, Dumbbell, Layers, ClipboardCheck, Columns2 } from 'lucide-react';
import { Card } from '../components/Card';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Mascot } from '../components/Mascot';
import { useApp } from '../lib/AppContext';

const ICONS = {
  learn: BookOpen,
  lab: Beaker,
  practice: Dumbbell,
  framework: Layers,
  quiz: ClipboardCheck,
  compare: Columns2,
} as const;

export function Home() {
  const { manifest, loading, error, lang } = useApp();

  if (loading) return <div className="loading">Loading the deck…</div>;
  if (error) return <div className="error">{error}</div>;
  if (!manifest) return null;

  const current = manifest.languages.find((l) => l.id === lang);

  return (
    <div>
      <section className="hero">
        <div>
          <p className="kicker" style={{ color: 'var(--star-yellow)' }}>
            Captain Corgi Hub
          </p>
          <h1>{manifest.title}</h1>
          <p className="lead">{manifest.subtitle}</p>
          <div className="row" style={{ marginTop: 'var(--space-5)' }}>
            <LanguageSwitcher />
          </div>
          {current && (
            <p style={{ marginTop: 'var(--space-4)', opacity: 0.9 }}>{current.blurb}</p>
          )}
        </div>
        <Mascot />
      </section>

      <p className="kicker">Deck sections</p>
      <h2>Pick a path</h2>
      <div className="grid-3" style={{ marginTop: 'var(--space-4)' }}>
        {manifest.sections.map((s) => {
          const Icon = ICONS[s.id];
          return (
            <Link key={s.id} to={s.path} style={{ color: 'inherit' }}>
              <Card>
                <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
                  <Icon size={20} strokeWidth={1.75} />
                  <strong>{s.label}</strong>
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  {s.blurb}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
