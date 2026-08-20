import { accentVar, listSubjectCards } from './subjects';

/**
 * Hub home: hero line, the merged subject list (installed packs first,
 * honest placeholders after), and the hub-crew mascot.
 */
export default function HubHome() {
  const cards = listSubjectCards();
  const installedCount = cards.filter((card) => card.installed).length;

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

      <div className="section-h">
        <h2>Your subjects</h2>
        <span className="hint">
          {cards.length} subjects · {installedCount} pack
          {installedCount === 1 ? '' : 's'} installed
        </span>
      </div>
      <div className="grid">
        {cards.map((subject) => (
          <a key={subject.id} className="card" href={`#/subject/${subject.id}`}>
            <div className="top">
              <div
                className="badge"
                style={{ background: accentVar(subject.accent) }}
              >
                {subject.code}
              </div>
              <div>
                <h3>{subject.code}</h3>
                <div className="meta">{subject.subtitle}</div>
              </div>
            </div>
            <p>{subject.description}</p>
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
        ))}
      </div>
    </section>
  );
}
