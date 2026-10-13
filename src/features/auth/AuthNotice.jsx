import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS = { info: Info, success: CheckCircle2, error: AlertCircle };

export const AuthNotice = ({ type = 'info', message, onClose }) => {
  if (!message) return null;
  const Icon = ICONS[type] || Info;
  return (
    <div className={`auth-notice auth-notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={16} className="auth-notice-icon" aria-hidden="true" />
      <span className="auth-notice-text">{message}</span>
      {onClose && (
        <button type="button" className="auth-notice-close" onClick={onClose} aria-label="ปิด">
          <X size={14} />
        </button>
      )}
    </div>
  );
};
