import { useEffect, useState } from 'react';

/** Sections the SPA can show. One section per top-level nav entry. */
export type Section = 'home' | 'learn' | 'lab' | 'practice' | 'exams' | 'compare';

/** A parsed hash route: section plus optional detail id (domain, lab, exam…)
 * and any deeper segments (exam `run` / `review/:index`). */
export interface Route {
  section: Section;
  id?: string;
  /** Segments after the id, e.g. `['run']` or `['review', '2']`. */
  rest?: string[];
}

/**
 * Parse a location hash into a Route.
 *
 * Supported shapes: `#/`, `#/learn`, `#/learn/git-basics`,
 * `#/exams/gh900-mock-a/run`, `#/exams/gh900-mock-a/review/0`.
 * Anything unrecognised (including an empty hash on first load) falls back to
 * the home section, so a bad link can never blank the page.
 */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const segments = path.split('/').filter(Boolean);
  const [rawSection, id, ...rest] = segments;

  switch (rawSection) {
    case 'learn':
    case 'lab':
    case 'practice':
    case 'exams':
      if (!id) return { section: rawSection };
      return rest.length > 0 ? { section: rawSection, id, rest } : { section: rawSection, id };
    case 'compare':
      return { section: 'compare' };
    default:
      return { section: 'home' };
  }
}

/** Current route, read straight from the location. */
function currentRoute(): Route {
  return parseHash(window.location.hash);
}

/**
 * Subscribe to hash navigation. Re-renders on every `hashchange` event,
 * including browser back/forward. Returns the live route.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

/** Navigate by setting the hash; `<a href="#/…">` links do the same thing. */
export function navigate(path: string): void {
  window.location.hash = path;
}
