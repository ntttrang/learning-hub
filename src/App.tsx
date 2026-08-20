import AppShell from './shell/AppShell';
import HubHome from './shell/HubHome';
import SubjectWorkspace from './shell/SubjectWorkspace';
import { useHashRoute } from './shell/router';

export default function App() {
  const route = useHashRoute();

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
