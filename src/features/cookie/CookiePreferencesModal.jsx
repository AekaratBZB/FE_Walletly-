import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../../context/CookieContext';
import { useWallet } from '../../context/WalletContext';
import { Settings, Shield, Sliders, BarChart3, Megaphone, Check } from 'lucide-react';
import './cookie.css';

export const CookiePreferencesModal = () => {
  const {
    consent,
    isPreferencesOpen,
    setIsPreferencesOpen,
    savePreferences,
    acceptAll
  } = useCookieConsent();
  const { addToast } = useWallet();

  // Local draft state for toggles (Default all to true)
  const [draft, setDraft] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true
  });

  // Sync draft with current consent when modal opens (defaults to true if not explicitly false)
  useEffect(() => {
    if (isPreferencesOpen) {
      setDraft({
        necessary: true, // Always true
        functional: consent ? consent.functional !== false : true,
        analytics: consent ? consent.analytics !== false : true,
        marketing: consent ? consent.marketing !== false : true
      });
    }
  }, [isPreferencesOpen, consent]);

  if (!isPreferencesOpen) return null;

  const handleSave = () => {
    savePreferences(draft);
    addToast('บันทึกการตั้งค่าคุกกี้ของคุณเรียบร้อยแล้ว', 'success');
  };

  const handleAcceptAllAndClose = () => {
    acceptAll();
    addToast('ยินยอมการใช้งานคุกกี้ทั้งหมดเรียบร้อยแล้ว', 'success');
  };

  return (
    <div
      className="cookie-modal-backdrop"
      onClick={() => setIsPreferencesOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
    >
      <div className="cookie-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="cookie-modal-header">
          <div className="cookie-modal-header-left">
            <Settings size={20} color="#059669" />
            <h3 id="cookie-modal-title">ศูนย์การตั้งค่าคุกกี้ (Cookie Preferences)</h3>
          </div>
          <button
            type="button"
            className="cookie-modal-close-btn"
            onClick={() => setIsPreferencesOpen(false)}
            aria-label="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="cookie-modal-body">
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5 }}>
            คุณสามารถเลือกเปิดหรือปิดการใช้งานคุกกี้แต่ละประเภทได้ตามต้องการ ทั้งนี้การปิดคุกกี้บางประเภทอาจส่งผลต่อการทำงานและการแสดงผลบางส่วนของ Future Wallet
          </p>

          {/* 1. Strictly Necessary */}
          <div className="cookie-category-item">
            <div className="cookie-category-header">
              <div className="cookie-category-title-wrap">
                <Shield size={16} color="#059669" />
                <span className="cookie-category-title">1. คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary)</span>
                <span className="cookie-always-active-badge">เปิดใช้งานเสมอ (จำเป็น)</span>
              </div>
              <label className="cookie-switch">
                <input type="checkbox" checked={true} disabled />
                <span className="cookie-slider" />
              </label>
            </div>
            <p className="cookie-category-desc">
              คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานหลักของระบบ เช่น ระบบล็อกอิน การยืนยันตัวตน ความปลอดภัยของเซสชัน และการบันทึกสถานะธุรกรรมการเงิน ไม่สามารถปิดการใช้งานได้
            </p>
          </div>

          {/* 2. Functional / Preferences */}
          <div className="cookie-category-item">
            <div className="cookie-category-header">
              <div className="cookie-category-title-wrap">
                <Sliders size={16} color="#3b82f6" />
                <span className="cookie-category-title">2. เพื่อการตั้งค่าและการใช้งาน (Functional)</span>
              </div>
              <label className="cookie-switch">
                <input
                  type="checkbox"
                  checked={draft.functional}
                  onChange={(e) => setDraft({ ...draft, functional: e.target.checked })}
                />
                <span className="cookie-slider" />
              </label>
            </div>
            <p className="cookie-category-desc">
              ช่วยจดจำการตั้งค่าของคุณ เช่น ฟิกคอสที่ใช้งานบ่อย, สูตรคำนวณภาษี, ข้อมูลเป้าหมายการออม และการตั้งค่าสัดส่วน 50/30/20 เพื่อความสะดวกเมื่อกลับมาใช้งานครั้งถัดไป
            </p>
          </div>

          {/* 3. Analytics & Performance */}
          <div className="cookie-category-item">
            <div className="cookie-category-header">
              <div className="cookie-category-title-wrap">
                <BarChart3 size={16} color="#8b5cf6" />
                <span className="cookie-category-title">3. เพื่อการวิเคราะห์และวัดผล (Analytics)</span>
              </div>
              <label className="cookie-switch">
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })}
                />
                <span className="cookie-slider" />
              </label>
            </div>
            <p className="cookie-category-desc">
              ช่วยให้เราเข้าใจพฤติกรรมการใช้งาน เช่น เมนูที่ผู้ใช้เข้าบ่อย ระยะเวลา และข้อผิดพลาด เพื่อนำข้อมูลไปปรับปรุงความเร็วและความลื่นไหลของ Future Wallet ให้ดียิ่งขึ้น
            </p>
          </div>

          {/* 4. Marketing */}
          <div className="cookie-category-item">
            <div className="cookie-category-header">
              <div className="cookie-category-title-wrap">
                <Megaphone size={16} color="#f59e0b" />
                <span className="cookie-category-title">4. เพื่อการตลาดและข้อเสนอพิเศษ (Marketing)</span>
              </div>
              <label className="cookie-switch">
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) => setDraft({ ...draft, marketing: e.target.checked })}
                />
                <span className="cookie-slider" />
              </label>
            </div>
            <p className="cookie-category-desc">
              นำเสนอเนื้อหา ความรู้ทางการเงิน วางแผนลดหย่อนภาษี และสิทธิประโยชน์พิเศษที่เหมาะสมกับพฤติกรรมทางการเงินของคุณ
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="cookie-modal-footer">
          <button
            type="button"
            className="cookie-btn cookie-btn-secondary"
            onClick={handleAcceptAllAndClose}
          >
            ยอมรับทั้งหมด (Accept All)
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={handleSave}
          >
            <Check size={16} />
            <span>บันทึกการตั้งค่า (Save Preferences)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
