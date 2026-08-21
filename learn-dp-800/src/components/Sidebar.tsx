"use client";

import { Link } from "@/components/Link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Target,
  GraduationCap,
  GitCompare,
  StickyNote,
  Bookmark,
  Container,
  ChevronDown,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { DOMAINS, modulesForDomain, lessonsForModule } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { asset } from "@/lib/asset";

const PRIMARY = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/labs", label: "Labs", Icon: FlaskConical },
  { href: "/practice", label: "Practice", Icon: Target },
  { href: "/exam", label: "Mock exams", Icon: GraduationCap },
  { href: "/compare", label: "Compare DBs", Icon: GitCompare },
];

const SECONDARY = [
  { href: "/notes", label: "Notes", Icon: StickyNote },
  { href: "/bookmarks", label: "Bookmarks", Icon: Bookmark },
  { href: "/setup", label: "Docker setup", Icon: Container },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3" aria-label="Main">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2.5 px-2 py-1.5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/brand/captain-corgi-hub-avatar.png")} alt="" width={38} height={38} className="rounded-full" style={{ boxShadow: "var(--shadow-1)" }} />
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold">DP-800</span>
          <span className="block text-[11px] font-semibold" style={{ color: "var(--fg-3)" }}>
            SQL AI Developer
          </span>
        </span>
      </Link>

      <div className="flex flex-col gap-0.5">
        {PRIMARY.map(({ href, label, Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="my-2 border-t" style={{ borderColor: "var(--border-soft)" }} />

      <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-4)" }}>
        Curriculum
      </p>
      <CurriculumTree onNavigate={onNavigate} />

      <div className="my-2 border-t" style={{ borderColor: "var(--border-soft)" }} />
      <div className="flex flex-col gap-0.5 pb-2">
        {SECONDARY.map(({ href, label, Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} active={isActive(href)} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: typeof BookOpen;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-sm font-semibold transition"
      style={{
        background: active ? "var(--bg-sunken)" : "transparent",
        color: active ? "var(--fg)" : "var(--fg-2)",
      }}
    >
      <Icon size={17} strokeWidth={1.75} style={{ color: active ? "var(--accent)" : "var(--fg-3)" }} />
      {label}
    </Link>
  );
}

function CurriculumTree({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      {DOMAINS.map((d) => (
        <DomainNode key={d.id} domainId={d.id} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function DomainNode({ domainId, onNavigate }: { domainId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const domain = DOMAINS.find((d) => d.id === domainId)!;
  const modules = modulesForDomain(domainId);
  const anyActive = modules.some((m) =>
    lessonsForModule(m.id).some((l) => pathname === `/learn/${l.slug}`),
  );
  const [open, setOpen] = useState(anyActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 text-left text-[13px] font-bold transition"
        style={{ color: "var(--fg-2)" }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: `var(${domain.accent})` }} />
          {domain.code}: {domain.title}
        </span>
        <ChevronDown size={14} className="transition" style={{ transform: open ? "rotate(180deg)" : "none", color: "var(--fg-4)" }} />
      </button>
      {open && (
        <div className="ml-3 flex flex-col gap-0.5 border-l pl-2" style={{ borderColor: "var(--border-soft)" }}>
          {modules.map((m) => (
            <ModuleNode key={m.id} moduleId={m.id} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleNode({ moduleId, onNavigate }: { moduleId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const lessons = lessonsForModule(moduleId);
  const module = lessons[0];
  const anyActive = lessons.some((l) => pathname === `/learn/${l.slug}`);
  const [open, setOpen] = useState(anyActive);
  const lessonsProgress = useStore((s) => s.lessons);
  const hydrated = useHydrated();

  const done = hydrated
    ? lessons.filter((l) => lessonsProgress[l.id]?.status === "completed").length
    : 0;

  if (!module) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-1 rounded-[8px] px-2 py-1 text-left text-[12px] font-semibold transition"
        style={{ color: "var(--fg-3)" }}
        aria-expanded={open}
      >
        <span className="truncate">
          {lessons[0].moduleId.replace("m", "")} · {moduleTitle(moduleId)}
        </span>
        <span className="shrink-0 text-[10px]" style={{ color: "var(--fg-4)" }}>
          {done}/{lessons.length}
        </span>
      </button>
      {open && (
        <div className="ml-1 flex flex-col">
          {lessons.map((l) => {
            const active = pathname === `/learn/${l.slug}`;
            const status = hydrated ? lessonsProgress[l.id]?.status : undefined;
            return (
              <Link
                key={l.id}
                href={`/learn/${l.slug}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[12px] transition"
                style={{
                  background: active ? "var(--bg-sunken)" : "transparent",
                  color: active ? "var(--fg)" : "var(--fg-3)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {status === "completed" ? (
                  <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
                ) : (
                  <Circle size={13} style={{ color: "var(--fg-4)" }} />
                )}
                <span className="truncate">{l.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function moduleTitle(moduleId: string): string {
  const map: Record<string, string> = {
    m01: "Database objects",
    m02: "Programmability",
    m03: "Advanced T-SQL",
    m04: "AI-assisted tools",
    m05: "Security & compliance",
    m06: "Performance",
    m07: "CI/CD projects",
    m08: "Azure integration",
    m09: "Models & embeddings",
    m10: "Intelligent search",
    m11: "RAG",
  };
  return map[moduleId] ?? moduleId;
}
