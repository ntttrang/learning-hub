import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fixtureSubjectContent } from '../test-fixtures';
import type { ExtensionBlock, SubjectContent } from '../types';
import { assertKindsRegistered, registryCoverageIssues } from './coverage';
import { registerBlockKind, renderBlock } from './blocks';

/** The fixture with lesson/question kinds swapped for unregistered ones. */
const seeded = (blockKind: string, questionKind: string): SubjectContent => ({
  ...fixtureSubjectContent,
  lessons: [
    { ...fixtureSubjectContent.lessons[0], blocks: [{ kind: blockKind } as never] },
  ],
  questions: [
    { ...fixtureSubjectContent.questions[0], kind: questionKind } as never,
  ],
});

describe('registry coverage (the content:check second pass)', () => {
  it('collects unknown block and question kinds as issues', () => {
    const issues = registryCoverageIssues(seeded('mystery-block', 'mystery-question'));
    expect(issues.map((issue) => issue.code)).toEqual([
      'unknown-block-kind',
      'unknown-question-kind',
    ]);
    expect(issues[0].path).toContain(fixtureSubjectContent.lessons[0].id);
    expect(issues[1].path).toContain(fixtureSubjectContent.questions[0].id);
  });

  it('assertKindsRegistered throws a readable report on a seeded bad kind', () => {
    expect(() => assertKindsRegistered(seeded('mystery-block', 'mystery-question'))).toThrow(
      /registry coverage failed.*mystery-block.*mystery-question/s,
    );
  });

  it('one registerBlockKind call makes the fixture pack fully covered and renderable', () => {
    // The extension workflow end to end: the fixture pack ships a `callout`
    // block; until its kind is registered, coverage flags it and rendering
    // throws. A single registration clears both.
    const lesson = fixtureSubjectContent.lessons[0];
    const callout = lesson.blocks.find((block) => block.kind === 'callout')!;
    expect(registryCoverageIssues(fixtureSubjectContent).map((issue) => issue.code)).toEqual([
      'unknown-block-kind',
    ]);
    expect(() => renderBlock(callout)).toThrow();

    registerBlockKind('callout', (block: ExtensionBlock) => (
      <aside role="note">{String(block.body)}</aside>
    ));
    render(<div>{renderBlock(callout)}</div>);
    expect(screen.getByRole('note')).toHaveTextContent(
      'Extension blocks flow through the registry.',
    );
    expect(registryCoverageIssues(fixtureSubjectContent)).toEqual([]);
    expect(() => assertKindsRegistered(fixtureSubjectContent)).not.toThrow();
  });
});
