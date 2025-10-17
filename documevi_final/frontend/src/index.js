import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Modal from 'react-modal';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import './index.css';

// Configuración de MSAL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const msalConfig = {
  auth: {
    clientId: '06f83521-c16a-4aab-bcee-f33530a8fa27',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: isLocalhost
      ? 'http://localhost:3000'
      : 'https://documevi.appsimevi.co'
  }
};
const msalInstance = new PublicClientApplication(msalConfig);

Modal.setAppElement('#root');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
