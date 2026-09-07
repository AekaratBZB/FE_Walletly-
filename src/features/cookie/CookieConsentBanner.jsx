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
        <div className="cookie-banner-header">
          <div className="cookie-icon-wrapper" aria-hidden="true">
            🍪
          </div>
          <div className="cookie-banner-text">
            <h4 className="cookie-banner-title">
              เราใช้คุกกี้เพื่อยกระดับประสบการณ์การเงินของคุณ
            </h4>
            <p className="cookie-banner-desc">
              Future Wallet ให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณตาม{' '}
              <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong>{' '}
              เราใช้คุกกี้ที่จำเป็นเพื่อความปลอดภัยและการทำงานของระบบ และคุกกี้เสริมเพื่อพัฒนาบริการให้ดียิ่งขึ้น คุณสามารถเลือกปรับแต่งความยินยอมได้ตามต้องการ หรืออ่าน{' '}
              <button
                type="button"
                className="cookie-policy-link"
                onClick={() => setIsPolicyOpen(true)}
              >
                นโยบายความเป็นส่วนตัว & คุกกี้
              </button>
            </p>
          </div>
        </div>

        <div className="cookie-banner-actions">
          {/* Settings Button */}
          <button
            type="button"
            className="cookie-btn cookie-btn-ghost"
            onClick={() => setIsPreferencesOpen(true)}
          >
            <Settings size={15} />
            <span>ตั้งค่าคุกกี้ (Settings)</span>
          </button>

          {/* Reject Non-Essential Button */}
          <button
            type="button"
            className="cookie-btn cookie-btn-secondary"
            onClick={handleRejectNonEssential}
          >
            <X size={15} />
            <span>ปฏิเสธคุกกี้ที่ไม่จำเป็น</span>
          </button>

          {/* Accept All Button */}
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={handleAcceptAll}
          >
            <Check size={16} />
            <span>ยอมรับทั้งหมด (Accept All)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
