import { q } from "../_build";

const T = ["lab-coding", "lab-04"];

export const LAB04 = [
  q({ id: "q-lab04-1", domainId: "d1", moduleId: "m04", lessonId: "l0402", difficulty: "advanced", type: "multi",
    tags: T,
    prompt: "Your team's Copilot instruction file requires: schema-qualify every object, no `SELECT *`, no comma joins, parameterized predicates, `SET NOCOUNT ON` in procedures.\n\nWhich **two** snippets violate those rules? Each correct answer presents part of the solution.",
    options: [
      ["a", "`CREATE PROC usp_GetGear @Name nvarchar(100) AS SELECT * FROM Gear WHERE Name = @Name`"],
      ["b", "`SELECT v.VoyageId, l.GearId FROM dbo.Voyage v, dbo.VoyageLine l WHERE v.VoyageId = l.VoyageId`"],
      ["c", "`CREATE PROC dbo.usp_GetGear @GearId INT AS BEGIN SET NOCOUNT ON; SELECT Name FROM dbo.Gear WHERE GearId = @GearId; END`"],
      ["d", "`CREATE VIEW dbo.vw_ActiveCrew AS SELECT CrewId, Handle FROM dbo.Crew WHERE Region IS NOT NULL`"],
    ],
    correct: ["a", "b"],
    explanation: "A drops the schema prefix, uses SELECT *, and skips SET NOCOUNT ON. B is a comma join. C and D follow the instruction file. Copilot instruction files exist so the model does not emit A/B." }),
  q({ id: "q-lab04-2", domainId: "d1", moduleId: "m04", lessonId: "l0402", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Harbor Outfitters wants every Copilot chat in this repo to follow the same T-SQL standards without pasting the rules into each prompt.\n\nWhere should the durable instructions live, and what is the security implication of Copilot suggesting SQL?",
    options: [
      ["a", "`.github/copilot-instructions.md` in the repo; treat generated SQL as untrusted — it can still emit injection, over-privileged objects, or secrets"],
      ["b", "A table `dbo.CopilotRules`; Copilot always executes suggested SQL as `sa`"],
      ["c", "SQL Server Agent job comments; generated SQL is guaranteed safe if the model is GPT-4"],
      ["d", "The `sa` login's default database; MCP then disables authentication for speed"],
    ],
    correct: ["a"],
    explanation: "GitHub Copilot reads `.github/copilot-instructions.md` (and path variants) from the workspace. DP-800 still expects you to interpret the **security impact**: the model is not an authorization boundary. Never auto-run generated SQL as a privileged principal." }),
  q({ id: "q-lab04-3", domainId: "d1", moduleId: "m04", lessonId: "l0403", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "You connect Copilot to a Microsoft SQL Server MCP server so the chat can list schemas and run read queries against Harbor's Azure SQL database. The endpoint is reachable from the public internet today. You must follow least privilege and avoid stored passwords.\n\nWhat should you do?",
    options: [
      ["a", "Restrict network access, authenticate with Managed Identity, grant the identity only the tools/data it needs, and log tool calls"],
      ["b", "Expose the MCP port publicly and use the `sa` password in the Copilot settings JSON committed to git"],
      ["c", "Disable authentication on the MCP server because Copilot already logged into GitHub"],
      ["d", "Grant the MCP identity CONTROL SERVER so Copilot can create logins when the prompt asks"],
    ],
    correct: ["a"],
    explanation: "MCP endpoints are a new attack surface on the DP-800 outline. Passwordless (Managed Identity), least privilege, private networking, and audit/logging are the controls. GitHub auth does not authenticate SQL. CONTROL SERVER is the opposite of least privilege." }),
  q({ id: "q-lab04-4", domainId: "d1", moduleId: "m04", lessonId: "l0401", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "Copilot emitted the following query for a 'gear sold after 2026-01-01' report. It returns the right rows in a tiny database. You must fix it before it ships.\n\nWhich change is required by the instruction file and by production hygiene?",
    code: `SELECT *
FROM dbo.Voyage v, dbo.VoyageLine l, dbo.Gear g
WHERE v.VoyageId = l.VoyageId
  AND l.GearId = g.GearId
  AND v.VoyageDate > '2026-01-01';`,
    options: [
      ["a", "Replace `SELECT *` with the columns the report needs and rewrite comma joins as ANSI `INNER JOIN … ON`"],
      ["b", "Add `WITH (NOLOCK)` on every table so Copilot queries never block"],
      ["c", "Wrap the batch in `sp_executesql` with concatenated `@Name` from the chat"],
      ["d", "Drop the WHERE clause; JOIN already implies the date filter"],
    ],
    correct: ["a"],
    explanation: "The AI-tools lab's whole point is reviewing Copilot output: SELECT * and comma joins are the instruction-file violations. NOLOCK trades correctness for fewer locks. Concatenating chat text into dynamic SQL is injection. JOIN does not replace a date predicate." }),
];
