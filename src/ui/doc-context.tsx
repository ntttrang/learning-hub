import { createContext, useContext, type ReactNode } from 'react';
import type { Reference } from '../sdk/types';
import { isExternalUrl } from './external-url';

/**
 * DocId resolution seam for prose renderers. Content references docs by
 * `docId` only — the registry of real URLs lives in the loaded pack, so it
 * flows in through a provider mounted by the viewer that owns the content.
 * No provider (unit tests, isolated prose) simply degrades doc links to
 * literal text; nothing imports content at module level.
 */
export type DocResolver = (docId: string) => Reference | undefined;

const DocResolverContext = createContext<DocResolver | undefined>(undefined);

export function DocResolverProvider({
  resolveDoc,
  children,
}: {
  /** A pack without docs passes undefined — links degrade, nothing crashes. */
  resolveDoc: DocResolver | undefined;
  children: ReactNode;
}) {
  return <DocResolverContext.Provider value={resolveDoc}>{children}</DocResolverContext.Provider>;
}

/** The active docId resolver, if a viewer mounted one. */
export function useDocResolver(): DocResolver | undefined {
  return useContext(DocResolverContext);
}

/** Adapt a pack's docs registry into a resolver. */
export function registryResolver(
  docs: Record<string, Reference> | undefined,
): DocResolver | undefined {
  if (!docs) return undefined;
  return (docId) => docs[docId];
}

/**
 * The docIds that survive the single-href policy: resolvable to a registry
 * entry whose url is plain http(s). Viewers use the count to decide whether a
 * References section has anything to show at all.
 */
export function resolvableDocLinks(
  docIds: string[] | undefined,
  resolveDoc: DocResolver | undefined,
): { docId: string; doc: Reference }[] {
  if (!docIds) return [];
  return docIds.flatMap((docId) => {
    const doc = resolveDoc?.(docId);
    return doc && isExternalUrl(doc.url) ? [{ docId, doc }] : [];
  });
}

/**
 * Compact external-link chips for a lesson's `docIds`. Unresolvable or
 * non-http urls render nothing — the single href policy applies here too.
 */
export function DocLinkChips({ docIds }: { docIds?: string[] }) {
  const resolveDoc = useDocResolver();
  const links = resolvableDocLinks(docIds, resolveDoc);
  if (links.length === 0) return null;
  return (
    <div className="doc-chips">
      {links.map(({ docId, doc }) => (
        <a key={docId} className="doc-chip" href={doc.url} target="_blank" rel="noopener noreferrer">
          {doc.title}
        </a>
      ))}
    </div>
  );
}
