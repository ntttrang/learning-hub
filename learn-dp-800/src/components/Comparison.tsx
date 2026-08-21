"use client";

import { useState } from "react";
import type { DbComparison, DatabaseEngine } from "@/lib/types";
import { ENGINE_LABELS } from "@/lib/types";
import { SqlBlock } from "./SqlBlock";

const ENGINES: DatabaseEngine[] = ["sqlserver", "postgresql", "mysql", "oracle"];
const ENGINE_COLOR: Record<DatabaseEngine, string> = {
  sqlserver: "var(--sky-cyan)",
  postgresql: "var(--hub-green)",
  mysql: "var(--corgi-orange)",
  oracle: "var(--captain-red)",
};

export function ComparisonTable({ cmp }: { cmp: DbComparison }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto rounded-[12px]" style={{ border: "1.5px solid var(--border)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: "var(--bg-sunken)" }}>
              <th className="p-3 text-left font-bold">Aspect</th>
              {ENGINES.map((e) => (
                <th key={e} className="p-3 text-left font-bold">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: ENGINE_COLOR[e] }} />
                    {ENGINE_LABELS[e]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cmp.rows.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="p-3 font-semibold">{r.aspect}</td>
                <td className="p-3" style={{ color: "var(--fg-2)" }}>{r.sqlserver}</td>
                <td className="p-3" style={{ color: "var(--fg-2)" }}>{r.postgresql}</td>
                <td className="p-3" style={{ color: "var(--fg-2)" }}>{r.mysql}</td>
                <td className="p-3" style={{ color: "var(--fg-2)" }}>{r.oracle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cmp.samples?.map((s, i) => (
        <SideBySideSql key={i} label={s.label} code={s.code} />
      ))}

      <div className="grid gap-3 sm:grid-cols-2">
        <MigrationItem label="What's equivalent" body={cmp.migration.equivalent} color="var(--hub-green)" />
        <MigrationItem label="What's different" body={cmp.migration.different} color="var(--corgi-orange)" />
        <MigrationItem label="Direct migration?" body={cmp.migration.directMigration} color="var(--sky-cyan)" />
        <MigrationItem label="Syntax changes" body={cmp.migration.syntaxChanges} color="var(--petal-pink)" />
        <MigrationItem label="Limitations" body={cmp.migration.limitations} color="var(--captain-red)" />
        <MigrationItem label="When to use each" body={cmp.migration.whenToUse} color="var(--star-yellow)" />
      </div>
    </div>
  );
}

function MigrationItem({ label, body, color }: { label: string; body: string; color: string }) {
  return (
    <div className="rounded-[12px] p-3" style={{ background: "var(--bg-sunken)" }}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: "var(--fg-2)" }}>
        {body}
      </p>
    </div>
  );
}

export function SideBySideSql({
  label,
  code,
}: {
  label: string;
  code: Partial<Record<DatabaseEngine, string>>;
}) {
  const available = ENGINES.filter((e) => code[e]);
  const [active, setActive] = useState<DatabaseEngine>(available[0]);

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {available.map((e) => {
          const on = e === active;
          return (
            <button
              key={e}
              onClick={() => setActive(e)}
              className="rounded-full px-3 py-1 text-xs font-bold transition"
              style={{
                background: on ? ENGINE_COLOR[e] : "var(--bg-sunken)",
                color: on ? "#08202a" : "var(--fg-3)",
                border: "1.5px solid " + (on ? "transparent" : "var(--border)"),
              }}
              aria-pressed={on}
            >
              {ENGINE_LABELS[e]}
            </button>
          );
        })}
      </div>
      <SqlBlock code={code[active] ?? ""} engine={active} />
    </div>
  );
}
