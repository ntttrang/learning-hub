import {
  Check,
  Circle,
  Database,
  Eye,
  FlaskConical,
  Lightbulb,
  ListChecks,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import type { LabStep } from '../sdk/types';
import { Button } from './Button';
import { CodeBlock } from './CodeBlock';
import { EmptyState } from './EmptyState';
import { Markdown } from './Markdown';
import { Pill } from './Pill';

interface LabViewerProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
  /** Route segment: lab id. */
  id: string;
}

/**
 * One lab, rich or plain: every section renders only when its fields exist,
 * so a gh-200-style plain lab (summary + steps + outcomes) shows no empty
 * headers. Step hints and solutions are opt-in reveals, dp-800 style.
 */
export function LabViewer({ subjectId, index, id }: LabViewerProps) {
  // Select the stored array itself — `?? []` here would mint a new reference
  // per snapshot and loop useSyncExternalStore before any lab is completed.
  const completedLabs = useSubjectDataStore((s) => s.subjects[subjectId]?.completedLabs);
  const completeLab = useSubjectDataStore((s) => s.completeLab);

  const lab = index.getLab(id);

  if (!lab) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No such lab"
        message={`We could not find a lab called "${id}". Pick one from the lab index instead.`}
      >
        <Button href={`#/subject/${subjectId}/labs`} variant="secondary">
          Back to labs
        </Button>
      </EmptyState>
    );
  }

  const done = completedLabs?.includes(lab.id) ?? false;
  const lesson = lab.lessonId ? index.getLesson(lab.lessonId) : undefined;

  return (
    <article className="lab">
      <a className="back-link" href={`#/subject/${subjectId}/labs`}>
        ← All labs
      </a>

      <header className="lesson-head">
        <h2 className="lesson-title">{lab.title}</h2>
        <p className="lesson-summary">{lab.summary}</p>
        <div className="lesson-chips">
          {lab.difficulty && <Pill tone="accent">{lab.difficulty}</Pill>}
          <Pill>{lab.minutes} min</Pill>
          <Pill>
            {lab.steps.length} step{lab.steps.length === 1 ? '' : 's'}
          </Pill>
          {lesson && (
            <a
              className="lab-lesson-link"
              href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}
            >
              Lesson: {lesson.title}
            </a>
          )}
        </div>
      </header>

      {(lab.scenario || lab.objective || lab.prerequisites || lab.engines) && (
        <section className="lab-panel" aria-label="Scenario and objective">
          <h3 className="lab-section-title">
            <Target size={16} strokeWidth={1.75} aria-hidden="true" /> Scenario &amp; objective
          </h3>
          {lab.scenario && <Markdown>{lab.scenario}</Markdown>}
          {lab.objective && (
            <p className="lab-objective">{lab.objective}</p>
          )}
          {lab.prerequisites && lab.prerequisites.length > 0 && (
            <div className="lab-prereqs">
              <span className="lab-prereqs-label">Prerequisites</span>
              <ul>
                {lab.prerequisites.map((prereq) => {
                  // Packs may name lessons by id or write free-text advice —
                  // resolve ids to their lesson, keep everything else as text.
                  const lesson = index.getLesson(prereq);
                  return (
                    <li key={prereq}>
                      {lesson ? (
                        <a
                          className="lab-lesson-link"
                          href={`#/subject/${subjectId}/learn/${lesson.slug ?? lesson.id}`}
                        >
                          {lesson.title}
                        </a>
                      ) : (
                        prereq
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {lab.engines && lab.engines.length > 0 && (
            <p className="lab-engines">Runs on: {lab.engines.join(', ')}</p>
          )}
        </section>
      )}

      {(lab.schemaSql || lab.seedSql) && (
        <section aria-label="Schema and sample data">
          <h3 className="lab-section-title">
            <Database size={16} strokeWidth={1.75} aria-hidden="true" /> Schema &amp; sample data
          </h3>
          <div className="lab-code-stack">
            {lab.schemaSql && <CodeBlock code={lab.schemaSql} language="sql" label="Schema" />}
            {lab.seedSql && <CodeBlock code={lab.seedSql} language="sql" label="Sample data" />}
          </div>
        </section>
      )}

      <section aria-label="Steps">
        <h3 className="lab-section-title">Steps</h3>
        <div className="lab-steps">
          {lab.steps.map((step, stepIndex) => (
            <LabStepCard key={stepIndex} step={step} index={stepIndex} />
          ))}
        </div>
      </section>

      {lab.engineNotes && Object.keys(lab.engineNotes).length > 0 && (
        <section aria-label="Engine notes">
          <h3 className="lab-section-title">Other engines</h3>
          <div className="lab-notes-grid">
            {Object.entries(lab.engineNotes).map(([engine, note]) => (
              <div key={engine} className="lab-note">
                <p className="lab-note-engine">{engine}</p>
                <p>{note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {lab.outcomes && lab.outcomes.length > 0 && (
        <section aria-label="Expected outcomes">
          <h3 className="lab-section-title">Expected outcomes</h3>
          <ul className="lab-list">
            {lab.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </section>
      )}

      {lab.checks && lab.checks.length > 0 && (
        <section aria-label="Self-check">
          <h3 className="lab-section-title">
            <ListChecks size={16} strokeWidth={1.75} aria-hidden="true" /> Self-check
          </h3>
          <ul className="lab-list">
            {lab.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>
      )}

      {lab.solutionExplanation && (
        <section aria-label="Solution explanation">
          <h3 className="lab-section-title">Solution explanation</h3>
          <div className="lab-panel">
            <Markdown>{lab.solutionExplanation}</Markdown>
          </div>
        </section>
      )}

      <footer className="lesson-actions">
        {done ? (
          <span className="done-flag">
            <Check size={15} strokeWidth={2.5} aria-hidden="true" /> Lab completed
          </span>
        ) : (
          <Button onClick={() => completeLab(subjectId, lab.id)} icon={Circle}>
            Mark lab complete
          </Button>
        )}
      </footer>
    </article>
  );
}

/** One numbered step: instructions plus opt-in hint/solution reveals. */
function LabStepCard({ step, index }: { step: LabStep; index: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="lab-step">
      <div className="lab-step-head">
        <span className="lab-step-num">{index + 1}</span>
        {step.title && <h4 className="lab-step-title">{step.title}</h4>}
      </div>

      <Markdown>{step.instructions}</Markdown>

      {step.starterSql && (
        <div className="lab-step-block">
          <span className="lab-block-label">Starter SQL</span>
          <CodeBlock code={step.starterSql} language="sql" />
        </div>
      )}

      {step.expectedOutput && (
        <div className="lab-step-expected">
          <span className="lab-block-label">Expected output</span>
          <Markdown>{step.expectedOutput}</Markdown>
        </div>
      )}

      {step.validation && (
        <div className="lab-step-validation">
          <ListChecks size={15} strokeWidth={1.75} aria-hidden="true" />
          <span>
            <strong>Validation:</strong> {step.validation}
          </span>
        </div>
      )}

      {(step.hint || step.solution) && (
        <div className="lab-step-actions">
          {step.hint && (
            <Button variant="ghost" icon={Lightbulb} onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Hide hint' : 'Show hint'}
            </Button>
          )}
          {step.solution && (
            <Button variant="ghost" icon={Eye} onClick={() => setShowSolution((v) => !v)}>
              {showSolution ? 'Hide solution' : 'Reveal solution'}
            </Button>
          )}
        </div>
      )}

      {showHint && step.hint && (
        <div className="lab-step-hint">
          <Lightbulb size={14} strokeWidth={1.75} aria-hidden="true" />
          <p>{step.hint}</p>
        </div>
      )}
      {showSolution && step.solution && (
        <CodeBlock code={step.solution} language="sql" label="Solution" />
      )}
    </div>
  );
}
