/**
 * Lab registry — one list every Lab view renders from.
 *
 * Phase 2 filled the seven GH-900 labs; phase 3 appended the GH-200 labs,
 * including the living-lab dissection of this site's own deploy pipeline.
 */

import type { Domain, Lab } from '../types';
import { gh900Labs } from './gh900-labs';
import { gh200Labs } from './gh200-labs';

export const LABS: Lab[] = [...gh900Labs, ...gh200Labs];

/** Look up one lab by id. */
export function labById(id: string | undefined): Lab | undefined {
  if (!id) return undefined;
  return LABS.find((lab) => lab.id === id);
}

/** Labs attached to one domain, in registry order. */
export function labsForDomain(domainId: string): Lab[] {
  return LABS.filter((lab) => lab.domainId === domainId);
}

/** Labs for every domain of one cert, in domain order. */
export function labsByDomains(domains: Domain[]): Lab[] {
  const order = new Map(domains.map((domain, index) => [domain.id, index]));
  return LABS.filter((lab) => order.has(lab.domainId)).sort(
    (a, b) => (order.get(a.domainId) ?? 0) - (order.get(b.domainId) ?? 0),
  );
}
