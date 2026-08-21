"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import hljs from "highlight.js/lib/core";
import sql from "highlight.js/lib/languages/sql";
import { ENGINE_LABELS, type DatabaseEngine } from "@/lib/types";

hljs.registerLanguage("sql", sql);

const ENGINE_COLOR: Record<DatabaseEngine, string> = {
  sqlserver: "var(--sky-cyan)",
  postgresql: "var(--hub-green)",
  mysql: "var(--corgi-orange)",
  oracle: "var(--captain-red)",
};

export function SqlBlock({
  code,
  engine,
  label,
}: {
  code: string;
  engine?: DatabaseEngine;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const html = hljs.highlight(code, { language: "sql" }).value;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  const tag = label ?? (engine ? ENGINE_LABELS[engine] : undefined);

  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ border: "1.5px solid var(--border)" }}>
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: "var(--bg-sunken)", borderBottom: "1.5px solid var(--border)" }}
      >
        <span className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--fg-3)" }}>
          {engine && (
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: ENGINE_COLOR[engine] }} />
          )}
          {tag ?? "SQL"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition"
          style={{ color: "var(--fg-3)" }}
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="cc-code m-0 rounded-none border-0" style={{ background: "var(--code-bg)" }}>
        <code className="hljs language-sql" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
