import { q } from "../_build";

const T = ["lab-coding", "lab-09"];

export const LAB09 = [
  q({ id: "q-lab09-1", domainId: "d3", moduleId: "m09", lessonId: "l0901", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Harbor Outfitters will generate embeddings **inside SQL Server** from Azure OpenAI `text-embedding-3-small`. You must register the deployment once and authenticate without a key in T-SQL.\n\nWhich object do you create, and what must accompany it?",
    code: `CREATE EXTERNAL MODEL HarborEmbed
WITH (
  LOCATION = 'https://<endpoint>/',
  API_FORMAT = 'OpenAI',
  MODEL = 'text-embedding-3-small'
);`,
    options: [
      ["a", "`CREATE EXTERNAL MODEL` plus a DATABASE SCOPED CREDENTIAL (Managed Identity preferred)"],
      ["b", "`CREATE EXTERNAL TABLE` pointing at a CSV of vectors in Blob Storage"],
      ["c", "`CREATE EXTERNAL DATA SOURCE` only — models are inferred from the database name"],
      ["d", "`CREATE EXTERNAL FILE FORMAT` — embeddings must be Parquet"],
    ],
    correct: ["a"],
    explanation: "`CREATE EXTERNAL MODEL` is the DP-800 registration skill. Pair it with a scoped credential (Managed Identity) so `AI_GENERATE_EMBEDDINGS` can call the endpoint. External tables/file formats are PolyBase/export, not the chat/embedding model object." }),
  q({ id: "q-lab09-2", domainId: "d3", moduleId: "m09", lessonId: "l0903", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "`HarborEmbed` is `text-embedding-3-small` (1536 dimensions). The following batch fails with a vector dimension mismatch.\n\nWhat is wrong?",
    code: `ALTER TABLE dbo.GearReview ADD Embedding VECTOR(384);
UPDATE dbo.GearReview
SET Embedding = AI_GENERATE_EMBEDDINGS(N'HarborEmbed', ReviewText);`,
    options: [
      ["a", "`VECTOR(384)` does not match the model's 1536-dimensional output — size the column to the model (and chunk text so each chunk still embeds to that size)"],
      ["b", "`AI_GENERATE_EMBEDDINGS` cannot appear in UPDATE; only SELECT is legal"],
      ["c", "`VECTOR` requires exactly 2 dimensions (x,y)"],
      ["d", "You must CAST the embedding to `nvarchar(max)` before storing it"],
    ],
    correct: ["a"],
    explanation: "Column dimensionality is a first-class DP-800 skill. 384 is a different family (e.g. some MiniLM models), not text-embedding-3-small. Chunking affects **input tokens**, not output size — each chunk still produces a 1536-float vector for that model." }),
  q({ id: "q-lab09-3", domainId: "d3", moduleId: "m09", lessonId: "l0903", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Reviews already live in Azure SQL. Leadership forbids copying the corpus to a separate vector database 'for AI'. You add `Embedding VECTOR(1536)`.\n\nWhich function writes the embedding, and why keep it on the row?",
    code: `UPDATE dbo.GearReview
SET Embedding = AI_GENERATE_EMBEDDINGS(N'HarborEmbed', ReviewText)
WHERE Embedding IS NULL;`,
    options: [
      ["a", "`AI_GENERATE_EMBEDDINGS` — transactions, RLS, and backups then apply to embeddings with the source row"],
      ["b", "`VECTOR_DISTANCE` — it both generates and stores embeddings"],
      ["c", "`PREDICT` with an ONNX model named HarborEmbed — required instead of EXTERNAL MODEL"],
      ["d", "`OPENJSON` — VECTOR is stored as JSON text, not a native type"],
    ],
    correct: ["a"],
    explanation: "The DP-800 value proposition is AI where the data lives. `AI_GENERATE_EMBEDDINGS(model, text)` returns VECTOR. `VECTOR_DISTANCE` compares two vectors; it does not call the model. Native VECTOR is not nvarchar JSON." }),
  q({ id: "q-lab09-4", domainId: "d3", moduleId: "m09", lessonId: "l0902", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "Reviews update throughout the day. Re-embedding the **entire** table each night misses the SLA and burns tokens. You need near-real-time refresh of **changed** rows only.\n\nWhich **two** maintenance approaches match the skills outline? Each correct answer presents part of the solution.",
    options: [
      ["a", "Change Tracking / CDC (or CES) to detect changed keys, then a job, Azure Function, or Logic App re-embeds those rows"],
      ["b", "An AFTER UPDATE trigger that calls `AI_GENERATE_EMBEDDINGS` for the inserted review text (with care for synchronous cost)"],
      ["c", "Rebuild the clustered index nightly with FILLFACTOR 50"],
      ["d", "Switch the database to SIMPLE recovery so embeddings auto-refresh"],
    ],
    correct: ["a", "b"],
    explanation: "Embedding maintenance is its own skill: triggers, Change Tracking, CDC, CES, Azure Functions (SQL trigger binding), Logic Apps, Foundry. Index rebuilds and recovery models do not refresh model output." }),
  q({ id: "q-lab09-5", domainId: "d3", moduleId: "m09", lessonId: "l0902", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "A review row is 12,000 tokens. The embedding model caps at 8,191 input tokens. Search quality is poor on long manuals pasted into `ReviewText`.\n\nWhat should you do?",
    options: [
      ["a", "Chunk the source text (overlapping windows or structure-aware splits), embed each chunk as its own row/child, and retrieve chunks — not one truncated mega-vector"],
      ["b", "Store the 12,000-token string in `VECTOR(1536)` directly; VECTOR is nvarchar"],
      ["c", "Drop the VECTOR column and use `LIKE '%chunk%'`"],
      ["d", "Increase VECTOR dimensions to 12000 so each token is a dimension"],
    ],
    correct: ["a"],
    explanation: "Chunking is an explicit DP-800 skill. You cannot stuff a novel into one embedding without truncation, and dimension ≠ token count. Child rows (ReviewId + ChunkId) keep retrieval granular." }),
  q({ id: "q-lab09-6", domainId: "d3", moduleId: "m09", lessonId: "l0901", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "You must choose an embedding model for Harbor's multilingual support articles and for a future image-caption search. Token cost matters.\n\nWhich evaluation factors match the outline?",
    options: [
      ["a", "Modality (text vs multimodal), languages, vector size/cost, and whether you need structured output from a chat model vs an embedding model"],
      ["b", "Only the Azure region; all embedding models have identical dimensions and languages"],
      ["c", "Whether Query Store is on; embeddings cannot be generated unless it is"],
      ["d", "Whether the table uses a columnstore index; VECTOR requires columnstore"],
    ],
    correct: ["a"],
    explanation: "The skills outline: evaluate external models including multimodal, multilanguage, sizes, and structured output. Region matters for latency/compliance but does not collapse model differences. Query Store and columnstore are unrelated to model choice." }),
];
