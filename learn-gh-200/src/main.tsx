import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrapTheme } from './hooks/useTheme';
import './styles/tokens.css';
import './styles/app.css';

// Apply the stored theme before first paint so reloads never flash.
bootstrapTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
