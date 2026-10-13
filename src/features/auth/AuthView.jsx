import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Database,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import './auth.css';

// Exact Future Wallet SVG Logo (Emerald Green W with Trend Arrow)
export const FutureWalletLogo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 11.5L9.5 22.5L14 13.5L18.5 22.5L24.5 9"
      stroke="#059669"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.5 9H24.5V14"
      stroke="#059669"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// High-fidelity Google G Logo SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// High-fidelity Facebook Logo SVG
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      fill="#FFFFFF"
      d="M15.15 12.35l.43-2.8h-2.68v-1.82c0-.77.38-1.52 1.59-1.52h1.23V3.82c-.74-.1-1.63-.16-2.52-.16-2.57 0-4.25 1.56-4.25 4.38v2.01h-2.45v2.8h2.45v6.78c.5.08 1 .12 1.52.12s1.02-.04 1.52-.12v-6.78h2.66z"
    />
  </svg>
);

const NOTICE_COLORS = {
  info: { rgb: '59, 130, 246', text: '#3b82f6' },
  success: { rgb: '16, 185, 129', text: '#059669' },
  error: { rgb: '239, 68, 68', text: '#ef4444' }
};

const noticeStyle = (type) => ({
  padding: '0.65rem 0.85rem',
  borderRadius: '8px',
  background: `rgba(${NOTICE_COLORS[type].rgb}, 0.12)`,
  border: `1px solid rgba(${NOTICE_COLORS[type].rgb}, 0.3)`,
  color: NOTICE_COLORS[type].text,
  fontSize: '0.82rem',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
});

const noticeCloseStyle = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '1rem',
  lineHeight: 1
};

// Available system accounts for login & selection
const AVAILABLE_ACCOUNTS = [
  {
    id: 'demo-somchai',
    name: 'สมชาย ฟินสมาร์ท (Demo Account)',
    email: 'demo@walletly.app',
    password: 'Password123!',
    tag: 'SQL Server Database: มี 10 ธุรกรรม, 6 ฟิกคอส, 3 แผนออม',
    badgeColor: '#10b981',
    avatarChar: 'ส',
    type: 'db_seed',
    description: 'บัญชีหลักเชื่อมต่อฐานข้อมูล SQL Server LocalDB พร้อมข้อมูลตัวอย่างจริง'
  },
  {
    id: 'test-user',
    name: 'Test User',
    email: 'test.user@walletly.app',
    password: 'Password123!',
    tag: 'SQL Server Database: 1 ธุรกรรม',
    badgeColor: '#3b82f6',
    avatarChar: 'T',
    type: 'db_test',
    description: 'บัญชีทดสอบในระบบ SQL Server (WalletlyDb)'
  },
  {
    id: 'google-user',
    name: 'Google User',
    email: 'user.google@walletly.app',
    tag: 'Google OAuth API (/api/Auth/google)',
    badgeColor: '#ea4335',
    avatarChar: 'G',
    type: 'social',
    provider: 'google',
    description: 'เข้าสู่ระบบด้วย Google ผ่าน .NET Core Auth Controller'
  }
];

export const AuthView = ({ onAuthSuccess }) => {
  const {
    login,
    register,
    loginWithSocial,
    loginAsGuest,
    savedEmail,
    isAuthLoading,
    emailVerification,
    clearEmailVerification
  } = useAuth();
  const { addToast } = useWallet();

  // Active Auth Screen mode ('login' | 'register') - Default to login only
  const [authMode, setAuthMode] = useState('login');

  // ข้อความหลังสมัคร: ให้ไปกดลิงก์ยืนยันในอีเมล
  const [verificationNotice, setVerificationNotice] = useState('');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState(savedEmail || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState({});

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Account Selection & Confirmation Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalStep, setAccountModalStep] = useState('choose'); // 'choose' | 'confirm'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountProvider, setAccountProvider] = useState('google'); // 'google' | 'facebook' | 'system'
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  // Password Strength Calculation (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!regPassword) return { score: 0, label: 'ยังไม่ได้ระบุ' };
    let score = 0;
    if (regPassword.length >= 6) score++;
    if (regPassword.length >= 8 && /[A-Z]/.test(regPassword)) score++;
    if (/\d/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword) || regPassword.length >= 10) score++;

    const labels = ['อ่อนมาก', 'อ่อน', 'ปานกลาง', 'ค่อนข้างแข็งแรง', 'ปลอดภัยสูงสุด'];
    return { score, label: labels[score] };
  }, [regPassword]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!loginEmail.trim()) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!loginPassword) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (loginPassword.length < 4) {
      errors.password = 'รหัสผ่านสั้นเกินไป';
    }

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginErrors({});
    const res = await login(loginEmail, loginPassword, rememberMe);
    if (res?.success) {
      addToast(`ยินดีต้อนรับกลับ ${res.user.name}! เข้าสู่ระบบสำเร็จ (API)`, 'success');
      if (onAuthSuccess) onAuthSuccess(res.user);
    } else {
      setLoginErrors({ general: res?.error || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน' });
      addToast(res?.error || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน', 'danger');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!regFullName.trim()) {
      errors.fullName = 'กรุณาระบุชื่อเต็ม';
    }
    if (!regEmail.trim()) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(regEmail)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    // ต้องตรงกับ RegisterCommandValidator ฝั่ง BE
    if (!regPassword) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (regPassword.length < 8) {
      errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    } else if (!/[A-Za-z]/.test(regPassword) || !/[0-9]/.test(regPassword)) {
      errors.password = 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อยอย่างละ 1 ตัว';
    } else if (new TextEncoder().encode(regPassword).length > 72) {
      errors.password = 'รหัสผ่านยาวเกินไป';
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegErrors({});
    const res = await register(regFullName, regEmail, regPassword);
    if (res?.success && res.pendingVerification) {
      // ต้องกดลิงก์ยืนยันในอีเมลก่อน จึงพากลับไปหน้า login พร้อมข้อความแนะนำ
      setVerificationNotice(res.message);
      setLoginEmail(regEmail);
      setRegPassword('');
      setAuthMode('login');
      addToast('ส่งลิงก์ยืนยันไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย (และโฟลเดอร์ Spam)', 'success');
    } else if (res?.success) {
      addToast(`สร้างบัญชี ${res.user.name} สำเร็จ! ยินดีต้อนรับสู่ Future Wallet`, 'success');
      if (onAuthSuccess) onAuthSuccess(res.user);
    } else {
      setRegErrors({ general: res?.error || 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
      addToast(res?.error || 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'danger');
    }
  };

  // Open Account Chooser Modal
  const openAccountChooser = (provider = 'google') => {
    setAccountProvider(provider);
    setAccountModalStep('choose');
    setIsCustomMode(false);
    setShowAccountModal(true);
  };

  // Select an account from list and move to confirmation step
  const handleSelectAccountToConfirm = (account) => {
    setSelectedAccount(account);
    setAccountModalStep('confirm');
  };

  // Confirm Custom Account and move to confirmation step
  const handleCustomAccountConfirm = (e) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      addToast('กรุณากรอกอีเมลที่ถูกต้อง', 'warning');
      return;
    }
    const acc = {
      id: 'custom-' + Date.now(),
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim(),
      tag: 'บัญชีระบุเอง (Custom Account)',
      badgeColor: '#8b5cf6',
      avatarChar: (customName || customEmail).charAt(0).toUpperCase(),
      type: 'social',
      provider: accountProvider === 'facebook' ? 'facebook' : 'google'
    };
    setSelectedAccount(acc);
    setAccountModalStep('confirm');
  };

  // Final confirmation execution (calls the real API!)
  const handleExecuteConfirmedLogin = async () => {
    if (!selectedAccount) return;
    setShowAccountModal(false);

    if (selectedAccount.password) {
      // Direct login with password to SQL Server API
      const res = await login(selectedAccount.email, selectedAccount.password, rememberMe);
      if (res?.success) {
        addToast(`ยืนยันเข้าสู่ระบบในชื่อ ${res.user.name} สำเร็จ! โหลดข้อมูลจริงจาก Database เรียบร้อย`, 'success');
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        addToast(res?.error || 'เข้าสู่ระบบไม่สำเร็จ', 'danger');
      }
    } else {
      // Social login through Backend API
      const res = await loginWithSocial(selectedAccount.provider || accountProvider, {
        email: selectedAccount.email,
        displayName: selectedAccount.name
      });
      if (res?.success) {
        addToast(`ยืนยันเข้าสู่ระบบด้วย ${selectedAccount.name} สำเร็จ! เชื่อมต่อ API เรียบร้อย`, 'success');
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        addToast(res?.error || 'เข้าสู่ระบบไม่สำเร็จ', 'danger');
      }
    }
  };

  // Handle Guest Mode
  const handleGuest = () => {
    const res = loginAsGuest();
    if (res.success) {
      addToast('เข้าสู่ระบบในฐานะแขก (Guest Mode) เรียบร้อย', 'info');
      if (onAuthSuccess) onAuthSuccess(res.user);
    }
  };

  // Handle Forgot Password
  const handleSendResetEmail = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      addToast('กรุณากรอกอีเมลที่ถูกต้องเพื่อรีเซ็ตรหัสผ่าน', 'warning');
      return;
    }
    addToast(`ส่งคำขอรีเซ็ตรหัสผ่านไปยัง ${forgotEmail} แล้ว! กรุณาตรวจสอบอีเมล`, 'success');
    setShowForgotModal(false);
    setForgotEmail('');
  };

  return (
    <div className="future-auth-overlay">
      {/* Main Container */}
      <div className="future-auth-container">
        {/* ==========================================================
            CARD 1: ยินดีต้อนรับกลับมา (LOGIN) - แสดงเมื่อ authMode === 'login'
           ========================================================== */}
        {authMode === 'login' && (
          <div className="future-auth-card">
            {/* Logo Header */}
            <div className="auth-brand-header">
              <div className="auth-brand-logo-icon">
                <FutureWalletLogo size={32} />
              </div>
              <span className="auth-brand-name">Future Wallet</span>
            </div>

            {/* Title */}
            <h2 className="auth-card-title">ยินดีต้อนรับกลับมา</h2>

            {/* Quick Account Chooser Button */}
            <button
              type="button"
              className="auth-account-chooser-btn"
              onClick={() => openAccountChooser('general')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={20} color="#10b981" />
                <span>เลือกบัญชีที่จะใช้ Login (Account Chooser)</span>
              </div>
              <ChevronRight size={18} color="#10b981" />
            </button>

            {/* Social Buttons */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => openAccountChooser('google')}
              >
                <GoogleIcon />
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
              <button
                type="button"
                className="auth-social-btn facebook-btn"
                onClick={() => openAccountChooser('facebook')}
              >
                <FacebookIcon />
                <span>ดำเนินการต่อด้วย Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span>หรือเข้าสู่ระบบด้วยอีเมล</span>
            </div>

            {/* Login Form */}
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              {emailVerification?.status === 'verifying' && (
                <div style={noticeStyle('info')}>
                  <span>⏳</span>
                  <span>กำลังยืนยันอีเมล... (ครั้งแรกอาจใช้เวลาประมาณ 1 นาที)</span>
                </div>
              )}

              {emailVerification?.status === 'error' && (
                <div style={noticeStyle('error')}>
                  <span>⚠️</span>
                  <span style={{ flex: 1 }}>{emailVerification.message}</span>
                  <button type="button" onClick={clearEmailVerification} style={noticeCloseStyle} aria-label="ปิด">
                    ×
                  </button>
                </div>
              )}

              {verificationNotice && (
                <div style={noticeStyle('success')}>
                  <span>📧</span>
                  <span style={{ flex: 1 }}>
                    {verificationNotice} (หากไม่พบ ให้ตรวจสอบโฟลเดอร์ Spam)
                  </span>
                  <button type="button" onClick={() => setVerificationNotice('')} style={noticeCloseStyle} aria-label="ปิด">
                    ×
                  </button>
                </div>
              )}

              {loginErrors.general && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>⚠️</span>
                  <span>{loginErrors.general}</span>
                </div>
              )}

              {/* Email Field */}
              <div className={`auth-input-group ${loginErrors.email ? 'has-error' : ''}`}>
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="อีเมล (Email)"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              {loginErrors.email && <div className="auth-field-error">{loginErrors.email}</div>}

              {/* Password Field */}
              <div className={`auth-input-group ${loginErrors.password ? 'has-error' : ''}`}>
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  className="auth-input-field"
                  placeholder="รหัสผ่าน (Password)"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  title={showLoginPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginErrors.password && <div className="auth-field-error">{loginErrors.password}</div>}

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="auth-options-row">
                <label className="auth-toggle-label">
                  <div className="auth-toggle-switch">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="auth-toggle-slider" />
                  </div>
                  <span>จดจำฉัน (Remember Me)</span>
                </label>

                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => setShowForgotModal(true)}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isAuthLoading}
                style={{ opacity: isAuthLoading ? 0.7 : 1, cursor: isAuthLoading ? 'not-allowed' : 'pointer' }}
              >
                {isAuthLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Login)'}
              </button>
            </form>

            {/* Quick Test Account Box */}
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px dashed rgba(16, 185, 129, 0.35)',
                fontSize: '0.78rem',
                color: 'var(--text-subtle, #94a3b8)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ color: '#10b981', fontWeight: 600 }}>บัญชีทดสอบ Backend (.NET):</div>
                <div style={{ fontSize: '0.75rem' }}>test.user@walletly.app / Password123!</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('test.user@walletly.app');
                  setLoginPassword('Password123!');
                  setLoginErrors({});
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#10b981',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                กรอกอัตโนมัติ
              </button>
            </div>

            {/* Guest Mode Link */}
            <button
              type="button"
              className="auth-guest-link"
              onClick={handleGuest}
            >
              เข้าใช้งานในฐานะแขก (Guest Mode)
            </button>

            {/* Switch to Register */}
            <div className="auth-footer-switch">
              <span>ยังไม่มีบัญชี Future Wallet?</span>
              <button
                type="button"
                className="auth-switch-link-btn"
                onClick={() => {
                  setAuthMode('register');
                  setLoginErrors({});
                }}
              >
                สมัครสมาชิกใหม่ (Register)
              </button>
            </div>
          </div>
        )}

        {/* ==========================================================
            CARD 2: สร้างบัญชีใหม่ (REGISTER) - แสดงเมื่อ authMode === 'register'
           ========================================================== */}
        {authMode === 'register' && (
          <div className="future-auth-card">
            {/* Logo Header */}
            <div className="auth-brand-header">
              <div className="auth-brand-logo-icon">
                <FutureWalletLogo size={32} />
              </div>
              <span className="auth-brand-name">Future Wallet</span>
            </div>

            {/* Title */}
            <h2 className="auth-card-title">สร้างบัญชีใหม่</h2>

            {/* Social Buttons */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleSocial('google')}
              >
                <GoogleIcon />
                <span>สมัครใช้งานด้วย Google</span>
              </button>
              <button
                type="button"
                className="auth-social-btn facebook-btn"
                onClick={() => handleSocial('facebook')}
              >
                <FacebookIcon />
                <span>ดำเนินการต่อด้วย Facebook</span>
              </button>
            </div>

            {/* Divider */}
            <div className="auth-divider">
              <span>Social Login</span>
            </div>

            {/* Register Form */}
            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              {regErrors.general && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>⚠️</span>
                  <span>{regErrors.general}</span>
                </div>
              )}

              {/* Full Name Field */}
              <div className={`auth-input-group ${regErrors.fullName ? 'has-error' : ''}`}>
                <span className="auth-input-icon">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="auth-input-field"
                  placeholder="ชื่อเต็ม (Full Name)"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>
              {regErrors.fullName && <div className="auth-field-error">{regErrors.fullName}</div>}

              {/* Email Field */}
              <div className={`auth-input-group ${regErrors.email ? 'has-error' : ''}`}>
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="อีเมล (Email)"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              {regErrors.email && <div className="auth-field-error">{regErrors.email}</div>}

              {/* Password Field */}
              <div className={`auth-input-group ${regErrors.password ? 'has-error' : ''}`}>
                <span className="auth-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="auth-input-field"
                  placeholder="รหัสผ่าน (Password)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  title={showRegPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {regErrors.password && <div className="auth-field-error">{regErrors.password}</div>}

              {/* Password Strength Indicator */}
              <div className="password-strength-container">
                <div className="password-strength-bars">
                  <div
                    className={`password-strength-bar ${
                      passwordStrength.score >= 1 ? 'weak-red' : ''
                    }`}
                  />
                  <div
                    className={`password-strength-bar ${
                      passwordStrength.score >= 2 ? 'weak-orange' : ''
                    }`}
                  />
                  <div
                    className={`password-strength-bar ${
                      passwordStrength.score >= 3 ? 'medium-yellow' : ''
                    }`}
                  />
                  <div
                    className={`password-strength-bar ${
                      passwordStrength.score >= 4 ? 'strong-green' : ''
                    }`}
                  />
                </div>
                <div className="password-strength-label">
                  <span>ความแข็งแรงของรหัสผ่าน</span>
                  {regPassword && (
                    <span
                      className="password-strength-status"
                      style={{
                        color:
                          passwordStrength.score === 1
                            ? '#ef4444'
                            : passwordStrength.score === 2
                            ? '#f97316'
                            : passwordStrength.score === 3
                            ? '#eab308'
                            : passwordStrength.score === 4
                            ? '#10b981'
                            : '#9ca3af'
                      }}
                    >
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isAuthLoading}
                style={{ opacity: isAuthLoading ? 0.7 : 1, cursor: isAuthLoading ? 'not-allowed' : 'pointer' }}
              >
                {isAuthLoading ? 'กำลังสร้างบัญชี...' : 'สมัครใช้งาน (Register)'}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="auth-footer-switch">
              <span>มีบัญชีผู้ใช้งานอยู่แล้ว?</span>
              <button
                type="button"
                className="auth-switch-link-btn"
                onClick={() => {
                  setAuthMode('login');
                  setRegErrors({});
                }}
              >
                เข้าสู่ระบบ (Login)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3>กู้คืนรหัสผ่าน</h3>
              <button
                type="button"
                className="auth-modal-close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.2rem', lineHeight: '1.5' }}>
              กรุณาระบุอีเมลที่ใช้ลงทะเบียนกับ Future Wallet ระบบจะจัดส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ
            </p>
            <form onSubmit={handleSendResetEmail}>
              <div className="auth-input-group" style={{ marginBottom: '1.25rem' }}>
                <span className="auth-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="auth-input-field"
                  placeholder="อีเมลของคุณ (Your Email)"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="auth-submit-btn" style={{ marginTop: 0 }}>
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Account Chooser & Confirmation Modal */}
      {showAccountModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div
            className="auth-modal-content"
            style={{ maxWidth: '460px', padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="auth-modal-header" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {accountModalStep === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => setAccountModalStep('choose')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="ย้อนกลับไปเลือกบัญชี"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                {accountProvider === 'google' ? (
                  <GoogleIcon />
                ) : accountProvider === 'facebook' ? (
                  <FacebookIcon />
                ) : (
                  <FutureWalletLogo size={22} />
                )}
                <h3 style={{ fontSize: '1.15rem' }}>
                  {accountModalStep === 'choose'
                    ? 'เลือกบัญชีเพื่อเข้าสู่ระบบ'
                    : 'ยืนยันการเข้าสู่ระบบ'}
                </h3>
              </div>
              <button
                type="button"
                className="auth-modal-close-btn"
                onClick={() => setShowAccountModal(false)}
              >
                ✕
              </button>
            </div>

            {/* STEP 1: CHOOSE ACCOUNT */}
            {accountModalStep === 'choose' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                  เลือกบัญชีผู้ใช้ที่ต้องการเพื่อเชื่อมต่อกับ Future Wallet และดึงข้อมูลจาก .NET Backend API (SQL Server)
                </p>

                {/* Accounts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                  {AVAILABLE_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSelectAccountToConfirm(acc)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px solid #e2e8f0',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = acc.badgeColor;
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: acc.badgeColor,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        >
                          {acc.avatarChar}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {acc.email}
                          </div>
                          <div
                            style={{
                              marginTop: '3px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: acc.badgeColor,
                              display: 'inline-block',
                              background: `${acc.badgeColor}15`,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {acc.tag}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} color="#94a3b8" />
                    </div>
                  ))}
                </div>

                {/* Custom / Add another account button */}
                {!isCustomMode ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px dashed #cbd5e1',
                      color: '#475569',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>➕ ใช้บัญชี Google อื่น / ระบุอีเมลเอง</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomAccountConfirm} style={{ marginTop: '0.75rem', padding: '0.85rem', background: '#f1f5f9', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
                      ระบุข้อมูลบัญชีสำหรับ Social Login:
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="ชื่อผู้ใช้งาน (Display Name)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="auth-input-field"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', height: 'auto' }}
                      />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <input
                        type="email"
                        placeholder="อีเมล (Google Email)*"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        required
                        className="auth-input-field"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', height: 'auto' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="btn btn-ghost btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        ถัดไป →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: CONFIRM ACCOUNT */}
            {accountModalStep === 'confirm' && selectedAccount && (
              <div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                  ตรวจสอบข้อมูลและยืนยันเพื่อเข้าสู่ระบบ Future Wallet ด้วยบัญชีนี้:
                </p>

                {/* Account Card Showcase */}
                <div
                  style={{
                    padding: '1.1rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.9rem',
                    marginBottom: '1.2rem'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: selectedAccount.badgeColor || '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.3rem',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {selectedAccount.avatarChar || selectedAccount.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                      {selectedAccount.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', wordBreak: 'break-all' }}>
                      {selectedAccount.email}
                    </div>
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: selectedAccount.badgeColor || '#10b981',
                        display: 'inline-block',
                        background: `${selectedAccount.badgeColor || '#10b981'}18`,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {selectedAccount.tag || 'เชื่อมต่อ Backend API'}
                    </div>
                  </div>
                </div>

                {/* Permissions & DB Connection Details */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    marginBottom: '1.25rem',
                    fontSize: '0.78rem',
                    color: '#334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={16} />
                    <span>สิทธิ์และการเชื่อมต่อฐานข้อมูล:</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>เชื่อมต่อฐานข้อมูล SQL Server (.NET Core Web API)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>ดึงและซิงค์ข้อมูลธุรกรรม, ฟิกคอส, เป้าหมายการออมสดจาก DB</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>ออกสิทธิ์ JWT Token เพื่อรักษาความปลอดภัย</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setAccountModalStep('choose')}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '10px', fontSize: '0.88rem' }}
                  >
                    ← เปลี่ยนบัญชี
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteConfirmedLogin}
                    disabled={isAuthLoading}
                    className="btn btn-primary"
                    style={{
                      flex: 1.5,
                      padding: '0.65rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 600,
                      cursor: isAuthLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span>{isAuthLoading ? 'กำลังเข้าสู่ระบบ...' : 'ยืนยันการเข้าสู่ระบบ'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
