/**
 * The four mock exams: two per certification, each a fixed 100-minute,
 * 35-question paper drawn from the 240-question bank by official domain
 * weightings.
 *
 * domainPlans turn each domain's official weight range into a static count
 * for N=35, chosen so every count's share sits inside its range:
 *
 * - GH-900 (25–30/10–15/10–15/10–15/5–10/10–15/5–10):
 *   10, 5, 5, 5, 3, 5, 2 → 28.6%, 14.3%, 14.3%, 14.3%, 8.6%, 14.3%, 5.7%
 * - GH-200 (20–25/15–20/15–20/20–25/10–15):
 *   8, 7, 7, 8, 5 → 22.9%, 20%, 20%, 22.9%, 14.3%
 *
 * Seeds are constants: the same exam serves the same paper forever. Mock B
 * draws from what mock A left behind (20 per domain covers the worst case,
 * GH-900 d1's 10 + 10), so the two papers of a cert never share a question.
 */

import type { ExamConfig } from './types';
import { QUESTIONS } from './questions';
import { sampleExam, sampleIds } from '../utils/sample';

/** GH-900's seven domains, weighted per the Foundations study guide. */
const GH900_DOMAIN_PLAN: Record<string, number> = {
  'gh900-d1': 10,
  'gh900-d2': 5,
  'gh900-d3': 5,
  'gh900-d4': 5,
  'gh900-d5': 3,
  'gh900-d6': 5,
  'gh900-d7': 2,
};

/** GH-200's five domains, weighted per the GitHub Actions study guide. */
const GH200_DOMAIN_PLAN: Record<string, number> = {
  'gh200-d1': 8,
  'gh200-d2': 7,
  'gh200-d3': 7,
  'gh200-d4': 8,
  'gh200-d5': 5,
};

export const EXAMS: ExamConfig[] = [
  {
    id: 'gh900-mock-a',
    cert: 'gh900',
    title: 'GH-900 mock exam A',
    durationMin: 100,
    totalQuestions: 35,
    domainPlan: GH900_DOMAIN_PLAN,
    seed: 9001,
  },
  {
    id: 'gh900-mock-b',
    cert: 'gh900',
    title: 'GH-900 mock exam B',
    durationMin: 100,
    totalQuestions: 35,
    domainPlan: { ...GH900_DOMAIN_PLAN },
    seed: 9002,
  },
  {
    id: 'gh200-mock-a',
    cert: 'gh200',
    title: 'GH-200 mock exam A',
    durationMin: 100,
    totalQuestions: 35,
    domainPlan: GH200_DOMAIN_PLAN,
    seed: 2001,
  },
  {
    id: 'gh200-mock-b',
    cert: 'gh200',
    title: 'GH-200 mock exam B',
    durationMin: 100,
    totalQuestions: 35,
    domainPlan: { ...GH200_DOMAIN_PLAN },
    seed: 2002,
  },
];

/** Look up one exam by id. */
export function examById(id: string | undefined): ExamConfig | undefined {
  if (!id) return undefined;
  return EXAMS.find((exam) => exam.id === id);
}

/** The mock A exam sharing this exam's cert, when this exam is a mock B. */
function mockAPartner(exam: ExamConfig): ExamConfig | undefined {
  if (!exam.id.endsWith('-mock-b')) return undefined;
  const partnerId = exam.id.replace(/-mock-b$/, '-mock-a');
  return EXAMS.find((exam2) => exam2.id === partnerId);
}

/**
 * The paper a runner serves: seeded sampling over the whole bank, with a
 * mock B excluding every id its cert's mock A already drew.
 */
export function examQuestions(exam: ExamConfig) {
  const partner = mockAPartner(exam);
  const excludeIds = partner
    ? new Set(sampleIds(partner, QUESTIONS))
    : new Set<string>();
  return sampleExam(exam, QUESTIONS, excludeIds);
}
