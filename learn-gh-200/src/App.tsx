import { useHashRoute } from './router';
import { AppShell } from './components/shell/AppShell';
import { Home } from './sections/Home';
import { LearnIndex } from './components/learn/LearnIndex';
import { LessonView } from './components/learn/LessonView';
import { LabIndex } from './components/lab/LabIndex';
import { LabView } from './components/lab/LabView';
import { PracticeIndex } from './components/practice/PracticeIndex';
import { QuizRunner } from './components/practice/QuizRunner';
import { CompareIndex } from './components/compare/CompareIndex';
import { ExamIndex } from './components/exams/ExamIndex';
import { ExamReview } from './components/exams/ExamReview';
import { ExamRunner } from './components/exams/ExamRunner';

/**
 * Root component: one switch over the parsed hash route. Learn, Lab,
 * Practice, Mock exams, and Compare render real content. Exam routes:
 * `#/exams` (index), `#/exams/:id` or `…/run` (the sitting, which resumes
 * an in-flight attempt), `…/review/:attemptIndex` (a past paper).
 */
export default function App() {
  const route = useHashRoute();
  const examView = route.rest?.[0];

  return (
    <AppShell active={route.section}>
      {route.section === 'home' && <Home />}
      {route.section === 'learn' &&
        (route.id ? <LessonView domainId={route.id} /> : <LearnIndex />)}
      {route.section === 'lab' &&
        (route.id ? <LabView labId={route.id} /> : <LabIndex />)}
      {route.section === 'practice' &&
        (route.id ? <QuizRunner domainId={route.id} /> : <PracticeIndex />)}
      {route.section === 'exams' &&
        (!route.id ? (
          <ExamIndex />
        ) : examView === 'review' && route.rest?.[1] !== undefined ? (
          <ExamReview examId={route.id} attemptIndex={Number(route.rest[1])} />
        ) : (
          <ExamRunner key={route.id} examId={route.id} />
        ))}
      {route.section === 'compare' && <CompareIndex />}
    </AppShell>
  );
}
