import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadManifest } from '../lib/data';
import { loadProgress, setLastLang } from '../lib/progress';
import type { LangId, Manifest } from '../lib/types';

interface AppContextValue {
  manifest: Manifest | null;
  loading: boolean;
  error: string | null;
  lang: LangId;
  setLang: (lang: LangId) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const VALID_LANGS: LangId[] = ['java', 'go', 'python', 'ruby'];

function coerceLang(value: string | undefined): LangId {
  return VALID_LANGS.includes(value as LangId) ? (value as LangId) : 'java';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<LangId>(() => coerceLang(loadProgress().lastLang));

  useEffect(() => {
    let cancelled = false;
    loadManifest()
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: LangId) => {
    setLangState(next);
    setLastLang(next);
  }, []);

  const value = useMemo(
    () => ({ manifest, loading, error, lang, setLang }),
    [manifest, loading, error, lang, setLang],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
