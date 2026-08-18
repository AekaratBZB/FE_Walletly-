import React from 'react';
import { useWallet } from '../context/WalletContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useWallet();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'var(--info)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'var(--success)';
        } else if (toast.type === 'danger') {
          Icon = AlertCircle;
          iconColor = 'var(--danger)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--warning)';
        }

        return (
          <div
            key={toast.id}
            className={`toast ${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <Icon size={20} color={iconColor} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, color: 'var(--text-main)', fontSize: '0.875rem' }}>
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
