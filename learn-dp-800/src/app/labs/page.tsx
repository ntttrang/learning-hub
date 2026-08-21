"use client";

import { Link } from "@/components/Link";
import { FlaskConical, Clock, CheckCircle2, ArrowRight, Container } from "lucide-react";
import { LABS, DOMAINS, getDomain } from "@/lib/content";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { Card, DifficultyBadge } from "@/components/ui";
import { ENGINE_LABELS } from "@/lib/types";

export default function LabsPage() {
  const hydrated = useHydrated();
  const completedLabs = useStore((s) => s.completedLabs);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Hands-on labs</h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
          Every lab is a runnable exercise with four tiers — guided, fill-in, independent, and a migration challenge — plus PostgreSQL, MySQL, and Oracle alternatives. Run them locally against real engines with{" "}
          <Link href="/setup" className="font-semibold" style={{ color: "var(--link)" }}>Docker Compose</Link>.
        </p>
      </header>

      <Card className="flex items-center gap-3 p-4">
        <Container size={20} style={{ color: "var(--accent)" }} />
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          New here? Spin up SQL Server 2025, PostgreSQL, MySQL, and Oracle in one command — see the{" "}
          <Link href="/setup" className="font-semibold" style={{ color: "var(--link)" }}>Docker setup guide</Link>.
        </p>
      </Card>

      {DOMAINS.map((d) => {
        const labs = LABS.filter((l) => l.domainId === d.id);
        if (labs.length === 0) return null;
        return (
          <section key={d.id}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: `var(${d.accent})` }} />
              {d.code}: {d.title}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {labs.map((lab) => {
                const done = hydrated && completedLabs.includes(lab.id);
                return (
                  <Card key={lab.id} hover className="p-5">
                    <Link href={`/labs/${lab.id}`} className="block">
                      <div className="mb-2 flex items-center justify-between">
                        <FlaskConical size={18} style={{ color: "var(--corgi-orange)" }} />
                        {done && <CheckCircle2 size={18} style={{ color: "var(--success)" }} />}
                      </div>
                      <h3 className="font-display text-lg font-bold">{lab.title}</h3>
                      <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
                        {lab.scenario}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <DifficultyBadge tier={lab.difficulty} />
                        <span className="cc-chip" style={{ color: "var(--fg-3)" }}>
                          <Clock size={12} /> ~{lab.estimatedMinutes}m
                        </span>
                        <span className="cc-chip" style={{ color: "var(--fg-3)" }}>
                          {lab.steps.length} steps
                        </span>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: "var(--fg-4)" }}>
                        Engines: {lab.engines.map((e) => ENGINE_LABELS[e]).join(", ")}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--link)" }}>
                        Start lab <ArrowRight size={14} />
                      </span>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
