import { useMemo, useState } from 'react';
import { CodeBlock } from './CodeBlock';
import { CodeEditor } from './CodeEditor';
import { markQuiz } from '../lib/progress';
import type { QuizQuestion as Q } from '../lib/types';

interface Props {
  question: Q;
  onGraded?: (correct: boolean) => void;
}

export function QuizQuestion({ question, onGraded }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [fill, setFill] = useState('');
  const [code, setCode] = useState(
    question.type === 'coding' ? question.starterCode : '',
  );
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  const isMulti = question.type === 'multi';

  const toggle = (id: string) => {
    if (revealed) return;
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelected([id]);
    }
  };

  const grade = () => {
    let correct = false;
    if (question.type === 'mcq') {
      correct = selected[0] === question.answer;
    } else if (question.type === 'multi') {
      const want = [...question.answers].sort().join(',');
      const got = [...selected].sort().join(',');
      correct = want === got;
    } else if (question.type === 'output') {
      correct =
        selected[0]?.trim() === question.answer.trim() ||
        fill.trim() === question.answer.trim();
    } else if (question.type === 'fill') {
      const answers = [question.answer, ...(question.accept ?? [])].map((a) =>
        a.trim().toLowerCase(),
      );
      correct = answers.includes(fill.trim().toLowerCase());
    } else if (question.type === 'coding') {
      // Self-check: user confirms after reviewing expected output / solution
      correct = true;
    }
    setResult(correct);
    setRevealed(true);
    markQuiz(question.id, correct);
    onGraded?.(correct);
  };

  const options = useMemo(() => {
    if (question.type === 'mcq' || question.type === 'multi') return question.options;
    return [];
  }, [question]);

  return (
    <div className="stack">
      <p className="kicker">{question.type}</p>
      <h3>{question.prompt}</h3>

      {(question.type === 'mcq' || question.type === 'multi') && (
        <div className="stack">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            let cls = 'quiz-option';
            if (isSelected) cls += ' selected';
            if (revealed) {
              if (question.type === 'mcq' && opt.id === question.answer) cls += ' correct';
              if (
                question.type === 'multi' &&
                question.answers.includes(opt.id)
              ) {
                cls += ' correct';
              }
              if (
                isSelected &&
                ((question.type === 'mcq' && opt.id !== question.answer) ||
                  (question.type === 'multi' && !question.answers.includes(opt.id)))
              ) {
                cls += ' wrong';
              }
            }
            return (
              <label key={opt.id} className={cls}>
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  name={question.id}
                  checked={isSelected}
                  disabled={revealed}
                  onChange={() => toggle(opt.id)}
                />
                <span>{opt.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'output' && (
        <div className="stack">
          <CodeBlock language={question.language} code={question.code} />
          <input
            className="input"
            placeholder="Predicted output"
            value={fill}
            disabled={revealed}
            onChange={(e) => setFill(e.target.value)}
          />
        </div>
      )}

      {question.type === 'fill' && (
        <div className="stack">
          <p className="mono muted">{question.template}</p>
          <input
            className="input"
            placeholder="Your answer"
            value={fill}
            disabled={revealed}
            onChange={(e) => setFill(e.target.value)}
          />
        </div>
      )}

      {question.type === 'coding' && (
        <div className="stack">
          <CodeEditor language={question.language} value={code} onChange={setCode} />
          <p className="muted">
            No live runner — write your solution, then check against expected output and the
            reference.
          </p>
          {revealed && (
            <>
              <p>
                <strong>Expected output:</strong>{' '}
                <code>{question.expectedOutput}</code>
              </p>
              <CodeEditor
                language={question.language}
                value={question.referenceSolution}
                readOnly
                height="280px"
              />
            </>
          )}
        </div>
      )}

      <div className="row">
        {!revealed && (
          <button type="button" className="btn btn-primary" onClick={grade}>
            {question.type === 'coding' ? 'Reveal reference' : 'Check answer'}
          </button>
        )}
        {revealed && result !== null && (
          <div className={`feedback ${result ? 'ok' : 'bad'}`}>
            <strong>{result ? 'Nice work.' : 'Not quite.'}</strong> {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
