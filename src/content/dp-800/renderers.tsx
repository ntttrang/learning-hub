import { AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { registerBlockKind, registeredBlockKinds } from '../../sdk/registry/blocks';
import type { Block, Comparison } from '../../sdk/types';
import { ComparisonBody } from '../../ui/Compare';
import { Markdown } from '../../ui/Markdown';
import { Mermaid } from '../../ui/Mermaid';

/**
 * DP-800 pack renderer registration — a side-effect module.
 *
 * Contract: importing this module registers every DP-800 extension block kind
 * (objectives, keyTerms, sourced, figure, sideBySide, mistakes, examTips).
 * Payload shapes live here beside their renderers, outside the core schema —
 * extension payloads are open by design (`ExtensionBlock` in sdk/types.ts).
 *
 * Section titles mirror the donor app's labels exactly (learn-dp-800
 * LessonViewer) — the phase-3 extractor keys on them.
 *
 * Two graphs must import it for side effects: `src/App.tsx` (rendered by
 * main.tsx, so the dev app and every App-rendering test carry registration)
 * and `src/content/content-check.test.ts` (the coverage gate, whose module
 * graph excludes the app entry). A missing site silently strands the kinds
 * in that graph's registry.
 */

/* ------------------------------ payload types ----------------------------- */

export type SourceKind = 'official' | 'explanation' | 'recommendation' | 'examTip';

export interface ObjectivesBlock {
  kind: 'objectives';
  items: string[];
}

export interface KeyTermsBlock {
  kind: 'keyTerms';
  terms: { term: string; definition: string }[];
}

export interface SourcedBlock {
  kind: 'sourced';
  source: SourceKind;
  heading?: string;
  body: string;
}

export interface FigureBlock {
  kind: 'figure';
  caption: string;
  mermaid?: string;
}

export interface SideBySideBlock {
  kind: 'sideBySide';
  comparison: Comparison;
}

export interface MistakesBlock {
  kind: 'mistakes';
  items: { mistake: string; fix: string }[];
}

export interface ExamTipsBlock {
  kind: 'examTips';
  tips: string[];
}

export type DP800Block =
  | ObjectivesBlock
  | KeyTermsBlock
  | SourcedBlock
  | FigureBlock
  | SideBySideBlock
  | MistakesBlock
  | ExamTipsBlock;

/** Donor-verbatim badge labels (learn-dp-800 ui.tsx SOURCE_META). */
const SOURCE_LABELS: Record<SourceKind, string> = {
  official: 'Official Microsoft',
  explanation: 'Explanation',
  recommendation: 'Recommendation',
  examTip: 'Exam tip',
};

/* ------------------------------- renderers -------------------------------- */

/**
 * Narrow an open extension payload to its DP-800 shape. The registry hands
 * renderers the open `Block`; the pack's extractor guarantees the field set,
 * so this is a type-level crossing (through `unknown`), not validation.
 */
function payloadOf<B extends DP800Block>(block: Block): B {
  return block as unknown as B;
}

/* registerBlockKind overwrites silently, so a second registration of these
 * ids anywhere in the module graph would clobber renderers with no signal.
 * Detect BEFORE registering: if any kind is already present, something else
 * claimed the id — fail at import time instead of clobbering.
 *
 * Dev-only caveat: vite HMR re-evaluates this module against the still-cached
 * registry (the registry lives upstream and is never invalidated with it), so
 * the guard then finds its OWN registrations and throws. If a dev session
 * dies with "duplicate dp-800 block kind registration" after an edit here or
 * in ui/Compare.tsx / ui/Mermaid.tsx, reload the page — production builds
 * evaluate the module once and are unaffected. */
const kinds = [
  'objectives',
  'keyTerms',
  'sourced',
  'figure',
  'sideBySide',
  'mistakes',
  'examTips',
] as const;

const alreadyRegistered = kinds.filter((kind) => registeredBlockKinds().includes(kind));
if (alreadyRegistered.length > 0) {
  throw new Error(
    `duplicate dp-800 block kind registration: ${alreadyRegistered.join(', ')} — ` +
      'another module registered these ids before content/dp-800/renderers',
  );
}

registerBlockKind('objectives', (block: Block) => {
  const { items } = payloadOf<ObjectivesBlock>(block);
  return (
    <section className="blk-objectives" aria-label="Learning objectives">
      <h3 className="blk-heading">Learning objectives</h3>
      <ul className="blk-objective-list">
        {items.map((item, i) => (
          <li key={i}>
            <Target size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});

registerBlockKind('keyTerms', (block: Block) => {
  const { terms } = payloadOf<KeyTermsBlock>(block);
  return (
    <section className="blk-key-terms" aria-label="Key terminology">
      <h3 className="blk-heading">Key terminology</h3>
      <div className="blk-term-grid">
        {terms.map(({ term, definition }, i) => (
          <div key={i} className="blk-term-card">
            <p className="blk-term">{term}</p>
            <p className="blk-term-def">{definition}</p>
          </div>
        ))}
      </div>
    </section>
  );
});

registerBlockKind('sourced', (block: Block) => {
  const { source, heading, body } = payloadOf<SourcedBlock>(block);
  // camelCase → dashed for the per-source modifier class (examTip → exam-tip).
  const sourceSlug = source.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return (
    <div className={`blk-sourced blk-sourced-${sourceSlug}`}>
      <span className="blk-source-badge">{SOURCE_LABELS[source] ?? source}</span>
      {heading && <h4 className="blk-sourced-heading">{heading}</h4>}
      <Markdown>{body}</Markdown>
    </div>
  );
});

registerBlockKind('figure', (block: Block) => {
  const { caption, mermaid } = payloadOf<FigureBlock>(block);
  return (
    <section className="blk-figure" aria-label="Visual explanation">
      <h3 className="blk-heading">Visual explanation</h3>
      {mermaid && <Mermaid chart={mermaid} />}
      <p className="blk-figure-caption">{caption}</p>
    </section>
  );
});

registerBlockKind('sideBySide', (block: Block) => {
  const { comparison } = payloadOf<SideBySideBlock>(block);
  return (
    <section className="blk-side-by-side" aria-label="Side-by-side comparison">
      <ComparisonBody comparison={comparison} />
    </section>
  );
});

registerBlockKind('mistakes', (block: Block) => {
  const { items } = payloadOf<MistakesBlock>(block);
  return (
    <section className="blk-mistakes" aria-label="Common mistakes">
      <h3 className="blk-heading">Common mistakes</h3>
      <div className="blk-mistake-list">
        {items.map(({ mistake, fix }, i) => (
          <div key={i} className="blk-mistake">
            <p className="blk-mistake-title">
              <AlertTriangle size={15} strokeWidth={1.75} aria-hidden="true" />
              {mistake}
            </p>
            <p className="blk-mistake-fix">
              <span className="blk-fix-label">Fix:</span> {fix}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

registerBlockKind('examTips', (block: Block) => {
  const { tips } = payloadOf<ExamTipsBlock>(block);
  return (
    <section className="blk-exam-tips" aria-label="Exam tips">
      <h3 className="blk-heading">Exam tips</h3>
      <ul className="blk-exam-tip-list">
        {tips.map((tip, i) => (
          <li key={i}>
            <Lightbulb size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});
