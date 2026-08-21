import { q } from "../_build";

const T = ["lab-coding", "lab-02"];

export const LAB02 = [
  q({ id: "q-lab02-1", domainId: "d1", moduleId: "m02", lessonId: "l0201", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "The Harbor mobile app must query crew voyages as **one object** without seeing the join. Ad-hoc SQL from the app should remain a single SELECT (not EXEC). Reporting will filter and join the result to other tables.\n\nWhich object should you create?",
    code: `CREATE OR ALTER VIEW dbo.vCrewVoyages
AS
SELECT c.CrewId, c.Handle, v.VoyageId, v.VoyageDate
FROM dbo.Crew AS c
INNER JOIN dbo.Voyage AS v ON v.CrewId = c.CrewId;`,
    options: [
      ["a", "A view — callers SELECT from it like a table; the join stays in the database"],
      ["b", "A stored procedure — the only object an app is allowed to SELECT from"],
      ["c", "An AFTER INSERT trigger on Crew that materializes a reporting table"],
      ["d", "A scalar function that returns the join as nvarchar(max) XML"],
    ],
    correct: ["a"],
    explanation: "Views encapsulate joins and remain composable in FROM/JOIN. Procedures are invoked with EXEC, not composed like tables. A trigger is the wrong side-effect for a read model. Returning XML from a scalar UDF is neither set-based nor what the app asked for." }),
  q({ id: "q-lab02-2", domainId: "d1", moduleId: "m02", lessonId: "l0203", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "Procedure `dbo.usp_AddVoyageLine` starts a transaction, looks up `ListPrice`, and inserts a line. If the gear row is missing, you must **undo the transaction and fail the client batch** with a custom error number. `PRINT` is not acceptable because callers ignore it.\n\nWhich statement belongs after `ROLLBACK`?",
    code: `IF @UnitPrice IS NULL
BEGIN
    ROLLBACK TRANSACTION;
    ??? 50010, 'Unknown GearId.', 1;
END`,
    options: [
      ["a", "`THROW` — raises a catchable error and, uncaught, aborts the batch"],
      ["b", "`RETURN 0` — signals success so the app retries the insert"],
      ["c", "`PRINT` — writes to the messages tab; the INSERT still commits"],
      ["d", "`WAITFOR DELAY '00:00:30'` — wait for the gear row to appear"],
    ],
    correct: ["a"],
    explanation: "`THROW` is the modern way to fail the caller after ROLLBACK. `RETURN 0` looks like success. `PRINT` does not raise. Waiting does not enforce integrity. (`RAISERROR` can also raise, but `THROW` is the preferred pattern in current T-SQL labs and does not require severity gymnastics.)" }),
  q({ id: "q-lab02-3", domainId: "d1", moduleId: "m02", lessonId: "l0202", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "You have inline TVF `dbo.GetCrewVoyages(@CrewId)`. The roster report must list **every crew member**, including those with zero voyages (VoyageId NULL). A second report must list **only crews that have at least one voyage**.\n\nWhich operators implement those two reports?",
    code: `-- Report A: keep crews with no voyages
SELECT c.Handle, o.VoyageId
FROM dbo.Crew AS c
??? dbo.GetCrewVoyages(c.CrewId) AS o;

-- Report B: drop crews with no voyages
SELECT c.Handle, o.VoyageId
FROM dbo.Crew AS c
??? dbo.GetCrewVoyages(c.CrewId) AS o;`,
    options: [
      ["a", "Report A: `OUTER APPLY`. Report B: `CROSS APPLY`"],
      ["b", "Report A: `CROSS JOIN`. Report B: `INNER JOIN` on CrewId (JOIN cannot bind a TVF parameter)"],
      ["c", "Report A: `CROSS APPLY`. Report B: `OUTER APPLY`"],
      ["d", "Both reports: `UNION ALL` the TVF to Crew"],
    ],
    correct: ["a"],
    explanation: "`APPLY` is how you invoke a TVF per outer row. `OUTER APPLY` is the LEFT JOIN analog (keep empty TVF results). `CROSS APPLY` is the INNER JOIN analog (drop empties). You cannot `INNER JOIN dbo.GetCrewVoyages(c.CrewId)` with a correlated parameter the way APPLY does. CROSS JOIN is a cartesian product, not a per-row invoke." }),
  q({ id: "q-lab02-4", domainId: "d1", moduleId: "m02", lessonId: "l0202", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "A developer wrote two functions that return the same columns. Query Store shows the first as a table scan plus a filter; the second is expanded into the outer query like a view.\n\nWhich statement is true?",
    code: `-- A
CREATE FUNCTION dbo.GetCrewVoyages_A (@CrewId INT)
RETURNS @t TABLE (VoyageId INT, VoyageDate DATE)
AS BEGIN
  INSERT @t SELECT VoyageId, VoyageDate FROM dbo.Voyage WHERE CrewId = @CrewId;
  RETURN;
END;

-- B
CREATE FUNCTION dbo.GetCrewVoyages_B (@CrewId INT)
RETURNS TABLE
AS RETURN
(
  SELECT VoyageId, VoyageDate FROM dbo.Voyage WHERE CrewId = @CrewId
);`,
    options: [
      ["a", "A is a multi-statement TVF (often a black box). B is an inline TVF the optimizer can expand"],
      ["b", "A is inline; B is scalar"],
      ["c", "Both are scalar UDFs because they take `@CrewId`"],
      ["d", "B cannot be used with APPLY; only A can"],
    ],
    correct: ["a"],
    explanation: "`RETURNS @t TABLE … BEGIN INSERT … END` is a multi-statement TVF. `RETURNS TABLE AS RETURN (SELECT …)` with no BEGIN/END is inline. Inline TVFs are the set-based default on DP-800; MSTVFs hide cardinality and historically block optimizations. Both TVFs work with APPLY; B is usually the one you want." }),
  q({ id: "q-lab02-5", domainId: "d1", moduleId: "m02", lessonId: "l0203", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "An `AFTER UPDATE` trigger on `dbo.Gear` must write an audit row with **both** the old list price and the new list price.\n\nWhich **two** virtual tables do you read? Each correct answer presents part of the solution.",
    options: [
      ["a", "`deleted` — previous image of the updated rows"],
      ["b", "`inserted` — new image of the updated rows"],
      ["c", "`updated` — SQL Server's dedicated UPDATE virtual table"],
      ["d", "`sys.dm_tran_locks` — lock list is the old/new column values"],
    ],
    correct: ["a", "b"],
    explanation: "There is no `updated` table. For UPDATE, `deleted` holds before-images and `inserted` holds after-images. Join them on the key to pair old and new prices. DMVs do not carry row images." }),
  q({ id: "q-lab02-6", domainId: "d1", moduleId: "m02", lessonId: "l0202", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "The catalog report runs `SELECT dbo.fnVoyageTotal(VoyageId) FROM dbo.Voyage` over 8 million voyages and is CPU-bound. The function compiles and returns the right totals.\n\nWhat should you change first?",
    code: `CREATE FUNCTION dbo.fnVoyageTotal (@VoyageId INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
  DECLARE @Total DECIMAL(18,2);
  SELECT @Total = SUM(Qty * UnitPrice)
  FROM dbo.VoyageLine WHERE VoyageId = @VoyageId;
  RETURN ISNULL(@Total, 0);
END;`,
    options: [
      ["a", "Replace the scalar UDF in the SELECT list with a set-based join/aggregate or an inline TVF — scalar UDFs are often RBAR and inhibit parallelism"],
      ["b", "Add `WITH SCHEMABINDING` only; that guarantees a parallel plan"],
      ["c", "Change `ISNULL` to `COALESCE`; scalar UDFs cannot use ISNULL"],
      ["d", "Move the function to `master` so it is cached once for the instance"],
    ],
    correct: ["a"],
    explanation: "This is a classic exam trap: the code is *correct* but the *pattern* is wrong at scale. Scalar UDFs in the SELECT list execute per row (SQL Server 2019+ inlining helps some functions, but an inline TVF or grouped join is the reliable design). SCHEMABINDING does not by itself buy parallelism. ISNULL is legal. master is irrelevant." }),
];
