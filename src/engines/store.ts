import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { type StorageAdapter } from './storage';
import {
  applyTheme,
  defaultThemeStorage,
  readRawThemeSetting,
  readThemeSetting,
  writeThemeSetting,
  type ThemeSetting,
} from './theme';

/**
 * Hub-wide persisted state, behind the swappable StorageAdapter so a future
 * cloud sync adapter can replace localStorage without touching callers.
 *
 * Phase 0 holds only the theme slice; progress/SRS/notes land with the
 * content SDK and are namespaced per subject when they do.
 */

export interface HubState {
  theme: ThemeSetting;
  setTheme: (next: ThemeSetting) => void;
}

export const HUB_STORE_KEY = 'cc-hub-store';

/** Bridge a StorageAdapter to zustand's StateStorage (shared by all stores). */
export function adapterAsStateStorage(adapter: StorageAdapter): StateStorage {
  return {
    getItem: (name) => adapter.getItem(name),
    setItem: (name, value) => adapter.setItem(name, value),
    removeItem: (name) => adapter.removeItem(name),
  };
}

export const useHubStore = create<HubState>()(
  persist(
    (set) => ({
      theme: readThemeSetting(),
      setTheme: (next) => {
        // cc-theme is the theme of record: write the raw string first so the
        // FOUC script on the next load agrees even if the blob write lags.
        applyTheme(next);
        writeThemeSetting(defaultThemeStorage, next);
        set({ theme: next });
      },
    }),
    {
      name: HUB_STORE_KEY,
      storage: createJSONStorage(() => adapterAsStateStorage(defaultThemeStorage)),
      // Rehydrate precedence resolves in merge, before any set: rehydrate
      // callbacks can run during create(), where the store binding does not
      // exist yet, so they must not reference this store.
      merge: (persisted, current) => {
        const fromBlob = (persisted as Partial<HubState> | undefined)?.theme;
        return {
          ...current,
          ...(persisted as Partial<HubState>),
          // The raw cc-theme string wins over the persist blob.
          theme: readRawThemeSetting() ?? fromBlob ?? current.theme,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
      },
    },
  ),
);
