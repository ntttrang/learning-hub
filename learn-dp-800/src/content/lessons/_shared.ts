import type { Lesson, SourceReference } from "@/lib/types";

const TODAY = "2026-07-28";

export function ref(title: string, url: string, publisher = "Microsoft Learn"): SourceReference {
  return { title, url, publisher, accessed: TODAY };
}

/** Common official references reused across lessons. */
export const REFS = {
  studyGuide: ref(
    "Study guide for Exam DP-800",
    "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-800",
  ),
  sqlDocs: ref("SQL Server documentation", "https://learn.microsoft.com/en-us/sql/"),
  tsql: ref("Transact-SQL reference", "https://learn.microsoft.com/en-us/sql/t-sql/language-reference"),
  postgres: ref("PostgreSQL documentation", "https://www.postgresql.org/docs/current/", "PostgreSQL"),
  mysql: ref("MySQL reference manual", "https://dev.mysql.com/doc/refman/9.0/en/", "MySQL"),
  oracle: ref("Oracle Database SQL Language Reference", "https://docs.oracle.com/en/database/oracle/oracle-database/", "Oracle"),
};

/**
 * Build a lesson from a partial definition, filling in the boilerplate so
 * scaffolded lessons stay concise while remaining fully typed.
 */
export function defineLesson(
  input: Omit<Lesson, "sections" | "knowledgeCheck" | "references"> &
    Partial<Pick<Lesson, "sections" | "knowledgeCheck" | "references">>,
): Lesson {
  return {
    ...input,
    sections: input.sections ?? {},
    knowledgeCheck: input.knowledgeCheck ?? { questionIds: [] },
    references: input.references ?? [REFS.studyGuide, REFS.sqlDocs],
  };
}
