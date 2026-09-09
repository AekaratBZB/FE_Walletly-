import React from 'react';
import { useCookieConsent } from '../../context/CookieContext';
import { useWallet } from '../../context/WalletContext';
import { ShieldCheck, Settings, Check, X } from 'lucide-react';
import './cookie.css';

export const CookieConsentBanner = () => {
  const {
    hasDecided,
    acceptAll,
    rejectNonEssential,
    setIsPreferencesOpen,
    setIsPolicyOpen
  } = useCookieConsent();
  const { addToast } = useWallet();

  // If the user has already made a decision, hide the banner
  if (hasDecided) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAll();
    addToast('ยินยอมการใช้งานคุกกี้ทั้งหมดเรียบร้อยแล้ว', 'success');
  };

  const handleRejectNonEssential = () => {
    rejectNonEssential();
    addToast('ปฏิเสธคุกกี้ที่ไม่จำเป็น (เปิดเฉพาะคุกกี้ที่จำเป็นต่อระบบ)', 'info');
  };

  return (
    <div className="cookie-banner-wrapper" role="region" aria-label="Cookie Consent Banner">
      <div className="cookie-banner-card">
        {/* Top Header with Icon, Title, and Close Button */}
        <div className="cookie-banner-header">
          <div className="cookie-banner-header-left">
            <span className="cookie-icon-mini" aria-hidden="true">🍪</span>
            <h4 className="cookie-banner-title">การใช้งานคุกกี้ & ความเป็นส่วนตัว</h4>
          </div>
          <button
            type="button"
            className="cookie-banner-close-btn"
            onClick={handleRejectNonEssential}
            title="ปฏิเสธคุกกี้ที่ไม่จำเป็นและปิด"
            aria-label="ปิด"
          >
            <X size={15} />
          </button>
        </div>

        {/* Concise Description */}
        <p className="cookie-banner-desc">
          เราใช้คุกกี้ที่จำเป็นเพื่อความปลอดภัยและการทำงานของระบบ คุณสามารถอ่าน{' '}
          <button
            type="button"
            className="cookie-policy-link"
            onClick={() => setIsPolicyOpen(true)}
          >
            นโยบายความเป็นส่วนตัว
          </button>{' '}
          หรือเลือกปรับแต่งความยินยอมได้
        </p>

        {/* Compact Actions Row */}
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn-ghost-sm"
            onClick={() => setIsPreferencesOpen(true)}
          >
            <Settings size={13} />
            <span>ตั้งค่า</span>
          </button>

          <div className="cookie-banner-actions-right">
            <button
              type="button"
              className="cookie-btn cookie-btn-secondary-sm"
              onClick={handleRejectNonEssential}
            >
              ปฏิเสธ
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-primary-sm"
              onClick={handleAcceptAll}
            >
              <Check size={14} />
              <span>ยอมรับทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
