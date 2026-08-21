import { useEffect, useState } from 'react';

let renderCounter = 0;

/**
 * Renders a Mermaid diagram client-side, lazily loading the library — the
 * dynamic import below is the only mermaid reference in the app, so it lands
 * in an async chunk, never the entry bundle.
 *
 * Trust boundary: `securityLevel: 'strict'` is the sanitizer — labels are
 * escaped and click callbacks disabled. The hub ships no CSP, so chart
 * strings are trusted exactly as far as content authoring is PR-gated.
 *
 * Render ids must be unique per invocation: mermaid keys its injected DOM
 * node by the id passed to `render()`, and under <StrictMode> effects fire
 * twice in dev — a colliding id throws, and that throw would be silently
 * absorbed by the fallback below, degrading every figure to its source text.
 * The module counter keeps ids distinct across renders.
 */
export function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict' });
        const { svg } = await mermaid.render(`mmd-${renderCounter++}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (failed) {
    return (
      <pre className="mermaid-src" aria-label="Diagram source">
        {chart}
      </pre>
    );
  }

  return <div className="mermaid-figure" dangerouslySetInnerHTML={{ __html: svg }} />;
}
