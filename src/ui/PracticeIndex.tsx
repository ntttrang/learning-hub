import { CircleHelp, Target } from 'lucide-react';
import { computeStats } from '../engines/progress';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectIndex } from '../sdk/content-source';
import type { SubjectContent } from '../sdk/types';
import { EmptyState } from './EmptyState';
import { Pill } from './Pill';

interface PracticeIndexProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

/**
 * Practice landing page, driven by the pack itself: one card per domain with
 * question counts and module scopes, plus an all-questions run. Weak domains
 * (worst exam accuracy from `computeStats`) carry a focus signal so the next
 * run goes where it pays.
 */
export function PracticeIndex({ subjectId, content, index }: PracticeIndexProps) {
  const data = useSubjectDataStore((s) => s.subjects[subjectId]);
  const stats = computeStats(content, {
    lessons: data?.lessons ?? {},
    completedLabs: data?.completedLabs ?? [],
    quizAttempts: data?.quizAttempts ?? [],
    examAttempts: data?.examAttempts ?? [],
  });

  if (content.questions.length === 0) {
    return (
      <EmptyState
        icon={CircleHelp}
        title="No question bank yet"
        message="This pack ships no practice questions — the mode stays honest about it until content lands."
      />
    );
  }

  const runHref = (scopeId: string) => `#/subject/${subjectId}/practice/${scopeId}`;
  const domains = [...content.domains].sort((a, b) => a.order - b.order);
  const playable = domains.filter((domain) => index.questionsForDomain(domain.id).length > 0);

  return (
    <>
      <p className="practice-lead">
        {content.questions.length} questions across {playable.length} practiceable
        {playable.length === 1 ? ' domain' : ' domains'} — instant feedback and a docs trail on
        every answer. {stats.quizCount > 0 ? `${stats.quizCount} run${stats.quizCount === 1 ? '' : 's'} recorded so far.` : ''}
      </p>

      <div className="practice-grid">
        <a className="practice-card" href={runHref('all')}>
          <div className="practice-card-head">
            <h3 className="practice-card-title">Everything, shuffled</h3>
            <Pill tone="accent">{content.questions.length} questions</Pill>
          </div>
          <p>One mixed run drawing on every domain in the pack.</p>
        </a>

        {domains.map((domain) => {
          const count = index.questionsForDomain(domain.id).length;
          if (count === 0) return null;
          const modules = index
            .modulesForDomain(domain.id)
            .filter((module) => index.questionsForModule(module.id).length > 0);
          const weak = stats.weakDomains.includes(domain.id);
          return (
            <a
              key={domain.id}
              className="practice-card"
              href={runHref(domain.id)}
            >
              <div className="practice-card-head">
                <h3 className="practice-card-title">{domain.title}</h3>
                {weak ? (
                  <Pill tone="warn" icon={Target}>
                    Focus
                  </Pill>
                ) : (
                  <Pill>{count} questions</Pill>
                )}
              </div>
              <p>{domain.summary ?? `Practice the ${domain.title.toLowerCase()} material.`}</p>
              {modules.length > 0 && (
                <div className="practice-modules">
                  {modules.map((module) => (
                    // Spans, not links: these chips sit inside the domain
                    // card's anchor, and nested <a> is invalid HTML. The run
                    // itself is reachable at /practice/<moduleId>.
                    <span key={module.id} className="practice-module">
                      {module.title} · {index.questionsForModule(module.id).length}
                    </span>
                  ))}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </>
  );
}
