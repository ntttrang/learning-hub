import type { Lesson } from "@/lib/types";
import { defineLesson, ref, REFS } from "./_shared";

export const DOMAIN2_LESSONS: Lesson[] = [
  // -------- Module 05: security & compliance --------
  defineLesson({
    id: "l0501",
    moduleId: "m05",
    domainId: "d2",
    order: 1,
    slug: "encryption",
    title: "Encryption: Always Encrypted and column-level encryption",
    summary: "Protect data at rest and in use with TDE, column-level encryption, and Always Encrypted (incl. secure enclaves).",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: [
      "Distinguish TDE, column-level encryption, and Always Encrypted.",
      "Explain what Always Encrypted protects against and its client-driver requirement.",
      "Describe secure enclaves for richer computations on encrypted data.",
    ],
    keyTerms: [
      { term: "TDE", definition: "Transparent Data Encryption — encrypts data files at rest; transparent to queries." },
      { term: "Always Encrypted", definition: "Client-side encryption where keys never reach the server; protects data in use." },
      { term: "Secure enclave", definition: "A protected memory region enabling comparisons/computations on Always Encrypted data." },
    ],
    sections: {
      overview: "DP-800 emphasizes protecting sensitive columns. Always Encrypted is the headline: the server never sees plaintext or keys.",
      officialConcepts: [
        { kind: "official", heading: "The three layers", body: "- **TDE** encrypts the whole database at rest, transparently.\n- **Column-level encryption** uses keys/certificates via `ENCRYPTBYKEY`.\n- **Always Encrypted** encrypts on the **client**; the engine stores and returns ciphertext and never has the Column Encryption Key. **Secure enclaves** extend it to support pattern-matching and range comparisons." },
      ],
      commonMistakes: [{ mistake: "Expecting the server to query Always Encrypted columns in plaintext.", fix: "Only enclave-enabled operations work server-side; otherwise decryption happens in the driver." }],
      examTips: [
        "'Server admin/DBA must not see plaintext' => Always Encrypted.",
        "'Encrypt everything at rest transparently' => TDE.",
        "Secure enclaves enable richer WHERE operations on encrypted columns.",
      ],
      summary: "Layer TDE (at rest), column encryption, and Always Encrypted (in use). Always Encrypted keeps keys client-side; enclaves add richer queries.",
    },
    knowledgeCheck: { questionIds: ["q-l0501-1", "q-l0501-2", "q-l0501-3"] },
    references: [REFS.studyGuide, ref("Always Encrypted", "https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/always-encrypted-database-engine"), ref("Transparent Data Encryption", "https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/transparent-data-encryption")],
  }),

  defineLesson({
    id: "l0502",
    moduleId: "m05",
    domainId: "d2",
    order: 2,
    slug: "dynamic-data-masking",
    title: "Dynamic Data Masking",
    summary: "Obscure sensitive values for unprivileged users without changing stored data.",
    estimatedMinutes: 20,
    difficulty: "beginner",
    learningObjectives: ["Apply DDM mask types.", "Explain that DDM is presentation-layer, not encryption.", "Grant UNMASK appropriately."],
    keyTerms: [
      { term: "Dynamic Data Masking", definition: "A feature that masks column values in query results for users without UNMASK permission." },
    ],
    sections: {
      overview: "DDM hides data at query time for non-privileged users while the underlying data is unchanged.",
      officialConcepts: [{ kind: "official", body: "Add masks with `MASKED WITH (FUNCTION = 'default()' | 'partial()' | 'email()' | 'random()')`. Users with **UNMASK** see real values. DDM is **not** a security boundary against determined users — combine with RLS and least privilege." }],
      commonMistakes: [{ mistake: "Treating DDM as encryption.", fix: "DDM only masks display; data is stored in clear and can be inferred via crafted queries without proper permissions." }],
      examTips: ["DDM is presentation-only; pair it with real access controls."],
      summary: "Use DDM to reduce accidental exposure, but never as your only control — it's cosmetic, not cryptographic.",
    },
    knowledgeCheck: { questionIds: ["q-l0502-1", "q-l0502-2"] },
    references: [REFS.studyGuide, ref("Dynamic Data Masking", "https://learn.microsoft.com/en-us/sql/relational-databases/security/dynamic-data-masking")],
  }),

  // ---------------- FLAGSHIP: Row-Level Security ----------------
  defineLesson({
    id: "l0503",
    moduleId: "m05",
    domainId: "d2",
    order: 3,
    slug: "row-level-security",
    title: "Row-Level Security",
    summary:
      "Restrict which rows each user can see or change with predicate functions and security policies — and compare RLS across all four engines.",
    estimatedMinutes: 55,
    difficulty: "advanced",
    flagship: true,
    learningObjectives: [
      "Implement RLS with an inline TVF predicate and a SECURITY POLICY.",
      "Distinguish FILTER predicates (reads) from BLOCK predicates (writes).",
      "Avoid RLS bypass and side-channel pitfalls.",
      "Compare RLS with PostgreSQL, MySQL, and Oracle approaches.",
    ],
    keyTerms: [
      { term: "Predicate function", definition: "An inline TVF that returns 1 for rows a user may access." },
      { term: "Security policy", definition: "The object that binds predicate functions to a table as FILTER and/or BLOCK predicates." },
      { term: "FILTER predicate", definition: "Silently removes rows from reads." },
      { term: "BLOCK predicate", definition: "Prevents writes that would violate the predicate." },
    ],
    sections: {
      overview:
        "Multi-tenant and least-privilege designs need per-row access control enforced in the database, not the app. SQL Server's Row-Level Security does this with an inline table-valued predicate function bound to a table by a security policy — transparent to application queries.",
      officialConcepts: [
        {
          kind: "official",
          heading: "How RLS works",
          body:
            "You write an **inline TVF** that returns a row when access is allowed, then attach it via `CREATE SECURITY POLICY`. A **FILTER predicate** silently excludes rows from SELECT/UPDATE/DELETE reads; a **BLOCK predicate** stops INSERT/UPDATE that would move a row out of a user's visibility. The predicate typically uses session context (`SESSION_CONTEXT`, `USER_NAME()`, `DATABASE_PRINCIPAL_ID()`).",
        },
        {
          kind: "official",
          heading: "Predicate types",
          body:
            "- **FILTER**: applies to reads (and the read portion of writes).\n- **BLOCK AFTER INSERT / AFTER UPDATE / BEFORE UPDATE / BEFORE DELETE**: prevent writing rows a user shouldn't own.\nUse both together to fully sandbox a tenant.",
        },
      ],
      visualExplanation: {
        caption: "A single query passes through the RLS predicate, which appends a hidden filter based on the caller's identity.",
        mermaid: `flowchart TB
    q["SELECT * FROM Orders"] --> pol["Security policy"]
    pol --> pred["Predicate TVF returns rows WHERE TenantId = SESSION_CONTEXT"]
    pred --> res["Caller sees only their tenant's rows"]`,
      },
      sqlServerImplementation: [
        {
          kind: "official",
          heading: "Predicate function + policy",
          body:
            "```sql\nCREATE SCHEMA sec;\nGO\nCREATE FUNCTION sec.fn_tenant(@TenantId int)\nRETURNS TABLE WITH SCHEMABINDING\nAS RETURN\n  SELECT 1 AS ok\n  WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS int)\n     OR DATABASE_PRINCIPAL_ID() = DATABASE_PRINCIPAL_ID('dbo');\nGO\nCREATE SECURITY POLICY sec.TenantFilter\n  ADD FILTER PREDICATE sec.fn_tenant(TenantId) ON dbo.Orders,\n  ADD BLOCK PREDICATE sec.fn_tenant(TenantId) ON dbo.Orders AFTER INSERT\n  WITH (STATE = ON);\n```",
        },
        {
          kind: "explanation",
          heading: "Setting the session context",
          body:
            "The app sets the tenant once per connection:\n```sql\nEXEC sp_set_session_context @key = N'TenantId', @value = 42, @read_only = 1;\n```\nMark it read-only so downstream code can't spoof another tenant.",
        },
      ],
      postgresComparison: [
        {
          kind: "explanation",
          heading: "PostgreSQL: native RLS with POLICY",
          body:
            "PostgreSQL has built-in RLS. Enable it per table and define policies with `USING` (read) and `WITH CHECK` (write) expressions — a very close analog to FILTER/BLOCK.\n```sql\nALTER TABLE orders ENABLE ROW LEVEL SECURITY;\nCREATE POLICY tenant_isolation ON orders\n  USING (tenant_id = current_setting('app.tenant_id')::int)\n  WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);\n```",
        },
      ],
      mysqlComparison: [
        {
          kind: "explanation",
          heading: "MySQL: no native RLS",
          body:
            "MySQL has **no built-in row-level security**. The common pattern is to expose data through **views that filter on a session variable or function**, and grant access only to those views:\n```sql\nCREATE VIEW my_orders AS\n  SELECT * FROM orders WHERE tenant_id = @app_tenant_id;\n```\nThis relies on discipline (users must not query base tables) rather than an engine-enforced boundary.",
        },
      ],
      oracleComparison: [
        {
          kind: "explanation",
          heading: "Oracle: Virtual Private Database (VPD)",
          body:
            "Oracle's **VPD** (`DBMS_RLS`) is the mature equivalent. A PL/SQL policy function returns a predicate string that Oracle appends to queries automatically.\n```sql\nBEGIN\n  DBMS_RLS.ADD_POLICY(\n    object_schema => 'APP', object_name => 'ORDERS',\n    policy_name => 'tenant_pol', function_schema => 'APP',\n    policy_function => 'tenant_predicate',\n    statement_types => 'SELECT,INSERT,UPDATE,DELETE');\nEND;\n```",
        },
      ],
      sideBySide: {
        id: "cmp-rls",
        concept: "Row-level security",
        summary: "SQL Server, PostgreSQL, and Oracle enforce RLS in-engine; MySQL relies on views.",
        rows: [
          { aspect: "Native RLS", sqlserver: "Yes (SECURITY POLICY)", postgresql: "Yes (CREATE POLICY)", mysql: "No (use views)", oracle: "Yes (VPD / DBMS_RLS)" },
          { aspect: "Read filter", sqlserver: "FILTER predicate", postgresql: "USING clause", mysql: "View WHERE clause", oracle: "Policy predicate" },
          { aspect: "Write restriction", sqlserver: "BLOCK predicate", postgresql: "WITH CHECK", mysql: "WITH CHECK OPTION on view", oracle: "Policy on DML statements" },
          { aspect: "Identity source", sqlserver: "SESSION_CONTEXT / USER_NAME()", postgresql: "current_setting / current_user", mysql: "Session variable", oracle: "SYS_CONTEXT" },
        ],
        samples: [
          {
            label: "Enable per-tenant read filtering",
            code: {
              sqlserver: "ADD FILTER PREDICATE sec.fn_tenant(TenantId) ON dbo.Orders;",
              postgresql: "CREATE POLICY p ON orders USING (tenant_id = current_setting('app.tenant_id')::int);",
              mysql: "CREATE VIEW my_orders AS SELECT * FROM orders WHERE tenant_id = @app_tenant_id;",
              oracle: "DBMS_RLS.ADD_POLICY(object_name=>'ORDERS', policy_function=>'tenant_predicate');",
            },
          },
        ],
        migration: {
          equivalent: "SQL Server FILTER/BLOCK maps almost 1:1 to PostgreSQL USING/WITH CHECK and to Oracle VPD.",
          different: "MySQL has no engine-level RLS; you must emulate with views and revoke base-table access.",
          directMigration: "Yes to PostgreSQL/Oracle with predicate rewrites; MySQL requires a view-based redesign.",
          syntaxChanges: "Rewrite the predicate function and swap SESSION_CONTEXT for current_setting/SYS_CONTEXT.",
          limitations: "MySQL's view approach is bypassable if users retain base-table privileges.",
          whenToUse: "Use native RLS wherever available; on MySQL, layer views plus strict grants.",
        },
      },
      realWorldScenario: [
        {
          kind: "recommendation",
          heading: "Multi-tenant SaaS on one database",
          body:
            "A SaaS app stores every tenant's orders in one table. Set `TenantId` in read-only session context at login, add FILTER + BLOCK predicates, and the same application query returns only the caller's rows — with no WHERE clause in the app and no way to leak across tenants, even if the app has a bug.",
        },
      ],
      commonMistakes: [
        { mistake: "Relying on RLS alone while users can still run arbitrary aggregates.", fix: "Combine RLS with least-privilege grants; RLS filters rows but users may still infer data via side channels if over-privileged." },
        { mistake: "Forgetting a BLOCK predicate.", fix: "Without BLOCK, a user could INSERT/UPDATE rows into another tenant's space even though they can't read them." },
        { mistake: "Non-inline predicate functions.", fix: "RLS predicate functions must be inline TVFs with SCHEMABINDING for performance and correctness." },
      ],
      performanceSecurity: [
        { kind: "recommendation", body: "Keep the predicate sargable (indexed TenantId) so the appended filter uses an index. Mark session context read-only. Test that dbo/admin paths behave as intended, and audit policy changes." },
      ],
      examTips: [
        "FILTER = reads, BLOCK = writes. Memorize this.",
        "Predicate functions must be inline TVFs WITH SCHEMABINDING.",
        "Set tenant identity via sp_set_session_context with @read_only = 1.",
        "MySQL has no native RLS — the correct answer there is 'use views + grants'.",
      ],
      summary:
        "RLS enforces per-row access in the engine via an inline predicate function bound by a security policy: FILTER for reads, BLOCK for writes, identity from session context. PostgreSQL (POLICY) and Oracle (VPD) are close equivalents; MySQL emulates with views. Always pair RLS with least-privilege grants.",
    },
    labId: "lab-rls",
    knowledgeCheck: { questionIds: ["q-l0503-1", "q-l0503-2", "q-l0503-3", "q-l0503-4", "q-l0503-5"] },
    references: [
      REFS.studyGuide,
      ref("Row-Level Security", "https://learn.microsoft.com/en-us/sql/relational-databases/security/row-level-security"),
      ref("sp_set_session_context", "https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-set-session-context-transact-sql"),
      REFS.postgres,
      REFS.mysql,
      REFS.oracle,
    ],
  }),

  defineLesson({
    id: "l0504",
    moduleId: "m05",
    domainId: "d2",
    order: 4,
    slug: "permissions-and-passwordless",
    title: "Object-level permissions and passwordless access",
    summary: "Grant least-privilege permissions and adopt passwordless (Entra/Managed Identity) authentication.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Apply GRANT/DENY/REVOKE at object scope.", "Implement passwordless access with Microsoft Entra and Managed Identity."],
    keyTerms: [
      { term: "Least privilege", definition: "Granting only the permissions a principal needs to do its job." },
      { term: "Managed Identity", definition: "An Entra identity for Azure resources that removes the need for stored credentials." },
    ],
    sections: {
      overview: "Permissions and passwordless auth are foundational to secure DP-800 solutions, especially for AI service connections.",
      officialConcepts: [{ kind: "official", body: "Use `GRANT`/`DENY`/`REVOKE` on specific objects and prefer roles over per-user grants. **Passwordless** access uses Microsoft Entra authentication and **Managed Identity** so no secrets are stored — the recommended approach for app and AI-service connections." }],
      performanceSecurity: [{ kind: "recommendation", body: "DENY overrides GRANT. Assign permissions to roles, add users to roles, and use Managed Identity for service-to-database connections." }],
      examTips: ["Passwordless + Managed Identity is the preferred answer for connecting apps/AI services securely.", "DENY always wins over GRANT."],
      summary: "Grant least privilege via roles and go passwordless with Entra/Managed Identity for service connections.",
    },
    knowledgeCheck: { questionIds: ["q-l0504-1", "q-l0504-2"] },
    references: [REFS.studyGuide, ref("Permissions (Database Engine)", "https://learn.microsoft.com/en-us/sql/relational-databases/security/permissions-database-engine"), ref("Passwordless connections", "https://learn.microsoft.com/en-us/azure/azure-sql/database/authentication-aad-overview")],
  }),

  defineLesson({
    id: "l0505",
    moduleId: "m05",
    domainId: "d2",
    order: 5,
    slug: "auditing-and-secure-endpoints",
    title: "Auditing and securing model, GraphQL, REST, and MCP endpoints",
    summary: "Turn on auditing and lock down the endpoints that expose your data and AI models.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: ["Configure SQL Server/Azure SQL auditing.", "Secure model endpoints with Managed Identity.", "Secure GraphQL, REST, and MCP endpoints."],
    keyTerms: [
      { term: "SQL Audit", definition: "Tracks server- and database-level events to a log target." },
      { term: "Endpoint hardening", definition: "Authentication, authorization, and network controls on data/AI endpoints." },
    ],
    sections: {
      overview: "As data is exposed via APIs and AI models, DP-800 expects you to audit access and secure every endpoint.",
      officialConcepts: [{ kind: "official", body: "Create a **SQL Audit** (server/database) writing to a secure target and audit sensitive actions. **Secure model endpoints** with **Managed Identity** (no keys). For **GraphQL/REST/MCP** endpoints (e.g., Data API builder), require authentication, apply authorization per entity/role, and restrict network exposure." }],
      performanceSecurity: [{ kind: "recommendation", body: "Prefer Managed Identity over API keys for model endpoints; scope endpoint permissions per role; log tool/endpoint calls for the AI attack surface." }],
      examTips: ["Managed Identity is the recommended way to secure model endpoints.", "DAB endpoints support per-entity role-based authorization."],
      summary: "Audit sensitive access and harden model/GraphQL/REST/MCP endpoints with Managed Identity, per-role authorization, and network limits.",
    },
    knowledgeCheck: { questionIds: ["q-l0505-1", "q-l0505-2"] },
    references: [REFS.studyGuide, ref("SQL Server Audit", "https://learn.microsoft.com/en-us/sql/relational-databases/security/auditing/sql-server-audit-database-engine"), ref("Data API builder security", "https://learn.microsoft.com/en-us/azure/data-api-builder/authentication")],
  }),

  // -------- Module 06: performance --------
  defineLesson({
    id: "l0601",
    moduleId: "m06",
    domainId: "d2",
    order: 1,
    slug: "database-configuration",
    title: "Recommending database configurations",
    summary: "Tune database-scoped and instance settings for the workload.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Recommend database-scoped configurations.", "Reason about compatibility level and MAXDOP."],
    keyTerms: [
      { term: "Database-scoped configuration", definition: "Per-database settings like MAXDOP and legacy cardinality estimation." },
      { term: "Compatibility level", definition: "Controls which query optimizer behaviors and features are enabled." },
    ],
    sections: {
      overview: "Correct configuration is a prerequisite for good performance; DP-800 expects sensible recommendations.",
      officialConcepts: [{ kind: "official", body: "Use `ALTER DATABASE SCOPED CONFIGURATION` for settings such as `MAXDOP`, `LEGACY_CARDINALITY_ESTIMATION`, and query optimizer hotfixes. Set an appropriate **compatibility level** to opt into (or out of) optimizer changes safely." }],
      examTips: ["MAXDOP controls parallelism per query; too high can cause contention."],
      summary: "Match compatibility level and database-scoped settings (MAXDOP, CE) to your workload rather than accepting defaults blindly.",
    },
    knowledgeCheck: { questionIds: ["q-l0601-1", "q-l0601-2"] },
    references: [REFS.studyGuide, ref("ALTER DATABASE SCOPED CONFIGURATION", "https://learn.microsoft.com/en-us/sql/t-sql/statements/alter-database-scoped-configuration-transact-sql")],
  }),

  defineLesson({
    id: "l0602",
    moduleId: "m06",
    domainId: "d2",
    order: 2,
    slug: "isolation-and-concurrency",
    title: "Transaction isolation levels and concurrency",
    summary: "Trade consistency for concurrency with isolation levels, and understand row-versioning (RCSI/snapshot).",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: ["Order the isolation levels and the anomalies they prevent.", "Explain RCSI and SNAPSHOT isolation.", "Choose an isolation level for a scenario."],
    keyTerms: [
      { term: "Isolation level", definition: "Controls visibility of concurrent transactions' changes." },
      { term: "RCSI", definition: "Read Committed Snapshot Isolation — read committed using row versions, avoiding reader/writer blocking." },
      { term: "Snapshot isolation", definition: "Transaction sees a consistent snapshot as of its start." },
    ],
    sections: {
      overview: "Isolation levels balance correctness against concurrency; this is a heavily tested area.",
      officialConcepts: [{ kind: "official", body: "From least to most isolating: READ UNCOMMITTED, READ COMMITTED (default), REPEATABLE READ, SERIALIZABLE. Anomalies: dirty read, non-repeatable read, phantom. **RCSI** and **SNAPSHOT** use row versioning so readers don't block writers." }],
      commonMistakes: [{ mistake: "Using NOLOCK (READ UNCOMMITTED) for 'speed'.", fix: "It permits dirty/inconsistent reads; prefer RCSI for non-blocking consistent reads." }],
      examTips: ["SERIALIZABLE prevents phantoms; REPEATABLE READ does not.", "RCSI changes read-committed to use versions — great default for read-heavy OLTP."],
      summary: "Pick the lowest isolation that prevents the anomalies you care about; use RCSI/snapshot to avoid reader/writer blocking.",
    },
    knowledgeCheck: { questionIds: ["q-l0602-1", "q-l0602-2", "q-l0602-3"] },
    references: [REFS.studyGuide, ref("SET TRANSACTION ISOLATION LEVEL", "https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql")],
  }),

  defineLesson({
    id: "l0603",
    moduleId: "m06",
    domainId: "d2",
    order: 3,
    slug: "execution-plans-dmvs-query-store",
    title: "Execution plans, DMVs, and Query Store",
    summary: "Diagnose query performance with execution plans, dynamic management views, and Query Store.",
    estimatedMinutes: 40,
    difficulty: "advanced",
    learningObjectives: ["Read estimated vs actual plans and spot warnings.", "Query key DMVs for waits and expensive queries.", "Use Query Store to find and force plans."],
    keyTerms: [
      { term: "Execution plan", definition: "The engine's chosen strategy to run a query." },
      { term: "DMV", definition: "Dynamic management view exposing server/database runtime state." },
      { term: "Query Store", definition: "Captures query text, plans, and runtime stats over time for regression analysis." },
    ],
    sections: {
      overview: "Performance troubleshooting hinges on plans, DMVs, and Query Store — all explicitly in the blueprint.",
      officialConcepts: [{ kind: "official", body: "Compare **estimated vs actual** plans; watch for key lookups, spills, and bad estimates. DMVs like `sys.dm_exec_query_stats`, `sys.dm_exec_requests`, and `sys.dm_os_wait_stats` reveal hotspots. **Query Store** tracks plan history and lets you **force a plan** to fix regressions. Azure SQL adds **Query Performance Insight**." }],
      examTips: ["Query Store 'force plan' fixes plan-regression scenarios.", "A fat arrow in a plan means many rows — often where the cost is."],
      summary: "Use execution plans to see the strategy, DMVs to find hotspots, and Query Store to catch and pin regressions.",
    },
    knowledgeCheck: { questionIds: ["q-l0603-1", "q-l0603-2", "q-l0603-3"] },
    references: [REFS.studyGuide, ref("Query Store", "https://learn.microsoft.com/en-us/sql/relational-databases/performance/monitoring-performance-by-using-the-query-store"), ref("Execution plans", "https://learn.microsoft.com/en-us/sql/relational-databases/performance/execution-plans")],
  }),

  defineLesson({
    id: "l0604",
    moduleId: "m06",
    domainId: "d2",
    order: 4,
    slug: "blocking-and-deadlocks",
    title: "Blocking and deadlocks",
    summary: "Identify, resolve, and prevent blocking chains and deadlocks.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: ["Diagnose blocking with DMVs.", "Read a deadlock graph.", "Apply prevention strategies."],
    keyTerms: [
      { term: "Blocking", definition: "One transaction waits for a lock held by another." },
      { term: "Deadlock", definition: "Two+ transactions each wait on locks the others hold; the engine kills a victim." },
    ],
    sections: {
      overview: "Concurrency problems show up as blocking and deadlocks; the exam expects diagnosis and mitigation.",
      officialConcepts: [{ kind: "official", body: "Find blocking via `sys.dm_exec_requests` (`blocking_session_id`). Capture **deadlock graphs** with Extended Events. Reduce both by keeping transactions short, accessing objects in a consistent order, indexing to shorten locks, and considering RCSI." }],
      commonMistakes: [{ mistake: "Retrying a deadlock victim without addressing access order.", fix: "Fix the root cause: consistent object access order and shorter transactions." }],
      examTips: ["Consistent object access order prevents many deadlocks.", "RCSI removes many reader/writer blocking scenarios."],
      summary: "Keep transactions short, access objects in the same order, index well, and use RCSI to cut blocking and deadlocks.",
    },
    knowledgeCheck: { questionIds: ["q-l0604-1", "q-l0604-2"] },
    references: [REFS.studyGuide, ref("Deadlocks guide", "https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-deadlocks-guide")],
  }),

  // -------- Module 07: CI/CD --------
  defineLesson({
    id: "l0701",
    moduleId: "m07",
    domainId: "d2",
    order: 1,
    slug: "sql-database-projects",
    title: "SQL Database Projects and SDK-style models",
    summary: "Define your schema as code, build a dacpac, and validate the model.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Create and build a SQL Database Project (SDK-style).", "Explain declarative, model-based deployment via dacpac.", "Validate a database model."],
    keyTerms: [
      { term: "SQL Database Project", definition: "A source-controlled, declarative definition of a database schema." },
      { term: "dacpac", definition: "A build artifact containing the database model, deployed by comparing to the target." },
      { term: "SDK-style project", definition: "A modern, concise project format for SQL projects." },
    ],
    sections: {
      overview: "CI/CD for databases starts with treating schema as code in a SQL Database Project.",
      officialConcepts: [{ kind: "official", body: "A **SQL Database Project** declares the desired schema. Building it produces a **dacpac**; deployment computes the diff against the target and applies changes (declarative, not migration scripts). **SDK-style** projects are the current recommended format and build cross-platform." }],
      examTips: ["dacpac deployment is declarative: it makes the target match the model.", "SDK-style projects are the modern default."],
      summary: "Model schema declaratively in an SDK-style SQL project; build a dacpac and deploy by diffing against the target.",
    },
    knowledgeCheck: { questionIds: ["q-l0701-1", "q-l0701-2"] },
    references: [REFS.studyGuide, ref("SQL Database Projects", "https://learn.microsoft.com/en-us/sql/tools/sql-database-projects/sql-database-projects")],
  }),

  defineLesson({
    id: "l0702",
    moduleId: "m07",
    domainId: "d2",
    order: 2,
    slug: "source-control-and-branching",
    title: "Source control, branching, and reference data",
    summary: "Manage schema in Git with branching, pull requests, conflict resolution, and versioned reference data.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Configure source control for a SQL project.", "Manage branches, PRs, and conflicts.", "Version reference/static data."],
    keyTerms: [
      { term: "Reference data", definition: "Static/lookup data managed in source control and deployed with the schema (post-deployment scripts)." },
      { term: "Pull request", definition: "A reviewed proposal to merge a branch." },
    ],
    sections: {
      overview: "Databases benefit from the same Git workflow as app code — branches, PRs, and reviewed merges.",
      officialConcepts: [{ kind: "official", body: "Keep the project in Git; use feature branches and **pull requests** with review. Resolve merge conflicts in the declarative files. Store **reference/static data** in source control (typically post-deployment scripts) so environments stay consistent." }],
      examTips: ["Reference data lives in post-deployment scripts within the project.", "PRs + branch policies enforce review before deployment."],
      summary: "Treat schema like code: branch, PR, review, and version reference data alongside the model.",
    },
    knowledgeCheck: { questionIds: ["q-l0702-1", "q-l0702-2"] },
    references: [REFS.studyGuide, ref("Source control for databases", "https://learn.microsoft.com/en-us/sql/tools/sql-database-projects/sql-database-projects")],
  }),

  defineLesson({
    id: "l0703",
    moduleId: "m07",
    domainId: "d2",
    order: 3,
    slug: "testing-and-secrets",
    title: "Testing strategy and secrets management",
    summary: "Add unit and integration tests to your database pipeline and manage secrets safely.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Design unit and integration tests for database code.", "Manage secrets outside source control."],
    keyTerms: [
      { term: "Unit test", definition: "Validates a single object's behavior (e.g., a stored procedure) in isolation." },
      { term: "Secrets management", definition: "Storing credentials/keys outside code (e.g., Key Vault, GitHub secrets)." },
    ],
    sections: {
      overview: "Reliable deployments need tests and secrets that never live in the repo.",
      officialConcepts: [{ kind: "official", body: "Write **unit tests** for procedures/functions and **integration tests** that exercise the deployed schema. Keep credentials in a secrets store (Azure Key Vault, GitHub Actions secrets) referenced by the pipeline — never commit secrets." }],
      performanceSecurity: [{ kind: "recommendation", body: "Reference secrets from Key Vault via Managed Identity in pipelines; rotate regularly." }],
      examTips: ["Never store connection strings/keys in the project — use a secret store.", "Integration tests run against a deployed copy."],
      summary: "Test database code (unit + integration) and keep every secret in a managed store, referenced at deploy time.",
    },
    knowledgeCheck: { questionIds: ["q-l0703-1", "q-l0703-2"] },
    references: [REFS.studyGuide, ref("Azure Key Vault", "https://learn.microsoft.com/en-us/azure/key-vault/general/overview")],
  }),

  defineLesson({
    id: "l0704",
    moduleId: "m07",
    domainId: "d2",
    order: 4,
    slug: "schema-drift-and-pipelines",
    title: "Schema drift detection and deployment pipelines",
    summary: "Detect drift between model and target, and control deployments with branch policies and approvals.",
    estimatedMinutes: 25,
    difficulty: "advanced",
    learningObjectives: ["Detect schema drift with SQL Database Projects.", "Implement pipeline controls: branch policies, triggers, approvals, code owners."],
    keyTerms: [
      { term: "Schema drift", definition: "When a deployed database diverges from the source-controlled model." },
      { term: "Branch policy", definition: "Rules (reviews, checks) that gate merges to protected branches." },
    ],
    sections: {
      overview: "Production databases drift; DP-800 expects you to detect drift and gate deployments.",
      officialConcepts: [{ kind: "official", body: "Compare the target to the project to **detect schema drift**, then reconcile. Control deployment pipelines with **branch policies**, **triggers**, **approvals**, authentication, and **code owners** so only reviewed, authorized changes reach production." }],
      examTips: ["Schema drift = target no longer matches the model.", "Approvals + branch policies + code owners gate production deploys."],
      summary: "Detect drift by comparing target vs model, and enforce approvals, branch policies, and code owners on the pipeline.",
    },
    knowledgeCheck: { questionIds: ["q-l0704-1", "q-l0704-2"] },
    references: [REFS.studyGuide, ref("Detect schema drift", "https://learn.microsoft.com/en-us/sql/tools/sql-database-projects/sql-database-projects")],
  }),

  // -------- Module 08: Azure integration --------
  defineLesson({
    id: "l0801",
    moduleId: "m08",
    domainId: "d2",
    order: 1,
    slug: "data-api-builder-config",
    title: "Data API builder configuration",
    summary: "Generate secure REST and GraphQL APIs over your database with Data API builder config files.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Create a DAB configuration file.", "Understand how entities become endpoints."],
    keyTerms: [
      { term: "Data API builder (DAB)", definition: "A tool that exposes database objects as REST and GraphQL endpoints from a config file." },
      { term: "Entity", definition: "A DAB-mapped database object (table/view/stored procedure) exposed via the API." },
    ],
    sections: {
      overview: "DAB turns tables, views, and procedures into APIs without hand-written services — a core Domain 2 integration skill.",
      officialConcepts: [{ kind: "official", body: "Author a **dab-config.json** defining the data source and **entities**. Each entity maps a table/view/stored procedure and its permissions to REST and/or GraphQL endpoints. DAB handles routing, serialization, and security policy." }],
      examTips: ["DAB is configuration-driven; entities map objects to endpoints.", "Permissions are defined per entity per role."],
      summary: "Define a DAB config with entities to expose database objects as REST/GraphQL, with per-entity role permissions.",
    },
    knowledgeCheck: { questionIds: ["q-l0801-1", "q-l0801-2"] },
    references: [REFS.studyGuide, ref("Data API builder", "https://learn.microsoft.com/en-us/azure/data-api-builder/")],
  }),

  defineLesson({
    id: "l0802",
    moduleId: "m08",
    domainId: "d2",
    order: 2,
    slug: "rest-graphql-entities",
    title: "REST and GraphQL entities: caching, pagination, filtering",
    summary: "Expose objects and relationships and tune endpoints with caching, pagination, searching, and filtering.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Configure REST/GraphQL endpoints and relationships.", "Enable caching, pagination, searching, and filtering."],
    keyTerms: [
      { term: "GraphQL relationship", definition: "A configured link between entities enabling nested queries." },
      { term: "Pagination", definition: "Returning results in pages (e.g., first/after) to bound response size." },
    ],
    sections: {
      overview: "Well-designed endpoints need caching, paging, and filtering — all configurable in DAB.",
      officialConcepts: [{ kind: "official", body: "Expose tables, views, **stored procedures**, and **GraphQL relationships**. Configure **data caching**, **pagination**, **searching**, and **filtering** so clients fetch exactly what they need efficiently." }],
      examTips: ["DAB can expose stored procedures and relationships, not just tables.", "Enable pagination to bound payloads."],
      summary: "Configure entity relationships plus caching, pagination, search, and filtering to build efficient REST/GraphQL APIs.",
    },
    knowledgeCheck: { questionIds: ["q-l0802-1", "q-l0802-2"] },
    references: [REFS.studyGuide, ref("DAB REST", "https://learn.microsoft.com/en-us/azure/data-api-builder/rest"), ref("DAB GraphQL", "https://learn.microsoft.com/en-us/azure/data-api-builder/graphql")],
  }),

  defineLesson({
    id: "l0803",
    moduleId: "m08",
    domainId: "d2",
    order: 3,
    slug: "azure-monitor",
    title: "Monitoring with Azure Monitor",
    summary: "Observe SQL and API workloads with Application Insights and Log Analytics.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Recommend Azure Monitor configurations.", "Use Application Insights and Log Analytics for observability."],
    keyTerms: [
      { term: "Application Insights", definition: "APM service for request tracing, dependencies, and failures." },
      { term: "Log Analytics", definition: "A workspace that stores and queries telemetry with KQL." },
    ],
    sections: {
      overview: "Observability is explicitly in the blueprint: recommend the right Azure Monitor setup for SQL and AI workloads.",
      officialConcepts: [{ kind: "official", body: "Send metrics and logs to **Azure Monitor**. Use **Application Insights** for end-to-end request/dependency tracing (including calls to AI services) and **Log Analytics** to store and query telemetry with KQL, powering alerts and dashboards." }],
      examTips: ["App Insights = distributed tracing; Log Analytics = query/store logs.", "Monitor AI service dependencies via App Insights."],
      summary: "Route telemetry to Azure Monitor; use App Insights for tracing and Log Analytics for querying and alerting.",
    },
    knowledgeCheck: { questionIds: ["q-l0803-1", "q-l0803-2"] },
    references: [REFS.studyGuide, ref("Azure Monitor", "https://learn.microsoft.com/en-us/azure/azure-monitor/overview")],
  }),

  defineLesson({
    id: "l0804",
    moduleId: "m08",
    domainId: "d2",
    order: 4,
    slug: "change-handling",
    title: "Change handling: CDC, Change Tracking, CES, and event-driven patterns",
    summary: "React to data changes with CDC, Change Tracking, Change Event Streaming, Azure Functions, and Logic Apps.",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: ["Compare CDC, Change Tracking, and CES.", "Wire event-driven reactions with Azure Functions SQL trigger and Logic Apps."],
    keyTerms: [
      { term: "Change Data Capture (CDC)", definition: "Captures full row change history to change tables." },
      { term: "Change Tracking (CT)", definition: "Lightweight tracking of which rows changed (not full history)." },
      { term: "Change Event Streaming (CES)", definition: "Streams change events (Fabric) to downstream consumers." },
    ],
    sections: {
      overview: "Change handling underpins both integration and AI embedding maintenance (Domain 3) — know the options and trade-offs.",
      officialConcepts: [{ kind: "official", body: "**CDC** records full before/after history; **Change Tracking** is lighter and only says what changed; **CES** streams change events in Fabric. React with **Azure Functions (SQL trigger binding)** or **Logic Apps** for event-driven workflows. These same mechanisms keep embeddings current in Domain 3." }],
      examTips: ["CDC = full history (heavier); CT = which rows changed (lighter).", "Azure Functions SQL trigger reacts to table changes."],
      summary: "Pick CDC for full history, CT for lightweight change detection, CES for Fabric streaming; automate reactions with Functions/Logic Apps.",
    },
    knowledgeCheck: { questionIds: ["q-l0804-1", "q-l0804-2"] },
    references: [REFS.studyGuide, ref("Change Data Capture", "https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/about-change-data-capture-sql-server"), ref("Change Tracking", "https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/about-change-tracking-sql-server")],
  }),
];
