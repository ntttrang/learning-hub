import { useMemo } from 'react';
import { loadSubjectWithIndex } from '../content/registry';
import { ACHIEVEMENTS } from '../engines/achievements';
import { buildHubOverview, type HubSubjectOverview } from '../engines/hub-stats';
import { useSubjectDataStore } from '../engines/subject-store';
import type { SubjectContent } from '../sdk/types';
import { ProgressBar } from '../ui/ProgressBar';
import { accentVar, listSubjectCards } from './subjects';

/**
 * Hub home: hero line, the hub stats band, the merged subject list (installed
 * packs first with live progress, honest placeholders after), and the
 * achievements strip.
 */

/** Pack contents for stats — static per session (bundled at build time). */
let packMemo: { id: string; content: SubjectContent }[] | undefined;

function statPacks(): { id: string; content: SubjectContent }[] {
  if (!packMemo) {
    packMemo = listSubjectCards()
      .filter((card) => card.installed)
      .map((card) => ({ id: card.id, content: loadSubjectWithIndex(card.id).content }));
  }
  return packMemo;
}

const earnedOn = (earned: Map<string, string>) => {
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  return (id: string) => {
    const at = earned.get(id);
    return at ? fmt.format(new Date(at)) : '';
  };
};

export default function HubHome() {
  const cards = listSubjectCards();
  const installedCount = cards.filter((card) => card.installed).length;

  const subjectsData = useSubjectDataStore((s) => s.subjects);
  const streak = useSubjectDataStore((s) => s.streak);
  const achievements = useSubjectDataStore((s) => s.achievements);

  // Pack totals are memoized at module scope; the recompute here tracks only
  // store-derived numbers, so it is cheap per render.
  const overview = useMemo(
    () => buildHubOverview(statPacks(), subjectsData, { streak, achievements }, new Date().toISOString()),
    [subjectsData, streak, achievements],
  );
  const byId = new Map(overview.subjects.map((entry) => [entry.subjectId, entry]));
  const dateEarned = earnedOn(new Map(achievements.map((a) => [a.id, a.earnedAt])));

  return (
    <section className="view" aria-label="Hub home">
      <div className="hub-hero">
        <div>
          <div className="eyebrow">Unified learning platform</div>
          <h1 className="h-hero">One hub for every subject you study</h1>
          <p className="sub">
            Three separate study apps — DP-800, the GitHub certs, and the GH-600 labs —
            now live under one roof, sharing the same navigation, progress, practice
            engine, and brand. New subjects, content types, and tools plug in without a
            rebuild.
          </p>
        </div>
        <img
          src="brand/captain-corgi-hub-avatar.png"
          alt=""
          width="96"
          height="96"
        />
      </div>

      <div className="stats" aria-label="Your hub at a glance">
        <a className="stat" href="#/review" title="Spaced review">
          <span className="n">{overview.totalDue}</span>
          <span className="l">cards due for review</span>
        </a>
        <div className="stat">
          <span className="n">
            {overview.lessonsDone}
            <small> / {overview.lessonsTotal}</small>
          </span>
          <span className="l">lessons completed</span>
        </div>
        <div className="stat">
          <span className="n">
            {overview.labsDone}
            <small> / {overview.labsTotal}</small>
          </span>
          <span className="l">labs completed</span>
        </div>
        <div className="stat">
          <span className="n">
            {overview.streakCurrent}
            <small> day streak · best {overview.streakLongest}</small>
          </span>
          <span className="l">learning days</span>
        </div>
        <div className="stat">
          <span className="n">
            {overview.achievementsEarned}
            <small> / {overview.achievementsTotal}</small>
          </span>
          <span className="l">achievements earned</span>
        </div>
      </div>

      <div className="section-h">
        <h2>Your subjects</h2>
        <span className="hint">
          {cards.length} subjects · {installedCount} pack
          {installedCount === 1 ? '' : 's'} installed
        </span>
      </div>
      <div className="grid">
        {cards.map((subject) => {
          const entry: HubSubjectOverview | undefined = subject.installed
            ? byId.get(subject.id)
            : undefined;
          const stats = entry?.stats;
          return (
            <article key={subject.id} className="card">
              {/* The whole card clicks through to the subject; the due chip
                  overlays it as its own #/review link (anchors can't nest). */}
              <a className="card-link" href={`#/subject/${subject.id}`}>
                <div className="top">
                  <div
                    className="badge"
                    style={subject.id === 'gh-200' || subject.id === 'dp-800' || subject.id === 'gh-600' || subject.id === 'gh-900'
                      ? undefined
                      : { background: accentVar(subject.accent) }}
                  >
                    {subject.id === 'gh-200' || subject.id === 'dp-800' || subject.id === 'gh-600' || subject.id === 'gh-900' ? (
                      <img
                        className="badge-image"
                        src={subject.id === 'dp-800'
                          ? '/sql-ai-developer.jpeg'
                          : subject.id === 'gh-600'
                            ? '/github-agentic.png'
                            : subject.id === 'gh-900'
                              ? '/github-foundations.svg'
                            : '/github-actions.svg'}
                        alt=""
                      />
                    ) : (
                      subject.code
                    )}
                  </div>
                  <div>
                    <h3>{subject.code}</h3>
                    <div className="meta">{subject.subtitle}</div>
                  </div>
                </div>
                <p>{subject.description}</p>
                {stats && (
                  <div className="card-progress">
                    <div className="progress-line">
                      <span>Lessons</span>
                      <span>
                        {stats.lessonsDone}/{stats.lessonsTotal}
                      </span>
                    </div>
                    <ProgressBar
                      value={stats.lessonsTotal === 0 ? 0 : stats.lessonsDone / stats.lessonsTotal}
                      label={`${subject.code} lessons completed`}
                    />
                    <div className="progress-facts">
                      <span>
                        Labs {stats.labsDone}/{stats.labsTotal}
                      </span>
                      <span>
                        {stats.bestExamPct === null
                          ? 'No exams yet'
                          : `Best exam ${stats.bestExamPct}%`}
                      </span>
                      {entry?.continueHref && <span className="continue-link">Continue →</span>}
                    </div>
                  </div>
                )}
                <div className="chips">
                  {subject.modes.map((mode) => (
                    <span key={mode} className="chip">
                      {mode}
                    </span>
                  ))}
                </div>
                <div className="foot">
                  <span>Content pack</span>
                  {subject.installed ? (
                    <span className="status live">
                      <span className="status-dot" aria-hidden="true" />
                      Installed
                    </span>
                  ) : (
                    <span className="status soon">Pack not installed</span>
                  )}
                </div>
              </a>
              {stats && stats.dueCount > 0 && (
                <a className="due-chip" href="#/review">
                  {stats.dueCount} due
                </a>
              )}
            </article>
          );
        })}
      </div>

      <div className="section-h">
        <h2>Achievements</h2>
        <span className="hint">
          {overview.achievementsEarned} of {overview.achievementsTotal} earned
        </span>
      </div>
      <ul className="achv-strip">
        {ACHIEVEMENTS.map((def) => {
          const earned = dateEarned(def.id) !== '';
          return (
            <li key={def.id} className={earned ? 'achv earned' : 'achv'}>
              <span className="achv-title">{def.title}</span>
              <span className="achv-meta">{earned ? dateEarned(def.id) : 'Locked'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
