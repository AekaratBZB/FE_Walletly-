import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { FutureWalletLogo } from './FutureWalletLogo';
import { SocialButtons } from './SocialButtons';
import { AuthNotice } from './AuthNotice';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import './auth.css';

export const AuthView = () => {
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

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [notice, setNotice] = useState(null); // { type, message } | null
  const [prefillEmail, setPrefillEmail] = useState(savedEmail || '');

  const isLogin = mode === 'login';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setNotice(null);
  };

  const showError = (message) => setNotice({ type: 'error', message });

  const handleLogin = async ({ email, password, rememberMe }) => {
    setNotice(null);
    const res = await login(email, password, rememberMe);
    if (res.success) addToast(`ยินดีต้อนรับ ${res.user.name}`, 'success');
    else showError(res.error);
  };

  const handleRegister = async ({ fullName, email, password }) => {
    setNotice(null);
    const res = await register(fullName, email, password);
    if (!res.success) {
      showError(res.error);
      return;
    }
    if (res.pendingVerification) {
      // ต้องกดลิงก์ยืนยันในอีเมลก่อน จึงพากลับไปหน้า login พร้อมอีเมลที่กรอกไว้
      setPrefillEmail(email);
      setMode('login');
      setNotice({ type: 'success', message: `${res.message} (หากไม่พบ ให้ตรวจสอบโฟลเดอร์ Spam)` });
      return;
    }
    addToast(`สร้างบัญชีสำเร็จ ยินดีต้อนรับ ${res.user.name}`, 'success');
  };

  const handleSocialToken = async (provider, token) => {
    setNotice(null);
    const res = await loginWithSocial(provider, token);
    if (res.success) addToast(`ยินดีต้อนรับ ${res.user.name}`, 'success');
    else showError(res.error);
  };

  const handleGuest = () => {
    const res = loginAsGuest();
    if (res.success) addToast('เข้าใช้งานแบบผู้เยี่ยมชม ข้อมูลจะเก็บไว้ในเครื่องนี้เท่านั้น', 'info');
  };

  // แสดงข้อความทีละอัน: สถานะยืนยันอีเมลจากลิงก์มาก่อนข้อความของฟอร์ม
  const activeNotice =
    emailVerification?.status === 'verifying'
      ? { type: 'info', message: 'กำลังยืนยันอีเมล... (ครั้งแรกอาจใช้เวลาประมาณ 1 นาที)' }
      : emailVerification?.status === 'error'
      ? { type: 'error', message: emailVerification.message, onClose: clearEmailVerification }
      : notice
      ? { ...notice, onClose: () => setNotice(null) }
      : null;

  return (
    <div className="future-auth-overlay">
      <div className="future-auth-card" key={mode}>
        <div className="auth-brand-header">
          <div className="auth-brand-logo-icon">
            <FutureWalletLogo size={32} />
          </div>
          <span className="auth-brand-name">Future Wallet</span>
        </div>

        <h1 className="auth-card-title">{isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}</h1>

        <SocialButtons mode={mode} disabled={isAuthLoading} onToken={handleSocialToken} />

        {activeNotice && <AuthNotice {...activeNotice} />}

        {isLogin ? (
          <LoginForm initialEmail={prefillEmail} isLoading={isAuthLoading} onSubmit={handleLogin} />
        ) : (
          <RegisterForm isLoading={isAuthLoading} onSubmit={handleRegister} />
        )}

        <div className="auth-footer-switch">
          <span>{isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}</span>
          <button
            type="button"
            className="auth-switch-link-btn"
            onClick={() => switchMode(isLogin ? 'register' : 'login')}
          >
            {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </div>

        {isLogin && (
          <button type="button" className="auth-guest-link" onClick={handleGuest}>
            ทดลองใช้แบบไม่สมัครสมาชิก
          </button>
        )}
      </div>
    </div>
  );
};
