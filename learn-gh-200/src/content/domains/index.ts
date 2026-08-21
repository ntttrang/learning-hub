/**
 * Domain registry — the single list every Learn view renders from.
 *
 * Phase 2 filled the seven GH-900 domains; phase 3 appended the five GH-200
 * domains. Files are aggregated by cert and number so lesson order always
 * matches the official study guides.
 */

import type { CertId, Domain } from '../types';
import { domain as gh900D1 } from './gh900-d1-git-and-github-basics';
import { domain as gh900D2 } from './gh900-d2-work-with-repositories';
import { domain as gh900D3 } from './gh900-d3-collaborate-using-github';
import { domain as gh900D4 } from './gh900-d4-modern-development-practices';
import { domain as gh900D5 } from './gh900-d5-manage-projects';
import { domain as gh900D6 } from './gh900-d6-security-and-administration';
import { domain as gh900D7 } from './gh900-d7-explore-community';
import { domain as gh200D1 } from './gh200-d1-author-and-manage-workflows';
import { domain as gh200D2 } from './gh200-d2-consume-and-troubleshoot-workflows';
import { domain as gh200D3 } from './gh200-d3-author-and-maintain-actions';
import { domain as gh200D4 } from './gh200-d4-manage-actions-for-the-enterprise';
import { domain as gh200D5 } from './gh200-d5-secure-and-optimize-automation';

export const DOMAINS: Domain[] = [
  gh900D1,
  gh900D2,
  gh900D3,
  gh900D4,
  gh900D5,
  gh900D6,
  gh900D7,
  gh200D1,
  gh200D2,
  gh200D3,
  gh200D4,
  gh200D5,
];

/** Domains for one cert, in official study-guide order. */
export function domainsByCert(cert: CertId): Domain[] {
  return DOMAINS.filter((domain) => domain.cert === cert).sort(
    (a, b) => a.number - b.number,
  );
}

/** Look up one domain by id. */
export function domainById(id: string | undefined): Domain | undefined {
  if (!id) return undefined;
  return DOMAINS.find((domain) => domain.id === id);
}

/** All lessons across a cert's domains, in domain order. */
export function lessonsByCert(cert: CertId) {
  return domainsByCert(cert).map((domain) => domain.lesson);
}
