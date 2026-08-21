"use client";

import { useState } from "react";
import { Container, Copy, Check, Terminal, Database, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui";

function CodeCard({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ border: "1.5px solid var(--border)" }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "var(--bg-sunken)", borderBottom: "1.5px solid var(--border)" }}>
        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "var(--fg-3)" }}>
          <Terminal size={13} /> {label ?? "shell"}
        </span>
        <button onClick={copy} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--fg-3)" }}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="cc-code m-0 rounded-none border-0"><code>{code}</code></pre>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Container size={26} style={{ color: "var(--accent)" }} /> Local Docker setup
        </h1>
        <p className="mt-1 max-w-3xl text-sm" style={{ color: "var(--fg-2)" }}>
          Labs are copy-paste SQL scripts you run against real database engines. This guide spins up SQL Server 2025, PostgreSQL, MySQL, and Oracle locally with one command using the <code>docker/docker-compose.yml</code> in this repo.
        </p>
      </header>

      <Card className="flex items-start gap-3 p-4" >
        <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--warning)" }} />
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          You need <strong>Docker Desktop</strong> (or a compatible engine) installed. SQL Server 2025 and Oracle images are large; the first pull can take several minutes. Review Oracle&apos;s license terms for the Free edition before use.
        </p>
      </Card>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">1. Start the databases</h2>
        <p className="mb-2 text-sm" style={{ color: "var(--fg-2)" }}>From the repo root:</p>
        <CodeCard label="bash" code={`cd docker\ndocker compose up -d\n\n# check they're healthy\ndocker compose ps`} />
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">2. Connect</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ConnectCard title="SQL Server 2025" color="var(--sky-cyan)" lines={["Host: localhost,1433", "User: sa", "Password: Dp800_Strong!Pass", "Database: dp800"]} />
          <ConnectCard title="PostgreSQL 17" color="var(--hub-green)" lines={["Host: localhost:5432", "User: dp800", "Password: dp800pass", "Database: dp800"]} />
          <ConnectCard title="MySQL 9" color="var(--corgi-orange)" lines={["Host: localhost:3306", "User: root", "Password: dp800pass", "Database: dp800"]} />
          <ConnectCard title="Oracle Free 23ai" color="var(--captain-red)" lines={["Host: localhost:1521", "Service: FREEPDB1", "User: dp800", "Password: dp800pass"]} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">3. Load the SQL Server lab schema</h2>
        <p className="mb-2 text-sm" style={{ color: "var(--fg-2)" }}>
          PostgreSQL, MySQL, and Oracle auto-seed on first start. For SQL Server, run the init script once the container is healthy:
        </p>
        <CodeCard label="bash" code={`docker exec -it dp800-mssql /opt/mssql-tools18/bin/sqlcmd \\\n  -S localhost -U sa -P 'Dp800_Strong!Pass' -C \\\n  -i /seed/01-init.sql`} />
        <p className="mt-2 text-sm" style={{ color: "var(--fg-2)" }}>
          Then connect with Azure Data Studio, the VS Code <em>mssql</em> extension, or <code>sqlcmd</code>, and work through each lab&apos;s steps.
        </p>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-bold">
          <Database size={18} style={{ color: "var(--accent)" }} /> 4. Try a quick query
        </h2>
        <CodeCard label="sql (SQL Server)" code={`USE dp800;\nSELECT ProductId, Name, JSON_VALUE(Attributes, '$.color') AS Color\nFROM dbo.Product;`} />
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl font-bold">5. Tear down</h2>
        <CodeCard label="bash" code={`docker compose down        # stop and remove containers\ndocker compose down -v     # also remove data volumes`} />
      </section>

      <Card className="p-4">
        <h3 className="mb-1 font-display text-base font-bold">A note on AI features</h3>
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          Vector search, <code>CREATE EXTERNAL MODEL</code>, <code>AI_GENERATE_EMBEDDINGS</code>, and <code>sp_invoke_external_rest_endpoint</code> require a configured external model endpoint (e.g., Azure OpenAI) and, for some features, preview flags. The labs show the exact T-SQL; wire up your own model endpoint with Managed Identity to run them end to end.
        </p>
      </Card>
    </div>
  );
}

function ConnectCard({ title, color, lines }: { title: string; color: string; lines: string[] }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <h3 className="font-display text-base font-bold">{title}</h3>
      </div>
      <ul className="flex flex-col gap-0.5 font-mono text-xs" style={{ color: "var(--fg-2)" }}>
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </Card>
  );
}
