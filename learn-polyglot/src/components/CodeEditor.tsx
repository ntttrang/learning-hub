import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  language,
  value,
  onChange,
  height = '320px',
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div className="code-frame">
      <div className="code-frame__bar">
        <span>{readOnly ? 'reference' : 'editor'}</span>
        <span className="muted">{language}</span>
      </div>
      <Editor
        height={height}
        language={language}
        value={value}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
        onChange={(v) => onChange?.(v ?? '')}
      />
    </div>
  );
}
