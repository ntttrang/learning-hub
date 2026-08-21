import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { searchEntries, type SearchEntry } from '../engines/search';
import { navigate } from './router';
import { buildHubSearchEntries } from './search-entries';

const KIND_LABEL: Record<SearchEntry['kind'], string> = {
  subject: 'Subject',
  lesson: 'Lesson',
  lab: 'Lab',
};

/**
 * Topbar search over every installed pack (subjects, lessons, labs) plus the
 * roadmap placeholders. ⌘K / Ctrl+K focuses it from anywhere; results are
 * keyboard-navigable and jump straight to the target's hash route.
 */
export default function TopbarSearch() {
  // The pack set is static for a page session — build the index once.
  const entries = useMemo(buildHubSearchEntries, []);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchEntries(entries, query), [entries, query]);
  const showPop = open && query.trim().length > 0;

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A pointerdown outside the box (the dropdown's links included — they are
  // inside `boxRef`) closes the popover.
  useEffect(() => {
    if (!showPop) return;
    const onDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [showPop]);

  const commit = (entry: SearchEntry) => {
    navigate(entry.route);
    setQuery('');
    setOpen(false);
    setActive(0);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      commit(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="searchbox" ref={boxRef}>
      <div className="field">
        <Search size={16} strokeWidth={1.75} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search subjects, lessons, labs…"
          aria-label="Search the hub"
          role="combobox"
          aria-expanded={showPop}
          aria-controls="hub-search-pop"
          aria-activedescendant={showPop && results[active] ? `hub-search-opt-${active}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <kbd aria-hidden="true">⌘K</kbd>
      </div>

      {showPop && (
        <div className="search-pop" id="hub-search-pop" role="listbox" aria-label="Search results">
          {results.length === 0 ? (
            <div className="search-empty">No matches for “{query.trim()}”</div>
          ) : (
            results.map((entry, i) => (
              <a
                key={`${entry.kind}:${entry.route}:${entry.title}`}
                id={`hub-search-opt-${i}`}
                href={entry.route}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'on' : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(entry)}
              >
                <span className="kind" data-kind={entry.kind}>
                  {KIND_LABEL[entry.kind]}
                </span>
                <span className="hit">{entry.title}</span>
                <span className="where">{entry.subjectCode}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
