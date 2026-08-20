import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrapTheme } from './engines/theme';
import './styles/tokens.css';
import './styles/theme-toggle.css';
import './styles/app.css';
import './styles/views.css';

// Apply the stored theme before first paint so reloads never flash.
bootstrapTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
