import { q } from "../_build";

const T = ["lab-coding", "lab-05"];

export const LAB05 = [
  q({ id: "q-lab05-1", domainId: "d2", moduleId: "m05", lessonId: "l0501", difficulty: "challenge", type: "codeReading",
    tags: T,
    prompt: "Regulators require that **cloud operators and DBAs cannot read TaxId plaintext**, including while a query executes on the server. Support still needs equality lookups on TaxId. Display-only masking for a reporting login is **not** sufficient.\n\nWhich technology set should you implement?",
    options: [
      ["a", "Always Encrypted with secure enclaves (keys stay client-side; enclaves enable equality/range in a trusted environment)"],
      ["b", "Transparent Data Encryption (TDE) only"],
      ["c", "Dynamic Data Masking on TaxId plus GRANT SELECT to the DBA group"],
      ["d", "A FILTER predicate on TaxId"],
    ],
    correct: ["a"],
    explanation: "TDE protects files/backups, not in-memory query results for a DBA. DDM is cosmetic — privileged users and the engine still see plaintext. RLS filters rows, it does not encrypt a column. Always Encrypted keeps keys on the client; secure enclaves are what make server-side equality possible without exposing plaintext to the service." }),
  q({ id: "q-lab05-2", domainId: "d2", moduleId: "m05", lessonId: "l0503", difficulty: "challenge", type: "multi",
    tags: T,
    prompt: "Pacific clerks must see **only** Pacific voyages and must **not** insert or update an Atlantic row. Region is taken from `SESSION_CONTEXT` and must not be spoofable from a SET statement in the same session after login.\n\nWhich **two** are required? Each correct answer presents part of the solution.",
    options: [
      ["a", "An RLS security policy with both a FILTER predicate (reads) and a BLOCK predicate (writes)"],
      ["b", "Store tenant region in read-only session context (`sp_set_session_context … @read_only = 1`) at session start"],
      ["c", "Dynamic Data Masking on `Voyage.Region` so Atlantic values display as `XXX`"],
      ["d", "A CHECK constraint `Region = USER_NAME()` on dbo.Voyage"],
    ],
    correct: ["a", "b"],
    explanation: "FILTER hides rows on SELECT; BLOCK rejects writes that would violate the predicate — both are on the DP-800 RLS skill. Read-only session context prevents `sp_set_session_context` spoofing after you set it. DDM does not stop Atlantic inserts. USER_NAME() is not the tenant region and a CHECK would break legitimate multi-region tables." }),
  q({ id: "q-lab05-3", domainId: "d2", moduleId: "m05", lessonId: "l0502", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "Support logins should SELECT from `dbo.Crew` but see TaxId as `XXX-XX-1234` (last four visible) and Email in the built-in email mask. They have SELECT, not UNMASK. Privileged auditors must still see plaintext.\n\nWhich statements are true of the following masks?",
    code: `ALTER TABLE dbo.Crew
  ALTER COLUMN TaxId ADD MASKED WITH (FUNCTION = 'partial(0, "XXX-XX-", 4)');
ALTER TABLE dbo.Crew
  ALTER COLUMN Email ADD MASKED WITH (FUNCTION = 'email()');`,
    options: [
      ["a", "Support SELECT succeeds with masked values; principals with UNMASK (or dbo) see plaintext — DDM is not encryption"],
      ["b", "Support SELECT fails with permission denied until UNMASK is granted"],
      ["c", "`partial` and `email` encrypt the column with a service-managed key (Always Encrypted)"],
      ["d", "Masking applies only to backups, never to SELECT"],
    ],
    correct: ["a"],
    explanation: "DDM is display-time obfuscation. SELECT is allowed; UNMASK (or high privilege) bypasses the mask. It does not encrypt data at rest or in memory for the engine/DBA — that is why question 1 needed Always Encrypted." }),
  q({ id: "q-lab05-4", domainId: "d2", moduleId: "m05", lessonId: "l0503", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "You create this RLS predicate. Pacific clerks still see every region's voyages.\n\nWhy is the policy inert, and what else should you fix before production?",
    code: `CREATE FUNCTION dbo.fn_RegionFilter(@Region nvarchar(20))
RETURNS TABLE
AS
RETURN SELECT 1 AS AccessGranted
       WHERE @Region = CONVERT(nvarchar(20), SESSION_CONTEXT(N'region'));

CREATE SECURITY POLICY dbo.VoyageRegionPolicy
ADD FILTER PREDICATE dbo.fn_RegionFilter(Region)
    ON dbo.Voyage
WITH (STATE = OFF);`,
    options: [
      ["a", "`STATE = OFF` disables enforcement; turn `STATE = ON`. Prefer `WITH SCHEMABINDING` on the inline predicate function"],
      ["b", "Filter predicates cannot read SESSION_CONTEXT, so RLS can never be tenant-aware"],
      ["c", "The function must live in tempdb or policies are ignored"],
      ["d", "You must use a scalar `bit` function; table-valued predicates are illegal"],
    ],
    correct: ["a"],
    explanation: "`WITH (STATE = OFF)` creates the object but does not filter. `ALTER SECURITY POLICY … WITH (STATE = ON)` (or create with ON). Predicate functions are inline TVFs (`SELECT 1 WHERE …`); a row present means visible. SCHEMABINDING is required/best practice for RLS predicates. SESSION_CONTEXT is the usual tenant key." }),
  q({ id: "q-lab05-5", domainId: "d2", moduleId: "m05", lessonId: "l0505", difficulty: "advanced", type: "codeReading",
    tags: T,
    prompt: "A RAG stored procedure will call Azure OpenAI via `sp_invoke_external_rest_endpoint`. You must not store API keys in T-SQL or in a table. The same identity should be used from Azure SQL.\n\nWhich authentication should you configure?",
    options: [
      ["a", "A DATABASE SCOPED CREDENTIAL backed by Managed Identity (passwordless)"],
      ["b", "Hard-code the OpenAI key in the procedure body and GRANT EXECUTE to public"],
      ["c", "Anonymous access to the model deployment because the database is in Azure"],
      ["d", "SQL authentication with the `sa` password in the REST URL query string"],
    ],
    correct: ["a"],
    explanation: "DP-800 explicitly calls out securing model endpoints with Managed Identity. Secrets in T-SQL, sa in URLs, and anonymous model access fail the skill. Pair the credential with the external REST / external model object." }),
  q({ id: "q-lab05-6", domainId: "d2", moduleId: "m05", lessonId: "l0503", difficulty: "challenge", type: "debugging",
    tags: T,
    prompt: "Tenants share `dbo.Voyage`. A developer used `USER_NAME()` as the RLS predicate against `Region`. Pacific clerk `ada@harbor` has SESSION_CONTEXT region `PAC` but sees **zero** rows, even though Pacific voyages exist.\n\nWhat is the bug?",
    code: `CREATE FUNCTION Security.fn_RegionFilter(@Region nvarchar(20))
RETURNS TABLE WITH SCHEMABINDING
AS
RETURN SELECT 1 AS AccessGranted WHERE @Region = USER_NAME();`,
    options: [
      ["a", "`USER_NAME()` is the database principal (`ada@harbor`), not `PAC`. Compare `@Region` to read-only `SESSION_CONTEXT(N'region')` (or a security table keyed by user)"],
      ["b", "SCHEMABINDING disables RLS on user tables"],
      ["c", "FILTER predicates cannot live in a `Security` schema"],
      ["d", "You must add `BLOCK PREDICATE` or SELECT always returns empty"],
    ],
    correct: ["a"],
    explanation: "This is the exam-style 'almost right RLS' trap. USER_NAME() / SUSER_SNAME() are login/user names. Tenant *region* belongs in session context (set at connect by the app) or a mapping table. SCHEMABINDING is required, not the bug. BLOCK is for writes, not empty reads." }),
];
