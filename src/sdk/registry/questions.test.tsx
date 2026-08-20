import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Answer, Question } from '../types';
import {
  answerReady,
  getQuestionHandler,
  gradeQuestion,
  initialAnswer,
  KIND_LABELS,
  matchingTokens,
  normalizeBlank,
  registerQuestionKind,
  renderQuestion,
  UnknownQuestionKindError,
} from './questions';

/* ------------------------------- fixtures ---------------------------------- */

const base = { id: 'q1', domainId: 'd1', prompt: 'Pick one', explanation: 'because' };

const single: Question = {
  ...base,
  kind: 'single',
  options: [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
  ],
  correct: 'a',
};

const codeReading: Question = {
  ...base,
  kind: 'codeReading',
  code: 'SELECT 1',
  options: [
    { id: 'a', text: 'One row' },
    { id: 'b', text: 'Error' },
  ],
  correct: 'b',
};

const bug: Question = {
  ...base,
  kind: 'bug',
  codeLines: ['ok line', 'fine too', 'the bug lives here'],
  buggyLineIndex: 2,
};

const multi: Question = {
  ...base,
  kind: 'multi',
  options: [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
    { id: 'c', text: 'Gamma' },
  ],
  correct: ['a', 'c'],
};

const order: Question = {
  ...base,
  kind: 'order',
  options: [
    { id: 'a', text: 'First' },
    { id: 'b', text: 'Second' },
  ],
  correct: ['a', 'b'],
};

const matching: Question = {
  ...base,
  kind: 'matching',
  pairs: [
    { left: 'Lakehouse', right: 'Bronze' },
    { left: 'Warehouse', right: 'Gold' },
  ],
};

const fill: Question = {
  ...base,
  kind: 'fill',
  template: 'COPY INTO ___ FROM ___',
  blanks: [
    { answer: 'target', alternatives: ['dest'] },
    { answer: 'source' },
  ],
};

/* -------------------------------- graders ---------------------------------- */

describe('question graders (merged semantics, Answer = string[])', () => {
  it('single: exact option id, one answer only', () => {
    expect(gradeQuestion(single, ['a'])).toBe(true);
    expect(gradeQuestion(single, ['b'])).toBe(false);
    expect(gradeQuestion(single, ['a', 'b'])).toBe(false);
  });

  it('codeReading: same rule as single over its options', () => {
    expect(gradeQuestion(codeReading, ['b'])).toBe(true);
    expect(gradeQuestion(codeReading, ['a'])).toBe(false);
  });

  it('bug: the buggy line index as a string', () => {
    expect(gradeQuestion(bug, ['2'])).toBe(true);
    expect(gradeQuestion(bug, ['1'])).toBe(false);
  });

  it('multi: correct set in any order', () => {
    expect(gradeQuestion(multi, ['c', 'a'])).toBe(true);
    expect(gradeQuestion(multi, ['a'])).toBe(false); // subset is wrong
    expect(gradeQuestion(multi, ['a', 'b', 'c'])).toBe(false); // superset is wrong
  });

  it('order: exact sequence required', () => {
    expect(gradeQuestion(order, ['a', 'b'])).toBe(true);
    expect(gradeQuestion(order, ['b', 'a'])).toBe(false);
  });

  it('matching: leftIndex::right tokens as a set', () => {
    expect(gradeQuestion(matching, ['0::Bronze', '1::Gold'])).toBe(true);
    expect(gradeQuestion(matching, ['1::Gold', '0::Bronze'])).toBe(true); // token order free
    expect(gradeQuestion(matching, ['0::Gold', '1::Bronze'])).toBe(false); // swapped rights
    expect(gradeQuestion(matching, ['0::Bronze'])).toBe(false); // incomplete
  });

  it('fill: case-insensitive, whitespace-tolerant, bracket-stripping, alternatives', () => {
    expect(gradeQuestion(fill, ['target', 'source'])).toBe(true);
    expect(gradeQuestion(fill, ['  TARGET ', 'Source'])).toBe(true);
    expect(gradeQuestion(fill, ['[target]', 'source'])).toBe(true);
    expect(gradeQuestion(fill, ['dest', 'source'])).toBe(true); // registered alternative
    expect(gradeQuestion(fill, ['target', 'wrong'])).toBe(false);
    expect(gradeQuestion(fill, ['target', '   '])).toBe(false); // blank is wrong
    expect(gradeQuestion(fill, ['target'])).toBe(false); // arity mismatch
  });

  it('empty and missing answers are wrong for every kind', () => {
    for (const q of [single, codeReading, bug, multi, order, matching, fill]) {
      expect(gradeQuestion(q, [])).toBe(false);
    }
  });

  it('normalizeBlank: trim, collapse whitespace, strip wrapping brackets, case-fold', () => {
    expect(normalizeBlank('  Hello   World ')).toBe('HELLO WORLD');
    expect(normalizeBlank('[Bronze]')).toBe('BRONZE');
    expect(normalizeBlank('a]')).toBe('A'); // only the wrapping end is stripped
  });

  it('matchingTokens produces the leftIndex::right encoding', () => {
    expect(matchingTokens([{ right: 'x' }, { right: 'y' }])).toEqual(['0::x', '1::y']);
  });
});

/* ------------------------------ dispatch rules ----------------------------- */

describe('registry dispatch', () => {
  it('throws UnknownQuestionKindError for an unregistered kind', () => {
    const ghost = { ...single, kind: 'ghost' } as unknown as Question;
    expect(() => gradeQuestion(ghost, ['a'])).toThrow(UnknownQuestionKindError);
    try {
      getQuestionHandler('ghost');
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownQuestionKindError);
      expect((error as UnknownQuestionKindError).kind).toBe('ghost');
    }
  });

  it('extension kinds register and dispatch like core kinds', () => {
    registerQuestionKind('test-ext-kind', {
      grade: (_question, answer) => answer.includes('always'),
      render: () => null,
    });
    const ext = { ...base, kind: 'test-ext-kind' } as unknown as Question;
    expect(gradeQuestion(ext, ['always'])).toBe(true);
    expect(gradeQuestion(ext, ['never'])).toBe(false);
  });
});

/* ------------------------------- renderers --------------------------------- */

describe('question renderers (dp-800 interaction models, brand classes)', () => {
  const draw = (
    q: Question,
    answer: Answer,
    onAnswer: (a: Answer) => void,
    disabled?: boolean,
    revealed?: boolean,
  ) => render(<div>{renderQuestion(q, answer, onAnswer, disabled, revealed)}</div>);

  it('single: option buttons carry letter chips, aria-pressed, one-id answers', () => {
    const onAnswer = vi.fn();
    draw(single, [], onAnswer);
    const alpha = screen.getByRole('button', { name: /Alpha/ });
    expect(alpha.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(alpha);
    expect(onAnswer).toHaveBeenCalledWith(['a']);
    expect(screen.getByText('A')).toBeInTheDocument(); // letter chip
    expect(screen.queryByText('Pick one')).toBeNull(); // stem belongs to the viewer
  });

  it('single: selected state reflects the answer', () => {
    draw(single, ['a'], vi.fn());
    expect(screen.getByRole('button', { name: /Alpha/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Alpha/ }).className).toContain('q-opt-selected');
  });

  it('single: reveal marks the correct option and a selected wrong one', () => {
    draw(single, ['b'], vi.fn(), true, true);
    const correctBtn = screen.getByRole('button', { name: /Alpha/ });
    const wrongBtn = screen.getByRole('button', { name: /Beta/ });
    expect(correctBtn.className).toContain('q-opt-correct');
    expect(wrongBtn.className).toContain('q-opt-wrong');
    expect(correctBtn).toBeDisabled(); // revealed controls are inert
  });

  it('codeReading: renders the code block plus option buttons', () => {
    const onAnswer = vi.fn();
    const { container } = draw(codeReading, [], onAnswer);
    expect(container.querySelector('.codeblock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Error/ }));
    expect(onAnswer).toHaveBeenCalledWith(['b']);
  });

  it('bug: one numbered button per code line, index-as-string answers', () => {
    const onAnswer = vi.fn();
    draw(bug, [], onAnswer);
    fireEvent.click(screen.getByRole('button', { name: /the bug lives here/ }));
    expect(onAnswer).toHaveBeenCalledWith(['2']);
    expect(screen.getByText('3')).toBeInTheDocument(); // 1-based line chips
  });

  it('multi: toggle membership with aria-pressed', () => {
    const onAnswer = vi.fn();
    draw(multi, ['a'], onAnswer);
    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
    expect(onAnswer).toHaveBeenCalledWith(['a', 'b']);
    fireEvent.click(screen.getByRole('button', { name: /Alpha/ }));
    expect(onAnswer).toHaveBeenCalledWith([]);
  });

  it('order: move up/down rewrites the full sequence', () => {
    const onAnswer = vi.fn();
    const first = draw(order, ['a', 'b'], onAnswer);
    fireEvent.click(screen.getByRole('button', { name: 'Move Second up' }));
    expect(onAnswer).toHaveBeenCalledWith(['b', 'a']);
    // the runner feeds answers back in, so a fresh draw with the new order:
    first.unmount();
    draw(order, ['b', 'a'], onAnswer); // displays Second, First — First is at the bottom
    fireEvent.click(screen.getByRole('button', { name: 'Move First up' }));
    expect(onAnswer).toHaveBeenCalledWith(['a', 'b']);
  });

  it('order: boundary moves are disabled, reveal shows placement', () => {
    draw(order, ['a', 'b'], vi.fn(), false, true);
    expect(screen.queryByRole('button', { name: 'Move First up' })).toBeNull(); // locked hides movers
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].className).toContain('q-order-correct');
    expect(rows[1].className).toContain('q-order-correct');
  });

  it('order: wrong placement colors the row on reveal', () => {
    draw(order, ['b', 'a'], vi.fn(), true, true);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].className).toContain('q-order-wrong');
    expect(rows[1].className).toContain('q-order-wrong');
  });

  it('matching: selects emit leftIndex::right tokens, keyed safely with duplicate rights', () => {
    const onAnswer = vi.fn();
    const dupRight: Question = {
      ...matching,
      pairs: [
        { left: 'Lakehouse', right: 'Same' },
        { left: 'Warehouse', right: 'Same' },
      ],
    };
    draw(dupRight, [], onAnswer);
    fireEvent.change(screen.getByLabelText('Warehouse'), { target: { value: 'Same' } });
    expect(onAnswer).toHaveBeenCalledWith(['1::Same']);
  });

  it('matching: reveal shows the correct right when missed', () => {
    draw(matching, ['0::Gold'], vi.fn(), true, true);
    const rows = screen.getAllByText(/Lakehouse|Warehouse/).map((el) => el.closest('.q-match-row')!);
    expect(rows[0].className).toContain('q-match-bad');
    const reveals = screen.getAllByLabelText('Correct answer'); // both pairs missed
    expect(reveals[0].textContent).toBe('→ Bronze');
  });

  it('matching: right values containing :: keep their full text and grade clean', () => {
    const cppish: Question = {
      ...matching,
      pairs: [
        { left: 'Vector', right: 'std::vector' },
        { left: 'Constructor', right: 'Vec::new' },
      ],
    };
    const onAnswer = vi.fn();
    const first = draw(cppish, [], onAnswer);
    fireEvent.change(screen.getByLabelText('Vector'), { target: { value: 'std::vector' } });
    expect(onAnswer).toHaveBeenCalledWith(['0::std::vector']); // full token, untruncated

    // Redraw with the stored answer: the pick must REDISPLAY completely…
    first.unmount();
    const second = draw(cppish, ['0::std::vector'], vi.fn());
    expect((screen.getByLabelText('Vector') as HTMLSelectElement).value).toBe('std::vector');
    second.unmount();

    // …and a correctly-picked pair reveals as ok, not missed. (Pair 1 stays
    // unanswered, so only its row may carry the correct-answer note.)
    draw(cppish, ['0::std::vector'], vi.fn(), true, true);
    const vectorRow = screen.getAllByText(/std::vector/)[0].closest('.q-match-row')!;
    expect(vectorRow.className).toContain('q-match-ok');
    expect(vectorRow.querySelector('[aria-label="Correct answer"]')).toBeNull();
  });

  it('fill: inputs map to blank positions with of-n labels', () => {
    const onAnswer = vi.fn();
    draw(fill, ['', ''], onAnswer);
    fireEvent.change(screen.getByLabelText('Blank 1 of 2'), { target: { value: 'target' } });
    expect(onAnswer).toHaveBeenCalledWith(['target', '']);
    expect(screen.getByLabelText('Blank 2 of 2')).toBeInTheDocument();
  });

  it('fill: reveal colors blanks and lists expected answers', () => {
    draw(fill, ['target', 'nope'], vi.fn(), true, true);
    expect(screen.getByLabelText('Blank 1 of 2').className).toContain('q-fill-ok');
    expect(screen.getByLabelText('Blank 2 of 2').className).toContain('q-fill-bad');
    expect(screen.getByText(/Expected: target · source/)).toBeInTheDocument();
  });

  it('disabled disables the answering controls', () => {
    draw(single, [], vi.fn(), true);
    expect(screen.getByRole('button', { name: /Alpha/ })).toBeDisabled();
  });
});

/* ---------------------------- labels and shaping ---------------------------- */

describe('KIND_LABELS, initialAnswer, answerReady', () => {
  it('labels all seven core kinds', () => {
    expect(Object.keys(KIND_LABELS).sort()).toEqual(
      ['bug', 'codeReading', 'fill', 'matching', 'multi', 'order', 'single'].sort(),
    );
  });

  it('initialAnswer: order seeds the option order, fill seeds empty strings', () => {
    expect(initialAnswer(order)).toEqual(['a', 'b']);
    expect(initialAnswer(fill)).toEqual(['', '']);
    expect(initialAnswer(single)).toEqual([]);
    expect(initialAnswer(matching)).toEqual([]);
  });

  it('answerReady: per-kind readiness rules', () => {
    expect(answerReady(single, ['a'])).toBe(true);
    expect(answerReady(single, [])).toBe(false);
    expect(answerReady(multi, ['a'])).toBe(true);
    expect(answerReady(multi, [])).toBe(false);
    expect(answerReady(order, ['a', 'b'])).toBe(true);
    expect(answerReady(order, ['a'])).toBe(false);
    expect(answerReady(matching, ['0::Bronze', '1::Gold'])).toBe(true);
    expect(answerReady(matching, ['0::Bronze'])).toBe(false);
    expect(answerReady(fill, ['a', 'b'])).toBe(true);
    expect(answerReady(fill, ['a', ''])).toBe(false); // blank blank is not ready
    expect(answerReady(fill, ['a'])).toBe(false); // arity mismatch
  });
});
