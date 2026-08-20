import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStorageAdapter, createMemoryAdapter, type StorageAdapter } from './storage';
import {
  applyTheme,
  bootstrapTheme,
  readRawThemeSetting,
  readThemeSetting,
  writeThemeSetting,
  type ThemeSetting,
} from './theme';

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

let adapter: StorageAdapter;

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  adapter = createMemoryAdapter();
});

describe('readThemeSetting', () => {
  it('defaults to auto with nothing stored', () => {
    expect(readThemeSetting(adapter)).toBe<ThemeSetting>('auto');
  });

  it('returns each stored setting', () => {
    for (const setting of ['light', 'dark', 'night', 'auto'] as const) {
      adapter.setItem(KEY, setting);
      expect(readThemeSetting(adapter)).toBe<ThemeSetting>(setting);
    }
  });

  it('treats an invalid value as auto', () => {
    adapter.setItem(KEY, 'midnight');
    expect(readThemeSetting(adapter)).toBe<ThemeSetting>('auto');
  });

  it('survives storage being unavailable', () => {
    const restore = blockStorage();
    try {
      expect(readThemeSetting(createLocalStorageAdapter())).toBe<ThemeSetting>('auto');
    } finally {
      restore();
    }
  });
});

describe('readRawThemeSetting', () => {
  it('distinguishes a stored auto from nothing stored', () => {
    expect(readRawThemeSetting(adapter)).toBeNull();
    adapter.setItem(KEY, 'auto');
    expect(readRawThemeSetting(adapter)).toBe<ThemeSetting>('auto');
  });
});

describe('applyTheme', () => {
  it('pins light, dark, and night via data-theme', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyTheme('night');
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
  });

  it('clears data-theme for auto so the media query drives the scheme', () => {
    applyTheme('dark');
    applyTheme('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('writeThemeSetting', () => {
  it('stores the raw string, including auto — never deletes the key', () => {
    writeThemeSetting(adapter, 'night');
    expect(adapter.getItem(KEY)).toBe('night');
    writeThemeSetting(adapter, 'auto');
    expect(adapter.getItem(KEY)).toBe('auto');
  });
});

describe('bootstrapTheme', () => {
  it('applies the stored setting before render', () => {
    adapter.setItem(KEY, 'night');
    bootstrapTheme(adapter);
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
  });
});
