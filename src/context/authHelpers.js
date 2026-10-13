/**
 * Pure helpers for AuthContext: error mapping, BE DTO → user, and restoring
 * the persisted user safely.
 */

export const CONNECTION_ERROR = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง';
export const TOO_MANY_ATTEMPTS = 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
export const INVALID_CREDENTIALS = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';

// apiClient ใช้ข้อความ "HTTP <status>: ..." เมื่อ BE ไม่ได้ส่ง message มา
const isGenericHttpMessage = (message) => !message || /^HTTP \d+/.test(message);

export const toAuthError = (err, { fallback, unauthorized = INVALID_CREDENTIALS } = {}) => {
  const status = err?.status;
  if (!status || status >= 500) return CONNECTION_ERROR;
  if (status === 429) return TOO_MANY_ATTEMPTS;
  if (!isGenericHttpMessage(err.message)) return err.message;
  if (status === 401) return unauthorized;
  return fallback;
};

export const toUserData = (dto, extra = {}) => ({
  id: dto.id,
  name: dto.displayName || (dto.email ? dto.email.split('@')[0] : 'ผู้ใช้งาน'),
  email: dto.email,
  avatarUrl: dto.avatarUrl || null,
  isGuest: false,
  ...extra
});

// ผู้ใช้ที่ไม่ใช่ guest ต้องมี token เสมอ: ผู้ใช้ "offline" จากเวอร์ชันเก่าจะถูกพากลับไปหน้า login
export const restoreStoredUser = (raw, hasToken) => {
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user) return null;
    return user.isGuest || hasToken ? user : null;
  } catch {
    return null;
  }
};
