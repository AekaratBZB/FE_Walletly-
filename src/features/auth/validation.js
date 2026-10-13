/**
 * Pure form validation for the auth screens. Register rules mirror the BE
 * RegisterCommandValidator so users see the error before the round trip.
 */

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MAX_PASSWORD_BYTES = 72; // bcrypt limit on the BE

const validateEmail = (email) => {
  const trimmed = (email || '').trim();
  if (!trimmed) return 'กรุณากรอกอีเมล';
  if (!EMAIL_PATTERN.test(trimmed)) return 'รูปแบบอีเมลไม่ถูกต้อง';
  return null;
};

const withoutEmpty = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

export const validateLogin = ({ email, password }) =>
  withoutEmpty({
    email: validateEmail(email),
    password: password ? null : 'กรุณากรอกรหัสผ่าน'
  });

const validateNewPassword = (password) => {
  if (!password) return 'กรุณากรอกรหัสผ่าน';
  if (password.length < 8) return 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อยอย่างละ 1 ตัว';
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) return 'รหัสผ่านยาวเกินไป';
  return null;
};

export const validateRegister = ({ fullName, email, password }) =>
  withoutEmpty({
    fullName: (fullName || '').trim() ? null : 'กรุณาระบุชื่อเต็ม',
    email: validateEmail(email),
    password: validateNewPassword(password)
  });

const STRENGTH_LABELS = ['อ่อนมาก', 'อ่อน', 'ปานกลาง', 'ค่อนข้างแข็งแรง', 'ปลอดภัยสูงสุด'];

export const passwordStrength = (password) => {
  if (!password) return { score: 0, label: 'ยังไม่ได้ระบุ' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8 && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 10) score++;
  return { score, label: STRENGTH_LABELS[score] };
};
