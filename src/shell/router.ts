import { useEffect, useState } from 'react';

/** Top-level hub routes: the home dashboard or one subject's workspace. */
export type HubRoute =
  | { view: 'home' }
  | {
      view: 'subject';
      subjectId: string;
      /** Tool id segment, e.g. `learn` in `#/subject/fx/learn/storage-models`. */
      mode?: string;
      /** Item inside the mode: lesson slug or id, exam id, lab id, … */
      id?: string;
      /** Any deeper segments, e.g. `['run']` or `['review', '2']` for exams. */
      rest?: string[];
    };

/**
 * Parse a location hash into a HubRoute.
 *
 * Supported shapes: ``/`#`/`#/` (hub home), `#/subject/:subjectId`, and
 * `#/subject/:subjectId/:mode[/:id[/…rest]]`. Anything unrecognised —
 * including an empty hash on first load — falls back to home, so a bad link
 * can never blank the page. Mode validity is the workspace's call: parsing
 * stays permissive and an unknown or disabled mode renders the overview.
 */
export function parseHash(hash: string): HubRoute {
  const segments = hash.replace(/^#/, '').split('/').filter(Boolean);
  const [head, subjectId, mode, id, ...rest] = segments;
  if (head !== 'subject' || !subjectId) return { view: 'home' };
  if (!mode) return { view: 'subject', subjectId };
  return {
    view: 'subject',
    subjectId,
    mode,
    id,
    rest: rest.length > 0 ? rest : undefined,
  };
}

/** Current route, read straight from the location. */
function currentRoute(): HubRoute {
  return parseHash(window.location.hash);
}

/**
 * Subscribe to hash navigation. Re-renders on every `hashchange` event,
 * including browser back/forward. Returns the live route.
 */
export function useHashRoute(): HubRoute {
  const [route, setRoute] = useState<HubRoute>(currentRoute);

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
