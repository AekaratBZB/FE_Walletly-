import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { validateLogin } from './validation';

export const LoginForm = ({ initialEmail = '', isLoading, onSubmit }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({ email: email.trim(), password, rememberMe });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className={`auth-input-group ${errors.email ? 'has-error' : ''}`}>
        <span className="auth-input-icon">
          <Mail size={18} />
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="auth-input-field"
          placeholder="อีเมล"
          aria-label="อีเมล"
          aria-invalid={!!errors.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {errors.email && <div className="auth-field-error">{errors.email}</div>}

      <div className={`auth-input-group ${errors.password ? 'has-error' : ''}`}>
        <span className="auth-input-icon">
          <Lock size={18} />
        </span>
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          className="auth-input-field"
          placeholder="รหัสผ่าน"
          aria-label="รหัสผ่าน"
          aria-invalid={!!errors.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {errors.password && <div className="auth-field-error">{errors.password}</div>}

      <div className="auth-options-row">
        <label className="auth-toggle-label">
          <div className="auth-toggle-switch">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="auth-toggle-slider" />
          </div>
          <span>จดจำอีเมล</span>
        </label>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
        {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
};
