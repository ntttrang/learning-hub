import { ArrowRight, Flame } from 'lucide-react';
import { computeStats } from '../engines/progress';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent, SubjectIndex } from '../content/registry';

interface SubjectOverviewProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
}

function pct(value: number): string {
  // Floor so a nearly-finished course never reads as 100%.
  return `${Math.floor(value * 100)}%`;
}

/**
 * Workspace landing panel: light stats (progress, accuracy, labs, streak),
 * per-domain completion, and a continue link to the last visited lesson.
 * Full dashboards arrive with the analytics roadmap — this stays honest with
 * what `computeStats` and the store actually know.
 */
export default function SubjectOverview({ subjectId, content, index }: SubjectOverviewProps) {
  const data = useSubjectDataStore((s) => s.subjects[subjectId]);
  const streak = useSubjectDataStore((s) => s.streak);

  const stats = computeStats(content, {
    lessons: data?.lessons ?? {},
    completedLabs: data?.completedLabs ?? [],
    quizAttempts: data?.quizAttempts ?? [],
    examAttempts: data?.examAttempts ?? [],
  });

  const lastLesson = data?.lastLessonId ? index.getLesson(data.lastLessonId) : undefined;
  const continueHref = lastLesson
    ? `#/subject/${subjectId}/learn/${lastLesson.slug ?? lastLesson.id}`
    : undefined;

  const domains = [...content.domains].sort((a, b) => a.order - b.order);

  return (
    <section className="overview" aria-label="Subject overview">
      <div className="stat-row">
        <div className="stat">
          <span className="stat-value">{pct(stats.overall)}</span>
          <span className="stat-label">Course progress</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.completedLessons}/{stats.totalLessons}
          </span>
          <span className="stat-label">Lessons done</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.quizCount > 0 ? pct(stats.quizAccuracy) : '—'}
          </span>
          <span className="stat-label">Quiz accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.labsDone}/{index.totals.labs}
          </span>
          <span className="stat-label">Labs done</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-streak">
            <Flame size={18} strokeWidth={1.75} aria-hidden="true" />
            {streak.current}
          </span>
          <span className="stat-label">Day streak</span>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Domains</h2>
        <ul className="domain-rows">
          {domains.map((domain) => (
            <li key={domain.id} className="domain-row">
              <span className="domain-name">{domain.title}</span>
              <span
                className="bar"
                role="progressbar"
                aria-valuenow={Math.round((stats.domainCompletion[domain.id] ?? 0) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${domain.title} completion`}
              >
                <span
                  className="bar-fill"
                  style={{ width: pct(stats.domainCompletion[domain.id] ?? 0) }}
                />
              </span>
              <span className="domain-pct">{pct(stats.domainCompletion[domain.id] ?? 0)}</span>
            </li>
          ))}
        </ul>
      </div>

      {continueHref && (
        <a className="continue-card" href={continueHref}>
          <span>
            <span className="continue-eyebrow">Continue where you left off</span>
            <span className="continue-title">{lastLesson?.title}</span>
          </span>
          <ArrowRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
