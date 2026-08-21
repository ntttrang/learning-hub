import { q } from "../_build";

const T = ["lab-coding", "lab-03"];

export const LAB03 = [
  q({ id: "q-lab03-1", domainId: "d1", moduleId: "m03", lessonId: "l0303", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "The Harbor API contract is a JSON **array of objects** with properties `GearId`, `Name`, and `ListPrice`. Null colors must be omitted. The client rejects an XML payload and rejects a single wrapper object unless you add ROOT later.\n\nWhich clause produces the array?",
    code: `SELECT GearId, Name, ListPrice
FROM dbo.Gear
WHERE Color IS NOT NULL
ORDER BY ListPrice DESC
FOR ??? PATH;`,
    options: [
      ["a", "`JSON` — `FOR JSON PATH` emits `[{...},{...}]`"],
      ["b", "`XML` — `FOR XML PATH` is interchangeable with JSON for REST clients"],
      ["c", "`BROWSE` — required whenever ORDER BY is present"],
      ["d", "`SYSTEM_TIME` — exports temporal history as JSON"],
    ],
    correct: ["a"],
    explanation: "`FOR JSON PATH` (or AUTO) is how T-SQL returns a JSON array. PATH lets you control nested property names with aliases like `tag.value`. FOR XML is a different media type. BROWSE and SYSTEM_TIME are not JSON emitters." }),
  q({ id: "q-lab03-2", domainId: "d1", moduleId: "m03", lessonId: "l0303", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "A downstream service **requires** `{\"TopGear\":[...]}` (named envelope). Another internal tool requires a **bare object** for a single row, not `[ {...} ]`.\n\nWhich options implement those two contracts?",
    code: `-- Envelope
SELECT GearId, Name FROM dbo.Gear FOR JSON PATH, ROOT('TopGear');

-- Single-row object
SELECT GearId, Name FROM dbo.Gear WHERE GearId = @Id
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;`,
    options: [
      ["a", "`ROOT('TopGear')` wraps the array; `WITHOUT_ARRAY_WRAPPER` unwraps a single object"],
      ["b", "`INCLUDE_NULL_VALUES` creates a named root; `FOR XML PATH` unwraps JSON"],
      ["c", "`ROOT` and `WITHOUT_ARRAY_WRAPPER` cannot be used with FOR JSON PATH"],
      ["d", "You must emit JSON from `JSON_OBJECT` only; FOR JSON cannot wrap a root"],
    ],
    correct: ["a"],
    explanation: "`ROOT('name')` adds the envelope. `WITHOUT_ARRAY_WRAPPER` drops the `[ ]` so one row becomes `{...}`. INCLUDE_NULL_VALUES only changes null property emission. JSON_OBJECT builds one object per row; it does not replace FOR JSON for a result-set array." }),
  q({ id: "q-lab03-3", domainId: "d1", moduleId: "m03", lessonId: "l0302", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "For each `Color`, return the **three most expensive** gear rows. Ties at the cutoff must not share a rank number (you need a deterministic 1..n so `<= 3` returns at most three rows per color). You already know window functions cannot be referenced in the same SELECT's WHERE.\n\nWhich function belongs in the CTE, and where do you filter?",
    code: `WITH Ranked AS (
  SELECT Name, Color, ListPrice,
         ???() OVER (PARTITION BY Color ORDER BY ListPrice DESC, GearId) AS rnk
  FROM dbo.Gear
)
SELECT Name, Color, ListPrice FROM Ranked WHERE rnk <= 3;`,
    options: [
      ["a", "`ROW_NUMBER` in the CTE; filter `rnk <= 3` in the outer query"],
      ["b", "`RANK` in the CTE; filter in the same SELECT's WHERE as the window"],
      ["c", "`NTILE(3)` in the outer WHERE without a CTE"],
      ["d", "`COUNT(*) OVER ()` and `HAVING COUNT(*) <= 3`"],
    ],
    correct: ["a"],
    explanation: "`ROW_NUMBER` assigns unique 1..n (use a tie-breaker like GearId). `RANK` shares numbers on ties, so `<= 3` can return more than three rows. Window functions are evaluated after WHERE, so the filter must be outer (CTE/derived table). NTILE buckets rows; it is not top-n." }),
  q({ id: "q-lab03-4", domainId: "d1", moduleId: "m03", lessonId: "l0303", difficulty: "advanced", type: "debugging",
    tags: T,
    prompt: "A price-update payload is a JSON array. The following batch returns `key`, `value`, and `type` columns instead of `ProductId` / `NewPrice` rows, and the subsequent UPDATE affects zero rows.\n\nWhat is wrong?",
    code: `DECLARE @Updates nvarchar(max) =
  N'[{"ProductId":10,"NewPrice":49.00},{"ProductId":11,"NewPrice":18.50}]';

SELECT * FROM OPENJSON(@Updates);
-- expected columns: ProductId INT, NewPrice DECIMAL(10,2)`,
    options: [
      ["a", "Default OPENJSON (no WITH) shreds to key/value/type; add `WITH (ProductId INT '$.ProductId', NewPrice DECIMAL(10,2) '$.NewPrice')`"],
      ["b", "OPENJSON cannot shred arrays; you must use FOR JSON PATH in reverse"],
      ["c", "You must CAST @Updates to XML first"],
      ["d", "JSON arrays require `JSON_OBJECT` instead of OPENJSON"],
    ],
    correct: ["a"],
    explanation: "OPENJSON without WITH is the generic key/value/type projector (array indexes in `key`). The WITH clause supplies typed columns and `$.path` mapping — the exam skill. FOR JSON goes the other direction (relational → JSON)." }),
  q({ id: "q-lab03-5", domainId: "d1", moduleId: "m03", lessonId: "l0304", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "SKU values in `dbo.Gear.Sku` must look like `HO-` plus 4 digits (e.g. `HO-1042`). Merchandising also wants near-duplicate names flagged when `EDIT_DISTANCE(Name, @Typed)` is at most 2.\n\nWhich **two** predicates belong in T-SQL 2025? Each correct answer presents part of the solution.",
    options: [
      ["a", "`REGEXP_LIKE(Sku, '^HO-[0-9]{4}$')`"],
      ["b", "`EDIT_DISTANCE(Name, @Typed) <= 2`"],
      ["c", "`Sku LIKE '[0-9][0-9][0-9][0-9]-HO'` (same pattern as the regex)"],
      ["d", "`CONTAINS(Name, 'FORMSOF(INFLECTIONAL, @Typed)')` for edit distance 2"],
    ],
    correct: ["a", "b"],
    explanation: "DP-800 advanced T-SQL includes `REGEXP_LIKE` / `REGEXP_REPLACE` and fuzzy helpers (`EDIT_DISTANCE`, `JARO_WINKLER_DISTANCE`). The LIKE pattern in C is reversed and does not anchor `HO-`. Full-text inflection is linguistic stemming, not Levenshtein distance." }),
  q({ id: "q-lab03-6", domainId: "d1", moduleId: "m03", lessonId: "l0305", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "Crew and voyages are modeled as a SQL graph: `Crew` (node), `Voyage` (node), `Crewed` (edge). You must return voyages that sailor `@Handle` crewed — using graph syntax, not a recursive CTE.\n\nWhich predicate is valid?",
    code: `SELECT v.VoyageId
FROM dbo.Crew AS c, dbo.Crewed AS e, dbo.Voyage AS v
WHERE MATCH(???);`,
    options: [
      ["a", "`MATCH(c-(e)->v) AND c.Handle = @Handle`"],
      ["b", "`MATCH(c INNER JOIN v ON e)`"],
      ["c", "`MATCH SHORTEST_PATH(c TO v)` without an edge table"],
      ["d", "`c.CrewId = v.CrewId` — graph tables ignore MATCH"],
    ],
    correct: ["a"],
    explanation: "SQL Server graph queries use `MATCH(node-(edge)->node)` (ASCII-art traversal). Joining through a CrewId column would ignore the edge table you modeled. SHORTEST_PATH is a different graph feature and still needs a defined path pattern. MATCH is not ANSI JOIN syntax." }),
];
