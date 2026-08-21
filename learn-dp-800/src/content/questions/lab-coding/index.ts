import type { Question } from "@/lib/types";
import { LAB01 } from "./01-database-objects";
import { LAB02 } from "./02-programmability";
import { LAB03 } from "./03-advanced-tsql";
import { LAB04 } from "./04-ai-tools";
import { LAB05 } from "./05-security";
import { LAB06 } from "./06-performance";
import { LAB07 } from "./07-cicd";
import { LAB08 } from "./08-azure-dab";
import { LAB09 } from "./09-embeddings";
import { LAB10 } from "./10-intelligent-search";
import { LAB11 } from "./11-rag";

const LAB_URL =
  "https://github.com/MicrosoftLearning/mslearn-sql-developer/blob/main/Instructions/Labs";

export interface LabCodingSet {
  id: string;
  moduleId: string;
  domainId: string;
  labNumber: number;
  title: string;
  sourceUrl: string;
  questionIds: string[];
}

function set(
  id: string,
  moduleId: string,
  domainId: string,
  labNumber: number,
  title: string,
  file: string,
  questions: Question[],
): LabCodingSet {
  return {
    id,
    moduleId,
    domainId,
    labNumber,
    title,
    sourceUrl: `${LAB_URL}/${file}`,
    questionIds: questions.map((q) => q.id),
  };
}

export const LAB_CODING_QUESTIONS: Question[] = [
  ...LAB01,
  ...LAB02,
  ...LAB03,
  ...LAB04,
  ...LAB05,
  ...LAB06,
  ...LAB07,
  ...LAB08,
  ...LAB09,
  ...LAB10,
  ...LAB11,
];

export const LAB_CODING_SETS: LabCodingSet[] = [
  set("lab-01", "m01", "d1", 1, "Database objects", "01-create-database-objects.md", LAB01),
  set("lab-02", "m02", "d1", 2, "Programmability objects", "02-implement-programmability-objects.md", LAB02),
  set("lab-03", "m03", "d1", 3, "Advanced T-SQL", "03-write-advanced-tsql-code.md", LAB03),
  set("lab-04", "m04", "d1", 4, "AI-assisted tools", "04-design-implement-sql-solutions-ai-assisted-tools.md", LAB04),
  set("lab-05", "m05", "d2", 5, "Security and compliance", "05-implement-security-compliance.md", LAB05),
  set("lab-06", "m06", "d2", 6, "Query performance", "06-optimize-database-performance.md", LAB06),
  set("lab-07", "m07", "d2", 7, "CI/CD database projects", "07-implement-cicd-sql-database-projects.md", LAB07),
  set("lab-08", "m08", "d2", 8, "Data API Builder", "08-integrate-sql-solutions-azure-services.md", LAB08),
  set("lab-09", "m09", "d3", 9, "Embeddings", "09-generate-update-embedings-sql.md", LAB09),
  set("lab-10", "m10", "d3", 10, "Intelligent search", "10-implement-intelligent-search.md", LAB10),
  set("lab-11", "m11", "d3", 11, "RAG procedures", "11-implement-rag-solutions.md", LAB11),
];
