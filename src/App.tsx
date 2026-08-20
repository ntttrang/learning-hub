import { useEffect } from 'react';
import { importLegacyGhProgress } from './engines/migrate-gh-progress';
import { useSubjectDataStore } from './engines/subject-store';
import AppShell from './shell/AppShell';
import HubHome from './shell/HubHome';
import SubjectWorkspace from './shell/SubjectWorkspace';
import { useHashRoute } from './shell/router';

export default function App() {
  const route = useHashRoute();

  // One-shot legacy progress import (learn-gh-200 → hub), strictly after the
  // persisted store rehydrated — never at store-create time, where the
  // rehydration trap documented in engines/store.ts lives. The sibling guard
  // key plus deterministic attempt ids make this idempotent across reloads.
  useEffect(() => {
    const run = () => {
      importLegacyGhProgress();
    };
    if (useSubjectDataStore.persist.hasHydrated()) {
      run();
      return;
    }
    return useSubjectDataStore.persist.onFinishHydration(run);
  }, []);

  return (
    <AppShell route={route}>
      {route.view === 'subject' ? (
        <SubjectWorkspace
          subjectId={route.subjectId}
          mode={route.mode}
          id={route.id}
          rest={route.rest}
        />
      ) : (
        <HubHome />
      )}
    </AppShell>
  );
}
