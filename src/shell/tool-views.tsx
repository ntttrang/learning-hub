import { PackageOpen } from 'lucide-react';
import type { ComponentType } from 'react';
import type { SubjectContent, SubjectIndex } from '../content/registry';
import { Compare } from '../ui/Compare';
import { ExamEngine } from '../ui/ExamEngine';
import { ExamIndex } from '../ui/ExamIndex';
import { ExamReview } from '../ui/ExamReview';
import { EmptyState } from '../ui/EmptyState';
import { LabIndex } from '../ui/LabIndex';
import { LabViewer } from '../ui/LabViewer';
import { LearnIndex } from '../ui/LearnIndex';
import { LessonViewer } from '../ui/LessonViewer';
import { Notes } from '../ui/Notes';
import { PracticeIndex } from '../ui/PracticeIndex';
import { QuizRunner } from '../ui/QuizRunner';
import { TOOL_REGISTRY } from '../sdk/registry/tools';
import type { ToolId } from '../sdk/types';

/**
 * Shell-side map from a mode (tool id) to its view component. The tool
 * registry stays metadata-only — components attach here, so the SDK never
 * imports app-level views. Content-backed modes resolve their view from the
 * route's item id; modes without a viewer yet render an honest placeholder
 * describing what the mode will do.
 */

export interface ToolViewProps {
  subjectId: string;
  content: SubjectContent;
  index: SubjectIndex;
  /** Route item id (lesson slug, exam id, …) when present. */
  id?: string;
  /** Route rest segments when present. */
  rest?: string[];
}

function toolPlaceholder(toolId: ToolId): ComponentType<ToolViewProps> {
  const meta = TOOL_REGISTRY[toolId];
  function ToolPlaceholder() {
    return (
      <EmptyState
        icon={PackageOpen}
        title={`${meta.label} is on its way`}
        message={`${meta.description} The content is installed — this mode's viewer arrives in an upcoming update.`}
      />
    );
  }
  return ToolPlaceholder;
}

/** Practice: scope index at the tab root, a shuffled run under `/:scopeId`. */
function PracticeView({ subjectId, content, index, id }: ToolViewProps) {
  if (!id) return <PracticeIndex subjectId={subjectId} content={content} index={index} />;

  const domain = index.getDomain(id);
  const module = domain ? undefined : index.getModule(id);
  const questions = domain
    ? index.questionsForDomain(id)
    : module
      ? index.questionsForModule(id)
      : id === 'all'
        ? content.questions
        : [];
  const title = domain?.title ?? module?.title ?? 'Everything, shuffled';

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No questions in this scope"
        message={`Nothing practiceable under "${id}" — pick a domain card from the practice index.`}
      />
    );
  }

  return (
    <QuizRunner
      key={`${subjectId}:${id}`} // a route hop between scopes starts a fresh run
      subjectId={subjectId}
      scope={id}
      questions={questions}
      title={title}
      index={index}
    />
  );
}

/** Learn: index at the tab root, a lesson viewer under /:slugOrId. */
function LearnView({ subjectId, content, index, id }: ToolViewProps) {
  if (!id) return <LearnIndex subjectId={subjectId} content={content} index={index} />;
  return <LessonViewer subjectId={subjectId} content={content} index={index} id={id} />;
}

/** Labs: index at the tab root, a lab viewer under /:labId. */
function LabsView({ subjectId, content, index, id }: ToolViewProps) {
  if (!id) return <LabIndex subjectId={subjectId} content={content} index={index} />;
  return <LabViewer subjectId={subjectId} content={content} index={index} id={id} />;
}

/** Compare: picker at the tab root when several ship; viewer under /:cmpId. */
function CompareView({ subjectId, content, id }: ToolViewProps) {
  return <Compare subjectId={subjectId} content={content} id={id} />;
}

/**
 * Exams: index at the tab root, the sitting engine under /:examId, and one
 * attempt's review under /:examId/review/:attemptIndex.
 */
function ExamsView({ subjectId, content, index, id, rest }: ToolViewProps) {
  if (!id) return <ExamIndex subjectId={subjectId} content={content} index={index} />;

  const [verb, arg] = rest ?? [];
  if (verb === 'review') {
    return (
      <ExamReview
        subjectId={subjectId}
        content={content}
        index={index}
        examId={id}
        attemptIndex={arg}
      />
    );
  }
  return (
    <ExamEngine
      key={`${subjectId}:${id}`} // a route hop between exams starts fresh
      subjectId={subjectId}
      content={content}
      index={index}
      examId={id}
    />
  );
}

export const TOOL_VIEWS: Record<ToolId, ComponentType<ToolViewProps>> = {
  learn: LearnView,
  labs: LabsView,
  practice: PracticeView,
  exams: ExamsView,
  compare: CompareView,
  notes: Notes,
  revision: toolPlaceholder('revision'),
};
