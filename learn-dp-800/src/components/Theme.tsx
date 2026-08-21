"use client";

import { useEffect } from "react";
import { Monitor, Sun, Moon, Coffee } from "lucide-react";
import { useStore, type ThemeChoice } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";

/** Applies the persisted theme choice to <html data-theme>. */
export function ThemeApplier() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "auto", label: "Auto", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "night", label: "Night", Icon: Coffee },
];

export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const hydrated = useHydrated();
  const active = hydrated ? theme : "auto";

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex items-center gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--border)", background: "var(--bg-sunken)" }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const on = active === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={on}
            title={label}
            onClick={() => setTheme(value)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition"
            style={{
              background: on ? "var(--accent)" : "transparent",
              color: on ? "var(--accent-fg)" : "var(--fg-3)",
            }}
          >
            <Icon size={15} strokeWidth={1.75} />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Inline script (no-flash): sets data-theme from persisted store before paint. */
export function ThemeScript() {
  const js = `(function(){try{var raw=localStorage.getItem('dp800-store');if(raw){var t=JSON.parse(raw);var th=t&&t.state&&t.state.theme;if(th&&th!=='auto'){document.documentElement.setAttribute('data-theme',th);}}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
