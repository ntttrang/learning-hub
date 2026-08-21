import { describe, expect, it } from 'vitest';
import { DOCS } from '../docs';
import { DOMAINS, domainById } from '../domains';
import type { Question } from '../types';
import { byCert, byDomain, QUESTIONS } from './index';

/** The GH-900 study guide's seven domains, each with its question file. */
const GH900_DOMAIN_IDS = DOMAINS.filter((d) => d.cert === 'gh900').map((d) => d.id);

/** The GH-200 study guide's five domains, each with its question file. */
const GH200_DOMAIN_IDS = DOMAINS.filter((d) => d.cert === 'gh200').map((d) => d.id);

const CODING_KINDS: Question['kind'][] = ['fill', 'bug', 'order'];

describe('question bank totals', () => {
  it('holds exactly 240 questions: 140 GH-900 plus 100 GH-200', () => {
    expect(QUESTIONS).toHaveLength(240);
    expect(byCert('gh900')).toHaveLength(140);
    expect(byCert('gh200')).toHaveLength(100);
  });

  it('gives every domain of both certs exactly 20 questions', () => {
    expect(GH900_DOMAIN_IDS).toHaveLength(7);
    expect(GH200_DOMAIN_IDS).toHaveLength(5);
    for (const domainId of [...GH900_DOMAIN_IDS, ...GH200_DOMAIN_IDS]) {
      expect(byDomain(domainId), domainId).toHaveLength(20);
    }
  });

  it('keeps question ids unique across the whole bank', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('per-domain kind mix', () => {
  it('meets the minimums: ≥12 single, ≥3 multi, ≥1 coding per domain', () => {
    for (const domainId of GH900_DOMAIN_IDS) {
      const kinds = byDomain(domainId).map((q) => q.kind);
      expect(kinds.filter((k) => k === 'single').length, `${domainId} single`).toBeGreaterThanOrEqual(12);
      expect(kinds.filter((k) => k === 'multi').length, `${domainId} multi`).toBeGreaterThanOrEqual(3);
      expect(kinds.filter((k) => CODING_KINDS.includes(k)).length, `${domainId} coding`).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers all three formats — single, multi, and coding — in every domain', () => {
    for (const domainId of GH900_DOMAIN_IDS) {
      const kinds = new Set(byDomain(domainId).map((q) => q.kind));
      expect(kinds.has('single'), `${domainId} has single`).toBe(true);
      expect(kinds.has('multi'), `${domainId} has multi`).toBe(true);
      expect(
        [...kinds].some((k) => CODING_KINDS.includes(k)),
        `${domainId} has a coding kind`,
      ).toBe(true);
    }
  });

  it('puts ≥2 fill-or-bug YAML items in the Actions/Codespaces domain', () => {
    const d4 = byDomain('gh900-d4');
    const yamlish = d4.filter((q) => q.kind === 'fill' || q.kind === 'bug');
    expect(yamlish.length).toBeGreaterThanOrEqual(2);
  });

  it('drills GitHub Flow ordering in domain 1 and 2FA/branch-protection ordering in domain 6', () => {
    const d1Order = byDomain('gh900-d1').filter(
      (q) => q.kind === 'order' && q.subSkillId === 'd1-github-flow',
    );
    expect(d1Order.length).toBeGreaterThanOrEqual(1);

    const d6Order = byDomain('gh900-d6').filter(
      (q) =>
        q.kind === 'order' &&
        (q.subSkillId === 'd6-2fa-passkeys' || q.subSkillId === 'd6-visibility-protection'),
    );
    expect(d6Order.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GH-200 per-domain kind mix', () => {
  /** Phase 5 contract: the advanced exam skews to YAML-heavy coding items. */
  const CODING_MINIMUMS: Record<string, number> = {
    'gh200-d1': 4,
    'gh200-d2': 3,
    'gh200-d3': 3,
    'gh200-d4': 3,
    'gh200-d5': 4,
  };

  it('meets the minimums: ≥10 single, ≥3 multi, and the per-domain coding floor', () => {
    for (const domainId of GH200_DOMAIN_IDS) {
      const kinds = byDomain(domainId).map((q) => q.kind);
      expect(kinds.filter((k) => k === 'single').length, `${domainId} single`).toBeGreaterThanOrEqual(10);
      expect(kinds.filter((k) => k === 'multi').length, `${domainId} multi`).toBeGreaterThanOrEqual(3);
      expect(
        kinds.filter((k) => CODING_KINDS.includes(k)).length,
        `${domainId} coding`,
      ).toBeGreaterThanOrEqual(CODING_MINIMUMS[domainId]!);
    }
  });

  it('covers all three formats — single, multi, and coding — in every domain', () => {
    for (const domainId of GH200_DOMAIN_IDS) {
      const kinds = new Set(byDomain(domainId).map((q) => q.kind));
      expect(kinds.has('single'), `${domainId} has single`).toBe(true);
      expect(kinds.has('multi'), `${domainId} has multi`).toBe(true);
      expect(
        [...kinds].some((k) => CODING_KINDS.includes(k)),
        `${domainId} has a coding kind`,
      ).toBe(true);
    }
  });

  it('pins the phase-named drills: matrix and context fill-ins, GITHUB_OUTPUT bug, workflow order in d1', () => {
    const d1 = byDomain('gh200-d1');
    expect(d1.filter((q) => q.kind === 'fill' && q.subSkillId === 'd1-matrix').length).toBeGreaterThanOrEqual(1);
    expect(d1.filter((q) => q.kind === 'fill' && q.subSkillId === 'd1-contexts-expressions').length).toBeGreaterThanOrEqual(1);
    expect(d1.filter((q) => q.kind === 'bug' && q.subSkillId === 'd1-passing-data').length).toBeGreaterThanOrEqual(1);
    expect(d1.filter((q) => q.kind === 'order' && q.subSkillId === 'd1-jobs-steps').length).toBeGreaterThanOrEqual(1);
  });

  it('pins the phase-named drills: log-diagnosis bug and rerun order in d2, injection/OIDC/pinning in d5', () => {
    const d2 = byDomain('gh200-d2');
    expect(d2.filter((q) => q.kind === 'bug' && q.subSkillId === 'd2-diagnose-failures').length).toBeGreaterThanOrEqual(1);
    expect(d2.filter((q) => q.kind === 'order' && q.subSkillId === 'd2-expand-config').length).toBeGreaterThanOrEqual(1);

    const d5 = byDomain('gh200-d5');
    expect(d5.filter((q) => q.kind === 'bug' && q.subSkillId === 'd5-script-injection').length).toBeGreaterThanOrEqual(1);
    expect(d5.filter((q) => q.kind === 'fill' && q.subSkillId === 'd5-oidc').length).toBeGreaterThanOrEqual(1);
    expect(d5.filter((q) => q.kind === 'order' && q.subSkillId === 'd5-pinning').length).toBeGreaterThanOrEqual(1);
  });
});

describe('question shape', () => {
  it('anchors every question to a real domain, cert, sub-skill, and doc', () => {
    for (const question of QUESTIONS) {
      const domain = domainById(question.domainId);
      expect(domain, question.id).toBeDefined();
      expect(question.cert, question.id).toBe(domain!.cert);
      expect(
        domain!.subSkills.some((skill) => skill.id === question.subSkillId),
        `${question.id} -> ${question.subSkillId}`,
      ).toBe(true);
      expect(DOCS[question.docId], `${question.id} -> ${question.docId}`).toBeDefined();
    }
  });

  it('teaches in every explanation (at least one full sentence)', () => {
    for (const question of QUESTIONS) {
      expect(question.explanation.length, question.id).toBeGreaterThanOrEqual(60);
      expect(question.explanation, question.id).toMatch(/[.!?]$/);
    }
  });

  it('gives single questions exactly 4 options and an in-range answer', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'single') continue;
      expect(question.options.length, question.id).toBe(4);
      expect(question.answerIndex, question.id).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex, question.id).toBeLessThan(question.options.length);
    }
  });

  it('gives multi questions 4–5 options, 2–3 distinct correct answers, and a choose-all stem', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'multi') continue;
      expect(question.options.length, question.id).toBeGreaterThanOrEqual(4);
      expect(question.options.length, question.id).toBeLessThanOrEqual(5);
      expect(new Set(question.answerIndexes).size, question.id).toBe(question.answerIndexes.length);
      expect(question.answerIndexes.length, question.id).toBeGreaterThanOrEqual(2);
      expect(question.answerIndexes.length, question.id).toBeLessThanOrEqual(3);
      for (const index of question.answerIndexes) {
        expect(index, question.id).toBeGreaterThanOrEqual(0);
        expect(index, question.id).toBeLessThan(question.options.length);
      }
      expect(question.stem, question.id).toMatch(/choose all that apply/i);
    }
  });

  it('gives fill questions one placeholder per blank and non-empty answers', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'fill') continue;
      const placeholders = question.codeTemplate.split('___').length - 1;
      expect(placeholders, question.id).toBe(question.blanks.length);
      expect(question.blanks.length, question.id).toBeGreaterThanOrEqual(1);
      for (const blank of question.blanks) {
        expect(blank.answer.trim().length, question.id).toBeGreaterThan(0);
        expect(Array.isArray(blank.alternatives), question.id).toBe(true);
      }
    }
  });

  it('gives bug questions an in-range buggy line', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'bug') continue;
      expect(question.codeLines.length, question.id).toBeGreaterThanOrEqual(3);
      expect(question.buggyLineIndex, question.id).toBeGreaterThanOrEqual(0);
      expect(question.buggyLineIndex, question.id).toBeLessThan(question.codeLines.length);
    }
  });

  it('gives order questions ≥3 distinct items', () => {
    for (const question of QUESTIONS) {
      if (question.kind !== 'order') continue;
      expect(question.items.length, question.id).toBeGreaterThanOrEqual(3);
      expect(new Set(question.items).size, question.id).toBe(question.items.length);
    }
  });
});
