"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, Search as SearchIcon, Flame } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./Theme";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const streak = useStore((s) => s.streak.current);
  const hydrated = useHydrated();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[280px] shrink-0 lg:block"
        style={{ background: "var(--bg-elevated)", borderRight: "1.5px solid var(--border)" }}
      >
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setDrawerOpen(false)} />
          <aside
            className="absolute inset-y-0 left-0 w-[280px]"
            style={{ background: "var(--bg-elevated)", borderRight: "1.5px solid var(--border)" }}
          >
            <div className="flex justify-end p-2">
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded-md p-1.5" style={{ color: "var(--fg-3)" }}>
                <X size={20} />
              </button>
            </div>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[280px]">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5"
          style={{
            background: "color-mix(in srgb, var(--bg-elevated) 82%, transparent)",
            backdropFilter: "blur(12px)",
            borderBottom: "1.5px solid var(--border)",
          }}
        >
          <button
            className="rounded-md p-1.5 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            style={{ color: "var(--fg-2)" }}
          >
            <Menu size={20} />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition sm:max-w-xs"
            style={{ background: "var(--bg-sunken)", border: "1.5px solid var(--border)", color: "var(--fg-3)" }}
          >
            <SearchIcon size={15} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden rounded px-1.5 py-0.5 text-[10px] font-semibold sm:inline" style={{ background: "var(--bg-elevated)", color: "var(--fg-4)" }}>
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: "var(--bg-sunken)", color: streak > 0 ? "var(--corgi-orange)" : "var(--fg-4)" }}
              title="Daily learning streak"
            >
              <Flame size={15} />
              {hydrated ? streak : 0}
            </span>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="px-6 py-8 text-center text-xs" style={{ color: "var(--fg-4)" }}>
          <p>
            An independent study aid for Microsoft DP-800. Not affiliated with or endorsed by Microsoft. Always verify against the official{" "}
            <a href="https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-800" target="_blank" rel="noreferrer" style={{ color: "var(--link)" }}>
              skills-measured page
            </a>
            .
          </p>
        </footer>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
