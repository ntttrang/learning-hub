import { useApp } from '../lib/AppContext';
import type { LangId } from '../lib/types';

export function LanguageSwitcher() {
  const { manifest, lang, setLang } = useApp();
  if (!manifest) return null;

  return (
    <div className="lang-switcher" role="group" aria-label="Language">
      {manifest.languages.map((l) => (
        <button
          key={l.id}
          type="button"
          className={`lang-pill${lang === l.id ? ' active' : ''}`}
          style={lang === l.id ? { background: l.accent } : undefined}
          onClick={() => setLang(l.id as LangId)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
