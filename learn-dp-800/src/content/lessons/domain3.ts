import type { Lesson } from "@/lib/types";
import { defineLesson, ref, REFS } from "./_shared";

export const DOMAIN3_LESSONS: Lesson[] = [
  // -------- Module 09: models & embeddings --------
  defineLesson({
    id: "l0901",
    moduleId: "m09",
    domainId: "d3",
    order: 1,
    slug: "external-models",
    title: "Evaluating, creating, and managing external models",
    summary: "Register external AI models in SQL and choose the right one by modality, language, size, and output shape.",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    learningObjectives: [
      "Evaluate external models by modality, language, size, and structured output.",
      "Create and manage external models with CREATE EXTERNAL MODEL.",
    ],
    keyTerms: [
      { term: "External model", definition: "A reference to a hosted AI model (e.g., Azure OpenAI) registered in SQL for use in T-SQL." },
      { term: "Structured output", definition: "A model's ability to return schema-constrained JSON." },
    ],
    sections: {
      overview:
        "SQL-native AI starts by registering the model. DP-800 expects you to pick an appropriate model and manage it with T-SQL.",
      officialConcepts: [
        { kind: "official", body: "Use **`CREATE EXTERNAL MODEL`** to register a model (embedding or chat) with its endpoint and credentials (prefer Managed Identity). Evaluate candidates by **modality** (text/multimodal), **language** coverage, **size** (latency/cost), and whether they support **structured output**. Manage lifecycle with ALTER/DROP." },
      ],
      performanceSecurity: [{ kind: "recommendation", body: "Authenticate external models with Managed Identity (see l0505); avoid embedding API keys in DDL." }],
      examTips: ["CREATE EXTERNAL MODEL registers the model for in-database use.", "Choose embedding models for search; chat models for RAG generation."],
      summary: "Register models with CREATE EXTERNAL MODEL and select by modality, language, size, and structured-output support; secure with Managed Identity.",
    },
    knowledgeCheck: { questionIds: ["q-l0901-1", "q-l0901-2"] },
    references: [REFS.studyGuide, ref("CREATE EXTERNAL MODEL", "https://learn.microsoft.com/en-us/sql/t-sql/statements/create-external-model-transact-sql"), ref("Microsoft Foundry", "https://learn.microsoft.com/en-us/azure/ai-foundry/")],
  }),

  defineLesson({
    id: "l0902",
    moduleId: "m09",
    domainId: "d3",
    order: 2,
    slug: "embedding-maintenance",
    title: "Choosing an embedding maintenance method",
    summary: "Keep embeddings fresh as source data changes using triggers, Change Tracking, CDC, CES, Functions, Logic Apps, or Foundry.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: [
      "Compare embedding maintenance methods and their trade-offs.",
      "Design a pipeline that re-embeds only changed rows.",
    ],
    keyTerms: [
      { term: "Embedding maintenance", definition: "Keeping stored embeddings in sync with changing source text." },
      { term: "Re-embedding", definition: "Regenerating an embedding when its source content changes." },
    ],
    sections: {
      overview:
        "Stale embeddings return wrong results. This lesson connects Domain 2's change-handling tools to AI freshness — a production-grade concern.",
      officialConcepts: [
        { kind: "official", body: "Maintenance options: **table triggers**, **Change Tracking**, **CDC**, **CES**, **Azure Functions (SQL trigger binding)**, **Logic Apps**, and **Microsoft Foundry**. Trade off latency, cost, and complexity: triggers are immediate but add write overhead; CT/CDC enable efficient batch re-embedding of only changed rows; Functions/Logic Apps decouple the work asynchronously." },
      ],
      realWorldScenario: [
        { kind: "recommendation", heading: "Keeping a knowledge base current", body: "Support articles change daily. Enable Change Tracking on the articles table; a scheduled Azure Function reads the change set, re-chunks and re-embeds only modified articles, and updates the vector column. This avoids re-embedding the whole corpus every night." },
      ],
      examTips: ["Change Tracking is the lightweight way to find rows needing re-embedding.", "Microsoft Foundry is a valid maintenance method in the 2026 blueprint."],
      summary: "Match the maintenance method to freshness needs and cost: triggers for immediacy, CT/CDC for efficient change-driven re-embedding, Functions/Logic Apps/Foundry for async pipelines.",
    },
    knowledgeCheck: { questionIds: ["q-l0902-1", "q-l0902-2"] },
    references: [REFS.studyGuide, ref("Change Tracking", "https://learn.microsoft.com/en-us/sql/relational-databases/track-changes/about-change-tracking-sql-server"), ref("Azure Functions SQL trigger", "https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-azure-sql-trigger")],
  }),

  defineLesson({
    id: "l0903",
    moduleId: "m09",
    domainId: "d3",
    order: 3,
    slug: "chunking-and-generating-embeddings",
    title: "Chunking and generating embeddings",
    summary: "Choose which columns to embed, chunk text well, and generate embeddings with AI_GENERATE_EMBEDDINGS.",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: [
      "Identify which columns to include in embeddings.",
      "Design chunking that preserves meaning and fits model limits.",
      "Generate embeddings in T-SQL.",
    ],
    keyTerms: [
      { term: "Chunking", definition: "Splitting long text into smaller passages before embedding." },
      { term: "Embedding", definition: "A numeric vector representing the meaning of text for similarity search." },
    ],
    sections: {
      overview: "Good retrieval depends on embedding the right content, chunked sensibly. This is where data prep for AI happens.",
      officialConcepts: [
        { kind: "official", body: "Include the columns that carry **semantic meaning** (title + body), not IDs or codes. **Chunk** long text into overlapping passages sized to the model's context, then embed each chunk. Generate with **`AI_GENERATE_EMBEDDINGS`** (or by calling the model), storing results in a `VECTOR` column keyed back to the source row/chunk." },
      ],
      visualExplanation: {
        caption: "Preparing relational data for AI: select semantic columns, chunk, embed, and store vectors linked to source rows.",
        mermaid: `flowchart LR
    src["Rows: title + body"] --> pick["Pick semantic columns"]
    pick --> chunk["Chunk with overlap"]
    chunk --> embed["AI_GENERATE_EMBEDDINGS"]
    embed --> store["Store VECTOR + source key"]`,
      },
      realWorldScenario: [
        { kind: "recommendation", heading: "Preparing product reviews for semantic search", body: "Embed the review title and text (semantic), not the star rating or SKU. Chunk long reviews at ~500 tokens with 50-token overlap so context isn't cut mid-sentence, and store each chunk's vector with a foreign key to the review." },
      ],
      commonMistakes: [{ mistake: "Embedding entire long documents as one vector.", fix: "Chunk first; a single vector over a long doc dilutes meaning and hurts retrieval." }],
      examTips: ["Embed semantic columns; skip IDs/codes.", "AI_GENERATE_EMBEDDINGS generates embeddings inline in T-SQL."],
      summary: "Embed meaning-bearing columns, chunk long text with overlap, and store vectors with AI_GENERATE_EMBEDDINGS linked to source rows.",
    },
    knowledgeCheck: { questionIds: ["q-l0903-1", "q-l0903-2"] },
    references: [REFS.studyGuide, ref("AI_GENERATE_EMBEDDINGS", "https://learn.microsoft.com/en-us/sql/t-sql/functions/ai-generate-embeddings-transact-sql"), ref("Vectors in SQL Server", "https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors")],
  }),

  // -------- Module 10: intelligent search --------
  defineLesson({
    id: "l1001",
    moduleId: "m10",
    domainId: "d3",
    order: 1,
    slug: "full-text-search",
    title: "Full-text search",
    summary: "Implement keyword search with full-text indexes, CONTAINS, and FREETEXT.",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    learningObjectives: ["Create a full-text catalog and index.", "Query with CONTAINS and FREETEXT.", "Know when keyword search beats vector search."],
    keyTerms: [
      { term: "Full-text index", definition: "An index enabling linguistic keyword search over text columns." },
      { term: "CONTAINS", definition: "Predicate for precise full-text searches (phrases, proximity, inflectional forms)." },
    ],
    sections: {
      overview: "Full-text search handles exact keywords, phrases, and linguistic variants — complementary to semantic vector search.",
      officialConcepts: [{ kind: "official", body: "Create a **full-text catalog** and **full-text index** on text columns, then query with **`CONTAINS`** (precise: phrases, proximity, inflectional) or **`FREETEXT`** (meaning of words). Full-text excels at exact terms/keywords where vector search may miss precise matches." }],
      examTips: ["CONTAINS = precise/phrase/proximity; FREETEXT = looser meaning.", "Combine full-text (keywords) with vector (semantics) in hybrid search."],
      summary: "Use full-text indexes with CONTAINS/FREETEXT for keyword precision; it pairs with vector search in hybrid retrieval.",
    },
    knowledgeCheck: { questionIds: ["q-l1001-1", "q-l1001-2"] },
    references: [REFS.studyGuide, ref("Full-text search", "https://learn.microsoft.com/en-us/sql/relational-databases/search/full-text-search")],
  }),

  // ---------------- FLAGSHIP: Vector search ----------------
  defineLesson({
    id: "l1002",
    moduleId: "m10",
    domainId: "d3",
    order: 2,
    slug: "vector-search",
    title: "Vector data, indexes, and semantic search",
    summary:
      "Store embeddings in the VECTOR type, measure similarity with VECTOR_DISTANCE, choose ANN vs ENN and DiskANN indexes — and compare vector support across databases.",
    estimatedMinutes: 60,
    difficulty: "advanced",
    flagship: true,
    learningObjectives: [
      "Store embeddings in the VECTOR data type and query similarity with VECTOR_DISTANCE.",
      "Choose the right distance metric (cosine, euclidean, dot).",
      "Decide between ENN (exact) and ANN (approximate/DiskANN) search.",
      "Compare vector capabilities with PostgreSQL (pgvector), MySQL, and Oracle.",
    ],
    keyTerms: [
      { term: "VECTOR", definition: "SQL Server 2025 data type storing a fixed-dimension embedding." },
      { term: "VECTOR_DISTANCE", definition: "Function returning the distance between two vectors for a chosen metric." },
      { term: "ENN", definition: "Exact nearest neighbor — scans all vectors; perfectly accurate, slower." },
      { term: "ANN", definition: "Approximate nearest neighbor — uses an index (e.g., DiskANN) for speed at slight accuracy cost." },
      { term: "DiskANN", definition: "A disk-based ANN index used for large-scale vector search." },
    ],
    sections: {
      overview:
        "Semantic search finds results by meaning, not keywords. SQL Server 2025 stores embeddings in the native `VECTOR` type and ranks by `VECTOR_DISTANCE`. At scale you add an approximate index (DiskANN). This lesson is the heart of Domain 3.",
      officialConcepts: [
        {
          kind: "official",
          heading: "The VECTOR type and distance",
          body:
            "`VECTOR(n)` stores an n-dimensional embedding (documented cap 1,998 dims; float16 in preview halves storage). **`VECTOR_DISTANCE(metric, a, b)`** computes similarity for `'cosine'`, `'euclidean'`, or `'dot'`. Cosine is the usual choice for text embeddings. Order ascending by distance to get nearest matches.",
        },
        {
          kind: "official",
          heading: "ENN vs ANN, and DiskANN",
          body:
            "**ENN** (exact) scans every vector — perfect recall, fine for small sets. **ANN** (approximate) uses a **DiskANN** vector index for large corpora, trading a little recall for large speedups. On SQL Server 2025, DiskANN indexing is in **preview** and requires `PREVIEW_FEATURES = ON`. **`VECTOR_SEARCH`**, **`VECTOR_NORMALIZE`**, and **`VECTORPROPERTY`** are the related functions (several are in preview).",
        },
      ],
      visualExplanation: {
        caption: "Semantic search: embed the query, compare against stored vectors by distance, return top-k nearest neighbors.",
        mermaid: `flowchart LR
    query["User query text"] --> qembed["Embed query"]
    qembed --> dist["VECTOR_DISTANCE vs stored VECTORs"]
    dist --> topk["ORDER BY distance, TOP k"]
    topk --> results["Most semantically similar rows"]`,
      },
      sqlServerImplementation: [
        {
          kind: "official",
          heading: "Store and search vectors",
          body:
            "```sql\nCREATE TABLE dbo.Doc (\n    DocId int PRIMARY KEY,\n    Body nvarchar(max),\n    Embedding vector(1536)\n);\n\n-- Generate + store an embedding\nUPDATE dbo.Doc\nSET Embedding = AI_GENERATE_EMBEDDINGS(Body USE MODEL MyEmbedder);\n\n-- Exact (ENN) top-5 semantic matches\nDECLARE @q vector(1536) =\n    AI_GENERATE_EMBEDDINGS(N'How do I reset my password?' USE MODEL MyEmbedder);\n\nSELECT TOP (5) DocId, Body,\n       VECTOR_DISTANCE('cosine', Embedding, @q) AS dist\nFROM dbo.Doc\nORDER BY dist;\n```",
        },
        {
          kind: "official",
          heading: "Approximate search with a DiskANN index (preview)",
          body:
            "```sql\n-- Requires PREVIEW_FEATURES = ON on SQL Server 2025\nCREATE VECTOR INDEX vec_doc ON dbo.Doc(Embedding)\n  WITH (METRIC = 'cosine', TYPE = 'diskann');\n\nSELECT d.DocId, s.distance\nFROM VECTOR_SEARCH(\n       TABLE = dbo.Doc AS d,\n       COLUMN = Embedding,\n       SIMILAR_TO = @q,\n       METRIC = 'cosine',\n       TOP_N = 5) AS s\nORDER BY s.distance;\n```",
        },
      ],
      postgresComparison: [
        {
          kind: "explanation",
          heading: "PostgreSQL: pgvector",
          body:
            "PostgreSQL uses the **pgvector** extension: a `vector` type, distance operators (`<->` L2, `<=>` cosine, `<#>` inner product), and **HNSW** or **IVFFlat** indexes for ANN.\n```sql\nCREATE EXTENSION vector;\nALTER TABLE doc ADD COLUMN embedding vector(1536);\nCREATE INDEX ON doc USING hnsw (embedding vector_cosine_ops);\nSELECT doc_id, embedding <=> $1 AS dist FROM doc ORDER BY dist LIMIT 5;\n```",
        },
      ],
      mysqlComparison: [
        {
          kind: "explanation",
          heading: "MySQL: VECTOR type + DISTANCE()",
          body:
            "MySQL 9 adds a **`VECTOR`** type with `DISTANCE()` / `VEC_FROM_TEXT`. Native ANN vector indexing is limited compared to the others (HeatWave offers more); for open-source MySQL you often do exact distance scans or use HeatWave for scale.\n```sql\nALTER TABLE doc ADD COLUMN embedding VECTOR(1536);\nSELECT doc_id, DISTANCE(embedding, VEC_FROM_TEXT(?), 'COSINE') AS dist\nFROM doc ORDER BY dist LIMIT 5;\n```",
        },
      ],
      oracleComparison: [
        {
          kind: "explanation",
          heading: "Oracle: AI Vector Search",
          body:
            "Oracle 23ai adds **AI Vector Search**: a `VECTOR` type, **`VECTOR_DISTANCE()`**, and vector indexes (HNSW, IVF). Syntax is strikingly close to SQL Server's.\n```sql\nALTER TABLE doc ADD (embedding VECTOR(1536, FLOAT32));\nCREATE VECTOR INDEX doc_vec ON doc(embedding)\n  ORGANIZATION INMEMORY NEIGHBOR GRAPH DISTANCE COSINE;\nSELECT doc_id FROM doc\nORDER BY VECTOR_DISTANCE(embedding, :q, COSINE)\nFETCH FIRST 5 ROWS ONLY;\n```",
        },
      ],
      sideBySide: {
        id: "cmp-vector",
        concept: "Vector and AI capabilities",
        summary: "All four now offer vector types and ANN indexing; SQL Server and Oracle are closest in syntax, PostgreSQL uses pgvector operators, MySQL is the least mature for open-source ANN.",
        rows: [
          { aspect: "Vector type", sqlserver: "VECTOR(n) (2025)", postgresql: "vector (pgvector)", mysql: "VECTOR (9.0)", oracle: "VECTOR (23ai)" },
          { aspect: "Distance function", sqlserver: "VECTOR_DISTANCE()", postgresql: "<=> / <-> operators", mysql: "DISTANCE()", oracle: "VECTOR_DISTANCE()" },
          { aspect: "ANN index", sqlserver: "DiskANN (preview)", postgresql: "HNSW / IVFFlat", mysql: "Limited (HeatWave)", oracle: "HNSW / IVF" },
          { aspect: "In-DB embedding gen", sqlserver: "AI_GENERATE_EMBEDDINGS", postgresql: "via extension/UDF", mysql: "External", oracle: "DBMS_VECTOR / ONNX in-db" },
          { aspect: "Metrics", sqlserver: "cosine, euclidean, dot", postgresql: "cosine, L2, inner", mysql: "cosine, euclidean, dot", oracle: "cosine, euclidean, dot" },
        ],
        samples: [
          {
            label: "Top-5 cosine nearest neighbors",
            code: {
              sqlserver: "SELECT TOP 5 DocId FROM dbo.Doc ORDER BY VECTOR_DISTANCE('cosine', Embedding, @q);",
              postgresql: "SELECT doc_id FROM doc ORDER BY embedding <=> $1 LIMIT 5;",
              mysql: "SELECT doc_id FROM doc ORDER BY DISTANCE(embedding, VEC_FROM_TEXT(?), 'COSINE') LIMIT 5;",
              oracle: "SELECT doc_id FROM doc ORDER BY VECTOR_DISTANCE(embedding, :q, COSINE) FETCH FIRST 5 ROWS ONLY;",
            },
          },
        ],
        migration: {
          equivalent: "The store-embedding / order-by-distance pattern is identical everywhere.",
          different: "Index types (DiskANN vs HNSW/IVFFlat) and function vs operator syntax differ; MySQL open-source ANN is the weakest.",
          directMigration: "Yes for the query pattern; index DDL and distance syntax must be rewritten.",
          syntaxChanges: "Swap VECTOR_DISTANCE for pgvector operators or MySQL DISTANCE(); change index creation syntax.",
          limitations: "SQL Server DiskANN and several vector functions are in preview; MySQL open-source lacks mature ANN indexing.",
          whenToUse: "Choose the engine already holding your relational data so you avoid moving it — the core DP-800 value proposition.",
        },
      },
      realWorldScenario: [
        {
          kind: "recommendation",
          heading: "Semantic help-desk search over existing SQL data",
          body:
            "Support articles already live in SQL Server. Add a `VECTOR` column, generate embeddings with `AI_GENERATE_EMBEDDINGS`, and serve semantic search with `VECTOR_DISTANCE` — no data movement to a separate vector store. Add a DiskANN index once the corpus grows. This 'AI where your data lives' pattern is exactly what DP-800 validates.",
        },
      ],
      commonMistakes: [
        { mistake: "Comparing vectors of different dimensions or models.", fix: "All vectors must share the same dimension and be produced by the same embedding model." },
        { mistake: "Using ANN and expecting exact results.", fix: "ANN trades recall for speed; use ENN when exactness matters or the set is small." },
        { mistake: "Ordering descending by distance.", fix: "Smaller distance = more similar; order ascending for nearest neighbors." },
      ],
      performanceSecurity: [
        { kind: "recommendation", body: "Normalize vectors (VECTOR_NORMALIZE) when a metric requires it. DiskANN speeds large-scale search but is preview — validate recall. Apply RLS/permissions so semantic search can't surface rows a user shouldn't see." },
      ],
      examTips: [
        "Cosine is the default metric for text embeddings; order ascending by distance.",
        "ENN = exact/small; ANN/DiskANN = approximate/large.",
        "VECTOR type, DiskANN, VECTOR_SEARCH have preview status on SQL Server 2025 — the exam may flag GA vs preview.",
        "The whole point: run AI where the data already is, without moving it.",
      ],
      summary:
        "Store embeddings in VECTOR, rank by VECTOR_DISTANCE (cosine, ascending), and add a DiskANN index for ANN at scale. PostgreSQL (pgvector), Oracle (23ai), and MySQL 9 offer parallels; Oracle is closest in syntax. The DP-800 theme is doing AI in-database without moving data.",
    },
    labId: "lab-vector",
    knowledgeCheck: { questionIds: ["q-l1002-1", "q-l1002-2", "q-l1002-3", "q-l1002-4", "q-l1002-5", "q-l1002-6"] },
    references: [
      REFS.studyGuide,
      ref("VECTOR data type", "https://learn.microsoft.com/en-us/sql/t-sql/data-types/vector-data-type"),
      ref("VECTOR_DISTANCE", "https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-distance-transact-sql"),
      ref("VECTOR_SEARCH", "https://learn.microsoft.com/en-us/sql/t-sql/functions/vector-search-transact-sql"),
      ref("Vectors overview", "https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors"),
      ref("pgvector", "https://github.com/pgvector/pgvector", "pgvector"),
      ref("Oracle AI Vector Search", "https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/", "Oracle"),
    ],
  }),

  defineLesson({
    id: "l1003",
    moduleId: "m10",
    domainId: "d3",
    order: 3,
    slug: "hybrid-search-and-rrf",
    title: "Hybrid search and reciprocal rank fusion",
    summary: "Combine keyword and vector results and merge rankings with RRF for the best of both.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: ["Implement hybrid search (full-text + vector).", "Merge rankings with reciprocal rank fusion (RRF).", "Choose full-text vs vector vs hybrid."],
    keyTerms: [
      { term: "Hybrid search", definition: "Combining keyword (full-text) and semantic (vector) retrieval." },
      { term: "Reciprocal rank fusion (RRF)", definition: "A method that merges multiple ranked lists using 1/(k + rank)." },
    ],
    sections: {
      overview: "Neither keyword nor vector search alone is best; hybrid + RRF fuses their strengths.",
      officialConcepts: [{ kind: "official", body: "Run **full-text** and **vector** searches, then fuse with **RRF**: each document's score is the sum over lists of `1/(k + rank)`. RRF needs no score calibration between systems, making it robust. Choose full-text for exact terms, vector for meaning, and **hybrid** when you need both." }],
      commonMistakes: [{ mistake: "Averaging raw scores from different systems.", fix: "Scores aren't comparable; use rank-based RRF instead." }],
      examTips: ["RRF fuses ranked lists without needing comparable scores.", "Hybrid = full-text + vector combined."],
      summary: "Fuse full-text and vector results with RRF (1/(k+rank)) to get precise and semantic matches together.",
    },
    knowledgeCheck: { questionIds: ["q-l1003-1", "q-l1003-2"] },
    references: [REFS.studyGuide, ref("Hybrid search", "https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors")],
  }),

  defineLesson({
    id: "l1004",
    moduleId: "m10",
    domainId: "d3",
    order: 4,
    slug: "evaluating-search-performance",
    title: "Evaluating vector and hybrid search performance",
    summary: "Measure recall, latency, and index trade-offs; pick index types and metrics deliberately.",
    estimatedMinutes: 25,
    difficulty: "advanced",
    learningObjectives: ["Evaluate vector index types and metrics.", "Balance recall vs latency for ANN.", "Measure hybrid search quality."],
    keyTerms: [
      { term: "Recall", definition: "Fraction of true nearest neighbors an ANN search actually returns." },
      { term: "Latency", definition: "Time to return results; usually traded against recall in ANN." },
    ],
    sections: {
      overview: "DP-800 expects you to evaluate, not just implement, search — recall/latency trade-offs and metric choice.",
      officialConcepts: [{ kind: "official", body: "Evaluate **index types** and **metrics** against your data. ANN parameters trade **recall** for **latency**; measure both on representative queries. For hybrid, verify RRF actually improves top-k relevance over either method alone." }],
      examTips: ["ANN tuning is a recall-vs-latency trade-off.", "Always evaluate on representative queries, not toy inputs."],
      summary: "Choose index type/metric by measuring recall and latency on real queries; confirm hybrid beats single-method retrieval.",
    },
    knowledgeCheck: { questionIds: ["q-l1004-1", "q-l1004-2"] },
    references: [REFS.studyGuide, ref("Vector index evaluation", "https://learn.microsoft.com/en-us/sql/sql-server/ai/vectors")],
  }),

  // -------- Module 11: RAG --------
  defineLesson({
    id: "l1101",
    moduleId: "m11",
    domainId: "d3",
    order: 1,
    slug: "rag-use-cases-and-rest-endpoint",
    title: "RAG use cases and calling models with sp_invoke_external_rest_endpoint",
    summary: "Ground LLM answers in your SQL data and call external models securely from T-SQL.",
    estimatedMinutes: 35,
    difficulty: "advanced",
    learningObjectives: [
      "Identify good use cases for RAG.",
      "Call an external model with sp_invoke_external_rest_endpoint.",
      "Assemble a grounded prompt from retrieved rows.",
    ],
    keyTerms: [
      { term: "RAG", definition: "Retrieval-augmented generation — grounding an LLM with retrieved context to reduce hallucination." },
      { term: "sp_invoke_external_rest_endpoint", definition: "System stored procedure that calls an external REST API (e.g., a model) from T-SQL." },
    ],
    sections: {
      overview:
        "RAG combines Domain 3's retrieval with generation: fetch relevant rows via vector/hybrid search, then ask a model to answer using only that context.",
      officialConcepts: [
        { kind: "official", body: "Good RAG use cases: Q&A over private docs, support assistants, and summarization grounded in current data. Call the model from SQL with **`sp_invoke_external_rest_endpoint`**, passing a JSON payload (URL, headers, body) and reading the JSON response. Authenticate with **Managed Identity** where possible." },
      ],
      visualExplanation: {
        caption: "RAG pipeline entirely inside SQL Server: retrieve with vector search, build a grounded prompt, call the model, extract the answer.",
        mermaid: `flowchart LR
    q["User question"] --> retr["Vector/hybrid retrieve top-k rows"]
    retr --> json["Convert rows to JSON (FOR JSON)"]
    json --> prompt["Build grounded prompt"]
    prompt --> call["sp_invoke_external_rest_endpoint"]
    call --> extract["Extract model answer (JSON_VALUE)"]`,
      },
      realWorldScenario: [
        { kind: "recommendation", heading: "Grounded support assistant", body: "A user asks a question; you vector-search the KB for the top 5 chunks, serialize them with FOR JSON, embed them in a prompt that says 'answer only from this context', call the chat model via sp_invoke_external_rest_endpoint, and return the extracted answer with citations to the source rows." },
      ],
      performanceSecurity: [{ kind: "recommendation", body: "Use Managed Identity for the endpoint; never inject untrusted text into system instructions; cap retrieved context size; log calls for monitoring." }],
      examTips: ["sp_invoke_external_rest_endpoint is THE way to call a model from T-SQL.", "RAG reduces hallucination by grounding the model in retrieved data."],
      summary: "RAG grounds LLMs in your data: retrieve, convert to JSON, prompt, call via sp_invoke_external_rest_endpoint, extract — all in SQL, secured with Managed Identity.",
    },
    knowledgeCheck: { questionIds: ["q-l1101-1", "q-l1101-2", "q-l1101-3"] },
    references: [REFS.studyGuide, ref("sp_invoke_external_rest_endpoint", "https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-invoke-external-rest-endpoint-transact-sql")],
  }),

  defineLesson({
    id: "l1102",
    moduleId: "m11",
    domainId: "d3",
    order: 2,
    slug: "rag-json-and-responses",
    title: "Converting data to JSON and handling model responses",
    summary: "Shape retrieved rows into JSON for the model, send them, and extract the response safely.",
    estimatedMinutes: 30,
    difficulty: "advanced",
    learningObjectives: [
      "Convert structured data to JSON for language-model processing.",
      "Send results to a model and extract its response.",
      "Evaluate correctness and prevent unsafe generated SQL.",
    ],
    keyTerms: [
      { term: "Grounding context", definition: "The retrieved data supplied to the model to answer from." },
      { term: "NL-to-SQL", definition: "Translating natural language into SQL, which must be validated before execution." },
    ],
    sections: {
      overview:
        "The last mile of RAG is data shaping and response handling — plus the safety concerns of AI-generated SQL, an explicit production concern in DP-800.",
      officialConcepts: [
        { kind: "official", body: "Use **`FOR JSON`** / JSON constructors to convert rows to the JSON the model expects, **send** via the REST endpoint, and **extract** the answer with `JSON_VALUE`/`OPENJSON`. For natural-language-to-SQL, treat generated SQL as untrusted: validate against an allow-list, run read-only with least privilege, and block destructive statements." },
      ],
      realWorldScenario: [
        { kind: "recommendation", heading: "Safe natural-language-to-SQL", body: "An agent turns a question into SQL. Before executing, parse and reject anything that isn't a single SELECT, run it as a low-privilege read-only principal (reinforced by RLS), enforce a row/time limit, and log the query. This prevents unsafe or destructive generated SQL." },
      ],
      commonMistakes: [{ mistake: "Executing model-generated SQL directly.", fix: "Validate, constrain to read-only least-privilege, and block DDL/DML before running." }],
      performanceSecurity: [{ kind: "recommendation", body: "Run AI-generated queries under a least-privilege, read-only identity with RLS; validate for correctness and safety; never allow destructive statements." }],
      examTips: ["FOR JSON shapes the payload; JSON_VALUE extracts the answer.", "Generated SQL must be validated and sandboxed (read-only, least privilege)."],
      summary: "Convert rows with FOR JSON, call the model, extract with JSON_VALUE, and rigorously sandbox any AI-generated SQL to read-only least privilege.",
    },
    knowledgeCheck: { questionIds: ["q-l1102-1", "q-l1102-2"] },
    references: [REFS.studyGuide, ref("FOR JSON", "https://learn.microsoft.com/en-us/sql/relational-databases/json/format-query-results-as-json-with-for-json"), ref("OPENJSON", "https://learn.microsoft.com/en-us/sql/t-sql/functions/openjson-transact-sql")],
  }),
];
