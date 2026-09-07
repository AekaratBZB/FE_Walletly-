import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
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

export const AuthView = ({ onAuthSuccess }) => {
  const { login, register, loginWithSocial, loginAsGuest, savedEmail } = useAuth();
  const { addToast } = useWallet();

  // Active Auth Screen mode ('login' | 'register') - Default to login only
  const [authMode, setAuthMode] = useState('login');

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
  const handleLoginSubmit = (e) => {
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
    const res = login(loginEmail, loginPassword, rememberMe);
    if (res.success) {
      addToast(`ยินดีต้อนรับกลับ ${res.user.name}! เข้าสู่ระบบสำเร็จ`, 'success');
      if (onAuthSuccess) onAuthSuccess(res.user);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e) => {
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
    if (!regPassword) {
      errors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (regPassword.length < 6) {
      errors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegErrors({});
    const res = register(regFullName, regEmail, regPassword);
    if (res.success) {
      addToast(`สร้างบัญชี ${res.user.name} สำเร็จ! ยินดีต้อนรับสู่ Future Wallet`, 'success');
      if (onAuthSuccess) onAuthSuccess(res.user);
    }
  };

  // Handle Social Login
  const handleSocial = (provider) => {
    const res = loginWithSocial(provider);
    if (res.success) {
      addToast(`เข้าสู่ระบบด้วย ${provider === 'google' ? 'Google' : 'Facebook'} สำเร็จ!`, 'success');
      if (onAuthSuccess) onAuthSuccess(res.user);
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

            {/* Social Buttons */}
            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-btn"
                onClick={() => handleSocial('google')}
              >
                <GoogleIcon />
                <span>เข้าสู่ระบบด้วย Google</span>
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

            {/* Login Form */}
            <form className="auth-form" onSubmit={handleLoginSubmit}>
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
              <button type="submit" className="auth-submit-btn">
                เข้าสู่ระบบ (Login)
              </button>
            </form>

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
              <button type="submit" className="auth-submit-btn">
                สมัครใช้งาน (Register)
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
    </div>
  );
};
