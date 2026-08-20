import { beforeEach, describe, expect, it } from 'vitest';
import { HUB_STORE_KEY, useHubStore } from './store';
import { THEME_KEY } from './theme';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  useHubStore.setState({ theme: 'auto' });
});

describe('hub store theme slice', () => {
  it('setTheme applies to the document and writes the raw cc-theme string', () => {
    useHubStore.getState().setTheme('night');
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('night');
  });

  it('setTheme persists the blob under the hub store key', () => {
    useHubStore.getState().setTheme('dark');
    const persisted = JSON.parse(window.localStorage.getItem(HUB_STORE_KEY)!) as {
      state: { theme: string };
    };
    expect(persisted.state.theme).toBe('dark');
  });

  it('stores auto as the raw string instead of deleting the key', () => {
    useHubStore.getState().setTheme('light');
    useHubStore.getState().setTheme('auto');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('auto');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('lets the raw cc-theme string win over the persist blob on rehydrate', async () => {
    window.localStorage.setItem(THEME_KEY, 'light');
    window.localStorage.setItem(
      HUB_STORE_KEY,
      JSON.stringify({ state: { theme: 'night' }, version: 0 }),
    );
    await useHubStore.persist.rehydrate();
    expect(useHubStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('falls back to the blob theme when no raw cc-theme exists', async () => {
    window.localStorage.setItem(
      HUB_STORE_KEY,
      JSON.stringify({ state: { theme: 'night' }, version: 0 }),
    );
    await useHubStore.persist.rehydrate();
    expect(useHubStore.getState().theme).toBe('night');
    expect(document.documentElement.getAttribute('data-theme')).toBe('night');
  });
});
