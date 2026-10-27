import React from 'react';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * ฟีเจอร์ที่คำนวณฝั่งเซิร์ฟเวอร์ใช้ได้เฉพาะสมาชิก: ผู้ใช้โหมดทดลอง (guest) เห็นการ์ดชวนสมัครแทน children
 */
export const MemberOnly = ({ title, description, icon: Icon = Lock, page = false, children }) => {
  const { user, goToAuth } = useAuth();

  if (!user?.isGuest) return children;

  const card = (
    <div className="member-only-card" role="region" aria-label={title}>
      <div className="member-only-icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="member-only-title">{title}</div>
      {description && <div className="member-only-desc">{description}</div>}
      <div className="member-only-actions">
        <button type="button" className="btn btn-primary" onClick={() => goToAuth('register')}>
          <UserPlus size={16} />
          <span>สมัครสมาชิกฟรี</span>
        </button>
        <button type="button" className="btn btn-outline" onClick={() => goToAuth('login')}>
          <LogIn size={16} />
          <span>เข้าสู่ระบบ</span>
        </button>
      </div>
      <div className="member-only-note">ข้อมูลที่บันทึกในโหมดทดลองจะไม่ถูกย้ายเข้าบัญชีที่สมัคร</div>
    </div>
  );

  // page = กั้นทั้งแท็บ จึงต้องมีกรอบหน้าเหมือนแท็บปกติ
  return page ? <div className="tab-panel active">{card}</div> : card;
};
