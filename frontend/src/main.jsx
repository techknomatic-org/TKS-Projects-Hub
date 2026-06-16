import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App.jsx';
import './index.css';

// MSAL (Microsoft Authentication Library) Configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '00000000-0000-0000-0000-000000000000', // Placeholder client ID if empty
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Stores auth state safely for the tab session
    storeAuthStateInCookie: false,
  }
};

// Instantiate MSAL client
const msalInstance = new PublicClientApplication(msalConfig);

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
