interface CodeBlockProps {
  code: string;
  /** Language label shown above the block (e.g. "yaml"). */
  lang?: string;
}

/** Terminal-style code block with an optional language chip. */
export function CodeBlock({ code, lang }: CodeBlockProps) {
  return (
    <div className="codeblock">
      {lang ? <span className="codeblock-lang">{lang}</span> : null}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
