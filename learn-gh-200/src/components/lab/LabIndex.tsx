import { Check, FlaskConical } from 'lucide-react';
import { Badge, Pill } from '../ui/Badge';
import { Card, CardHead } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { domainsByCert, domainById } from '../../content/domains';
import { LABS, labsByDomains } from '../../content/labs';
import { useProgress } from '../../hooks/useProgress';

/** Lab landing page: one card per lab, in domain order. */
export function LabIndex() {
  const { progress } = useProgress();

  if (LABS.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No labs yet"
        message="Labs arrive with their lessons — hands-on exercises you run in your own repository."
      />
    );
  }

  const ordered = labsByDomains([
    ...domainsByCert('gh900'),
    ...domainsByCert('gh200'),
  ]);
  const doneCount = ordered.filter((lab) => progress.labsDone[lab.id]).length;

  return (
    <>
      <div className="section-head enter">
        <span className="caption">Lab</span>
        <h2>Hands-on in your own repository</h2>
        <p className="lead">
          The site narrates; you do. Each lab is a concrete task list with an
          observable end state. {doneCount} of {ordered.length} done.
        </p>
        <ProgressBar value={doneCount / ordered.length} />
      </div>

      <div className="card-grid">
        {ordered.map((lab) => {
          const domain = domainById(lab.domainId);
          const done = Boolean(progress.labsDone[lab.id]);
          return (
            <Card key={lab.id} href={`#/lab/${lab.id}`}>
              <CardHead
                meta={
                  done ? (
                    <span className="done-flag">
                      <Check size={14} strokeWidth={2.5} aria-hidden /> Done
                    </span>
                  ) : (
                    <Pill>{lab.minutes} min</Pill>
                  )
                }
              >
                {domain ? <Badge tone={domain.cert}>Domain {domain.number}</Badge> : null}
              </CardHead>
              <h4 className="card-title">{lab.title}</h4>
              <p>{lab.summary}</p>
              <div className="card-foot card-foot-meta">
                <span>{lab.steps.length} tasks</span>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
