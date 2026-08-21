import { useCallback, useState } from 'react';

/**
 * Theme handling for the site.
 *
 * Three settings: 'auto' follows the OS colour scheme live (no data-theme
 * attribute, so the CSS `prefers-color-scheme` media query drives everything),
 * 'light' and 'dark' pin the scheme via `data-theme` on <html>.
 */

export type ThemeSetting = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'cc-theme';
const THEME_ATTR = 'data-theme';

/** Read the stored setting; anything absent or invalid means 'auto'. */
export function readThemeSetting(): ThemeSetting {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
    return 'auto';
  } catch {
    // Storage unavailable (blocked, quota API missing) — default, don't crash.
    return 'auto';
  }
}

/** Apply a setting to the document: pin data-theme, or clear it for auto. */
export function applyTheme(setting: ThemeSetting): void {
  if (setting === 'auto') {
    document.documentElement.removeAttribute(THEME_ATTR);
  } else {
    document.documentElement.setAttribute(THEME_ATTR, setting);
  }
}

/** Persist a setting and apply it. */
function storeThemeSetting(setting: ThemeSetting): void {
  applyTheme(setting);
  try {
    window.localStorage.setItem(STORAGE_KEY, setting);
  } catch {
    // Storage unavailable — the visual change still applies for this visit.
  }
}

/**
 * Called once in main.tsx before first render, so reloads never flash the
 * wrong theme: the stored setting is applied before React paints anything.
 */
export function bootstrapTheme(): void {
  applyTheme(readThemeSetting());
}

/** React binding: current setting plus a setter that persists and re-renders. */
export function useTheme(): [ThemeSetting, (setting: ThemeSetting) => void] {
  const [setting, setSetting] = useState<ThemeSetting>(readThemeSetting);

  const update = useCallback((next: ThemeSetting) => {
    storeThemeSetting(next);
    setSetting(next);
  }, []);

  return [setting, update];
}
