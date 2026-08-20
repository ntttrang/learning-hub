import { createLocalStorageAdapter, type StorageAdapter } from './storage';

/**
 * Theme handling for the hub.
 *
 * Four settings: 'auto' follows the OS colour scheme live (no data-theme
 * attribute, so the CSS `prefers-color-scheme` media query in tokens.css
 * drives everything), while 'light', 'dark', and 'night' pin the scheme via
 * `data-theme` on <html>.
 *
 * The raw `cc-theme` string — not the Zustand persist blob — is the theme of
 * record: the FOUC script in index.html reads it before first paint and must
 * never parse JSON.
 */

export type ThemeSetting = 'auto' | 'light' | 'dark' | 'night';

// Deliberately shared with learn-gh-200 (its useTheme.ts reads the same key):
// one theme preference carries across apps, and degradation is one-way-safe —
// gh-200 rejects the hub's 'night' and falls back to auto.
export const THEME_KEY = 'cc-theme';

const THEME_ATTR = 'data-theme';
const VALID_SETTINGS: readonly ThemeSetting[] = ['auto', 'light', 'dark', 'night'];

/** Shared default adapter; tests inject their own instead of rebinding this. */
export const defaultThemeStorage: StorageAdapter = createLocalStorageAdapter();

/**
 * Raw stored setting, or null when absent or invalid.
 * Distinguishes "user chose auto" from "nothing stored" for precedence checks.
 */
export function readRawThemeSetting(
  adapter: StorageAdapter = defaultThemeStorage,
): ThemeSetting | null {
  try {
    const stored = adapter.getItem(THEME_KEY);
    return VALID_SETTINGS.includes(stored as ThemeSetting)
      ? (stored as ThemeSetting)
      : null;
  } catch {
    // Storage unavailable (blocked, quota API missing) — treat as unset.
    return null;
  }
}

/** Read the stored setting; anything absent or invalid means 'auto'. */
export function readThemeSetting(
  adapter: StorageAdapter = defaultThemeStorage,
): ThemeSetting {
  return readRawThemeSetting(adapter) ?? 'auto';
}

/** Apply a setting to the document: pin data-theme, or clear it for auto. */
export function applyTheme(setting: ThemeSetting): void {
  if (setting === 'auto') {
    document.documentElement.removeAttribute(THEME_ATTR);
  } else {
    document.documentElement.setAttribute(THEME_ATTR, setting);
  }
}

/**
 * Persist the raw string. 'auto' is stored rather than deleted so the value
 * round-trips and rehydrate precedence can trust it.
 */
export function writeThemeSetting(
  adapter: StorageAdapter,
  setting: ThemeSetting,
): void {
  try {
    adapter.setItem(THEME_KEY, setting);
  } catch {
    // Storage unavailable — the visual change still applies for this visit.
  }
}

/**
 * Called once in main.tsx before first render (after the FOUC script), so
 * reloads never flash the wrong theme even if the script was stripped.
 */
export function bootstrapTheme(adapter: StorageAdapter = defaultThemeStorage): void {
  applyTheme(readThemeSetting(adapter));
}
