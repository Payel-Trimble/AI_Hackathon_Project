import { ModusWcThemeProvider } from '@trimble-oss/moduswebcomponents-react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModusWcThemeProvider
      initialTheme={{
        theme: 'modus-modern',
        mode: prefersDark ? 'dark' : 'light',
      }}
    >
      <App />
    </ModusWcThemeProvider>
  </StrictMode>,
);
