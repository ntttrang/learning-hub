import { describe, expect, it } from 'vitest';
import { COMPARISONS } from './compare';
import { DOCS } from './docs';
import { DOMAINS } from './domains';
import { LABS } from './labs';
import type { LessonBlock } from './types';
import { extractDocIds } from '../utils/inline';

/** Every string of prose that can carry `[docId]` links. */
function proseStrings(blocks: LessonBlock[]): string[] {
  return blocks.flatMap((block) => {
    switch (block.kind) {
      case 'p':
      case 'h3':
      case 'tip':
        return [block.text];
      case 'list':
        return block.items;
      case 'table':
        return [...block.headers, ...block.rows.flat()];
      case 'code':
        return [];
    }
  });
}

/** Every docId referenced anywhere in lessons, labs, and sub-skill metadata. */
function allReferencedDocIds(): Set<string> {
  const ids = new Set<string>();
  for (const domain of DOMAINS) {
    for (const skill of domain.subSkills) {
      skill.docIds.forEach((id) => ids.add(id));
    }
    proseStrings(domain.lesson.blocks).forEach((text) => {
      extractDocIds(text).forEach((id) => ids.add(id));
    });
  }
  for (const lab of LABS) {
    [...lab.steps, ...lab.outcomes, ...lab.checks, lab.summary].forEach((text) => {
      extractDocIds(text).forEach((id) => ids.add(id));
    });
  }
  return ids;
}

describe('content integrity', () => {
  it('resolves every referenced docId in the DOCS registry', () => {
    const missing = [...allReferencedDocIds()].filter((id) => !(id in DOCS));
    expect(missing).toEqual([]);
  });

  it('points every lab at a real domain', () => {
    const domainIds = new Set(DOMAINS.map((domain) => domain.id));
    const orphaned = LABS.filter((lab) => !domainIds.has(lab.domainId));
    expect(orphaned.map((lab) => lab.id)).toEqual([]);
  });

  it('gives every domain exactly one lesson, and ids line up', () => {
    for (const domain of DOMAINS) {
      expect(domain.lesson.domainId, domain.id).toBe(domain.id);
      expect(DOMAINS.filter((item) => item.lesson.id === domain.lesson.id)).toHaveLength(1);
    }
  });

  it('carries exactly seven GH-900 domains in study-guide order', () => {
    const gh900 = DOMAINS.filter((domain) => domain.cert === 'gh900');
    expect(gh900).toHaveLength(7);
    expect(gh900.map((domain) => domain.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('carries exactly five GH-200 domains in study-guide order', () => {
    const gh200 = DOMAINS.filter((domain) => domain.cert === 'gh200');
    expect(gh200).toHaveLength(5);
    expect(gh200.map((domain) => domain.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives every sub-skill 1–3 docIds that resolve', () => {
    for (const domain of DOMAINS) {
      for (const skill of domain.subSkills) {
        expect(skill.docIds.length, `${domain.id}/${skill.id}`).toBeGreaterThanOrEqual(1);
        expect(skill.docIds.length, `${domain.id}/${skill.id}`).toBeLessThanOrEqual(3);
        for (const docId of skill.docIds) {
          expect(DOCS[docId], `${domain.id}/${skill.id} -> ${docId}`).toBeDefined();
        }
      }
    }
  });

  it('keeps lessons inside the per-cert block budget (GH-900 ~16, GH-200 14–22)', () => {
    for (const domain of DOMAINS) {
      const budget = domain.cert === 'gh200' ? { min: 14, max: 22 } : { min: 0, max: 16 };
      const size = domain.lesson.blocks.length;
      expect(size, `${domain.id} lesson has ${size} blocks`).toBeGreaterThanOrEqual(budget.min);
      expect(size, `${domain.id} lesson has ${size} blocks`).toBeLessThanOrEqual(budget.max);
    }
  });

  it('shapes labs to the phase contract (4–8 tasks, 2–4 outcomes, 2–4 checks)', () => {
    for (const lab of LABS) {
      expect(lab.steps.length, `${lab.id} steps`).toBeGreaterThanOrEqual(4);
      expect(lab.steps.length, `${lab.id} steps`).toBeLessThanOrEqual(8);
      expect(lab.outcomes.length, `${lab.id} outcomes`).toBeGreaterThanOrEqual(2);
      expect(lab.outcomes.length, `${lab.id} outcomes`).toBeLessThanOrEqual(4);
      expect(lab.checks.length, `${lab.id} checks`).toBeGreaterThanOrEqual(2);
      expect(lab.checks.length, `${lab.id} checks`).toBeLessThanOrEqual(4);
    }
  });

  it('keeps every docId unique (no two keys for one page)', () => {
    const urls = Object.values(DOCS).map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('points the living lab at this repo’s deploy workflow and Actions runs', () => {
    const living = LABS.find((lab) => lab.id === 'gh200-lab-06');
    expect(living).toBeDefined();
    const linked = new Set(
      [living!.summary, ...living!.steps, ...living!.outcomes, ...living!.checks]
        .flatMap((text) => extractDocIds(text)),
    );
    expect(linked.has('repo-deploy-workflow')).toBe(true);
    expect(linked.has('repo-actions-runs')).toBe(true);
  });
});

describe('compare content integrity', () => {
  /** Every prose string a comparison carries — rows cite inside their cells. */
  function compareStrings(): string[] {
    return COMPARISONS.flatMap((comparison) => [
      comparison.title,
      comparison.counterpart,
      comparison.description,
      ...comparison.rows.flatMap((row) => [row.dimension, row.github, row.other]),
    ]);
  }

  it('holds exactly the two planned comparisons with unique ids', () => {
    expect(COMPARISONS.map((comparison) => comparison.id)).toEqual([
      'actions-vs-jenkins',
      'actions-vs-aws',
    ]);
  });

  it('keeps each table near the ~10-row fence (non-goals forbid more comparisons)', () => {
    for (const comparison of COMPARISONS) {
      expect(comparison.rows.length, comparison.id).toBeGreaterThanOrEqual(8);
      expect(comparison.rows.length, comparison.id).toBeLessThanOrEqual(11);
    }
  });

  it('resolves every docId cited inside compare cells', () => {
    const missing = compareStrings()
      .flatMap((text) => extractDocIds(text))
      .filter((id) => !(id in DOCS));
    expect(missing).toEqual([]);
  });

  it('cites at least one doc link in every row', () => {
    for (const comparison of COMPARISONS) {
      for (const row of comparison.rows) {
        const cited = [...extractDocIds(row.github), ...extractDocIds(row.other)];
        expect(cited.length, `${comparison.id} / ${row.dimension}`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('describes pricing models without dollar figures', () => {
    for (const text of compareStrings()) {
      expect(text, text).not.toMatch(/\$\s?\d/);
      expect(text, text).not.toMatch(/\b\d+[\s.]*(USD|dollars)\b/i);
    }
  });
});
