import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppNav } from './components/AppNav';
import { ThemeToggle } from './components/ThemeToggle';
import { AppProvider } from './lib/AppContext';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Lab } from './pages/Lab';
import { Practice } from './pages/Practice';
import { Framework } from './pages/Framework';
import { KnowledgeCheck } from './pages/KnowledgeCheck';
import { Compare } from './pages/Compare';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="app-shell">
          <AppNav />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/lab" element={<Lab />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/framework" element={<Framework />} />
              <Route path="/quiz" element={<KnowledgeCheck />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ThemeToggle />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
