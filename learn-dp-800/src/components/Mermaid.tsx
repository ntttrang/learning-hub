"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

/** Renders a Mermaid diagram client-side, lazily loading the library. */
export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
        const id = `mmd-${idCounter++}`;
        const { svg } = await mermaid.render(id, chart);
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
      <pre className="cc-code" aria-label="Diagram source">
        {chart}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="flex justify-center overflow-x-auto rounded-[12px] p-4"
      style={{ background: "var(--bg-sunken)", border: "1.5px solid var(--border)" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
