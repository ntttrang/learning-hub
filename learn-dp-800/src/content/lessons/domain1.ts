import type { Lesson } from "@/lib/types";
import { defineLesson, ref, REFS } from "./_shared";

export const DOMAIN1_LESSONS: Lesson[] = [
  defineLesson({
    id: "l0101",
    moduleId: "m01",
    domainId: "d1",
    order: 1,
    slug: "tables-data-types-indexes",
    title: "Tables, data types, and indexes",
    summary:
      "Choose right-sized data types, design clustered and nonclustered indexes, and know when columnstore beats rowstore.",
    estimatedMinutes: 30,
    difficulty: "beginner",
    learningObjectives: [
      "Select appropriate data types and understand their storage and precision trade-offs.",
      "Distinguish clustered, nonclustered, and columnstore indexes and when to use each.",
      "Explain how index design affects read and write performance.",
    ],
    keyTerms: [
      { term: "Clustered index", definition: "Defines the physical sort order of the table's rows; one per table." },
      { term: "Nonclustered index", definition: "A separate structure with a copy of key columns plus a row locator." },
      { term: "Columnstore index", definition: "Column-oriented storage with compression, ideal for analytics over large tables." },
      { term: "Heap", definition: "A table with no clustered index; rows are unordered." },
    ],
    sections: {
      overview:
        "Every DP-800 solution starts with well-designed tables. The exam expects you to pick correct data types, size columns deliberately, and choose the right index type for the workload.",
      officialConcepts: [
        {
          kind: "official",
          heading: "Rowstore vs columnstore",
          body:
            "SQL Server stores tables as **rowstore** (clustered/nonclustered B-tree indexes) or **columnstore**. Columnstore indexes store data column-by-column with heavy compression and batch-mode execution, giving large gains for analytic queries scanning many rows. Rowstore remains best for OLTP seeks and small range scans.",
        },
        {
          kind: "official",
          heading: "Data types",
          body:
            "Use the smallest type that safely holds your data: `INT` vs `BIGINT`, `DECIMAL(p,s)` for exact numerics, `DATE`/`DATETIME2` over legacy `DATETIME`, and `NVARCHAR` for Unicode. Oversized types waste storage, memory grants, and index space.",
        },
      ],
      examTips: [
        "If a question describes analytics over millions of rows, the answer is usually a **columnstore** index.",
        "A table can have only one clustered index but many nonclustered indexes.",
        "`DATETIME2` has better range and precision than `DATETIME`; prefer it for new designs.",
      ],
      summary:
        "Right-size data types, give most OLTP tables a clustered index, add nonclustered indexes for frequent predicates, and reach for columnstore when the workload is analytic.",
    },
    knowledgeCheck: { questionIds: ["q-l0101-1", "q-l0101-2", "q-l0101-3"] },
    references: [REFS.studyGuide, ref("Columnstore indexes overview", "https://learn.microsoft.com/en-us/sql/relational-databases/indexes/columnstore-indexes-overview"), ref("Data types (Transact-SQL)", "https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql")],
  }),

  defineLesson({
    id: "l0102",
    moduleId: "m01",
    domainId: "d1",
    order: 2,
    slug: "specialized-tables",
    title: "Specialized tables: in-memory, temporal, external, ledger, graph",
    summary:
      "Know the purpose, constraints, and syntax of SQL Server's specialized table types and when each is the right tool.",
    estimatedMinutes: 35,
    difficulty: "intermediate",
    learningObjectives: [
      "Match each specialized table type to the scenario it solves.",
      "Recall the defining syntax for temporal, ledger, and graph tables.",
      "Explain the guarantees ledger tables provide for tamper-evidence.",
    ],
    keyTerms: [
      { term: "Temporal table", definition: "System-versioned table that automatically keeps full history of row changes." },
      { term: "Ledger table", definition: "Provides cryptographically verifiable, tamper-evident history using a blockchain-like structure." },
      { term: "Memory-optimized table", definition: "In-memory OLTP table using lock-free structures for extreme throughput." },
      { term: "Graph table", definition: "NODE and EDGE tables queried with the MATCH operator." },
    ],
    sections: {
      overview:
        "SQL Server ships several specialized table types. The exam tests recognizing which one fits a described requirement.",
      officialConcepts: [
        {
          kind: "official",
          heading: "The five types",
          body:
            "- **In-memory (memory-optimized)**: `WITH (MEMORY_OPTIMIZED = ON)` for high-throughput OLTP.\n- **Temporal**: `WITH (SYSTEM_VERSIONING = ON)` keeps a history table for point-in-time queries with `FOR SYSTEM_TIME`.\n- **External**: `CREATE EXTERNAL TABLE` reads data that lives outside the database (e.g., data lake).\n- **Ledger**: `WITH (LEDGER = ON)` for tamper-evident, auditable data.\n- **Graph**: `AS NODE` / `AS EDGE` tables queried with `MATCH`.",
        },
      ],
      commonMistakes: [
        { mistake: "Using a temporal table when tamper-evidence is required.", fix: "Temporal tables track history but are not tamper-proof; use ledger tables for verifiable auditing." },
      ],
      examTips: [
        "'Tamper-evident' / 'cryptographically verifiable' => ledger table.",
        "'Point-in-time' / 'as of' history => temporal table with FOR SYSTEM_TIME.",
        "'Query relationships / many-to-many networks' => graph NODE/EDGE + MATCH.",
      ],
      summary:
        "Learn the one-line trigger phrase for each specialized table type — the exam usually gives you a scenario and asks which one to pick.",
    },
    knowledgeCheck: { questionIds: ["q-l0102-1", "q-l0102-2", "q-l0102-3"] },
    references: [REFS.studyGuide, ref("Temporal tables", "https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables"), ref("Ledger", "https://learn.microsoft.com/en-us/sql/relational-databases/security/ledger/ledger-overview")],
  }),

  // ---------------- FLAGSHIP: JSON columns and functions ----------------
  defineLesson({
    id: "l0103",
    moduleId: "m01",
    domainId: "d1",
    order: 3,
    slug: "json-columns-and-functions",
    title: "JSON columns, indexes, and functions",
    summary:
      "Store, index, query, and shape semi-structured JSON in SQL Server — and see exactly how PostgreSQL, MySQL, and Oracle differ.",
    estimatedMinutes: 55,
    difficulty: "intermediate",
    flagship: true,
    learningObjectives: [
      "Store JSON in SQL Server using the native json data type and the nvarchar pattern.",
      "Query and shape JSON with OPENJSON, JSON_VALUE, JSON_QUERY, JSON_OBJECT, and JSON_ARRAY.",
      "Index JSON for predicate performance.",
      "Translate JSON designs across SQL Server, PostgreSQL, MySQL, and Oracle.",
    ],
    keyTerms: [
      { term: "json data type", definition: "SQL Server 2025's native binary JSON type with validation and efficient access." },
      { term: "OPENJSON", definition: "Table-valued function that shreds a JSON document into rows and columns." },
      { term: "JSON_VALUE", definition: "Extracts a scalar value from JSON using a path expression." },
      { term: "JSON path", definition: "A `$.a.b[0]` expression that navigates into a JSON document." },
    ],
    sections: {
      overview:
        "Modern applications mix relational and semi-structured data. DP-800 expects you to store JSON, validate it, extract and project values, and index it for performance. SQL Server 2025 adds a native `json` data type alongside the long-standing `nvarchar(max)` approach.",
      officialConcepts: [
        {
          kind: "official",
          heading: "Storing JSON",
          body:
            "SQL Server 2025 introduces the native **`json`** data type, which stores an optimized binary form, validates on insert, and speeds up read/modify operations. Before it, JSON was stored in `nvarchar(max)` with an optional `ISJSON()` check constraint. Both are still valid; the exam expects you to know the native type is preferred on SQL Server 2025.",
        },
        {
          kind: "official",
          heading: "Reading JSON",
          body:
            "- **`JSON_VALUE(expr, path)`** returns a scalar (string/number).\n- **`JSON_QUERY(expr, path)`** returns an object or array fragment.\n- **`OPENJSON(expr [, path]) WITH (...)`** shreds JSON into a rowset with a typed schema.\n- **`ISJSON(expr)`** validates.",
        },
        {
          kind: "official",
          heading: "Constructing JSON",
          body:
            "SQL Server supports **`JSON_OBJECT`**, **`JSON_ARRAY`**, and **`JSON_ARRAYAGG`** constructors, plus **`FOR JSON PATH`/`AUTO`** to serialize query results. **`JSON_MODIFY`** updates values in place, and **`JSON_CONTAINS`** tests membership.",
        },
      ],
      visualExplanation: {
        caption: "How OPENJSON shreds a document into a typed rowset that you can join like any table.",
        mermaid: `flowchart LR
    doc["JSON document {orders:[...] }"] --> openjson["OPENJSON(@json, '$.orders')"]
    openjson --> withclause["WITH (id INT, total DECIMAL)"]
    withclause --> rows["Relational rowset"]
    rows --> joins["JOIN / WHERE / aggregate"]`,
      },
      sqlServerImplementation: [
        {
          kind: "official",
          heading: "Native json column + query",
          body:
            "```sql\n-- SQL Server 2025 native json type\nCREATE TABLE dbo.Product (\n    ProductId INT PRIMARY KEY,\n    Attributes json NOT NULL\n);\n\nINSERT dbo.Product VALUES\n(1, '{\"color\":\"red\",\"tags\":[\"sale\",\"new\"],\"dims\":{\"w\":10,\"h\":4}}');\n\n-- Scalar extract\nSELECT ProductId,\n       JSON_VALUE(Attributes, '$.color')   AS color,\n       JSON_QUERY(Attributes, '$.tags')    AS tags\nFROM dbo.Product;\n\n-- Shred an array into rows\nSELECT p.ProductId, t.[value] AS tag\nFROM dbo.Product p\nCROSS APPLY OPENJSON(p.Attributes, '$.tags') t;\n```",
        },
        {
          kind: "recommendation",
          heading: "Indexing JSON predicates",
          body:
            "SQL Server does not index inside a JSON blob directly. Promote hot paths to a **computed column** and index that:\n\n```sql\nALTER TABLE dbo.Product\n  ADD Color AS JSON_VALUE(Attributes, '$.color');\nCREATE INDEX IX_Product_Color ON dbo.Product(Color);\n```",
        },
      ],
      postgresComparison: [
        {
          kind: "explanation",
          heading: "PostgreSQL: jsonb + GIN",
          body:
            "PostgreSQL has first-class **`json`** (text-preserving) and **`jsonb`** (binary, indexable) types. Use operators `->`, `->>`, `#>`, and the containment operator `@>`. Crucially, `jsonb` supports **GIN indexes** that index the whole document — no computed-column trick needed.\n\n```sql\nCREATE TABLE product (product_id int PRIMARY KEY, attributes jsonb);\nSELECT attributes ->> 'color' AS color FROM product;\nSELECT * FROM product, jsonb_array_elements_text(attributes->'tags') AS tag;\nCREATE INDEX idx_product_attrs ON product USING GIN (attributes);\nSELECT * FROM product WHERE attributes @> '{\"color\":\"red\"}';\n```",
        },
      ],
      mysqlComparison: [
        {
          kind: "explanation",
          heading: "MySQL: JSON type + generated columns",
          body:
            "MySQL has a native **`JSON`** type. Extract with `JSON_EXTRACT()` or the `->` / `->>` shortcuts. Like SQL Server, MySQL cannot index inside JSON directly — you index a **generated (virtual) column**.\n\n```sql\nCREATE TABLE product (\n  product_id INT PRIMARY KEY,\n  attributes JSON,\n  color VARCHAR(20) AS (attributes->>'$.color') STORED,\n  INDEX idx_color (color)\n);\nSELECT attributes->>'$.color' AS color FROM product;\nSELECT jt.tag FROM product,\n  JSON_TABLE(attributes, '$.tags[*]' COLUMNS (tag VARCHAR(50) PATH '$')) AS jt;\n```",
        },
      ],
      oracleComparison: [
        {
          kind: "explanation",
          heading: "Oracle: JSON type + JSON_TABLE",
          body:
            "Oracle (21c+) has a native **`JSON`** type; earlier versions used `VARCHAR2`/`CLOB` with an `IS JSON` check. Query with dot-notation, `JSON_VALUE`, `JSON_QUERY`, and shred with **`JSON_TABLE`**. Oracle can index JSON via function-based indexes or a **JSON search index**.\n\n```sql\nCREATE TABLE product (product_id NUMBER PRIMARY KEY, attributes JSON);\nSELECT p.attributes.color FROM product p;\nSELECT jt.tag FROM product p,\n  JSON_TABLE(p.attributes, '$.tags[*]' COLUMNS (tag VARCHAR2(50) PATH '$')) jt;\nCREATE SEARCH INDEX prod_json_ix ON product (attributes) FOR JSON;\n```",
        },
      ],
      sideBySide: {
        id: "cmp-json",
        concept: "JSON support",
        summary: "All four engines store and query JSON, but indexing strategy and function names differ significantly.",
        rows: [
          { aspect: "Native type", sqlserver: "json (2025); else nvarchar(max)", postgresql: "json, jsonb", mysql: "JSON", oracle: "JSON (21c+)" },
          { aspect: "Scalar extract", sqlserver: "JSON_VALUE()", postgresql: "->> operator", mysql: "->> / JSON_EXTRACT", oracle: "JSON_VALUE / dot notation" },
          { aspect: "Shred array", sqlserver: "OPENJSON", postgresql: "jsonb_array_elements", mysql: "JSON_TABLE", oracle: "JSON_TABLE" },
          { aspect: "Index inside doc", sqlserver: "Computed column + index", postgresql: "GIN index (direct)", mysql: "Generated column + index", oracle: "JSON search index" },
          { aspect: "Containment test", sqlserver: "JSON_CONTAINS", postgresql: "@> operator", mysql: "JSON_CONTAINS", oracle: "JSON_EXISTS" },
        ],
        samples: [
          {
            label: "Extract a scalar field 'color'",
            code: {
              sqlserver: "SELECT JSON_VALUE(Attributes,'$.color') FROM dbo.Product;",
              postgresql: "SELECT attributes->>'color' FROM product;",
              mysql: "SELECT attributes->>'$.color' FROM product;",
              oracle: "SELECT p.attributes.color FROM product p;",
            },
          },
        ],
        migration: {
          equivalent: "Storing documents and extracting scalar values is conceptually identical across all four engines.",
          different: "Index strategy differs the most: PostgreSQL jsonb indexes the whole document with GIN, while SQL Server and MySQL require promoting paths to (computed/generated) columns.",
          directMigration: "Partial. Data migrates cleanly; queries and index DDL must be rewritten per engine.",
          syntaxChanges: "Replace JSON_VALUE/OPENJSON with the target engine's operators (->>, JSON_TABLE, jsonb_array_elements).",
          limitations: "SQL Server's native json type is 2025-only; older targets need nvarchar(max) + ISJSON.",
          whenToUse: "Use jsonb (PostgreSQL) when you need flexible ad-hoc indexing of documents; use the native json types elsewhere when documents are read via known paths.",
        },
      },
      realWorldScenario: [
        {
          kind: "recommendation",
          heading: "Product catalog with variable attributes",
          body:
            "A catalog has thousands of product types with different attributes. Store the stable columns relationally (id, price, name) and put variable attributes in a `json` column. Promote the two or three attributes you filter on (color, brand) to computed/generated columns and index those. This keeps writes flexible while queries stay fast — the pattern the exam rewards.",
        },
      ],
      commonMistakes: [
        { mistake: "Expecting a JSON path predicate to use an index automatically.", fix: "On SQL Server and MySQL, promote the path to a computed/generated column and index it; only PostgreSQL jsonb indexes the document directly." },
        { mistake: "Using JSON_VALUE to return an object or array.", fix: "JSON_VALUE returns scalars only; use JSON_QUERY for object/array fragments." },
        { mistake: "Storing everything as JSON.", fix: "Keep columns you join/filter/aggregate on relational; use JSON for genuinely variable data." },
      ],
      performanceSecurity: [
        {
          kind: "recommendation",
          body:
            "Validate input with `ISJSON()` (or an `IS JSON` check) to avoid storing malformed documents. Large JSON blobs bloat memory grants — project only the paths you need. Treat JSON extracted into dynamic SQL as untrusted input to avoid injection.",
        },
      ],
      examTips: [
        "OPENJSON with an explicit WITH clause returns strongly-typed columns — the go-to for shredding.",
        "JSON_VALUE = scalar; JSON_QUERY = object/array. This distinction shows up often.",
        "Remember the native json data type is a SQL Server 2025 addition.",
      ],
      summary:
        "SQL Server stores JSON in the native json type (2025) or nvarchar(max), reads it with JSON_VALUE/JSON_QUERY/OPENJSON, and indexes it via computed columns. PostgreSQL's jsonb + GIN is the most flexible for ad-hoc indexing; MySQL and Oracle sit in between. Keep hot, structured data relational and reserve JSON for truly variable attributes.",
    },
    labId: "lab-json",
    knowledgeCheck: { questionIds: ["q-l0103-1", "q-l0103-2", "q-l0103-3", "q-l0103-4", "q-l0103-5"] },
    references: [
      REFS.studyGuide,
      ref("JSON data in SQL Server", "https://learn.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server"),
      ref("json data type", "https://learn.microsoft.com/en-us/sql/t-sql/data-types/json-data-type"),
      ref("OPENJSON (Transact-SQL)", "https://learn.microsoft.com/en-us/sql/t-sql/functions/openjson-transact-sql"),
      REFS.postgres,
      REFS.mysql,
      REFS.oracle,
    ],
  }),

  defineLesson({
    id: "l0104",
    moduleId: "m01",
    domainId: "d1",
    order: 4,
    slug: "constraints",
    title: "Constraints: PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, DEFAULT",
    summary: "Enforce data integrity declaratively and understand how constraints interact with indexes and performance.",
    estimatedMinutes: 25,
    difficulty: "beginner",
    learningObjectives: [
      "Apply the five core constraint types correctly.",
      "Explain how PRIMARY KEY and UNIQUE create backing indexes.",
      "Reason about referential actions (CASCADE, SET NULL, NO ACTION).",
    ],
    keyTerms: [
      { term: "PRIMARY KEY", definition: "Uniquely identifies each row; not nullable; creates a unique index (clustered by default)." },
      { term: "FOREIGN KEY", definition: "Enforces referential integrity between tables." },
      { term: "CHECK", definition: "Restricts values with a boolean expression." },
    ],
    sections: {
      overview: "Constraints push integrity rules into the engine so they can't be bypassed by application bugs.",
      officialConcepts: [
        { kind: "official", body: "A **PRIMARY KEY** creates a unique index (clustered unless told otherwise). **UNIQUE** allows one NULL (SQL Server) and also creates an index. **FOREIGN KEY** supports referential actions: `ON DELETE`/`ON UPDATE` with `CASCADE`, `SET NULL`, `SET DEFAULT`, or `NO ACTION`. **CHECK** validates an expression; **DEFAULT** supplies a value when none is given." },
      ],
      examTips: [
        "SQL Server UNIQUE constraints permit a single NULL; other engines differ.",
        "Disabling and re-enabling a FK with WITH CHECK re-validates existing data; WITH NOCHECK leaves it 'not trusted'.",
      ],
      summary: "Prefer declarative constraints over trigger-based validation; they're clearer, faster, and trusted by the optimizer.",
    },
    knowledgeCheck: { questionIds: ["q-l0104-1", "q-l0104-2", "q-l0104-3"] },
    references: [REFS.studyGuide, ref("Constraints", "https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-check-constraints")],
  }),

  defineLesson({
    id: "l0105",
    moduleId: "m01",
    domainId: "d1",
    order: 5,
    slug: "sequences-and-identity",
    title: "Sequences and identity",
    summary: "Generate surrogate keys with IDENTITY and SEQUENCE, and compare with PostgreSQL, MySQL, and Oracle.",
    estimatedMinutes: 25,
    difficulty: "beginner",
    learningObjectives: [
      "Create and use SEQUENCE objects and IDENTITY columns.",
      "Choose between IDENTITY and SEQUENCE.",
      "Map identity generation across the four engines.",
    ],
    keyTerms: [
      { term: "IDENTITY", definition: "A table-column property that auto-increments on insert." },
      { term: "SEQUENCE", definition: "A schema-level object that generates numbers independent of any table." },
    ],
    sections: {
      overview: "Surrogate keys need a generator. SQL Server offers column-bound IDENTITY and standalone SEQUENCE objects.",
      officialConcepts: [
        { kind: "official", body: "`CREATE SEQUENCE dbo.OrderSeq AS BIGINT START WITH 1 INCREMENT BY 1;` then `NEXT VALUE FOR dbo.OrderSeq`. Use SEQUENCE when multiple tables share a number space or you need the value before insert. Use IDENTITY for simple per-table auto-increment." },
      ],
      sideBySide: {
        id: "cmp-identity",
        concept: "Identity and sequence generation",
        summary: "Every engine auto-generates keys but the syntax and defaults differ.",
        rows: [
          { aspect: "Auto-increment column", sqlserver: "IDENTITY(1,1)", postgresql: "GENERATED ... AS IDENTITY / serial", mysql: "AUTO_INCREMENT", oracle: "GENERATED ... AS IDENTITY" },
          { aspect: "Standalone sequence", sqlserver: "CREATE SEQUENCE", postgresql: "CREATE SEQUENCE", mysql: "Not supported (8.0)", oracle: "CREATE SEQUENCE" },
          { aspect: "Get next value", sqlserver: "NEXT VALUE FOR seq", postgresql: "nextval('seq')", mysql: "n/a", oracle: "seq.NEXTVAL" },
        ],
        migration: {
          equivalent: "IDENTITY-style auto-increment exists everywhere.",
          different: "MySQL has no standalone SEQUENCE object; PostgreSQL/Oracle/SQL Server do.",
          directMigration: "Mostly yes for auto-increment; sequence-based designs need rework on MySQL.",
          syntaxChanges: "Replace NEXT VALUE FOR with nextval()/NEXTVAL; replace IDENTITY with AUTO_INCREMENT or GENERATED AS IDENTITY.",
          limitations: "MySQL emulates sequences via AUTO_INCREMENT or a helper table.",
          whenToUse: "Use SEQUENCE for cross-table keys or pre-fetching IDs; IDENTITY for simple cases.",
        },
      },
      examTips: ["SCOPE_IDENTITY() returns the last identity in the current scope — safer than @@IDENTITY which crosses triggers."],
      summary: "SEQUENCE decouples number generation from tables; IDENTITY binds it to a column. Know the equivalents per engine.",
    },
    knowledgeCheck: { questionIds: ["q-l0105-1", "q-l0105-2"] },
    references: [REFS.studyGuide, ref("Sequence numbers", "https://learn.microsoft.com/en-us/sql/relational-databases/sequence-numbers/sequence-numbers"), REFS.postgres, REFS.mysql, REFS.oracle],
  }),

  defineLesson({
    id: "l0106",
    moduleId: "m01",
    domainId: "d1",
    order: 6,
    slug: "partitioning",
    title: "Partitioning tables and indexes",
    summary: "Split large tables by a partition function and scheme for manageability and query elimination.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: [
      "Create a partition function and scheme and align an index.",
      "Explain partition elimination and the sliding-window pattern.",
    ],
    keyTerms: [
      { term: "Partition function", definition: "Maps rows to partitions based on boundary values of a column." },
      { term: "Partition scheme", definition: "Maps partitions to filegroups." },
      { term: "Aligned index", definition: "An index partitioned on the same key as its table." },
    ],
    sections: {
      overview: "Partitioning divides one logical table into physical partitions, enabling fast metadata operations and partition elimination.",
      officialConcepts: [
        { kind: "official", body: "Define a `PARTITION FUNCTION` (RANGE LEFT/RIGHT boundaries), a `PARTITION SCHEME` mapping to filegroups, then create the table/index ON the scheme. `SWITCH` moves a whole partition in/out instantly — the basis of the sliding-window archival pattern." },
      ],
      commonMistakes: [
        { mistake: "Assuming partitioning always speeds up queries.", fix: "It helps mainly via partition elimination and manageability; poorly chosen keys can hurt." },
      ],
      examTips: ["ALTER TABLE ... SWITCH is a metadata-only operation — near-instant, used for archiving."],
      summary: "Partition on the column your queries filter by so the optimizer can eliminate partitions; use SWITCH for fast archival.",
    },
    knowledgeCheck: { questionIds: ["q-l0106-1", "q-l0106-2"] },
    references: [REFS.studyGuide, ref("Partitioned tables and indexes", "https://learn.microsoft.com/en-us/sql/relational-databases/partitions/partitioned-tables-and-indexes")],
  }),

  // -------- Module 02: programmability --------
  defineLesson({
    id: "l0201",
    moduleId: "m02",
    domainId: "d1",
    order: 1,
    slug: "views",
    title: "Views and indexed views",
    summary: "Encapsulate queries with views, and materialize aggregates with indexed views.",
    estimatedMinutes: 25,
    difficulty: "beginner",
    learningObjectives: ["Create views and understand updatability rules.", "Explain when an indexed (materialized) view helps.", "Use SCHEMABINDING."],
    keyTerms: [
      { term: "View", definition: "A named, stored SELECT that behaves like a virtual table." },
      { term: "Indexed view", definition: "A view with a unique clustered index that physically stores its results." },
      { term: "SCHEMABINDING", definition: "Binds a view to the schema of its base tables, required for indexing." },
    ],
    sections: {
      overview: "Views simplify access, enforce security, and can be materialized for performance.",
      officialConcepts: [{ kind: "official", body: "A standard view stores no data. An **indexed view** requires `WITH SCHEMABINDING` and a `UNIQUE CLUSTERED INDEX`; its results are stored and auto-maintained, accelerating expensive aggregations at write cost." }],
      examTips: ["Indexed views need SCHEMABINDING and deterministic expressions.", "Views can restrict columns/rows as a security layer."],
      summary: "Use views for abstraction and security; reach for indexed views to materialize costly, frequently-read aggregates.",
    },
    knowledgeCheck: { questionIds: ["q-l0201-1", "q-l0201-2"] },
    references: [REFS.studyGuide, ref("Views", "https://learn.microsoft.com/en-us/sql/relational-databases/views/views")],
  }),

  defineLesson({
    id: "l0202",
    moduleId: "m02",
    domainId: "d1",
    order: 2,
    slug: "functions",
    title: "Scalar and table-valued functions",
    summary: "Write UDFs, understand inline vs multi-statement TVFs, and avoid scalar-UDF performance traps.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Create scalar, inline TVF, and multi-statement TVF.", "Explain why inline TVFs and scalar UDF inlining matter for performance."],
    keyTerms: [
      { term: "Inline TVF", definition: "A table-valued function whose body is a single SELECT; expands like a view for the optimizer." },
      { term: "Scalar UDF inlining", definition: "SQL Server 2019+ feature that inlines eligible scalar UDFs for big speedups." },
    ],
    sections: {
      overview: "User-defined functions encapsulate reusable logic, but scalar UDFs historically hurt performance.",
      officialConcepts: [{ kind: "official", body: "Prefer **inline table-valued functions** over multi-statement TVFs — the optimizer can expand and optimize them. **Scalar UDF inlining** (Intelligent Query Processing) automatically inlines eligible scalar functions." }],
      commonMistakes: [{ mistake: "Row-by-row scalar UDFs in SELECT lists on large sets.", fix: "Rewrite as an inline TVF via APPLY, or rely on scalar UDF inlining." }],
      examTips: ["Inline TVF good, multi-statement TVF often bad for cardinality estimation."],
      summary: "Favor inline TVFs; know that scalar UDF inlining can rescue legacy scalar functions.",
    },
    knowledgeCheck: { questionIds: ["q-l0202-1", "q-l0202-2"] },
    references: [REFS.studyGuide, ref("User-defined functions", "https://learn.microsoft.com/en-us/sql/relational-databases/user-defined-functions/user-defined-functions")],
  }),

  defineLesson({
    id: "l0203",
    moduleId: "m02",
    domainId: "d1",
    order: 3,
    slug: "stored-procedures-and-triggers",
    title: "Stored procedures and triggers",
    summary: "Encapsulate logic in procs, handle parameters and errors, and use triggers judiciously.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Create parameterized stored procedures with error handling.", "Use DML and DDL triggers and understand inserted/deleted tables.", "Recognize trigger pitfalls."],
    keyTerms: [
      { term: "Stored procedure", definition: "A precompiled batch of T-SQL invoked by name with parameters." },
      { term: "DML trigger", definition: "Code that fires on INSERT/UPDATE/DELETE; sees inserted and deleted pseudo-tables." },
    ],
    sections: {
      overview: "Procedures centralize business logic; triggers react to data changes but can hide behavior.",
      officialConcepts: [{ kind: "official", body: "Triggers access the **`inserted`** and **`deleted`** virtual tables. AFTER triggers run post-operation; INSTEAD OF triggers replace it (common on views). Keep trigger logic set-based and short." }],
      commonMistakes: [{ mistake: "Writing row-by-row logic in triggers.", fix: "Triggers fire once per statement, not per row — always write set-based logic over inserted/deleted." }],
      examTips: ["INSTEAD OF triggers make otherwise non-updatable views updatable."],
      summary: "Use procs for encapsulation and triggers sparingly, always set-based, using inserted/deleted.",
    },
    knowledgeCheck: { questionIds: ["q-l0203-1", "q-l0203-2"] },
    references: [REFS.studyGuide, ref("Stored procedures", "https://learn.microsoft.com/en-us/sql/relational-databases/stored-procedures/stored-procedures-database-engine"), ref("DML triggers", "https://learn.microsoft.com/en-us/sql/relational-databases/triggers/dml-triggers")],
  }),

  // -------- Module 03: advanced T-SQL --------
  defineLesson({
    id: "l0301",
    moduleId: "m03",
    domainId: "d1",
    order: 1,
    slug: "ctes",
    title: "Common table expressions and recursion",
    summary: "Structure queries with CTEs and traverse hierarchies with recursive CTEs.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Write non-recursive and recursive CTEs.", "Traverse a hierarchy with an anchor + recursive member."],
    keyTerms: [
      { term: "CTE", definition: "A named temporary result set defined with WITH, referenced once in the following statement." },
      { term: "Recursive CTE", definition: "A CTE that references itself, with an anchor and a recursive member." },
    ],
    sections: {
      overview: "CTEs improve readability and enable recursion over hierarchical data.",
      officialConcepts: [{ kind: "official", body: "A recursive CTE has an **anchor member**, `UNION ALL`, and a **recursive member** that references the CTE. Guard with `OPTION (MAXRECURSION n)` to avoid runaway recursion." }],
      examTips: ["MAXRECURSION 0 removes the limit (default is 100).", "A CTE is scoped to the single statement that follows it."],
      summary: "Use CTEs for clarity and hierarchy traversal; control depth with MAXRECURSION.",
    },
    knowledgeCheck: { questionIds: ["q-l0301-1", "q-l0301-2"] },
    references: [REFS.studyGuide, ref("WITH common_table_expression", "https://learn.microsoft.com/en-us/sql/t-sql/queries/with-common-table-expression-transact-sql")],
  }),

  defineLesson({
    id: "l0302",
    moduleId: "m03",
    domainId: "d1",
    order: 2,
    slug: "window-functions",
    title: "Window functions",
    summary: "Rank, aggregate, and offset over partitions with OVER, ROW_NUMBER, LAG/LEAD, and frames.",
    estimatedMinutes: 35,
    difficulty: "intermediate",
    learningObjectives: ["Use ranking, aggregate, and offset window functions.", "Control frames with ROWS/RANGE BETWEEN.", "Pick RANK vs DENSE_RANK vs ROW_NUMBER."],
    keyTerms: [
      { term: "OVER clause", definition: "Defines the window (PARTITION BY / ORDER BY / frame) for a window function." },
      { term: "Frame", definition: "The subset of rows in the partition used for the calculation (ROWS/RANGE BETWEEN)." },
    ],
    sections: {
      overview: "Window functions compute across a set of rows related to the current row without collapsing them.",
      officialConcepts: [{ kind: "official", body: "`ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE` for ranking; `SUM/AVG/... OVER (...)` for running totals; `LAG`/`LEAD` for offsets; `FIRST_VALUE`/`LAST_VALUE` with explicit frames. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` gives a running total." }],
      commonMistakes: [{ mistake: "Expecting LAST_VALUE to return the partition's last row by default.", fix: "Set the frame to ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING." }],
      examTips: ["ROW_NUMBER is always unique; RANK leaves gaps; DENSE_RANK doesn't."],
      summary: "Master OVER with PARTITION BY, ORDER BY, and explicit frames — window functions appear throughout the exam.",
    },
    knowledgeCheck: { questionIds: ["q-l0302-1", "q-l0302-2", "q-l0302-3"] },
    references: [REFS.studyGuide, ref("OVER clause", "https://learn.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql")],
  }),

  defineLesson({
    id: "l0303",
    moduleId: "m03",
    domainId: "d1",
    order: 3,
    slug: "json-functions",
    title: "JSON functions in queries",
    summary: "Build and consume JSON in T-SQL with JSON_OBJECT, JSON_ARRAY, JSON_ARRAYAGG, and FOR JSON.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Construct JSON with JSON_OBJECT/JSON_ARRAY/JSON_ARRAYAGG.", "Serialize result sets with FOR JSON.", "Test membership with JSON_CONTAINS."],
    keyTerms: [
      { term: "FOR JSON", definition: "Clause that serializes a query result set into JSON (PATH or AUTO)." },
      { term: "JSON_ARRAYAGG", definition: "Aggregates values from multiple rows into a JSON array." },
    ],
    sections: {
      overview: "Beyond reading JSON, T-SQL can construct it — essential for API and RAG payloads (Domain 3).",
      officialConcepts: [{ kind: "official", body: "`JSON_OBJECT('k':v,...)` and `JSON_ARRAY(...)` build documents; `JSON_ARRAYAGG`/`JSON_OBJECTAGG` aggregate rows; `FOR JSON PATH` shapes nested output. These directly feed language-model prompts when you convert structured rows to JSON." }],
      examTips: ["FOR JSON PATH with ROOT() wraps output in a named root object.", "This lesson links to RAG: converting rows to JSON for a model."],
      summary: "Construct JSON with the constructors and FOR JSON; you'll reuse this to feed models in RAG workflows.",
    },
    knowledgeCheck: { questionIds: ["q-l0303-1", "q-l0303-2"] },
    references: [REFS.studyGuide, ref("FOR JSON", "https://learn.microsoft.com/en-us/sql/relational-databases/json/format-query-results-as-json-with-for-json")],
  }),

  defineLesson({
    id: "l0304",
    moduleId: "m03",
    domainId: "d1",
    order: 4,
    slug: "regex-and-fuzzy-matching",
    title: "Regular expressions and fuzzy string matching",
    summary: "Use the new REGEXP_* functions and fuzzy matchers like EDIT_DISTANCE and JARO_WINKLER_DISTANCE.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: ["Apply REGEXP_LIKE, REGEXP_REPLACE, REGEXP_SUBSTR, and REGEXP_SPLIT_TO_TABLE.", "Use fuzzy matching for approximate joins and dedup."],
    keyTerms: [
      { term: "REGEXP_LIKE", definition: "Boolean predicate testing whether a string matches a regex pattern." },
      { term: "EDIT_DISTANCE", definition: "Levenshtein distance — number of edits to transform one string into another." },
      { term: "JARO_WINKLER_DISTANCE", definition: "Similarity metric favoring common prefixes; good for names." },
    ],
    sections: {
      overview: "SQL Server 2025 adds native regular-expression and fuzzy-matching functions — new, exam-relevant surface area.",
      officialConcepts: [{ kind: "official", body: "Regex family: `REGEXP_LIKE`, `REGEXP_REPLACE`, `REGEXP_SUBSTR`, `REGEXP_INSTR`, `REGEXP_COUNT`, `REGEXP_MATCHES`, `REGEXP_SPLIT_TO_TABLE`. Fuzzy: `EDIT_DISTANCE`, `EDIT_DISTANCE_SIMILARITY`, `JARO_WINKLER_DISTANCE`/`_SIMILARITY`. Use fuzzy matching for approximate joins, deduplication, and data cleansing." }],
      examTips: ["These functions are SQL Server 2025 additions — expect at least one question.", "Use JARO_WINKLER for person names; EDIT_DISTANCE for general typos."],
      summary: "Know the REGEXP_* and fuzzy functions by name and purpose; they're fresh in the blueprint.",
    },
    knowledgeCheck: { questionIds: ["q-l0304-1", "q-l0304-2"] },
    references: [REFS.studyGuide, ref("Regular expressions in SQL Server", "https://learn.microsoft.com/en-us/sql/t-sql/functions/regexp-like-transact-sql")],
  }),

  defineLesson({
    id: "l0305",
    moduleId: "m03",
    domainId: "d1",
    order: 5,
    slug: "graph-correlated-error-handling",
    title: "Graph queries, correlated subqueries, and error handling",
    summary: "Traverse graph data with MATCH, write correlated subqueries, and handle errors with TRY/CATCH and THROW.",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: ["Query NODE/EDGE tables with MATCH.", "Write correlated subqueries and EXISTS.", "Implement TRY...CATCH with THROW and transaction rollback."],
    keyTerms: [
      { term: "MATCH", definition: "Graph pattern-matching operator over NODE and EDGE tables." },
      { term: "Correlated subquery", definition: "A subquery that references columns from the outer query, evaluated per outer row." },
      { term: "TRY...CATCH", definition: "Structured error handling block in T-SQL." },
    ],
    sections: {
      overview: "This lesson bundles three exam skills: graph MATCH, correlated queries, and error handling.",
      officialConcepts: [{ kind: "official", body: "Graph: `SELECT ... FROM Person p, likes l, Person p2 WHERE MATCH(p-(l)->p2)`. Error handling: wrap DML in `BEGIN TRY ... END TRY BEGIN CATCH ... END CATCH`; use `THROW` (re-raises) or `RAISERROR`, and check `@@TRANCOUNT`/`XACT_STATE()` before rollback." }],
      commonMistakes: [{ mistake: "Committing inside CATCH without checking XACT_STATE().", fix: "A doomed transaction (XACT_STATE = -1) can only be rolled back." }],
      examTips: ["THROW with no arguments re-raises the current error inside CATCH.", "MATCH only works on NODE/EDGE tables."],
      summary: "Use MATCH for graph traversal, correlated subqueries for per-row logic, and TRY/CATCH + THROW for robust error handling.",
    },
    knowledgeCheck: { questionIds: ["q-l0305-1", "q-l0305-2"] },
    references: [REFS.studyGuide, ref("Graph processing with MATCH", "https://learn.microsoft.com/en-us/sql/relational-databases/graphs/sql-graph-overview"), ref("TRY...CATCH", "https://learn.microsoft.com/en-us/sql/t-sql/language-elements/try-catch-transact-sql")],
  }),

  // -------- Module 04: AI-assisted tools --------
  defineLesson({
    id: "l0401",
    moduleId: "m04",
    domainId: "d1",
    order: 1,
    slug: "copilot-enablement",
    title: "Enabling GitHub Copilot and Copilot in Fabric",
    summary: "Turn on AI-assisted development for SQL work and understand the security implications.",
    estimatedMinutes: 25,
    difficulty: "beginner",
    learningObjectives: ["Enable GitHub Copilot and Copilot in Fabric.", "Interpret the security impact of AI-assisted tools on SQL development."],
    keyTerms: [
      { term: "GitHub Copilot", definition: "AI pair-programmer that suggests code, including T-SQL, in editors like VS Code." },
      { term: "Copilot in Fabric", definition: "Microsoft Fabric's built-in AI assistance for data workloads." },
    ],
    sections: {
      overview: "AI-assisted tools speed up SQL development but can leak context or suggest insecure code — the exam tests both enablement and judgment.",
      officialConcepts: [{ kind: "official", body: "Enable Copilot at the org/subscription level and in the editor. Understand that prompts and code context may be sent to the model; sensitive schema or data must be handled per policy. Always review AI-suggested SQL for injection risks and over-broad permissions." }],
      performanceSecurity: [{ kind: "recommendation", body: "Never paste secrets or production data into prompts. Treat generated SQL as a draft: verify object names, parameterization, and least-privilege before running." }],
      examTips: ["'Security impact of AI-assisted tools' is an explicit skill — expect a judgment question."],
      summary: "Enable Copilot thoughtfully; review generated SQL for security, and keep sensitive data out of prompts.",
    },
    knowledgeCheck: { questionIds: ["q-l0401-1", "q-l0401-2"] },
    references: [REFS.studyGuide, ref("GitHub Copilot documentation", "https://docs.github.com/en/copilot", "GitHub"), ref("Copilot in Fabric", "https://learn.microsoft.com/en-us/fabric/fundamentals/copilot-fabric-overview")],
  }),

  defineLesson({
    id: "l0402",
    moduleId: "m04",
    domainId: "d1",
    order: 2,
    slug: "copilot-models-and-instructions",
    title: "Configuring models, MCP tools, and instruction files",
    summary: "Choose models, configure MCP tool options in chat, and author Copilot instruction files.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Configure model and MCP tool options in a Copilot chat session.", "Create and configure GitHub Copilot instruction files."],
    keyTerms: [
      { term: "Instruction file", definition: "A repo file (e.g., .github/copilot-instructions.md) that gives Copilot persistent project context." },
      { term: "MCP tool", definition: "A tool exposed to the model via the Model Context Protocol." },
    ],
    sections: {
      overview: "Beyond turning Copilot on, DP-800 expects you to steer it: pick models, wire up MCP tools, and give it durable instructions.",
      officialConcepts: [{ kind: "official", body: "In a Copilot chat session you can select the **model** and enable **MCP tool** options so the assistant can call external tools. **Instruction files** (like `.github/copilot-instructions.md`) encode conventions, schemas, and guardrails Copilot should always follow." }],
      examTips: ["Instruction files persist context so you don't repeat it every prompt.", "Model choice affects capability and cost."],
      summary: "Configure the model and MCP tools per session, and commit instruction files so Copilot respects project conventions.",
    },
    knowledgeCheck: { questionIds: ["q-l0402-1", "q-l0402-2"] },
    references: [REFS.studyGuide, ref("Model Context Protocol", "https://modelcontextprotocol.io/", "Anthropic/MCP"), ref("Copilot instruction files", "https://docs.github.com/en/copilot/customizing-copilot", "GitHub")],
  }),

  defineLesson({
    id: "l0403",
    moduleId: "m04",
    domainId: "d1",
    order: 3,
    slug: "mcp-server-endpoints",
    title: "Connecting to MCP server endpoints",
    summary: "Connect Copilot to Microsoft SQL Server and Fabric lakehouse MCP servers for grounded, tool-using AI.",
    estimatedMinutes: 25,
    difficulty: "advanced",
    flagship: false,
    learningObjectives: ["Connect to MCP server endpoints for SQL Server and Fabric lakehouse.", "Explain how MCP grounds the assistant in live database context."],
    keyTerms: [
      { term: "MCP server", definition: "A server exposing tools/resources to AI clients over the Model Context Protocol." },
      { term: "Fabric lakehouse", definition: "A Fabric analytics store combining a data lake and warehouse experience." },
    ],
    sections: {
      overview: "MCP server endpoints let an AI assistant query and act on your SQL Server or Fabric lakehouse safely and with live context.",
      officialConcepts: [{ kind: "official", body: "Connect Copilot to an **MCP server endpoint** for **Microsoft SQL Server** or a **Fabric lakehouse**. The assistant can then discover schema and run scoped tools instead of guessing. Secure these endpoints (see Domain 2) with Managed Identity and least privilege." }],
      performanceSecurity: [{ kind: "recommendation", body: "MCP endpoints are a new attack surface: authenticate with Managed Identity, scope permissions tightly, and log tool invocations." }],
      examTips: ["Know that SQL Server and Fabric lakehouse MCP endpoints are explicitly named in the blueprint.", "Securing MCP endpoints is tested in Domain 2 (l0505)."],
      summary: "MCP endpoints ground AI assistants in live SQL/Fabric context; connect them securely with Managed Identity.",
    },
    knowledgeCheck: { questionIds: ["q-l0403-1", "q-l0403-2"] },
    references: [REFS.studyGuide, ref("SQL Server MCP", "https://learn.microsoft.com/en-us/sql/"), ref("SQL database in Microsoft Fabric", "https://learn.microsoft.com/en-us/fabric/database/sql/overview")],
  }),
];
