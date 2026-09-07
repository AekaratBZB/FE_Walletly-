import React from 'react';
import { useCookieConsent } from '../../context/CookieContext';
import { ShieldCheck, FileText, Check } from 'lucide-react';
import './cookie.css';

export const PrivacyPolicyModal = () => {
  const { isPolicyOpen, setIsPolicyOpen } = useCookieConsent();

  if (!isPolicyOpen) return null;

  return (
    <div
      className="cookie-modal-backdrop"
      onClick={() => setIsPolicyOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="cookie-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="cookie-modal-header">
          <div className="cookie-modal-header-left">
            <ShieldCheck size={22} color="#059669" />
            <h3 id="privacy-modal-title">นโยบายความเป็นส่วนตัวและคุกกี้ (Privacy & Cookie Policy)</h3>
          </div>
          <button
            type="button"
            className="cookie-modal-close-btn"
            onClick={() => setIsPolicyOpen(false)}
            aria-label="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cookie-modal-body" style={{ maxHeight: '68vh' }}>
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', color: '#475569', border: '1px solid #e2e8f0' }}>
            อัปเดตล่าสุด: 8 กันยายน 2026 • เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </div>

          <div className="privacy-policy-section">
            <h4>1. บทนำและความตั้งใจของเรา</h4>
            <p>
              Future Wallet ("เรา") ให้ความสำคัญสูงสุดต่อการคุ้มครองข้อมูลส่วนบุคคลและความเป็นส่วนตัวของผู้ใช้งาน เอกสารฉบับนี้อธิบายถึงประเภทข้อมูลที่เราจัดเก็บ วิธีการประมวลผล สิทธิของท่าน และการใช้งานคุกกี้ (Cookies) บนระบบของเรา
            </p>
          </div>

          <div className="privacy-policy-section">
            <h4>2. ข้อมูลส่วนบุคคลที่เราจัดเก็บ</h4>
            <p>เมื่อท่านลงทะเบียนหรือใช้งาน Future Wallet ข้อมูลที่อาจถูกจัดเก็บประกอบด้วย:</p>
            <ul>
              <li><strong>ข้อมูลระบุตัวตน:</strong> ชื่อ-นามสกุล, ที่อยู่อีเมล, บัญชี Social Login</li>
              <li><strong>ข้อมูลทางการเงินในแอป:</strong> บันทึกรายรับ-รายจ่าย, ฟิกคอส, เป้าหมายการออม, ข้อมูลคำนวณภาษี (จัดเก็บในพื้นที่ Local Storage บนอุปกรณ์ของท่านเพื่อความปลอดภัยสูงสุด)</li>
              <li><strong>ข้อมูลทางเทคนิค:</strong> ไอพีแอดเดรส (IP Address), ประเภทเบราว์เซอร์, การตั้งค่าการใช้งาน</li>
            </ul>
          </div>

          <div className="privacy-policy-section">
            <h4>3. วัตถุประสงค์ในการประมวลผลข้อมูล</h4>
            <ul>
              <li>เพื่อให้บริการระบบบริหารการเงินส่วนบุคคลและคำนวณภาษีได้อย่างมีประสิทธิภาพ</li>
              <li>เพื่อยืนยันตัวตน รักษาความปลอดภัยของบัญชีผู้ใช้งาน และป้องกันการทุจริต</li>
              <li>เพื่อพัฒนาและปรับปรุงประสิทธิภาพการทำงานของแอปพลิเคชัน</li>
            </ul>
          </div>

          <div className="privacy-policy-section">
            <h4>4. การใช้งานคุกกี้ (Cookies & Local Storage)</h4>
            <p>
              เราใช้คุกกี้และเทคโนโลยีการจัดเก็บข้อมูลบนเครื่องของท่าน เพื่อช่วยให้ระบบจดจำสถานะการล็อกอิน ค่าตัวเลือก และวิเคราะห์การใช้งาน โดยแบ่งออกเป็น 4 หมวดหมู่ (จำเป็น, ตั้งค่า, วิเคราะห์, การตลาด) ซึ่งท่านมีสิทธิในการเลือกให้ความยินยอมหรือเพิกถอนได้ตลอดเวลาผ่านปุ่มการตั้งค่าคุกกี้
            </p>
          </div>

          <div className="privacy-policy-section">
            <h4>5. สิทธิของท่านตามกฎหมาย PDPA</h4>
            <p>ในฐานะเจ้าของข้อมูลส่วนบุคคล ท่านมีสิทธิตามกฎหมายดังนี้:</p>
            <ul>
              <li><strong>สิทธิขอเข้าถึงและรับสำเนาข้อมูล (Right of Access)</strong></li>
              <li><strong>สิทธิขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)</strong></li>
              <li><strong>สิทธิขอลบหรือทำลายข้อมูล (Right to Erasure)</strong></li>
              <li><strong>สิทธิเพิกถอนความยินยอม (Right to Withdraw Consent)</strong> ได้ทุกเมื่อ</li>
              <li><strong>สิทธิคัดค้านการประมวลผล (Right to Object)</strong></li>
            </ul>
          </div>

          <div className="privacy-policy-section">
            <h4>6. ช่องทางการติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)</h4>
            <p>
              หากท่านมีข้อสงสัยเกี่ยวกับนโยบายนี้ หรือต้องการใช้สิทธิตามกฎหมาย PDPA สามารถติดต่อทีมงานได้ที่:<br />
              📧 <strong>Email:</strong> privacy@futurewallet.app<br />
              🏢 <strong>สำนักงาน:</strong> Future Wallet Data Protection Unit, กรุงเทพมหานคร
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="cookie-modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={() => setIsPolicyOpen(false)}
          >
            <Check size={16} />
            <span>รับทราบและเข้าใจแล้ว</span>
          </button>
        </div>
      </div>
    </div>
  );
};
