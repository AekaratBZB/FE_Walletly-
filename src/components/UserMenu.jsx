import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Cookie, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCookieConsent } from '../context/CookieContext';
import { useWallet } from '../context/WalletContext';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const { setIsPreferencesOpen } = useCookieConsent();
  const { addToast } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : null;
  const avatar = (size) => (
    <span className={`user-menu-avatar user-menu-avatar-${size}`}>
      {initial || <UserIcon size={size === 'lg' ? 18 : 12} />}
    </span>
  );

  const runAndClose = (action) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {avatar('sm')}
        <span className="user-menu-name">{user.name}</span>
        <ChevronDown size={14} className={`user-menu-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            {avatar('lg')}
            <div className="user-menu-identity">
              <div className="user-menu-identity-name">{user.name}</div>
              {user.email && <div className="user-menu-identity-email">{user.email}</div>}
            </div>
          </div>

          <div className="user-menu-section">
            {/* หน้าโปรไฟล์จริงรอ API ฝั่ง BE */}
            <button
              type="button"
              role="menuitem"
              className="user-menu-item"
              onClick={runAndClose(() => addToast('หน้าโปรไฟล์กำลังพัฒนา เร็วๆ นี้', 'info'))}
            >
              <UserIcon size={16} />
              <span>โปรไฟล์ของฉัน</span>
              <span className="user-menu-soon">เร็วๆ นี้</span>
            </button>
            <button
              type="button"
              role="menuitem"
              className="user-menu-item"
              onClick={runAndClose(() => setIsPreferencesOpen(true))}
            >
              <Cookie size={16} />
              <span>ตั้งค่าคุกกี้</span>
            </button>
          </div>

          <div className="user-menu-section">
            <button
              type="button"
              role="menuitem"
              className="user-menu-item user-menu-item-danger"
              onClick={runAndClose(logout)}
            >
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
