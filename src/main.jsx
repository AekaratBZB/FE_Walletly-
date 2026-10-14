import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { CookieProvider } from './context/CookieContext';
import { healthApi } from './shared/api';
import './index.css';

// ปลุก BE ให้เร็วที่สุด ก่อน render; AuthProvider จะรอผลจาก promise เดียวกัน
healthApi.warmUp().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <CookieProvider>
          <App />
        </CookieProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);
