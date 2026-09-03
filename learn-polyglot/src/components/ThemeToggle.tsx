import { useEffect, useState } from 'react';

type ThemeChoice = 'auto' | 'light' | 'dark' | 'night';

const KEY = 'cc-theme';
const VALID: ThemeChoice[] = ['auto', 'light', 'dark', 'night'];

function readStored(): ThemeChoice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (VALID as string[]).includes(stored) && stored !== 'auto') {
      return stored as ThemeChoice;
    }
  } catch {
    /* ignore */
  }
  return 'auto';
}

function applyTheme(theme: ThemeChoice, persist = true) {
  const root = document.documentElement;
  if (theme === 'auto') {
    root.removeAttribute('data-theme');
    if (persist) {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
    }
  } else {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try {
        localStorage.setItem(KEY, theme);
      } catch {
        /* ignore */
      }
    }
  }
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readStored());
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    applyTheme(choice, false);
  }, [choice]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const select = (next: ThemeChoice) => {
    setChoice(next);
    applyTheme(next, true);
  };

  const systemTheme: ThemeChoice = systemDark ? 'dark' : 'light';

  return (
    <div className="cc-theme-toggle" role="radiogroup" aria-label="Theme">
      {(
        [
          {
            id: 'auto',
            title: 'Auto — follow system',
            label: 'Auto',
            icon: (
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18" />
                <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />
              </svg>
            ),
          },
          {
            id: 'light',
            title: 'Light — clay cream',
            label: 'Light',
            icon: (
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ),
          },
          {
            id: 'dark',
            title: 'Dark — warm clay night',
            label: 'Dark',
            icon: (
              <svg viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ),
          },
          {
            id: 'night',
            title: 'Deep night — amber, low-blue-light',
            label: 'Night',
            icon: (
              <svg viewBox="0 0 24 24">
                <path d="M12 3a4 4 0 0 0 0 8 6 6 0 0 0 0-8z" />
                <path d="M12 14v7M9 18l3-1 3 1" />
              </svg>
            ),
          },
        ] as const
      ).map((btn) => (
        <button
          key={btn.id}
          type="button"
          data-theme-set={btn.id}
          aria-pressed={choice === btn.id}
          data-auto-shadow={choice === 'auto' && btn.id === systemTheme ? 'true' : undefined}
          title={btn.title}
          onClick={() => select(btn.id)}
        >
          {btn.icon}
          <span className="cc-theme-label">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Apply stored theme before first paint when possible. */
export function initThemeEarly() {
  applyTheme(readStored(), false);
}
