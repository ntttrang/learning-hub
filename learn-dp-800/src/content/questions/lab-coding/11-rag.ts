import { q } from "../_build";

const T = ["lab-coding", "lab-11"];

export const LAB11 = [
  q({ id: "q-lab11-1", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "Harbor wants a database-grounded assistant. Which **two** are appropriate RAG use cases? Each correct answer presents part of the solution. (RAG is not a substitute for SQL aggregation.)",
    options: [
      ["a", "Q&A over private review text and policy docs that must cite retrieved rows"],
      ["b", "A support assistant whose answers must reflect **current** GearReview rows, not the model's training cutoff"],
      ["c", "Guaranteeing an exact SUM of VoyageLine.Qty × UnitPrice without running SQL"],
      ["d", "Replacing RLS so the model can read every tenant's rows"],
    ],
    correct: ["a", "b"],
    explanation: "RAG grounds generation in retrieved, up-to-date private data. Exact numeric aggregation is a SQL job — the model must not be treated as a calculator of record. RAG does not bypass RLS; retrieve should run under the caller's security context." }),
  q({ id: "q-lab11-2", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "The generate step must call Azure OpenAI **from T-SQL** using a scoped credential (no `xp_cmdshell`, no CLR). The prompt JSON is already in `@PromptJson`.\n\nWhich procedure should you call?",
    code: `EXEC ???
  @url = N'https://<endpoint>/openai/deployments/chat/chat/completions?api-version=2024-10-21',
  @method = 'POST',
  @credential = [HarborRest],
  @payload = @PromptJson,
  @response = @ResponseJson OUTPUT;`,
    options: [
      ["a", "`sp_invoke_external_rest_endpoint`"],
      ["b", "`sp_execute_external_script` (Python) with urllib"],
      ["c", "`xp_cmdshell` curling the endpoint"],
      ["d", "`OPENROWSET(BULK)` against the URL"],
    ],
    correct: ["a"],
    explanation: "`sp_invoke_external_rest_endpoint` is the DP-800 RAG skill for sending a prompt and receiving JSON. External script / xp_cmdshell / OPENROWSET are the wrong surfaces (and xp_cmdshell is a security non-starter)." }),
  q({ id: "q-lab11-3", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "After VECTOR_DISTANCE retrieve, you must attach the hits to the chat payload as a named JSON document `{\"context\":[...]}`.\n\nWhich clause packs the rows?",
    code: `SELECT ReviewId, ReviewText
FROM @Hits
FOR ??? PATH, ROOT('context');`,
    options: [
      ["a", "`JSON` — `FOR JSON PATH, ROOT('context')` is the relational-to-JSON step of RAG"],
      ["b", "`XML` — language models require XML context"],
      ["c", "`BROWSE`"],
      ["d", "`SYSTEM_TIME`"],
    ],
    correct: ["a"],
    explanation: "Convert structured data to JSON for the model — `FOR JSON PATH` with optional ROOT. That string is concatenated/inserted into the chat messages array before `sp_invoke_external_rest_endpoint`." }),
  q({ id: "q-lab11-4", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "You wrap retrieve → JSON augment → REST generate in `dbo.usp_GearRag`. Apps EXEC it with a question. Why is a procedure the right boundary, and what must still be true of retrieve?",
    options: [
      ["a", "One GRANT EXECUTE surface, a stable prompt template, and retrieve that still obeys RLS/permissions of the caller (or an explicit, audited EXECUTE AS)"],
      ["b", "Procedures are the only objects that can SELECT VECTOR columns"],
      ["c", "REST calls from ad-hoc batches are impossible, so a proc is required by the engine"],
      ["d", "Stored procedures disable RLS, which RAG needs in order to see all tenants"],
    ],
    correct: ["a"],
    explanation: "Lab/exam pattern: a callable RAG API in the database. VECTOR is selectable from any module. Ad-hoc batches *can* call the REST proc — you still want the template and permissions in one place. RLS should remain on; do not 'fix' RAG by reading other tenants." }),
  q({ id: "q-lab11-5", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "The chat completion JSON lands in `@ResponseJson`. The procedure must return the assistant text to the app.\n\nWhat should you do next?",
    options: [
      ["a", "Parse `choices[0].message.content` (or the current API shape) with `JSON_VALUE` / `OPENJSON` and RETURN/SELECT it"],
      ["b", "INSERT the raw TCP payload into the VECTOR column"],
      ["c", "Disable RLS because the model response is already tenant-safe"],
      ["d", "`DROP DATABASE` if `error` is present in the JSON"],
    ],
    correct: ["a"],
    explanation: "Skills outline: send results to a language model **and extract** the response. OPENJSON/JSON_VALUE on the OpenAI (or Azure) chat shape is the usual extract. The model output is not a vector; it is also not a reason to disable RLS." }),
  q({ id: "q-lab11-6", domainId: "d3", moduleId: "m11", lessonId: "l1101", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "A developer implemented retrieve as dynamic SQL so users can 'search anything'. The rest of the RAG pipeline (JSON + REST) is parameterized.\n\nWhy is this still unsafe, and what should retrieve be?",
    code: `DECLARE @sql nvarchar(max) =
  N'SELECT ReviewText FROM dbo.GearReview
    WHERE ReviewText LIKE ''%' + @UserQuestion + N'%'';';
EXEC (@sql);
-- then FOR JSON and sp_invoke_external_rest_endpoint`,
    options: [
      ["a", "Concatenating user text into SQL is injection. Use parameterized `CONTAINS` / `VECTOR_DISTANCE` (and keep RLS). Prompt injection into the **model** is a separate later control"],
      ["b", "`LIKE` cannot be used on nvarchar, so the batch cannot have run"],
      ["c", "RAG forbids reading the source table; you must only call the model"],
      ["d", "`EXEC` of a string is deprecated and fails on SQL Server 2025"],
    ],
    correct: ["a"],
    explanation: "DP-800 production concern: AI-generated or user-tainted SQL. Retrieval must be parameterized (FT/vector). Parameterizing the REST payload does not retroactively fix a concatenated SELECT. LIKE on nvarchar is legal. EXEC(@sql) still exists — that is the problem." }),
];
