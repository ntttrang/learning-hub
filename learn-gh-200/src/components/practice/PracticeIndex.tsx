import { CircleHelp, Target } from 'lucide-react';
import { Badge, Pill } from '../ui/Badge';
import { Card, CardHead } from '../ui/Card';
import { DOMAINS, domainsByCert } from '../../content/domains';
import { byCert, byDomain, QUESTIONS } from '../../content/questions';
import { useProgress } from '../../hooks/useProgress';

const CERT_LABELS: Record<string, string> = {
  gh900: 'GH-900 · GitHub Foundations',
  gh200: 'GH-200 · GitHub Actions',
};

/** Practice landing page: one card per domain, driven by the bank itself. */
export function PracticeIndex() {
  const { progress } = useProgress();
  const certs = [...new Set(DOMAINS.map((domain) => domain.cert))];
  const answeredTotal = Object.values(progress.practiceStats).reduce(
    (sum, stat) => sum + stat.seen,
    0,
  );
  const playable = DOMAINS.filter((domain) => byDomain(domain.id).length > 0).length;

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Practice</span>
        <h2>Practice, one domain at a time</h2>
        <p className="lead">
          {QUESTIONS.length} original questions across both certifications — instant
          feedback and a docs trail on every answer. {answeredTotal} answered so far
          across {playable} playable domain{playable === 1 ? '' : 's'}.
        </p>
      </div>

      {certs.map((cert) => (
        <section key={cert} style={{ marginBottom: 'var(--space-7)' }}>
          <div className="cert-row">
            <h3>{CERT_LABELS[cert] ?? cert}</h3>
            <Pill>{byCert(cert).length} questions</Pill>
          </div>
          <div className="card-grid">
            {domainsByCert(cert).map((domain) => {
              const count = byDomain(domain.id).length;
              const stat = progress.practiceStats[domain.id];
              return count > 0 ? (
                <Card key={domain.id} href={`#/practice/${domain.id}`}>
                  <CardHead meta={<Pill>{count} questions</Pill>}>
                    <Badge tone={domain.cert}>Domain {domain.number}</Badge>
                  </CardHead>
                  <h4 className="card-title">{domain.title}</h4>
                  <p>{domain.summary}</p>
                  <div className="card-foot card-foot-meta">
                    <span>
                      {stat
                        ? `${stat.seen} answered · ${stat.correct} correct`
                        : 'Not started'}
                    </span>
                    <Target size={14} strokeWidth={1.75} aria-hidden />
                  </div>
                </Card>
              ) : (
                <Card key={domain.id} className="card-locked">
                  <CardHead meta={<Pill>Coming soon</Pill>}>
                    <Badge tone={domain.cert}>Domain {domain.number}</Badge>
                  </CardHead>
                  <h4 className="card-title">{domain.title}</h4>
                  <p>{domain.summary}</p>
                  <div className="card-foot card-foot-meta">
                    <span>Question bank in progress</span>
                    <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
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
