import type { Lab } from "@/lib/types";

export const LABS: Lab[] = [
  // -------------------- Domain 1: JSON --------------------
  {
    id: "lab-json",
    lessonId: "l0103",
    domainId: "d1",
    title: "Lab: Query and index JSON product attributes",
    difficulty: "intermediate",
    estimatedMinutes: 40,
    scenario:
      "You run the catalog for a hardware store. Products share a few fixed columns but each has wildly different attributes (color, voltage, thread size). The team wants flexible storage plus fast filtering by color.",
    objective:
      "Store product attributes as JSON, shred and query them, and make a JSON attribute filter fast with an indexed computed column.",
    prerequisites: [
      "A running SQL Server 2025 container (see the Setup page).",
      "Ability to connect with sqlcmd, Azure Data Studio, or the VS Code mssql extension.",
    ],
    engines: ["sqlserver", "postgresql", "mysql", "oracle"],
    schemaSql: `CREATE TABLE dbo.Product (
    ProductId INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Attributes json NOT NULL   -- SQL Server 2025 native json type
);`,
    seedSql: `INSERT dbo.Product (Name, Price, Attributes) VALUES
(N'Cordless drill', 129.00, N'{"color":"blue","voltage":18,"tags":["power","sale"]}'),
(N'Hex bolt M8',      0.20,  N'{"color":"silver","thread":"M8","tags":["fastener"]}'),
(N'LED work light', 49.99,  N'{"color":"blue","lumens":2000,"tags":["lighting","new"]}'),
(N'Paint roller',    8.50,  N'{"color":"yellow","tags":["decor"]}');`,
    steps: [
      {
        title: "Beginner — extract a scalar attribute (guided)",
        instructions:
          "Run the starter query to list each product's color using `JSON_VALUE`. Notice how a scalar path returns text.",
        starterSql: `SELECT ProductId, Name,
       JSON_VALUE(Attributes, '$.color') AS Color
FROM dbo.Product;`,
        expectedOutput:
          "| ProductId | Name | Color |\n|---|---|---|\n| 1 | Cordless drill | blue |\n| 2 | Hex bolt M8 | silver |\n| 3 | LED work light | blue |\n| 4 | Paint roller | yellow |",
        validation: "You should see one row per product with a Color column populated from the JSON.",
      },
      {
        title: "Intermediate — shred the tags array (complete the SQL)",
        instructions:
          "Complete the query so it returns one row per tag per product. Replace the `____` with the correct table-valued function and path.",
        starterSql: `SELECT p.ProductId, p.Name, t.[value] AS Tag
FROM dbo.Product p
CROSS APPLY ____(p.Attributes, '$.tags') AS t;`,
        hint: "The function that shreds a JSON array into rows is OPENJSON.",
        solution: `SELECT p.ProductId, p.Name, t.[value] AS Tag
FROM dbo.Product p
CROSS APPLY OPENJSON(p.Attributes, '$.tags') AS t;`,
        expectedOutput:
          "One row per tag: e.g., (1, Cordless drill, power), (1, Cordless drill, sale), (3, LED work light, lighting), ...",
        validation: "The cordless drill should produce two rows (power, sale).",
      },
      {
        title: "Advanced — make the color filter fast (solve independently)",
        instructions:
          "Filtering `WHERE JSON_VALUE(Attributes,'$.color') = 'blue'` scans the table. Add a computed column for color and index it, then write the filtered query. Verify the plan uses an index seek.",
        hint: "Use `ALTER TABLE ... ADD Color AS JSON_VALUE(...)` then `CREATE INDEX`.",
        solution: `ALTER TABLE dbo.Product
  ADD Color AS JSON_VALUE(Attributes, '$.color');
CREATE INDEX IX_Product_Color ON dbo.Product(Color);

SELECT ProductId, Name, Price
FROM dbo.Product
WHERE Color = 'blue';`,
        expectedOutput: "Two rows: Cordless drill and LED work light.",
        validation: "SET STATISTICS IO ON should show far fewer logical reads, and the plan should use IX_Product_Color.",
      },
      {
        title: "Challenge — migrate the design to PostgreSQL",
        instructions:
          "Rewrite the storage and the fast color filter for PostgreSQL. Because jsonb can be indexed directly, you do NOT need a computed column. Provide the DDL and the filter query.",
        hint: "Use jsonb + a GIN index and the @> containment operator (or ->> for equality).",
        solution: `CREATE TABLE product (
  product_id serial PRIMARY KEY,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  attributes jsonb NOT NULL
);
CREATE INDEX idx_product_attrs ON product USING GIN (attributes);

-- Fast filter using containment (GIN-supported)
SELECT product_id, name, price
FROM product
WHERE attributes @> '{"color":"blue"}';`,
        expectedOutput: "Same two blue products, but served by the GIN index on jsonb.",
        validation: "EXPLAIN should show a Bitmap Index Scan on idx_product_attrs.",
      },
    ],
    engineNotes: {
      postgresql:
        "Use jsonb and a GIN index; filter with @> or ->>. No computed column needed.",
      mysql:
        "Use the JSON type and a STORED generated column indexed for the color path: `color VARCHAR(20) AS (attributes->>'$.color') STORED, INDEX(color)`.",
      oracle:
        "Use the JSON type; query with dot notation (`p.attributes.color`) and add a JSON search index or a function-based index for the color path.",
    },
    solutionExplanation:
      "JSON gives you schema flexibility, but every engine handles indexing differently. On SQL Server and MySQL you promote the hot path to a computed/generated column and index that; PostgreSQL's jsonb indexes the whole document with GIN; Oracle offers JSON search indexes. Keep truly variable data in JSON and index only the paths you actually filter on.",
  },

  // -------------------- Domain 2: RLS --------------------
  {
    id: "lab-rls",
    lessonId: "l0503",
    domainId: "d2",
    title: "Lab: Enforce multi-tenant isolation with Row-Level Security",
    difficulty: "advanced",
    estimatedMinutes: 45,
    scenario:
      "A SaaS app stores every customer's orders in one shared table. A bug once leaked one tenant's orders to another. You must guarantee, in the database, that each tenant only sees and writes its own rows.",
    objective:
      "Implement an RLS predicate function and security policy with FILTER and BLOCK predicates driven by read-only session context.",
    prerequisites: ["A running SQL Server 2025 container.", "Permission to create schemas, functions, and security policies."],
    engines: ["sqlserver", "postgresql", "oracle"],
    schemaSql: `CREATE TABLE dbo.Orders (
    OrderId INT IDENTITY PRIMARY KEY,
    TenantId INT NOT NULL,
    Product NVARCHAR(100) NOT NULL,
    Amount DECIMAL(10,2) NOT NULL
);
CREATE INDEX IX_Orders_TenantId ON dbo.Orders(TenantId);`,
    seedSql: `INSERT dbo.Orders (TenantId, Product, Amount) VALUES
(1, N'Widget', 10.00),
(1, N'Gadget', 25.50),
(2, N'Sprocket', 5.75),
(2, N'Cog', 40.00);`,
    steps: [
      {
        title: "Beginner — set the tenant context (guided)",
        instructions:
          "Set a read-only tenant id for your session, then read it back. This value will drive the RLS predicate.",
        starterSql: `EXEC sp_set_session_context @key = N'TenantId', @value = 1, @read_only = 1;
SELECT CAST(SESSION_CONTEXT(N'TenantId') AS int) AS CurrentTenant;`,
        expectedOutput: "| CurrentTenant |\n|---|\n| 1 |",
        validation: "The query returns 1. Because it's read-only, a later attempt to change it in the same session will fail.",
      },
      {
        title: "Intermediate — create the predicate function (complete the SQL)",
        instructions:
          "Complete the inline TVF so it returns a row only when the row's TenantId matches the session context (or the caller is dbo).",
        starterSql: `CREATE SCHEMA sec;
GO
CREATE FUNCTION sec.fn_tenant(@TenantId int)
RETURNS TABLE WITH SCHEMABINDING
AS RETURN
  SELECT 1 AS ok
  WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS int)
     OR ____ = DATABASE_PRINCIPAL_ID('dbo');`,
        hint: "The function that returns the current principal id is DATABASE_PRINCIPAL_ID().",
        solution: `CREATE SCHEMA sec;
GO
CREATE FUNCTION sec.fn_tenant(@TenantId int)
RETURNS TABLE WITH SCHEMABINDING
AS RETURN
  SELECT 1 AS ok
  WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS int)
     OR DATABASE_PRINCIPAL_ID() = DATABASE_PRINCIPAL_ID('dbo');`,
        validation: "The function must be an inline TVF (RETURNS TABLE ... AS RETURN) with SCHEMABINDING.",
      },
      {
        title: "Advanced — bind the policy and verify isolation (solve independently)",
        instructions:
          "Create a security policy adding a FILTER predicate and a BLOCK predicate (AFTER INSERT) on dbo.Orders. Then, with TenantId = 1 in context, confirm you see only tenant 1's rows and cannot insert a row for tenant 2.",
        hint: "CREATE SECURITY POLICY ... ADD FILTER PREDICATE ... ADD BLOCK PREDICATE ... AFTER INSERT WITH (STATE = ON).",
        solution: `CREATE SECURITY POLICY sec.TenantFilter
  ADD FILTER PREDICATE sec.fn_tenant(TenantId) ON dbo.Orders,
  ADD BLOCK PREDICATE sec.fn_tenant(TenantId) ON dbo.Orders AFTER INSERT
  WITH (STATE = ON);

-- With TenantId=1 in context:
SELECT * FROM dbo.Orders;              -- returns only tenant 1's rows
-- This should FAIL (blocked):
INSERT dbo.Orders (TenantId, Product, Amount) VALUES (2, N'Sneaky', 1.00);`,
        expectedOutput: "SELECT returns 2 rows (tenant 1). The cross-tenant INSERT is blocked with error 33504.",
        validation: "Reading returns only your tenant's rows; the cross-tenant insert is rejected by the BLOCK predicate.",
      },
      {
        title: "Challenge — port the policy to PostgreSQL",
        instructions:
          "Reimplement the same isolation in PostgreSQL using native RLS. Enable RLS on the table and create a policy with USING and WITH CHECK based on a session setting.",
        hint: "ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ... USING (...) WITH CHECK (...); set the tenant with set_config or SET.",
        solution: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::int);

-- set per session/transaction:
SELECT set_config('app.tenant_id', '1', false);
SELECT * FROM orders;   -- only tenant 1
INSERT INTO orders(tenant_id, product, amount) VALUES (2,'Sneaky',1.00); -- fails WITH CHECK`,
        expectedOutput: "Tenant 1 sees only its rows; the cross-tenant insert violates WITH CHECK.",
        validation: "USING maps to FILTER (reads); WITH CHECK maps to BLOCK (writes).",
      },
    ],
    engineNotes: {
      postgresql: "Native RLS: ENABLE ROW LEVEL SECURITY + CREATE POLICY (USING = read, WITH CHECK = write).",
      oracle: "Use Virtual Private Database (DBMS_RLS.ADD_POLICY) with a PL/SQL predicate function and SYS_CONTEXT.",
      mysql: "No native RLS — emulate with filtered views and revoke base-table access (not covered in this SQL Server lab).",
    },
    solutionExplanation:
      "RLS pushes tenant isolation into the engine so application bugs can't leak data. FILTER predicates guard reads; BLOCK predicates guard writes; the tenant id comes from read-only session context so it can't be spoofed. PostgreSQL (USING/WITH CHECK) and Oracle (VPD) provide close equivalents; MySQL requires a view-based workaround. Always pair RLS with least-privilege grants.",
  },

  // -------------------- Domain 3: Vector search --------------------
  {
    id: "lab-vector",
    lessonId: "l1002",
    domainId: "d3",
    title: "Lab: Build semantic search with the VECTOR type",
    difficulty: "advanced",
    estimatedMinutes: 50,
    scenario:
      "Your support KB lives in SQL Server. Users can't find articles by keyword alone ('can't sign in' should match 'password reset'). You'll add semantic search using embeddings — without moving data to a separate vector store.",
    objective:
      "Store embeddings in a VECTOR column, rank results with VECTOR_DISTANCE, and understand when to add a DiskANN index.",
    prerequisites: [
      "SQL Server 2025 with an external embedding model registered (CREATE EXTERNAL MODEL).",
      "For DiskANN steps: PREVIEW_FEATURES = ON.",
    ],
    engines: ["sqlserver", "postgresql", "oracle"],
    schemaSql: `CREATE TABLE dbo.Article (
    ArticleId INT IDENTITY PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Body NVARCHAR(MAX) NOT NULL,
    Embedding vector(1536) NULL
);`,
    seedSql: `INSERT dbo.Article (Title, Body) VALUES
(N'Reset your password', N'Use the Forgot Password link to receive a reset email and choose a new password.'),
(N'Update billing details', N'Change your card and billing address from Account > Billing.'),
(N'Two-factor authentication', N'Enable 2FA to add a second sign-in step using an authenticator app.'),
(N'Export your data', N'Download a copy of your data as CSV from Account > Privacy.');`,
    steps: [
      {
        title: "Beginner — generate embeddings (guided)",
        instructions:
          "Populate the Embedding column by generating an embedding of each article's body with your registered model.",
        starterSql: `UPDATE dbo.Article
SET Embedding = AI_GENERATE_EMBEDDINGS(Body USE MODEL MyEmbedder)
WHERE Embedding IS NULL;`,
        expectedOutput: "All four rows now have a non-null Embedding of 1536 dimensions.",
        validation: "SELECT COUNT(*) FROM dbo.Article WHERE Embedding IS NOT NULL; should return 4.",
      },
      {
        title: "Intermediate — nearest-neighbor search (complete the SQL)",
        instructions:
          "Complete the query to return the top 3 articles most similar to a user question. Fill in the metric and the ordering direction.",
        starterSql: `DECLARE @q vector(1536) =
  AI_GENERATE_EMBEDDINGS(N'I cannot sign in to my account' USE MODEL MyEmbedder);

SELECT TOP (3) ArticleId, Title,
       VECTOR_DISTANCE('____', Embedding, @q) AS dist
FROM dbo.Article
ORDER BY dist ____;`,
        hint: "Cosine is the usual metric for text; nearest neighbors have the smallest distance.",
        solution: `DECLARE @q vector(1536) =
  AI_GENERATE_EMBEDDINGS(N'I cannot sign in to my account' USE MODEL MyEmbedder);

SELECT TOP (3) ArticleId, Title,
       VECTOR_DISTANCE('cosine', Embedding, @q) AS dist
FROM dbo.Article
ORDER BY dist ASC;`,
        expectedOutput: "'Reset your password' and 'Two-factor authentication' should rank at the top — even though the query never used those keywords.",
        validation: "The password/2FA articles rank above billing/export, demonstrating semantic (not keyword) matching.",
      },
      {
        title: "Advanced — add an approximate index for scale (solve independently)",
        instructions:
          "Imagine the table grows to millions of rows and exact scans get slow. Create a DiskANN vector index and rewrite the search using VECTOR_SEARCH. Note the preview requirement.",
        hint: "Enable PREVIEW_FEATURES = ON, then CREATE VECTOR INDEX ... WITH (METRIC='cosine', TYPE='diskann') and query with VECTOR_SEARCH.",
        solution: `-- Requires PREVIEW_FEATURES = ON on SQL Server 2025
CREATE VECTOR INDEX vec_article ON dbo.Article(Embedding)
  WITH (METRIC = 'cosine', TYPE = 'diskann');

DECLARE @q vector(1536) =
  AI_GENERATE_EMBEDDINGS(N'I cannot sign in to my account' USE MODEL MyEmbedder);

SELECT a.ArticleId, a.Title, s.distance
FROM VECTOR_SEARCH(
       TABLE = dbo.Article AS a,
       COLUMN = Embedding,
       SIMILAR_TO = @q,
       METRIC = 'cosine',
       TOP_N = 3) AS s
ORDER BY s.distance;`,
        expectedOutput: "Same top results, now served by the approximate DiskANN index (faster at scale, slight recall trade-off).",
        validation: "Understand that ANN trades a little recall for speed; validate recall against the exact query on a sample.",
      },
      {
        title: "Challenge — port to PostgreSQL pgvector",
        instructions:
          "Reimplement storage, an HNSW index, and the nearest-neighbor query using pgvector.",
        hint: "vector column, `USING hnsw (embedding vector_cosine_ops)`, and the `<=>` cosine operator.",
        solution: `CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE article ADD COLUMN embedding vector(1536);
CREATE INDEX ON article USING hnsw (embedding vector_cosine_ops);

-- $1 is the query embedding produced by your app/model
SELECT article_id, title, embedding <=> $1 AS dist
FROM article
ORDER BY dist
LIMIT 3;`,
        expectedOutput: "Equivalent semantic ranking via pgvector's <=> cosine operator and HNSW index.",
        validation: "VECTOR_DISTANCE('cosine', ...) maps to the <=> operator; DiskANN maps to HNSW/IVFFlat.",
      },
    ],
    engineNotes: {
      postgresql: "Use pgvector: vector type, <=> (cosine)/<-> (L2) operators, HNSW or IVFFlat indexes.",
      oracle: "Oracle 23ai AI Vector Search: VECTOR type, VECTOR_DISTANCE(...), and NEIGHBOR GRAPH (HNSW)/IVF indexes — syntax close to SQL Server.",
      mysql: "MySQL 9 has a VECTOR type and DISTANCE(); open-source ANN indexing is limited (HeatWave offers more).",
    },
    solutionExplanation:
      "Semantic search matches meaning, not keywords: embed the content and the query, then rank by VECTOR_DISTANCE (cosine, ascending). Exact (ENN) scans are fine for small sets; add a DiskANN index for approximate (ANN) search at scale, trading a little recall for speed. The key DP-800 idea is doing all of this where your data already lives — no separate vector database required.",
  },
];
