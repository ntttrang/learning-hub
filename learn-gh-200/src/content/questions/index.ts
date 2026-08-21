/**
 * Question bank aggregation — every practice question on the site, flat.
 *
 * Files are named per domain (`<cert>-dN-….questions.ts`) and each exports a
 * `questions` array. The GH-200 bank appends its files here alongside the
 * GH-900 ones; consumers (Practice, Mock exams) only ever import QUESTIONS
 * or byDomain, never a file directly.
 */

import type { Question } from '../types';
import { questions as gh900D1 } from './gh900-d1-git-and-github-basics.questions';
import { questions as gh900D2 } from './gh900-d2-work-with-repositories.questions';
import { questions as gh900D3 } from './gh900-d3-collaborate-using-github.questions';
import { questions as gh900D4 } from './gh900-d4-modern-development-practices.questions';
import { questions as gh900D5 } from './gh900-d5-manage-projects.questions';
import { questions as gh900D6 } from './gh900-d6-security-and-administration.questions';
import { questions as gh900D7 } from './gh900-d7-explore-community.questions';
import { questions as gh200D1 } from './gh200-d1-author-and-manage-workflows.questions';
import { questions as gh200D2 } from './gh200-d2-consume-and-troubleshoot-workflows.questions';
import { questions as gh200D3 } from './gh200-d3-author-and-maintain-actions.questions';
import { questions as gh200D4 } from './gh200-d4-manage-actions-for-the-enterprise.questions';
import { questions as gh200D5 } from './gh200-d5-secure-and-optimize-automation.questions';

export const QUESTIONS: Question[] = [
  ...gh900D1,
  ...gh900D2,
  ...gh900D3,
  ...gh900D4,
  ...gh900D5,
  ...gh900D6,
  ...gh900D7,
  ...gh200D1,
  ...gh200D2,
  ...gh200D3,
  ...gh200D4,
  ...gh200D5,
];

/** Every question authored for one domain, in authored order. */
export function byDomain(domainId: string): Question[] {
  return QUESTIONS.filter((question) => question.domainId === domainId);
}

/** Every question for one certification. */
export function byCert(cert: Question['cert']): Question[] {
  return QUESTIONS.filter((question) => question.cert === cert);
}
