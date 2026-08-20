import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HUB_STORE_KEY, useHubStore as staleImport } from './store';
import { THEME_KEY } from './theme';

// Module-init hydration: a real reload imports the store with storage already
// primed, so the rehydrate callbacks run during create() — not after. These
// tests re-import the module fresh with divergent values to cover that path;
// the static import above belongs to the earlier, empty-storage instance.
describe('store module-init rehydration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.resetModules();
  });

  it('keeps the raw cc-theme over a divergent persist blob when the module initializes', async () => {
    window.localStorage.setItem(THEME_KEY, 'light');
    window.localStorage.setItem(
      HUB_STORE_KEY,
      JSON.stringify({ state: { theme: 'night' }, version: 0 }),
    );

    const { useHubStore } = await import('./store');
    await vi.waitFor(() => {
      expect(useHubStore.persist.hasHydrated()).toBe(true);
    });

    expect(useHubStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('marks hydration finished even when raw key and blob agree', async () => {
    window.localStorage.setItem(THEME_KEY, 'night');
    window.localStorage.setItem(
      HUB_STORE_KEY,
      JSON.stringify({ state: { theme: 'night' }, version: 0 }),
    );

    const { useHubStore } = await import('./store');
    await vi.waitFor(() => {
      expect(useHubStore.persist.hasHydrated()).toBe(true);
    });

    expect(useHubStore.getState().theme).toBe('night');
    expect(staleImport.getState().theme).toBe('auto');
  });
});
