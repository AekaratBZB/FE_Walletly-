import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { CookieProvider } from './context/CookieContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WalletProvider>
      <AuthProvider>
        <CookieProvider>
          <App />
        </CookieProvider>
      </AuthProvider>
    </WalletProvider>
  </React.StrictMode>
);
