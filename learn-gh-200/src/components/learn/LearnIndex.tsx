import { BookOpen, Check } from 'lucide-react';
import { Badge, Pill } from '../ui/Badge';
import { Card, CardHead } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { DOMAINS, domainsByCert } from '../../content/domains';
import { useProgress } from '../../hooks/useProgress';

const CERT_LABELS: Record<string, string> = {
  gh900: 'GH-900 · GitHub Foundations',
  gh200: 'GH-200 · GitHub Actions',
};

/** Learn landing page: one card per domain, grouped by certification. */
export function LearnIndex() {
  const { progress } = useProgress();
  const certs = [...new Set(DOMAINS.map((domain) => domain.cert))];
  const readCount = DOMAINS.filter((domain) => progress.lessonsRead[domain.id]).length;

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Learn</span>
        <h2>Lessons, one per exam domain</h2>
        <p className="lead">
          Each lesson maps to the official skills outline, carries its own docs
          trail, and takes about ten minutes. {readCount} of {DOMAINS.length}{' '}
          read.
        </p>
        <ProgressBar value={DOMAINS.length ? readCount / DOMAINS.length : 0} />
      </div>

      {certs.map((cert) => (
        <section key={cert} style={{ marginBottom: 'var(--space-7)' }}>
          <div className="cert-row">
            <h3>{CERT_LABELS[cert] ?? cert}</h3>
            <Pill>{domainsByCert(cert).length} domains</Pill>
          </div>
          <div className="card-grid">
            {domainsByCert(cert).map((domain) => {
              const read = Boolean(progress.lessonsRead[domain.id]);
              return (
                <Card key={domain.id} href={`#/learn/${domain.id}`}>
                  <CardHead
                    meta={
                      read ? (
                        <span className="done-flag">
                          <Check size={14} strokeWidth={2.5} aria-hidden /> Read
                        </span>
                      ) : (
                        <Pill>{domain.lesson.minutes} min</Pill>
                      )
                    }
                  >
                    <Badge tone={domain.cert}>Domain {domain.number}</Badge>
                  </CardHead>
                  <h4 className="card-title">{domain.title}</h4>
                  <p>{domain.summary}</p>
                  <div className="card-foot card-foot-meta">
                    <span>
                      Weight {domain.weightMin}–{domain.weightMax}%
                    </span>
                    <BookOpen size={14} strokeWidth={1.75} aria-hidden />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
