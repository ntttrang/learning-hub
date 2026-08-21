import { q } from "../_build";

const T = ["lab-coding", "lab-07"];

export const LAB07 = [
  q({ id: "q-lab07-1", domainId: "d2", moduleId: "m07", lessonId: "l0701", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Harbor Outfitters wants **declarative**, source-controlled schema deployments: the target database should be made to match a model, not by running ordered hand-written migration scripts as the source of truth. Production restores of last night's `.bak` are not an acceptable deploy path.\n\nWhich approach fits?",
    options: [
      ["a", "An SDK-style SQL Database Project that builds a dacpac; SqlPackage / the pipeline publishes by diffing the model against the target"],
      ["b", "A folder of one-off ALTER scripts run from SSMS in whatever order a DBA remembers"],
      ["c", "Nightly RESTORE from production.bak onto every environment"],
      ["d", "`BULK INSERT` of CREATE TABLE statements into model"],
    ],
    correct: ["a"],
    explanation: "SQL Database Projects are the DP-800 CI/CD skill: compile a dacpac, publish a diff. Ad-hoc SSMS is drift. Restoring a backup copies data, not a repeatable schema pipeline. BULK INSERT loads data, not a project model." }),
  q({ id: "q-lab07-2", domainId: "d2", moduleId: "m07", lessonId: "l0704", difficulty: "challenge", type: "multi",
    tags: T,
    prompt: "A DBA applied `ALTER TABLE dbo.Gear ADD Notes nvarchar(max)` directly on production. The SDK project in `main` has no `Notes` column. The next pipeline publish must not surprise-drop the column, and you must detect this class of problem earlier.\n\nWhich **two** actions should you take? Each correct answer presents part of the solution.",
    options: [
      ["a", "Detect schema drift (compare dacpac / project to the target) and import or script `Notes` into the project before publish"],
      ["b", "Gate production publishes with branch policies, reviews/approvals, and a publish option that blocks destructive changes until reviewed"],
      ["c", "Delete the GitHub Actions secret so publish cannot run; leave production as the source of truth"],
      ["d", "Set the project TargetPlatform to XML so dacpac publish ignores tables"],
    ],
    correct: ["a", "b"],
    explanation: "Schema drift is target ≠ project. Bring the column into source control (or deliberately drop it). Pipeline controls (PRs, environments, `DropObjectsNotInSource` / publish flags) prevent a silent drop. Removing secrets is not a drift strategy. TargetPlatform XML is nonsense." }),
  q({ id: "q-lab07-3", domainId: "d2", moduleId: "m07", lessonId: "l0703", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "You add `ListPrice` precision in a project `.sql` table file, open a PR, and the build produces a dacpac. Why is that safer than running the ALTER in SSMS on production during lunch?",
    options: [
      ["a", "The change is reviewed in git, built in CI, and publish computes a consistent deployment against the declared model"],
      ["b", "SSMS cannot execute ALTER TABLE on Azure SQL"],
      ["c", "Dacpac publish ignores permissions and CHECK constraints, so it is always faster"],
      ["d", "Projects disable Query Store, which is required after every column change"],
    ],
    correct: ["a"],
    explanation: "CI/CD is repeatability and review. SSMS ALTERs cause drift the next publish may overwrite or fight. Publish does **not** skip permissions/CHECKs as a feature. Query Store is unrelated to whether a column change is in git." }),
  q({ id: "q-lab07-4", domainId: "d2", moduleId: "m07", lessonId: "l0704", difficulty: "advanced", type: "debugging",
    tags: T,
    prompt: "GitHub Actions fails at publish: `Login failed for user`. The workflow maps `secrets.SQL_PUBLISH_CONNECTION` into `SQLPACKAGE_CONNECTION`. Yesterday the same pipeline succeeded.\n\nWhat should you check first?",
    options: [
      ["a", "The secret **name** matches the workflow mapping, the credential is still valid on the target, and the login has publish rights — not Query Store or renaming the dacpac to .zip"],
      ["b", "Whether Query Store is enabled on `master`"],
      ["c", "Whether you hand-renamed the dacpac to `.zip` so SqlPackage will accept it"],
      ["d", "Whether the .sqlproj TargetPlatform is set to XML"],
    ],
    correct: ["a"],
    explanation: "The CI lab's secrets section exists because connection strings rotate and secret names typo. Login failed is authentication/authorization, not Query Store. A dacpac is a zip internally but you do not rename it for SqlPackage. TargetPlatform XML is not a login fix." }),
];
