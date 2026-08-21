import type { ReactNode } from 'react';
import type { Section } from '../../router';
import { Header } from './Header';

interface AppShellProps {
  active: Section;
  children: ReactNode;
}

/** Site chrome: header, main content, footer. */
export function AppShell({ active, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Header active={active} />

      <main className="app-main">
        <div className="container">{children}</div>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <span className="caption">Captain Corgi Hub · learning by shipping</span>
        </div>
      </footer>
    </div>
  );
}
