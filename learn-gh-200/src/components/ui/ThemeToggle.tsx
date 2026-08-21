import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeSetting } from '../../hooks/useTheme';

const NEXT: Record<ThemeSetting, ThemeSetting> = {
  auto: 'light',
  light: 'dark',
  dark: 'auto',
};

const LABEL: Record<ThemeSetting, string> = {
  auto: 'Theme: auto',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

/**
 * Round icon button cycling auto → light → dark. Auto shows a monitor
 * (follows the system), light a sun, dark a moon.
 */
export function ThemeToggle() {
  const [setting, setSetting] = useTheme();
  const Icon = setting === 'auto' ? Monitor : setting === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={LABEL[setting]}
      title={LABEL[setting]}
      onClick={() => setSetting(NEXT[setting])}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
