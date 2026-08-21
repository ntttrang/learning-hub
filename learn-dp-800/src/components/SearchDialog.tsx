"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/components/Link";
import { Search, X, FileText, FlaskConical } from "lucide-react";
import { LESSONS, LABS } from "@/lib/content";

interface Hit {
  href: string;
  title: string;
  subtitle: string;
  kind: "lesson" | "lab";
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo<Hit[]>(() => {
    const lessons: Hit[] = LESSONS.map((l) => ({
      href: `/learn/${l.slug}`,
      title: l.title,
      subtitle: `${l.summary} ${l.keyTerms.map((k) => k.term).join(" ")} ${l.learningObjectives.join(" ")}`,
      kind: "lesson",
    }));
    const labs: Hit[] = LABS.map((l) => ({
      href: `/labs/${l.id}`,
      title: l.title,
      subtitle: l.objective,
      kind: "lab",
    }));
    return [...lessons, ...labs];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .map((h) => {
        const hay = `${h.title} ${h.subtitle}`.toLowerCase();
        let score = 0;
        if (h.title.toLowerCase().includes(q)) score += 10;
        for (const term of q.split(/\s+/)) if (hay.includes(term)) score += 1;
        return { h, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r) => r.h);
  }, [query, index]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-[20px]"
        style={{ background: "var(--bg-elevated)", boxShadow: "var(--shadow-4)", border: "1.5px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1.5px solid var(--border)" }}>
          <Search size={18} style={{ color: "var(--fg-3)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons and labs..."
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "var(--fg)" }}
          />
          <button onClick={onClose} aria-label="Close search" className="rounded-md p-1" style={{ color: "var(--fg-3)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--fg-3)" }}>
              No results for &ldquo;{query}&rdquo;.
            </p>
          )}
          {!query && (
            <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--fg-3)" }}>
              Search across all lessons and labs.
            </p>
          )}
          {results.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition hover:bg-[var(--bg-sunken)]"
            >
              {h.kind === "lesson" ? (
                <FileText size={16} style={{ color: "var(--sky-cyan)" }} />
              ) : (
                <FlaskConical size={16} style={{ color: "var(--corgi-orange)" }} />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{h.title}</span>
                <span className="block truncate text-xs" style={{ color: "var(--fg-3)" }}>
                  {h.subtitle}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
