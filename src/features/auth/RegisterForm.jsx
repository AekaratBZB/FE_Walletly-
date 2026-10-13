import React, { useMemo, useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { validateRegister, passwordStrength } from './validation';

const STRENGTH_BAR_CLASSES = ['weak-red', 'weak-orange', 'medium-yellow', 'strong-green'];
const STRENGTH_COLORS = ['#9ca3af', '#ef4444', '#f97316', '#eab308', '#10b981'];

export const RegisterForm = ({ isLoading, onSubmit }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateRegister({ fullName, email, password });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({ fullName: fullName.trim(), email: email.trim(), password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className={`auth-input-group ${errors.fullName ? 'has-error' : ''}`}>
        <span className="auth-input-icon">
          <User size={18} />
        </span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          className="auth-input-field"
          placeholder="ชื่อ-นามสกุล"
          aria-label="ชื่อ-นามสกุล"
          aria-invalid={!!errors.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      {errors.fullName && <div className="auth-field-error">{errors.fullName}</div>}

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
          name="new-password"
          autoComplete="new-password"
          className="auth-input-field"
          placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว มีตัวอักษรและตัวเลข)"
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

      <div className="password-strength-container">
        <div className="password-strength-bars">
          {STRENGTH_BAR_CLASSES.map((className, index) => (
            <div key={className} className={`password-strength-bar ${strength.score > index ? className : ''}`} />
          ))}
        </div>
        <div className="password-strength-label">
          <span>ความแข็งแรงของรหัสผ่าน</span>
          {password && (
            <span className="password-strength-status" style={{ color: STRENGTH_COLORS[strength.score] }}>
              {strength.label}
            </span>
          )}
        </div>
      </div>

      <button type="submit" className="auth-submit-btn" disabled={isLoading}>
        {isLoading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
      </button>
    </form>
  );
};
