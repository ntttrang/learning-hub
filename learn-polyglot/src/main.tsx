import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initThemeEarly } from './components/ThemeToggle';
import './styles/app.css';

initThemeEarly();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
