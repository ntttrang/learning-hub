import { describe, expect, it } from 'vitest';
import { createLocalStorageAdapter, createMemoryAdapter } from './storage';

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

describe('createMemoryAdapter', () => {
  it('round-trips values and reports missing keys as null', () => {
    const adapter = createMemoryAdapter();
    expect(adapter.getItem('missing')).toBeNull();
    adapter.setItem('cc-theme', 'night');
    expect(adapter.getItem('cc-theme')).toBe('night');
    adapter.removeItem('cc-theme');
    expect(adapter.getItem('cc-theme')).toBeNull();
  });
});

describe('createLocalStorageAdapter', () => {
  it('reads and writes through localStorage when it is writable', () => {
    const adapter = createLocalStorageAdapter();
    adapter.setItem('cc-theme', 'dark');
    expect(adapter.getItem('cc-theme')).toBe('dark');
    expect(window.localStorage.getItem('cc-theme')).toBe('dark');
    adapter.removeItem('cc-theme');
    expect(window.localStorage.getItem('cc-theme')).toBeNull();
  });

  it('falls back to the memory adapter when storage is blocked', () => {
    const restore = blockStorage();
    try {
      const adapter = createLocalStorageAdapter();
      adapter.setItem('cc-theme', 'night');
      // The fallback keeps the value alive for the session…
      expect(adapter.getItem('cc-theme')).toBe('night');
      // …and never throws at the caller.
      expect(() => adapter.setItem('cc-theme', 'auto')).not.toThrow();
    } finally {
      restore();
    }
  });
});
