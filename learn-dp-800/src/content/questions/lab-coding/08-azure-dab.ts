import { q } from "../_build";

const T = ["lab-coding", "lab-08"];

export const LAB08 = [
  q({ id: "q-lab08-1", domainId: "d2", moduleId: "m08", lessonId: "l0801", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "You have an empty Data API builder config. You must expose `dbo.Gear` as a REST/GraphQL entity. Anonymous clients may **read** only — no create/update/delete. The connection string must not be committed.\n\nWhich CLI sequence matches that design?",
    code: `dab init --database-type mssql --connection-string "@env('DATABASE_CONNECTION_STRING')"
dab add Gear --source dbo.Gear --permissions "anonymous:read"
dab start`,
    options: [
      ["a", "`init` creates the config with `@env` for the secret; `add` registers the entity and permission; `start` hosts it"],
      ["b", "`dab add` creates the config file; `init` is only for PostgreSQL"],
      ["c", "`anonymous:read` also grants write; use `anonymous:*` for read-only"],
      ["d", "You must hard-code the sa password in dab-config.json or DAB will not start"],
    ],
    correct: ["a"],
    explanation: "`dab init` writes dab-config.json; `dab add` registers an entity; permissions are role:action (`anonymous:read` is read-only). `@env('…')` keeps secrets out of git. `anonymous:*` would be more privilege, not less." }),
  q({ id: "q-lab08-2", domainId: "d2", moduleId: "m08", lessonId: "l0802", difficulty: "challenge", type: "multi",
    tags: T,
    prompt: "You expose view `dbo.vCrewVoyages` through DAB. The view has no primary-key metadata. GraphQL clients must query it, not mutate it. REST field `id` should map from `CrewId` without renaming the column.\n\nWhich **two** configuration choices are required? Each correct answer presents part of the solution.",
    options: [
      ["a", "Set `key-fields` (e.g. CrewId) because DAB cannot infer a PK from a view"],
      ["b", "Restrict the entity to query (GraphQL `operation: query`) / omit write permissions"],
      ["c", "Enable writes automatically; views with key-fields are always updatable through DAB"],
      ["d", "Issue `ALTER VIEW … RENAME COLUMN CrewId TO id` so DAB mappings are unnecessary"],
    ],
    correct: ["a", "b"],
    explanation: "Tables expose PK metadata; views do not — you declare `key-fields`. Views are typically query-only. Mappings (`CrewId` → `id`) change the API shape without renaming SQL. Making the view writable is not implied by key-fields." }),
  q({ id: "q-lab08-3", domainId: "d2", moduleId: "m08", lessonId: "l0802", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "A DAB mappings block contains `\"GearId\": \"id\"`. A REST client GET returns JSON.\n\nWhat does the client see, and what happens in SQL Server?",
    options: [
      ["a", "JSON property `id` mapped from column `GearId`; the physical column name is unchanged"],
      ["b", "Both `GearId` and `id` are required in every payload or DAB returns 500"],
      ["c", "SQL Server renames the column; existing procedures that reference GearId break"],
      ["d", "The column is dropped from the API and from the table"],
    ],
    correct: ["a"],
    explanation: "Mappings are an API façade. GraphQL/REST expose `id`; T-SQL still uses GearId. That is how you keep REST naming conventions without a table rewrite." }),
  q({ id: "q-lab08-4", domainId: "d2", moduleId: "m08", lessonId: "l0801", difficulty: "advanced", type: "debugging",
    tags: T,
    prompt: "`dab start` fails to open a connection. Config has `\"connection-string\": \"@env('DATABASE_CONNECTION_STRING')\"`. The JSON file is valid and `dab add` succeeded yesterday.\n\nWhat is the likely miss?",
    options: [
      ["a", "`DATABASE_CONNECTION_STRING` is unset in **this** shell / container, so `@env` resolves empty — do not paste the sa password into dab-config.json to 'fix' it"],
      ["b", "DAB cannot use environment variables; `@env` is documentation only"],
      ["c", "The REST path `/api` is illegal in DAB"],
      ["d", "You must enable Query Store on the DAB host machine"],
    ],
    correct: ["a"],
    explanation: "`@env('NAME')` is resolved at runtime. A missing variable is the boring, correct failure. Committing secrets is the wrong fix. Query Store and `/api` are unrelated." }),
];
