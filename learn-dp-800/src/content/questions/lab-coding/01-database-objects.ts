import { q } from "../_build";

const T = ["lab-coding", "lab-01"];

export const LAB01 = [
  q({ id: "q-lab01-1", domainId: "d1", moduleId: "m01", lessonId: "l0103", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Harbor Outfitters stores flexible gear attributes in `dbo.Gear.Attr` (JSON). Support must filter **millions** of rows by `$.color` in interactive time. The JSON shape will keep changing, so you must not add a sparse column per attribute. PostgreSQL-style GIN indexes are not available.\n\nWhich design meets the requirement?",
    code: `-- Attr example: {"color":"navy","fit":"unisex"}
ALTER TABLE dbo.Gear
  ADD Color AS JSON_VALUE(Attr, '$.color');
CREATE INDEX IX_Gear_Color ON dbo.Gear(Color);`,
    options: [
      ["a", "Promote `$.color` to a persisted computed column with `JSON_VALUE` and index that column"],
      ["b", "Create a GIN index directly on the JSON document"],
      ["c", "Filter with `Attr LIKE '%\"color\":\"navy\"%'` and add a full-text catalog on Attr"],
      ["d", "Store each attribute as its own sparse column and rebuild the table when the schema changes"],
    ],
    correct: ["a"],
    explanation: "SQL Server cannot index inside a JSON document the way PostgreSQL GIN can. The exam pattern is: extract the scalar with `JSON_VALUE`, optionally `PERSISTED`, then index the computed column. LIKE scans are not selective at millions of rows; sparse columns fight the 'shape keeps changing' constraint." }),
  q({ id: "q-lab01-2", domainId: "d1", moduleId: "m01", lessonId: "l0104", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "Finance requires that list price cannot be negative **or zero**, and that `RegionCode` is always one of `PAC`, `ATL`, or `ARC`. Both rules must be enforced in the table definition (not only in the app).\n\nWhich **two** table constraints should you add? Each correct answer presents part of the solution.",
    code: `CREATE TABLE dbo.Gear (
  GearId INT PRIMARY KEY,
  Name NVARCHAR(100) NOT NULL,
  ListPrice DECIMAL(10,2) NOT NULL,
  RegionCode CHAR(3) NOT NULL
);`,
    options: [
      ["a", "`CHECK (ListPrice > 0)`"],
      ["b", "`CHECK (RegionCode IN ('PAC', 'ATL', 'ARC'))`"],
      ["c", "`DEFAULT (0) FOR ListPrice`"],
      ["d", "`UNIQUE (Name, RegionCode)`"],
    ],
    correct: ["a", "b"],
    explanation: "`CHECK (ListPrice > 0)` rejects negatives and zero. A CHECK with `IN` enforces the allowed region codes. A DEFAULT of 0 would *insert* a forbidden price. UNIQUE does not restrict which region codes are legal." }),
  q({ id: "q-lab01-3", domainId: "d1", moduleId: "m01", lessonId: "l0102", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "You need system-versioned history of `dbo.GearPrice` so `FOR SYSTEM_TIME` queries work without application changes. The following statement fails.\n\nWhat is the cause?",
    code: `CREATE TABLE dbo.GearPrice (
  GearId INT PRIMARY KEY,
  CurrentPrice DECIMAL(10,2) NOT NULL,
  SysStartTime DATETIME2,
  SysEndTime DATETIME2
) WITH (SYSTEM_VERSIONING = ON);`,
    options: [
      ["a", "Period columns must be `GENERATED ALWAYS AS ROW START/END` and you must declare `PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime)`"],
      ["b", "Temporal tables cannot have a PRIMARY KEY; use a heap"],
      ["c", "`SYSTEM_VERSIONING` is valid only with `LEDGER = ON` on the same statement"],
      ["d", "You must create the history table first with `IDENTITY` on GearId"],
    ],
    correct: ["a"],
    explanation: "A pair of ordinary DATETIME2 columns is not a system-time period. SQL Server requires generated ROW START / ROW END columns (often HIDDEN) and `PERIOD FOR SYSTEM_TIME`. A PRIMARY KEY is required, not forbidden. Ledger is a different specialized table type." }),
  q({ id: "q-lab01-4", domainId: "d1", moduleId: "m01", lessonId: "l0106", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "Voyages are partitioned by `VoyageDate`. Finance insists that **the entire calendar day** `2026-01-01` belongs in Q1 2026 (the partition immediately after the first boundary), not in the leftover 2025 partition.\n\nGiven this function, where does `'2026-01-01'` land, and is the function the right choice?",
    code: `CREATE PARTITION FUNCTION PF_VoyageDate (DATE)
  AS RANGE RIGHT FOR VALUES ('2026-01-01', '2026-04-01', '2026-07-01', '2026-10-01');`,
    options: [
      ["a", "RANGE RIGHT puts `'2026-01-01'` in the partition to the right of that boundary (Q1 2026). That matches the 'whole day stays together on the right' requirement"],
      ["b", "RANGE RIGHT puts `'2026-01-01'` in the leftmost (2025) partition, so you must switch to RANGE LEFT"],
      ["c", "Boundary values are rejected, so you cannot store voyages on quarter-start dates"],
      ["d", "RANGE RIGHT and RANGE LEFT place the boundary in every partition; pick either"],
    ],
    correct: ["a"],
    explanation: "RANGE RIGHT: each boundary value belongs to the partition on its right. `'2026-01-01'` is therefore in partition 2 (Q1), and all later times that day stay with it because the type is DATE. RANGE LEFT would put the boundary in the left partition — the usual reason date/time keys use RANGE RIGHT." }),
  q({ id: "q-lab01-5", domainId: "d1", moduleId: "m01", lessonId: "l0105", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Harbor Outfitters needs a **shared** integer namespace for `dbo.VoyageLine` and a staging table `dbo.VoyageLineIngest`. Both tables must draw the next id without colliding. Identity columns cannot be shared across tables.\n\nWhich pattern should you use?",
    code: `INSERT INTO dbo.VoyageLine (LineId, VoyageId, GearId, Qty)
VALUES (NEXT VALUE FOR dbo.VoyageLineSeq, @VoyageId, @GearId, @Qty);`,
    options: [
      ["a", "A SEQUENCE object; call `NEXT VALUE FOR` (or a DEFAULT bound to it) from both tables"],
      ["b", "IDENTITY(1,1) on both tables starting at 1; collisions cannot occur"],
      ["c", "`NEWID()` as a DEFAULT on an INT column"],
      ["d", "A computed column `LineId AS VoyageId * 1000 + GearId`"],
    ],
    correct: ["a"],
    explanation: "`IDENTITY` is table-scoped. A SEQUENCE is an independent object, so both tables can call `NEXT VALUE FOR dbo.VoyageLineSeq`. NEWID() is uniqueidentifier, not INT. A formula on VoyageId/GearId is not a monotonic surrogate and will collide." }),
  q({ id: "q-lab01-6", domainId: "d1", moduleId: "m01", lessonId: "l0102", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "You enable system-versioning on `dbo.GearPrice`. Apps must keep using `SELECT … FROM dbo.GearPrice` without listing period columns, and you must query prices as of `'2025-12-01'`.\n\nWhich **two** are required? Each correct answer presents part of the solution.",
    options: [
      ["a", "Mark the period columns `HIDDEN` so ordinary SELECT * / SELECT lists omit them"],
      ["b", "Query with `FOR SYSTEM_TIME AS OF '2025-12-01'` (or BETWEEN / CONTAINED IN / ALL)"],
      ["c", "Replace the PRIMARY KEY with a columnstore index; temporal tables require it"],
      ["d", "Grant CONTROL SERVER to every reporting login so history is visible"],
    ],
    correct: ["a", "b"],
    explanation: "HIDDEN period columns keep the current-table contract stable. Historical lookup is `FOR SYSTEM_TIME`. Columnstore is optional, not required for temporal. CONTROL SERVER is unrelated and violates least privilege." }),
];
