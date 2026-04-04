import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateContext';
import { ToastProvider } from './context/ToastContext';
import App from './App.jsx';
import './index.css';

const basename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppStateProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppStateProvider>
    </BrowserRouter>
  </StrictMode>
);
