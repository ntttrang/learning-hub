import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  bootstrapTheme,
  readThemeSetting,
  useTheme,
  type ThemeSetting,
} from './useTheme';

const KEY = 'cc-theme';

/** Swap window.localStorage for a throwing getter, the way blocked storage looks. */
function blockStorage() {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage denied', 'SecurityError');
    },
  });
  return () => {
    if (original) Object.defineProperty(window, 'localStorage', original);
  };
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('readThemeSetting', () => {
  it('defaults to auto with nothing stored', () => {
    expect(readThemeSetting()).toBe<ThemeSetting>('auto');
  });

  it('returns a stored setting', () => {
    window.localStorage.setItem(KEY, 'dark');
    expect(readThemeSetting()).toBe<ThemeSetting>('dark');
  });

  it('treats an invalid value as auto', () => {
    window.localStorage.setItem(KEY, 'midnight');
    expect(readThemeSetting()).toBe<ThemeSetting>('auto');
  });

  it('survives storage being unavailable', () => {
    const restore = blockStorage();
    try {
      expect(readThemeSetting()).toBe<ThemeSetting>('auto');
    } finally {
      restore();
    }
  });
});

describe('applyTheme and bootstrapTheme', () => {
  it('pins light and dark via data-theme', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('clears data-theme for auto so the media query drives the scheme', () => {
    applyTheme('dark');
    applyTheme('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('bootstrap applies the stored setting before render', () => {
    window.localStorage.setItem(KEY, 'dark');
    bootstrapTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('useTheme', () => {
  it('updates the document, persists, and re-renders', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe<ThemeSetting>('auto');

    act(() => result.current[1]('light'));
    expect(result.current[0]).toBe<ThemeSetting>('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem(KEY)).toBe('light');
  });

  it('still switches visually when storage is unavailable', () => {
    const restore = blockStorage();
    try {
      const { result } = renderHook(() => useTheme());
      act(() => result.current[1]('dark'));
      expect(result.current[0]).toBe<ThemeSetting>('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    } finally {
      restore();
    }
  });
});
