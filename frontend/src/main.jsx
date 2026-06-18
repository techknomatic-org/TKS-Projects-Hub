import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './services/msalService.js';
import App from './App.jsx';
import './index.css';

// Initialize MSAL and render the app once ready
msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MsalProvider>
    </React.StrictMode>
  );
}).catch(err => {
  console.error('MSAL initialization failed:', err);
});
