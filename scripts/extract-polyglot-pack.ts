/**
 * One-off pack extractor: the vendored Polyglot Revision Hub donor
 * (`learn-polyglot/data/**`) → the hub `content/languages/` JSON pack.
 *
 * This script is the provenance record for the generated files committed under
 * `content/languages/` — re-run it manually to regenerate after donor changes
 * (one-shot by decision; the donor-backed parity suite is the drift gate).
 *
 * Usage: npm run content:extract-polyglot [-- --dry-run]
 *
 * All extraction logic lives in the side-effect-free `polyglot-extract-lib.ts`;
 * this entry only wires I/O behind an explicit entry guard so test imports can
 * never execute an extraction. Authored touches are marked in the lib and
 * counted in the derivation log; before any write this script additionally
 * asserts: donor ids kebab-clean (prefix-only id rule), migrated ids globally
 * unique, per-section counts equal donor counts, and the assembled pack passes
 * `validateSubject` with zero issues.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { assertKebabCleanIds, assertUniqueIds, polyglotId } from '../src/engines/polyglot-ids';
import { validateSubject } from '../src/sdk/validate';
import type { SubjectContent } from '../src/sdk/types';
import {
  buildPack,
  LANG_ORDER,
  readDonorData,
} from './polyglot-extract-lib';

const SUBJECT_DIR_SEGMENT = 'languages';
const PACK_DIR = join('content', SUBJECT_DIR_SEGMENT);

const jsonText = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

async function main(dryRun: boolean): Promise<void> {
  const donor = readDonorData(process.cwd());

  /* ---- donor-id guard: prefix-only rule requires verbatim kebab ids ---- */
  const donorIds = [
    ...LANG_ORDER.flatMap((l) => donor.learn[l].lessons.map((x) => x.id)),
    ...LANG_ORDER.flatMap((l) => donor.labs[l].labs.map((x) => x.id)),
    ...LANG_ORDER.flatMap((l) => donor.practice[l].problems.map((x) => x.id)),
    ...LANG_ORDER.flatMap((l) => donor.framework[l].challenges.map((x) => x.id)),
    ...LANG_ORDER.flatMap((l) => donor.quiz[l].questions.map((x) => x.id)),
    ...donor.compare.topics.map((x) => x.id),
  ];
  assertKebabCleanIds(donorIds, 'donor data');

  const { files, derivations, quizRemap } = buildPack(donor);

  /* ---- count parity: every donor entity migrated exactly once ---- */
  const codingToLabs = Object.values(quizRemap).filter((d) => d === 'lab').length;
  const counts = {
    lessons: Object.keys(files).filter((p) => p.includes('/lessons/')).length,
    questions: Object.keys(files).filter((p) => p.includes('/questions/')).length,
    labs: (files['content/languages/labs.json'] as unknown[]).length,
    comparisons: (files['content/languages/comparisons.json'] as unknown[]).length,
  };
  const donorCounts = {
    lessons: LANG_ORDER.reduce((n, l) => n + donor.learn[l].lessons.length, 0)
      + LANG_ORDER.length, // + authored framework-overview lesson per language
    questions: LANG_ORDER.reduce((n, l) => n + donor.quiz[l].questions.length, 0) - codingToLabs,
    labs:
      LANG_ORDER.reduce((n, l) => n + donor.labs[l].labs.length, 0)
      + LANG_ORDER.reduce((n, l) => n + donor.practice[l].problems.length, 0)
      + LANG_ORDER.reduce((n, l) => n + donor.framework[l].challenges.length, 0)
      + codingToLabs,
    comparisons: donor.compare.topics.length,
  };
  for (const key of Object.keys(counts) as (keyof typeof counts)[]) {
    if (counts[key] !== donorCounts[key]) {
      throw new Error(`count parity failed for ${key}: pack ${counts[key]} vs donor ${donorCounts[key]}`);
    }
  }

  /* ---- migrated-id uniqueness ---- */
  assertUniqueIds(
    [...donorIds.map(polyglotId), 'plg-exam-1'],
    'all migrated entities',
  );

  /* ---- schema validation before any write ---- */
  const content = {
    subject: files['content/languages/subject.json'],
    docs: files['content/languages/docs.json'],
    domains: files['content/languages/domains.json'],
    modules: files['content/languages/modules.json'],
    lessons: Object.entries(files).filter(([p]) => p.includes('/lessons/')).map(([, v]) => v),
    questions: Object.entries(files).filter(([p]) => p.includes('/questions/')).map(([, v]) => v),
    labs: files['content/languages/labs.json'],
    exams: files['content/languages/exams.json'],
    comparisons: files['content/languages/comparisons.json'],
  } as unknown as SubjectContent;
  const issues = validateSubject(content);
  if (issues.length > 0) {
    for (const issue of issues.slice(0, 20)) {
      console.error(`${issue.code} @ ${issue.path}: ${issue.message}`);
    }
    throw new Error(`validation failed with ${issues.length} issue(s) — nothing written`);
  }

  /* ---- report, then write (prune to generated set, incl. scaffold ghosts) ---- */
  console.log(
    `polyglot extraction: ${counts.lessons} lessons, ${counts.questions} questions, ${counts.labs} labs, ${counts.comparisons} comparisons`,
  );
  console.log('derivation log:', JSON.stringify(derivations, null, 2));
  console.log(`quiz remap: ${codingToLabs} coding questions -> labs`);
  if (dryRun) {
    console.log('--dry-run: nothing written');
    return;
  }
  await rm(PACK_DIR, { recursive: true, force: true });
  await mkdir(PACK_DIR, { recursive: true });
  for (const [path, value] of Object.entries(files)) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, jsonText(value));
  }
  console.log(`wrote ${Object.keys(files).length} files under content/languages/`);
}

if (process.argv[1]?.endsWith('extract-polyglot-pack.ts')) {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  await main(dryRun);
}
