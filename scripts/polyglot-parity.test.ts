/**
 * Donor-backed parity suite for the Languages pack: proves the extraction
 * preserved `learn-polyglot/data/**` exactly once, verbatim-or-derived, with
 * the derivations asserted by number (never silent).
 *
 * Donor reads go through the same `readDonorData` the extractor uses; pack
 * reads go through the committed JSON on disk, so a stale or hand-edited pack
 * fails here. Derivation expectations are recomputed from the donor, and the
 * pack must match the extractor's derivation log exactly.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildPack, readDonorData, LANG_ORDER } from './polyglot-extract-lib';
import { polyglotId } from '../src/engines/polyglot-ids';
import { gradeQuestion } from '../src/sdk/registry/questions';
import type { Question } from '../src/sdk/types';

const donor = readDonorData(process.cwd());
const packDir = join(process.cwd(), 'content', 'languages');

const packJson = <T>(rel: string): T => JSON.parse(readFileSync(join(packDir, rel), 'utf8')) as T;
const readPackDir = (rel: string): string[] => readdirSync(join(packDir, rel)) as string[];
const packList = <T>(dir: string): T[] => readPackDir(dir).map((name) => packJson(`${dir}/${name}`));

const lessons = packList<Record<string, unknown>>('lessons');
const questions = packList<Question>('questions');
const labs = packJson<Record<string, unknown>[]>('labs.json');
const comparisons = packJson<Record<string, unknown>[]>('comparisons.json');
const exams = packJson<Record<string, unknown>[]>('exams.json');
const docs = packJson<Record<string, { title: string; url: string }>>('docs.json');

describe('polyglot pack parity — counts', () => {
  it('migrates every donor entity exactly once', () => {
    for (const lang of LANG_ORDER) {
      expect(
        lessons.filter((l) => l.domainId === `plg-${lang}`).length,
        `${lang} lessons (learn + framework overview)`,
      ).toBe(donor.learn[lang].lessons.length + 1);
      const donorLabsN =
        donor.labs[lang].labs.length +
        donor.practice[lang].problems.length +
        donor.framework[lang].challenges.length +
        donor.quiz[lang].questions.filter((q) => q.type === 'coding').length;
      expect(labs.filter((l) => l.domainId === `plg-${lang}`).length, `${lang} labs`).toBe(
        donorLabsN,
      );
      const donorQuestionsN = donor.quiz[lang].questions.filter((q) => q.type !== 'coding').length;
      expect(
        questions.filter((q) => q.domainId === `plg-${lang}`).length,
        `${lang} questions`,
      ).toBe(donorQuestionsN);
    }
    expect(comparisons.length).toBe(donor.compare.topics.length);
    expect(exams.length).toBe(1);
  });
});

describe('polyglot pack parity — id bijection via the shared helper', () => {
  it('every donor id is present exactly once under the prefix rule', () => {
    const packIds = new Set<string>();
    for (const l of lessons) packIds.add(String(l.id));
    for (const q of questions) packIds.add(q.id);
    for (const l of labs) packIds.add(String(l.id));
    for (const c of comparisons) packIds.add(String(c.id));
    for (const e of exams) packIds.add(String(e.id));

    const donorIds = [
      ...LANG_ORDER.flatMap((lang) => donor.learn[lang].lessons.map((x) => x.id)),
      ...LANG_ORDER.flatMap((lang) => donor.quiz[lang].questions.map((x) => x.id)),
      ...LANG_ORDER.flatMap((lang) => donor.labs[lang].labs.map((x) => x.id)),
      ...LANG_ORDER.flatMap((lang) => donor.practice[lang].problems.map((x) => x.id)),
      ...LANG_ORDER.flatMap((lang) => donor.framework[lang].challenges.map((x) => x.id)),
      ...donor.compare.topics.map((x) => x.id),
    ].map(polyglotId);

    for (const id of donorIds) expect(packIds.has(id), id).toBe(true);
    // authored ids exist too
    expect(packIds.has('plg-exam-1')).toBe(true);
    for (const lang of LANG_ORDER) {
      expect(packIds.has(polyglotId(`${lang}-framework-overview`))).toBe(true);
    }
  });

  it('the quiz remap sends coding to labs and nothing else', () => {
    const labIds = new Set(labs.map((l) => String(l.id)));
    const questionIds = new Set(questions.map((q) => q.id));
    for (const lang of LANG_ORDER) {
      for (const q of donor.quiz[lang].questions) {
        if (q.type === 'coding') {
          expect(labIds.has(polyglotId(q.id)), `${q.id} as lab`).toBe(true);
          expect(questionIds.has(polyglotId(q.id))).toBe(false);
        } else {
          expect(questionIds.has(polyglotId(q.id)), `${q.id} as question`).toBe(true);
        }
      }
    }
  });
});

describe('polyglot pack parity — body fidelity (verbatim or derivation output)', () => {
  it('lessons carry donor bodies and code samples verbatim', () => {
    for (const lang of LANG_ORDER) {
      for (const donorLesson of donor.learn[lang].lessons) {
        const packLesson = lessons.find((l) => l.id === polyglotId(donorLesson.id));
        expect(packLesson, donorLesson.id).toBeDefined();
        const blocks = packLesson!.blocks as { kind: string; body?: string; code?: string; language?: string }[];
        expect(blocks[0]).toEqual({ kind: 'md', body: donorLesson.body });
        const codeBlocks = blocks.slice(1);
        expect(codeBlocks.map((b) => b.code)).toEqual(
          (donorLesson.codeSamples ?? []).map((s) => s.code),
        );
        expect(codeBlocks.map((b) => b.language)).toEqual(
          (donorLesson.codeSamples ?? []).map((s) => s.language),
        );
        expect(packLesson!.minutes).toBe(donorLesson.estMinutes);
        expect(packLesson!.title).toBe(donorLesson.title);
      }
      // framework overview: tagline + overview verbatim inside the md block
      const fw = donor.framework[lang].framework;
      const overview = lessons.find((l) => l.id === polyglotId(`${lang}-framework-overview`));
      expect(String((overview!.blocks as { body: string }[])[0].body)).toBe(
        `**${fw.tagline}**\n\n${fw.overview}`,
      );
      expect(overview!.title).toBe(
        `${{ java: 'Java', go: 'Go', python: 'Python', ruby: 'Ruby' }[lang]} · ${fw.name}`,
      );
    }
  });

  it('labs carry donor goal/prompt as summary and solution/output verbatim in steps', () => {
    for (const lang of LANG_ORDER) {
      for (const donorLab of donor.labs[lang].labs) {
        const lab = labs.find((l) => l.id === polyglotId(donorLab.id));
        expect(lab, donorLab.id).toBeDefined();
        expect(lab!.summary).toBe(donorLab.goal);
        const instructions = (lab!.steps as { instructions: string }[]).map((s) => s.instructions).join('\n');
        expect(instructions).toContain(donorLab.solution);
        expect(instructions).toContain(donorLab.starterCode);
        if (donorLab.expectedOutput) expect(instructions).toContain(donorLab.expectedOutput);
        for (const step of donorLab.steps) expect(instructions).toContain(step);
      }
      for (const problem of donor.practice[lang].problems) {
        const lab = labs.find((l) => l.id === polyglotId(problem.id));
        expect(lab, problem.id).toBeDefined();
        expect(lab!.summary).toBe(problem.prompt);
        const instructions = (lab!.steps as { instructions: string }[])[0].instructions;
        expect(instructions).toContain(problem.solution);
        expect(instructions).toContain(problem.starterCode);
        for (const hint of problem.hints) expect(instructions).toContain(hint);
      }
      for (const challenge of donor.framework[lang].challenges) {
        const lab = labs.find((l) => l.id === polyglotId(challenge.id));
        expect(lab, challenge.id).toBeDefined();
        expect(lab!.summary).toBe(challenge.goal);
        const instructions = (lab!.steps as { instructions: string }[])[0].instructions;
        expect(instructions).toContain(challenge.solution);
        expect(instructions).toContain(challenge.concept);
      }
    }
  });

  it('questions carry donor prompts, explanations, options, and answers verbatim', () => {
    for (const lang of LANG_ORDER) {
      for (const donorQuestion of donor.quiz[lang].questions) {
        if (donorQuestion.type === 'coding') continue; // lab fidelity covered above
        const packQuestion = questions.find((q) => q.id === polyglotId(donorQuestion.id));
        expect(packQuestion, donorQuestion.id).toBeDefined();
        expect(packQuestion!.prompt).toBe(donorQuestion.prompt);
        expect(packQuestion!.explanation).toBe(donorQuestion.explanation);
        if (donorQuestion.type === 'mcq') {
          const q = packQuestion as Extract<Question, { kind: 'single' }>;
          expect(q.kind).toBe('single');
          expect(q.correct).toBe(donorQuestion.answer);
          expect(q.options).toEqual(donorQuestion.options);
        } else if (donorQuestion.type === 'multi') {
          const q = packQuestion as Extract<Question, { kind: 'multi' }>;
          expect(q.kind).toBe('multi');
          expect(q.correct).toEqual(donorQuestion.answers);
          expect(q.options).toEqual(donorQuestion.options);
        } else if (donorQuestion.type === 'output') {
          const q = packQuestion as Extract<Question, { kind: 'fill' }>;
          expect(q.kind).toBe('fill');
          expect(q.template).toBe(`${donorQuestion.code}\n\nPredicted output: ___`);
          expect((q.blanks ?? [])[0].answer).toBe(donorQuestion.answer);
        } else {
          const q = packQuestion as Extract<Question, { kind: 'fill' }>;
          expect(q.kind).toBe('fill');
          expect(q.template).toBe(donorQuestion.template.replace(/_{3,}/g, '___'));
          for (const blank of q.blanks ?? []) expect(blank.answer).toBe(donorQuestion.answer);
          if (donorQuestion.accept) expect((q.blanks ?? [])[0].alternatives).toEqual(donorQuestion.accept);
        }
      }
    }
  });

  it('comparisons carry donor summaries verbatim and snippets as samples', () => {
    for (const topic of donor.compare.topics) {
      const comparison = comparisons.find((c) => c.id === polyglotId(topic.id));
      expect(comparison, topic.id).toBeDefined();
      const rows = comparison!.rows as { aspect: string; cells: Record<string, string> }[];
      for (const lang of LANG_ORDER) {
        expect(rows[0].cells[`plg-${lang}`]).toBe(topic.cells[lang].summary);
      }
      const snippets = Object.values(topic.cells)
        .map((cell) => cell.snippet)
        .filter((s) => s !== undefined);
      if (snippets.length > 0) {
        const samples = comparison!.samples as { code: Record<string, string> }[];
        expect(Object.values(samples[0].code)).toEqual(snippets);
      }
    }
  });

  it('the docs registry carries every learn/framework link with title + url', () => {
    const donorLinks = new Map<string, { title: string; url: string }>();
    for (const lang of LANG_ORDER) {
      for (const link of [
        ...(donor.learn[lang].resources ?? []),
        ...donor.learn[lang].lessons.flatMap((l) => l.docs ?? []),
        ...(donor.framework[lang].framework.docs ?? []),
      ]) {
        donorLinks.set(link.url, { title: link.title, url: link.url });
      }
    }
    for (const [url, ref] of donorLinks) {
      const entry = Object.values(docs).find((d) => d.url === url);
      expect(entry, url).toBeDefined();
      expect(entry!.title).toBe(ref.title);
    }
  });
});

describe('polyglot pack parity — derivation accounting', () => {
  it('every drop matches a donor recount', () => {
    const donorLessonTags = LANG_ORDER.reduce(
      (n, lang) => n + donor.learn[lang].lessons.reduce((m, l) => m + l.tags.length, 0),
      0,
    );
    const donorResourceNotes = LANG_ORDER.reduce(
      (n, lang) =>
        n +
        (donor.learn[lang].resources ?? []).filter((l) => l.note).length +
        donor.learn[lang].lessons.flatMap((l) => l.docs ?? []).filter((l) => l.note).length +
        (donor.framework[lang].framework.docs ?? []).filter((l) => l.note).length,
      0,
    );
    const donorCodeSampleTitles = LANG_ORDER.reduce(
      (n, lang) => n + donor.learn[lang].lessons.reduce((m, l) => m + (l.codeSamples ?? []).length, 0),
      0,
    );
    const donorOutputCount = LANG_ORDER.reduce(
      (n, lang) => n + donor.quiz[lang].questions.filter((q) => q.type === 'output').length,
      0,
    );
    const donorFillMarkers = LANG_ORDER.reduce(
      (n, lang) =>
        n +
        donor.quiz[lang].questions.reduce((m, q) => m + (q.type === 'fill' ? (q.template.match(/_{3,}/g) ?? []).length : 0), 0),
      0,
    );
    const donorCodingCount = LANG_ORDER.reduce(
      (n, lang) => n + donor.quiz[lang].questions.filter((q) => q.type === 'coding').length,
      0,
    );
    // The extractor's derivation log is deterministic; recompute the
    // expectations here and assert pack shapes carry the accounting.
    expect(donorLessonTags).toBe(209);
    expect(donorResourceNotes).toBe(19); // notes live only on learn resources in the donor
    expect(donorCodeSampleTitles).toBe(100);
    expect(donorOutputCount).toBe(61);
    expect(donorFillMarkers).toBe(66);
    expect(donorCodingCount).toBe(63);

    // The extractor's own log must equal the donor recount — a lib change
    // that stops counting a derivation fails here.
    const { derivations } = buildPack(readDonorData(process.cwd()));
    expect(derivations.droppedLessonTags).toBe(donorLessonTags);
    expect(derivations.droppedDocNotes).toBe(donorResourceNotes);
    expect(derivations.droppedCodeSampleTitles).toBe(donorCodeSampleTitles);
    expect(derivations.droppedOutputLanguages).toBe(donorOutputCount);
    expect(derivations.fillMarkerRewrites).toBe(donorFillMarkers);
    expect(derivations.authoredSelfChecks).toBe(donorCodingCount);
    // exactly one donor fill carries more markers than answers (the
    // `<_____>test</_____>` template) — its blank replication is counted
    const twoMarkerFills = LANG_ORDER.map((lang) =>
      donor.quiz[lang].questions.filter(
        (q) => q.type === 'fill' && (q.template.match(/_{3,}/g) ?? []).length > 1,
      ),
    ).flat();
    expect(twoMarkerFills).toHaveLength(1);
    expect(derivations.blankReplications).toBe(1);
  });
});

describe('polyglot pack parity — grader delta probe (hub is the looser superset)', () => {
  it('every migrated output→fill question grades its exact donor answer correct', () => {
    for (const lang of LANG_ORDER) {
      for (const donorQuestion of donor.quiz[lang].questions) {
        if (donorQuestion.type !== 'output') continue;
        const packQuestion = questions.find((q) => q.id === polyglotId(donorQuestion.id));
        expect(packQuestion, donorQuestion.id).toBeDefined();
        expect(gradeQuestion(packQuestion!, [donorQuestion.answer])).toBe(true);
        // multiline answers: the hub collapses whitespace to single-line form
        expect(gradeQuestion(packQuestion!, [donorQuestion.answer.replace(/\n/g, ' ')])).toBe(true);
      }
    }
  });

  it('every migrated fill question grades donor answer and accepted alternatives correct', () => {
    for (const lang of LANG_ORDER) {
      for (const donorQuestion of donor.quiz[lang].questions) {
        if (donorQuestion.type !== 'fill') continue;
        const packQuestion = questions.find((q) => q.id === polyglotId(donorQuestion.id)) as
          | Extract<Question, { kind: 'fill' }>
          | undefined;
        expect(packQuestion, donorQuestion.id).toBeDefined();
        const answers = Array.from(
          { length: (packQuestion!.blanks ?? []).length },
          () => donorQuestion.answer,
        );
        expect(gradeQuestion(packQuestion!, answers)).toBe(true);
        for (const alt of donorQuestion.accept ?? []) {
          expect(
            gradeQuestion(packQuestion!, answers.map(() => alt)),
            `${donorQuestion.id} accepts ${alt}`,
          ).toBe(true);
        }
      }
    }
  });

  it('the hub additionally accepts case-insensitive answers (accepted looseness)', () => {
    const sample = questions.find((q) => q.kind === 'fill');
    expect(sample).toBeDefined();
    const firstBlank = (sample!.blanks ?? [])[0];
    expect(gradeQuestion(sample!, [firstBlank.answer.toUpperCase()])).toBe(true);
  });
});
