/**
 * Swappable persistence seam for all user data.
 *
 * The hub is client-only for now, so the default adapter is `localStorage`
 * wrapped so it can never throw at the UI. Engines depend on this interface
 * — not on `window.localStorage` — so a future Supabase/cloud adapter drops
 * in without touching engine code.
 */

export interface StorageAdapter {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
}

/** In-memory adapter: session-scoped fallback and test double. */
export function createMemoryAdapter(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

/** Probe once whether localStorage is writable (blocked cookies, quota, missing API). */
function probeLocalStorage(): Storage | null {
  try {
    const store = window.localStorage;
    const probeKey = '__cc-hub-storage-probe__';
    store.setItem(probeKey, '1');
    store.removeItem(probeKey);
    return store;
  } catch {
    return null;
  }
}

/**
 * localStorage adapter that degrades to `fallback` when storage is denied.
 * Every operation stays inside try/catch so a mid-session permission change
 * degrades silently instead of crashing the app.
 */
export function createLocalStorageAdapter(
  fallback: StorageAdapter = createMemoryAdapter(),
): StorageAdapter {
  const store = probeLocalStorage();
  if (!store) return fallback;
  return {
    getItem: (name) => {
      try {
        return store.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        store.setItem(name, value);
      } catch {
        // Storage denied mid-session — drop the write, never throw.
      }
    },
    removeItem: (name) => {
      try {
        store.removeItem(name);
      } catch {
        // Ignore.
      }
    },
  };
}
