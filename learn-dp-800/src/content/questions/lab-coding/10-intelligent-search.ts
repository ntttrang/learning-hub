import { q } from "../_build";

const T = ["lab-coding", "lab-10"];

export const LAB10 = [
  q({ id: "q-lab10-1", domainId: "d3", moduleId: "m10", lessonId: "l1001", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Support agents search Harbor reviews. Query A is the exact token `SKU-HO-1042`. Query B is “something like a waxed canvas tote for rain” with **no** shared keywords. Query C is both an error code **and** a paraphrase.\n\nWhich search mode should you choose for A, B, and C?",
    options: [
      ["a", "A: full-text. B: vector. C: hybrid (FT + vector fused, typically RRF)"],
      ["b", "A: vector only. B: full-text only. C: LIKE '%error%'"],
      ["c", "All three: clustered columnstore scan"],
      ["d", "All three: graph `MATCH` shortest path"],
    ],
    correct: ["a"],
    explanation: "DP-800 expects you to **choose** among full-text (tokens, Boolean, inflection), semantic vector (paraphrase), and hybrid. Hybrid is how you keep SKU precision and still recall paraphrases." }),
  q({ id: "q-lab10-2", domainId: "d3", moduleId: "m10", lessonId: "l1002", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "You rank reviews by cosine similarity to `@QueryVec`. Lower cosine **distance** is closer. A developer orders by `Dist DESC` and wonders why the worst matches appear first.\n\nWhat should the query look like?",
    code: `SELECT TOP (5) ReviewId,
       VECTOR_DISTANCE(Embedding, @QueryVec, 'cosine') AS Dist
FROM dbo.GearReview
WHERE Embedding IS NOT NULL
ORDER BY Dist ???;`,
    options: [
      ["a", "`ORDER BY Dist ASC` — cosine distance is a distance; nearest neighbors are the smallest values"],
      ["b", "`ORDER BY Dist DESC` — cosine distance is already a similarity score"],
      ["c", "`ORDER BY ReviewId` — VECTOR_DISTANCE is not deterministic unless you sort on the key"],
      ["d", "Remove ORDER BY; `TOP (5)` without ORDER BY returns the five nearest vectors by definition"],
    ],
    correct: ["a"],
    explanation: "`VECTOR_DISTANCE(..., 'cosine')` returns a distance (0 = identical direction). Nearest neighbor is `ORDER BY Dist ASC`. TOP without ORDER BY is not nearest-neighbor. Do not confuse distance with a similarity that you maximize." }),
  q({ id: "q-lab10-3", domainId: "d3", moduleId: "m10", lessonId: "l1004", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "A teammate calls this “hybrid search”. It compiles. Product says recall is worse than vector-only **or** FT-only on some queries.\n\nWhy is this not hybrid ranking?",
    code: `SELECT ReviewId, ReviewText
FROM dbo.GearReview
WHERE CONTAINS(ReviewText, 'canvas')
  AND VECTOR_DISTANCE(Embedding, @Q, 'cosine') < 0.2
ORDER BY ReviewId;`,
    options: [
      ["a", "It is a Boolean **intersection** plus an arbitrary ORDER BY, not rank fusion. Hybrid search keeps both ranked lists and combines ranks (RRF / weighted fusion)"],
      ["b", "CONTAINS cannot appear in the same statement as VECTOR_DISTANCE (parser error — but it compiled, so this cannot be)"],
      ["c", "`cosine` is not a legal VECTOR_DISTANCE metric"],
      ["d", "You must `SELECT … FOR JSON` or hybrid search is undefined"],
    ],
    correct: ["a"],
    explanation: "The exam trap: AND of a keyword filter and a hard distance cutoff **drops** documents that fail either predicate, and `ORDER BY ReviewId` is not relevance. RRF fuses independent ranked lists without calibrating raw scores. CONTAINS + VECTOR_DISTANCE can coexist; that is not the bug." }),
  q({ id: "q-lab10-4", domainId: "d3", moduleId: "m10", lessonId: "l1002", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "`dbo.GearReview` will hold ~2 million embeddings of 1536 dimensions. Exact scans miss the latency SLO. You still want cosine. Preview vector indexes are acceptable if labeled.\n\nWhich **two** statements are correct? Each correct answer presents part of the solution.",
    options: [
      ["a", "Add an approximate nearest-neighbor (ANN) vector index (e.g. DiskANN) and search with ANN; expect a recall/latency trade-off vs exact NN"],
      ["b", "ENN (exact) scans every vector; fine for small sets, not the default at 2M × 1536 under a tight SLO"],
      ["c", "A nonclustered **rowstore** B-tree on the VECTOR column gives the same ANN behavior as DiskANN"],
      ["d", "Full-text catalogs index VECTOR columns automatically if you add a stoplist"],
    ],
    correct: ["a", "b"],
    explanation: "At this scale the outline expects ANN (DiskANN-style) vs ENN. A rowstore index is not a vector ANN index. Full-text does not index VECTOR. Label preview APIs in production plans." }),
  q({ id: "q-lab10-5", domainId: "d3", moduleId: "m10", lessonId: "l1001", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Agents type `waterproof` and must also match `waterproofs` / `waterproofing` (inflection), but must **not** silently expand to thesaurus synonyms from a custom thesaurus file you have not reviewed.\n\nWhich CONTAINS term is correct?",
    code: `SELECT ReviewId, ReviewText
FROM dbo.GearReview
WHERE CONTAINS(ReviewText, 'FORMSOF(???, waterproof)');`,
    options: [
      ["a", "`INFLECTIONAL`"],
      ["b", "`THESAURUS`"],
      ["c", "`WILDCARD` as a FORMSOF first argument"],
      ["d", "`NEAR` as a FORMSOF first argument"],
    ],
    correct: ["a"],
    explanation: "`FORMSOF(INFLECTIONAL, term)` is stemming. `THESAURUS` uses the thesaurus (the thing you have not reviewed). WILDCARD/NEAR are other CONTAINS constructs, not FORMSOF variants." }),
  q({ id: "q-lab10-6", domainId: "d3", moduleId: "m10", lessonId: "l1003", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "After adding a DiskANN index, p95 latency is good but a known-relevant review sometimes misses the top 10. Leadership asks whether to revert to exact search.\n\nHow should you evaluate?",
    options: [
      ["a", "Measure recall@k vs latency (and metric choice). ANN trades a little recall for speed; tighten k / tune the index or hybridize rather than assuming ENN is free"],
      ["b", "ANN always returns a random 10 rows; DiskANN cannot use cosine"],
      ["c", "If any document is missing, the VECTOR type is corrupt and you must drop the database"],
      ["d", "Disable Query Store; it reduces vector recall"],
    ],
    correct: ["a"],
    explanation: "Evaluating vector/hybrid performance (recall, latency, metric) is an explicit skill. Missing a neighbor is expected ANN behavior, not corruption. Query Store does not rank vectors." }),
];
