import React from 'react';
import { useCookieConsent } from '../../context/CookieContext';
import { Settings } from 'lucide-react';
import './cookie.css';

export const PersistentCookieButton = () => {
  const { hasDecided, setIsPreferencesOpen } = useCookieConsent();

  // Show only after the user has made an initial choice
  if (!hasDecided) {
    return null;
  }

  return (
    <button
      type="button"
      className="cookie-floating-btn"
      onClick={() => setIsPreferencesOpen(true)}
      title="คลิกเพื่อจัดการการตั้งค่าคุกกี้และความเป็นส่วนตัว (PDPA)"
      aria-label="ตั้งค่าคุกกี้"
    >
      <span aria-hidden="true">🍪</span>
      <span>ตั้งค่าคุกกี้</span>
    </button>
  );
};
