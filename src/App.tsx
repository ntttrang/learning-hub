import { useEffect } from 'react';
import { importGh600Progress } from './engines/migrate-gh600-progress';
import { importLegacyGhProgress } from './engines/migrate-gh-progress';
import { useSubjectDataStore } from './engines/subject-store';
import AppShell from './shell/AppShell';
import HubHome from './shell/HubHome';
import SubjectWorkspace from './shell/SubjectWorkspace';
import { useHashRoute } from './shell/router';
// DP-800 block renderers register on import. This is the authoritative site:
// the dev app (via main.tsx) and every App-rendering test inherit the
// registration from here; content-check.test.ts imports the module directly
// because its graph excludes the app entry.
import './content/dp-800/renderers';

export default function App() {
  const route = useHashRoute();

  // One-shot legacy progress imports (learn-gh-200 + the gh-600 study
  // companion → hub), strictly after the persisted store rehydrated — never
  // at store-create time, where the rehydration trap documented in
  // engines/store.ts lives. Sibling guard keys plus deterministic ids make
  // each import idempotent across reloads.
  useEffect(() => {
    const run = () => {
      importLegacyGhProgress();
      importGh600Progress();
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
