import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Flame, Home, Menu } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import ThemeToggle from './ThemeToggle';
import TopbarSearch from './TopbarSearch';
import { accentVar, listSubjectCards } from './subjects';
import { useSubjectDataStore } from '../engines/subject-store';
import type { HubRoute } from './router';

interface AppShellProps {
  route: HubRoute;
  children: ReactNode;
}

/**
 * Generic app frame: brand rail (hub navigation + subjects, with the local
 * profile at its foot) and a header banner with hub-wide search, the
 * daily-streak badge, and the theme quartet. Knows nothing about any
 * subject's content — views render into `children`. Below 900px the rail
 * becomes a drawer opened from the topbar.
 */
export default function AppShell({ route, children }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const streak = useSubjectDataStore((s) => s.streak);

  // Any navigation closes the mobile drawer.
  useEffect(() => {
    const close = () => setNavOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  // A route change can unmount the focused element (a content link), which
  // drops focus to <body> and loses the keyboard position. Park it on the
  // content region instead — but never steal focus that survived on chrome
  // (tabs, rail, topbar).
  useEffect(() => {
    if (document.activeElement === document.body) mainRef.current?.focus();
  }, [route]);

  // Escape closes the drawer once it is open.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className={navOpen ? 'app nav-open' : 'app'}>
      <aside className="rail" aria-label="Hub navigation">
        <a className="brand" href="#/">
          <img className="star" src="brand/icons/star.svg" alt="" width="34" height="34" />
          <BrandWordmark className="wordmark" />
        </a>

        <a
          className={route.view === 'home' ? 'navi on' : 'navi'}
          href="#/"
          aria-current={route.view === 'home' ? 'page' : undefined}
        >
          <Home size={18} strokeWidth={1.75} aria-hidden="true" />
          Hub home
        </a>

        <div className="grp">My subjects</div>
        {listSubjectCards().map((subject) => {
          const active = route.view === 'subject' && route.subjectId === subject.id;
          return (
            <a
              key={subject.id}
              className={active ? 'navi on' : 'navi'}
              href={`#/subject/${subject.id}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="pip" style={{ background: accentVar(subject.accent) }} />
              {subject.code}
            </a>
          );
        })}

        <div className="rail-foot">
          <img
            className="avatar-img"
            src="brand/captain-corgi-hub-avatar.png"
            alt=""
            width="32"
            height="32"
          />
          <div className="who">
            Trang
            <br />
            <span>Local profile</span>
          </div>
        </div>
      </aside>

      <div className="scrim" aria-hidden="true" onClick={() => setNavOpen(false)} />

      <main className="main" tabIndex={-1} ref={mainRef}>
        <div className="topbar">
          <button
            type="button"
            className="menu-btn"
            aria-label="Open navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <TopbarSearch />
          <div className="topbar-actions">
            <span
              className="streak-chip ibtn"
              role="status"
              title={`${streak.current}-day learning streak`}
            >
              <Flame size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="cnt">{streak.current}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
