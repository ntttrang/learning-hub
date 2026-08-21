import { useEffect, useState } from 'react';
import { Coffee, Monitor, Moon, Sun } from 'lucide-react';
import { useHubStore } from '../engines/store';
import type { ThemeSetting } from '../engines/theme';

const OPTIONS = [
  { value: 'auto', label: 'Auto', title: 'Auto — follow system', Icon: Monitor },
  { value: 'light', label: 'Light', title: 'Light — clay cream', Icon: Sun },
  { value: 'dark', label: 'Dark', title: 'Dark — warm clay night', Icon: Moon },
  { value: 'night', label: 'Night', title: 'Deep night — amber, low-blue-light', Icon: Coffee },
] as const satisfies ReadonlyArray<{
  value: ThemeSetting;
  label: string;
  title: string;
  Icon: typeof Monitor;
}>;

/** prefers-color-scheme query, tolerant of environments without matchMedia. */
function darkModeQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
}

/**
 * Theme quartet inline in the header's action cluster: Monitor / Sun / Moon /
 * Cup icon buttons. The chosen mode fills accent and goes round; in auto mode
 * the concrete mode the OS resolves to gets a ring (`data-auto-shadow`) so the
 * UI always reflects what the OS shows.
 */
export default function ThemeToggle() {
  const theme = useHubStore((s) => s.theme);
  const setTheme = useHubStore((s) => s.setTheme);
  const [systemDark, setSystemDark] = useState(() => darkModeQuery()?.matches ?? false);

  useEffect(() => {
    const mql = darkModeQuery();
    if (!mql) return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const systemTheme: ThemeSetting = systemDark ? 'dark' : 'light';

  return (
    <div className="cc-theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, title, Icon }) => (
        <button
          key={value}
          type="button"
          className="ibtn"
          aria-label={label}
          aria-pressed={theme === value}
          data-theme-set={value}
          data-auto-shadow={
            theme === 'auto' && value === systemTheme ? 'true' : undefined
          }
          title={title}
          onClick={() => setTheme(value)}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
