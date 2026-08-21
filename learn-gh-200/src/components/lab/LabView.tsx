import { ArrowLeft, Check, FlaskConical } from 'lucide-react';
import { labById } from '../../content/labs';
import { domainById } from '../../content/domains';
import { useProgress } from '../../hooks/useProgress';
import { Badge, Pill } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InlineText } from '../ui/InlineText';

/** Lab page: summary, numbered tasks, expected outcomes, self-check. */
export function LabView({ labId }: { labId?: string }) {
  const { progress, markLabDone } = useProgress();
  const lab = labById(labId);

  if (!lab) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No such lab"
        message={`We could not find a lab called “${labId}”. Pick one from the Lab index instead.`}
      >
        <Button href="#/lab">Back to Lab</Button>
      </EmptyState>
    );
  }

  const domain = domainById(lab.domainId);
  const doneOn = progress.labsDone[lab.id];

  return (
    <article className="lab enter">
      <a className="back-link" href="#/lab">
        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden /> All labs
      </a>

      <header className="lesson-head">
        <div className="lesson-head-tags">
          {domain ? (
            <a href={`#/learn/${domain.id}`}>
              <Badge tone={domain.cert}>Domain {domain.number}</Badge>
            </a>
          ) : null}
          <Pill>{lab.minutes} min</Pill>
          <Pill>{lab.steps.length} tasks</Pill>
        </div>
        <h2>{lab.title}</h2>
        <p className="lead">{lab.summary}</p>
      </header>

      <section className="lab-section">
        <h3>Tasks</h3>
        <ol className="lab-tasks">
          {lab.steps.map((step, index) => (
            <li key={index}>
              <InlineText text={step} />
            </li>
          ))}
        </ol>
      </section>

      <section className="lab-section">
        <h3>Expected outcomes</h3>
        <ul>
          {lab.outcomes.map((outcome, index) => (
            <li key={index}>
              <InlineText text={outcome} />
            </li>
          ))}
        </ul>
      </section>

      <section className="lab-section">
        <h3>Self-check</h3>
        <ul>
          {lab.checks.map((check, index) => (
            <li key={index}>
              <InlineText text={check} />
            </li>
          ))}
        </ul>
      </section>

      <footer className="lesson-actions">
        {doneOn ? (
          <span className="done-flag done-flag-big">
            <Check size={16} strokeWidth={2.5} aria-hidden /> Done on{' '}
            {new Date(doneOn).toLocaleDateString()}
          </span>
        ) : (
          <Button onClick={() => markLabDone(lab.id)}>Mark as done</Button>
        )}
      </footer>
    </article>
  );
}
