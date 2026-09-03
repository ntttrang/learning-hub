interface CodeBlockProps {
  title?: string;
  language?: string;
  code: string;
}

export function CodeBlock({ title, language, code }: CodeBlockProps) {
  return (
    <div className="code-frame">
      <div className="code-frame__bar">
        <span>{title ?? language ?? 'code'}</span>
        <span className="muted">{language}</span>
      </div>
      <pre>
        <code className={language ? `language-${language}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}
