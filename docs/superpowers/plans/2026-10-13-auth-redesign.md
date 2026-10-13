# Auth Redesign & Real Social Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cluttered, partly fake login screen with one clear flow where email login/register work against the BE and Google/Facebook sign-in send real provider tokens.

**Architecture:** Pure helpers (`validation.js`, `authHelpers.js`, `socialConfig.js`) carry the logic and are unit-tested. `AuthContext` keeps owning session state but loses every offline/fake fallback. `AuthView` becomes a small shell composing `SocialButtons`, `AuthNotice`, `LoginForm`, `RegisterForm`; provider SDKs load lazily only when their env ID is set.

**Tech Stack:** React 18, Vite 6, Vitest 4 (node environment, no jsdom), lucide-react, Google Identity Services, Facebook JS SDK.

**Spec:** `docs/superpowers/specs/2026-10-13-auth-redesign-design.md`

## Global Constraints

- Brand name in UI: **Future Wallet**.
- UI copy in Thai.
- Env vars: `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID`, `VITE_FACEBOOK_API_VERSION` (default `v21.0`). Empty/unset = provider button not rendered.
- BE endpoints: `POST /auth/google { idToken }`, `POST /auth/facebook { accessToken }`. Never send email/displayName/avatarUrl for social login.
- Facebook scope: `public_profile,email`. Google button: official `renderButton`, `ux_mode: 'popup'`, no One Tap.
- No offline login fallback anywhere. Only Guest mode may sign in without a BE token.
- Test account (`test.user@walletly.app` / `Password123!`) appears only when `import.meta.env.DEV` is true and must not appear in `dist/`.
- Register password rule (matches BE `RegisterCommandValidator`): ≥ 8 chars, at least one ASCII letter and one digit, ≤ 72 UTF-8 bytes.
- No App Secret in any FE file.
- Code style: 2-space indent, single quotes, semicolons, no trailing commas, named arrow-function exports.
- Tests live in `__tests__/` beside the code, `*.test.js`, run with `npm test`.

## Review Focus

1. A user still holding a pre-upgrade "offline" user (no token, `isGuest: false`) in localStorage should land on the login screen, not inside the app with every API call failing. → Task 2 `restoreStoredUser` tests.
2. Email typed with leading/trailing spaces should validate and be sent trimmed. → Task 1 test.
3. A rate-limited request (429, body-less `HTTP 429: Too Many Requests`) should show a Thai "too many attempts" message, not the raw HTTP string. → Task 2 test.
4. BE 400 validation errors (joined `errors[]` text from `apiClient`) should reach the user verbatim. → Task 2 test.
5. A Thai-character password whose UTF-8 size exceeds 72 bytes while under 72 characters should be rejected before hitting the BE. → Task 1 test.

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/auth/validation.js` | Create | `validateLogin`, `validateRegister`, `passwordStrength` |
| `src/features/auth/__tests__/validation.test.js` | Create | tests |
| `src/context/authHelpers.js` | Create | `toAuthError`, `toUserData`, `restoreStoredUser`, message constants |
| `src/context/__tests__/authHelpers.test.js` | Create | tests |
| `src/context/AuthContext.jsx` | Rewrite | session state; no fallbacks |
| `src/shared/api/authApi.js` | Modify `loginSocial` | token-only body |
| `src/features/auth/social/socialConfig.js` | Create | env → enabled flags |
| `src/features/auth/social/__tests__/socialConfig.test.js` | Create | tests |
| `src/features/auth/social/loadScript.js` | Create | inject script once |
| `src/features/auth/social/googleAuth.js` | Create | GIS init + render button |
| `src/features/auth/social/facebookAuth.js` | Create | FB SDK init + login popup |
| `src/features/auth/SocialButtons.jsx` | Create | provider buttons + divider |
| `src/features/auth/AuthNotice.jsx` | Create | single notice box |
| `src/features/auth/FutureWalletLogo.jsx` | Create | logo (moved) |
| `src/features/auth/LoginForm.jsx` | Create | login form + DEV box |
| `src/features/auth/RegisterForm.jsx` | Create | register form + strength bar |
| `src/features/auth/AuthView.jsx` | Rewrite | shell |
| `src/features/auth/auth.css` | Rewrite | all auth styles |
| `.env.example` | Modify | new env vars |

---

### Task 1: Form validation module

**Files:**
- Create: `src/features/auth/validation.js`
- Test: `src/features/auth/__tests__/validation.test.js`

**Interfaces:**
- Produces:
  - `validateLogin({ email: string, password: string }) => { email?: string, password?: string }`
  - `validateRegister({ fullName: string, email: string, password: string }) => { fullName?, email?, password? }`
  - `passwordStrength(password: string) => { score: 0|1|2|3|4, label: string }`

- [ ] **Step 1: Write the failing test**

`src/features/auth/__tests__/validation.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateLogin, validateRegister, passwordStrength } from '../validation';

describe('validateLogin', () => {
  it('requires email and password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'กรุณากรอกอีเมล',
      password: 'กรุณากรอกรหัสผ่าน'
    });
  });

  it('rejects malformed email', () => {
    expect(validateLogin({ email: 'not-an-email', password: 'x' }).email).toBe('รูปแบบอีเมลไม่ถูกต้อง');
  });

  it('accepts email with surrounding spaces', () => {
    expect(validateLogin({ email: '  user@example.com  ', password: 'secret' })).toEqual({});
  });

  it('treats whitespace-only email as empty', () => {
    expect(validateLogin({ email: '   ', password: 'x' }).email).toBe('กรุณากรอกอีเมล');
  });
});

describe('validateRegister', () => {
  const valid = { fullName: 'สมชาย ใจดี', email: 'a@b.co', password: 'abcd1234' };

  it('accepts valid input', () => {
    expect(validateRegister(valid)).toEqual({});
  });

  it('requires full name', () => {
    expect(validateRegister({ ...valid, fullName: '  ' }).fullName).toBe('กรุณาระบุชื่อเต็ม');
  });

  it('requires at least 8 characters', () => {
    expect(validateRegister({ ...valid, password: 'abc123' }).password).toBe(
      'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'
    );
  });

  it('requires a letter and a digit', () => {
    const message = 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษและตัวเลขอย่างน้อยอย่างละ 1 ตัว';
    expect(validateRegister({ ...valid, password: 'abcdefgh' }).password).toBe(message);
    expect(validateRegister({ ...valid, password: '12345678' }).password).toBe(message);
  });

  it('rejects passwords over 72 UTF-8 bytes even when under 72 characters', () => {
    const thaiHeavy = 'ก'.repeat(24) + 'a1'; // 26 chars, 74 bytes
    expect(thaiHeavy.length).toBeLessThan(72);
    expect(validateRegister({ ...valid, password: thaiHeavy }).password).toBe('รหัสผ่านยาวเกินไป');
  });
});

describe('passwordStrength', () => {
  it('returns 0 for empty password', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'ยังไม่ได้ระบุ' });
  });

  it('scores a long mixed password as 4', () => {
    expect(passwordStrength('Abcdefgh12!').score).toBe(4);
  });

  it('scores a short lowercase password low', () => {
    expect(passwordStrength('abcdef').score).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/auth/__tests__/validation.test.js`
Expected: FAIL — cannot resolve `../validation`.

- [ ] **Step 3: Write implementation**

`src/features/auth/validation.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/auth/__tests__/validation.test.js`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/validation.js src/features/auth/__tests__/validation.test.js
git commit -m "feat(auth): add pure login/register validation"
```

---

### Task 2: Auth helpers + AuthContext without fake fallbacks

**Files:**
- Create: `src/context/authHelpers.js`
- Test: `src/context/__tests__/authHelpers.test.js`
- Rewrite: `src/context/AuthContext.jsx`
- Modify: `src/shared/api/authApi.js` (`loginSocial`, lines 47-62)

**Interfaces:**
- Produces:
  - `toAuthError(err, { fallback: string, unauthorized?: string }) => string`
  - `toUserData(dto, extra?) => { id, name, email, avatarUrl, isGuest: false, ...extra }`
  - `restoreStoredUser(raw: string|null, hasToken: boolean) => object|null`
  - `CONNECTION_ERROR`, `TOO_MANY_ATTEMPTS`, `INVALID_CREDENTIALS` string constants
  - `useAuth().loginWithSocial(provider: 'google'|'facebook', token: string) => Promise<{ success: true, user } | { success: false, error: string }>`
  - `useAuth().login(email, password, rememberMe) => Promise<{ success: true, user } | { success: false, error }>`
  - `useAuth().register(fullName, email, password) => Promise<{ success: true, user } | { success: true, pendingVerification: true, message } | { success: false, error }>`
  - `authApi.loginSocial(provider, token) => Promise<AuthResponseDto>`

- [ ] **Step 1: Write the failing test**

`src/context/__tests__/authHelpers.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  toAuthError,
  toUserData,
  restoreStoredUser,
  CONNECTION_ERROR,
  TOO_MANY_ATTEMPTS,
  INVALID_CREDENTIALS
} from '../authHelpers';

const httpError = (status, message) => Object.assign(new Error(message), { status });

describe('toAuthError', () => {
  const opts = { fallback: 'fallback message' };

  it('maps network errors (no status) to connection error', () => {
    expect(toAuthError(new TypeError('Failed to fetch'), opts)).toBe(CONNECTION_ERROR);
  });

  it('maps 5xx to connection error even with a server message', () => {
    expect(toAuthError(httpError(503, 'Service Unavailable detail'), opts)).toBe(CONNECTION_ERROR);
  });

  it('maps body-less 429 to too-many-attempts', () => {
    expect(toAuthError(httpError(429, 'HTTP 429: Too Many Requests'), opts)).toBe(TOO_MANY_ATTEMPTS);
  });

  it('passes BE message through for 401', () => {
    expect(toAuthError(httpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'), opts)).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  });

  it('uses default unauthorized message when 401 has no body', () => {
    expect(toAuthError(httpError(401, 'HTTP 401: Unauthorized'), opts)).toBe(INVALID_CREDENTIALS);
  });

  it('uses custom unauthorized message when given', () => {
    expect(
      toAuthError(httpError(401, 'HTTP 401: Unauthorized'), { fallback: 'x', unauthorized: 'social failed' })
    ).toBe('social failed');
  });

  it('passes joined BE validation errors through for 400', () => {
    expect(toAuthError(httpError(400, 'Email ซ้ำ, รหัสผ่านสั้นไป'), opts)).toBe('Email ซ้ำ, รหัสผ่านสั้นไป');
  });

  it('uses fallback for body-less 4xx', () => {
    expect(toAuthError(httpError(404, 'HTTP 404: Not Found'), opts)).toBe('fallback message');
  });
});

describe('toUserData', () => {
  it('maps BE auth response', () => {
    expect(
      toUserData({ id: 'u1', email: 'a@b.co', displayName: 'Ann', avatarUrl: 'x.png' }, { loginAt: 't' })
    ).toEqual({ id: 'u1', name: 'Ann', email: 'a@b.co', avatarUrl: 'x.png', isGuest: false, loginAt: 't' });
  });

  it('falls back to email local part for name', () => {
    expect(toUserData({ id: 'u1', email: 'somchai@b.co' }).name).toBe('somchai');
  });
});

describe('restoreStoredUser', () => {
  const real = JSON.stringify({ id: 'u1', name: 'Ann', isGuest: false });
  const guest = JSON.stringify({ name: 'Guest', isGuest: true });

  it('restores a real user who still has a token', () => {
    expect(restoreStoredUser(real, true)).toEqual({ id: 'u1', name: 'Ann', isGuest: false });
  });

  it('drops a non-guest user without a token (legacy offline login)', () => {
    expect(restoreStoredUser(real, false)).toBeNull();
  });

  it('restores a guest without a token', () => {
    expect(restoreStoredUser(guest, false)).toEqual({ name: 'Guest', isGuest: true });
  });

  it('returns null for empty or corrupt storage', () => {
    expect(restoreStoredUser(null, true)).toBeNull();
    expect(restoreStoredUser('{not json', true)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/__tests__/authHelpers.test.js`
Expected: FAIL — cannot resolve `../authHelpers`.

- [ ] **Step 3: Write `src/context/authHelpers.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/context/__tests__/authHelpers.test.js`
Expected: PASS (14 tests).

- [ ] **Step 5: Change `authApi.loginSocial` to token-only**

In `src/shared/api/authApi.js` replace the whole `loginSocial` method (lines 47-62) with:

```js
  // BE ตรวจ token กับ Google / Facebook เอง และไม่ใช้ email / ชื่อที่ FE ส่งมา
  async loginSocial(provider, token) {
    const endpoint = provider === 'facebook' ? '/auth/facebook' : '/auth/google';
    const body = provider === 'facebook' ? { accessToken: token } : { idToken: token };

    const data = await apiClient(endpoint, {
      method: 'POST',
      body
    });
    if (data.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },
```

- [ ] **Step 6: Rewrite `src/context/AuthContext.jsx`**

Replace the whole file with:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredToken, healthApi } from '../shared/api';
import { toAuthError, toUserData, restoreStoredUser } from './authHelpers';

const AUTH_STORAGE_KEY = 'future_wallet_auth_user';
const REMEMBER_ME_KEY = 'future_wallet_remember_email';

const PROVIDER_NAMES = { google: 'Google', facebook: 'Facebook' };

export const clearMockLocalStorage = () => {
  try {
    localStorage.removeItem('finsmart_transactions_v1');
    localStorage.removeItem('finsmart_fixed_costs_v1');
    localStorage.removeItem('finsmart_savings_goals_v1');
    localStorage.removeItem('finsmart_debts_v1');
  } catch (e) {
    console.error('Failed to clear mock storage:', e);
  }
};

const persistUser = (userData) => {
  try {
    if (userData) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to persist user auth state:', e);
  }
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const AuthContext = createContext();

// token ยืนยันอีเมลใช้ได้ครั้งเดียว: กันเรียกซ้ำเมื่อ effect รันสองรอบ (React.StrictMode)
let pendingEmailVerification = null;
const verifyEmailOnce = (token) => {
  if (pendingEmailVerification?.token !== token) {
    pendingEmailVerification = { token, promise: authApi.verifyEmail(token) };
  }
  return pendingEmailVerification.promise;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => restoreStoredUser(readStorage(AUTH_STORAGE_KEY), !!getStoredToken()));
  const [savedEmail, setSavedEmail] = useState(() => readStorage(REMEMBER_ME_KEY) || '');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ลิงก์ยืนยันอีเมล: {VITE_APP_URL}/verify-email?token=...
  const [emailVerification, setEmailVerification] = useState(() => {
    const isVerifyPath = window.location.pathname.replace(/\/+$/, '') === '/verify-email';
    const token = new URLSearchParams(window.location.search).get('token');
    return isVerifyPath && token ? { status: 'verifying', token, message: '' } : null;
  });

  const rememberEmail = (email) => {
    try {
      if (email) localStorage.setItem(REMEMBER_ME_KEY, email);
      else localStorage.removeItem(REMEMBER_ME_KEY);
    } catch (e) {
      console.error('Failed to store remembered email:', e);
    }
    setSavedEmail(email || '');
  };

  // ใช้หลัง BE ออก token ให้แล้วเท่านั้น
  const signIn = (dto, extra) => {
    clearMockLocalStorage();
    const userData = toUserData(dto, extra);
    setUser(userData);
    persistUser(userData);
    setBackendStatus('connected');
    return userData;
  };

  const runAuth = async (action) => {
    setIsAuthLoading(true);
    try {
      return await action();
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Check Backend health and verify user token on app mount
  useEffect(() => {
    let isMounted = true;

    const verifyEmailFromLink = async (token) => {
      // ลบ token ออกจาก URL ทันที ไม่ให้ค้างใน history / ถูกแชร์ต่อ
      window.history.replaceState(null, '', '/');
      try {
        const data = await verifyEmailOnce(token);
        if (!isMounted) return;
        signIn(data, { registeredAt: new Date().toISOString() });
        rememberEmail(data.email);
        setEmailVerification({ status: 'success', message: 'ยืนยันอีเมลสำเร็จ ยินดีต้อนรับสู่ Future Wallet!' });
      } catch (err) {
        if (!isMounted) return;
        setEmailVerification({
          status: 'error',
          message: err?.message || 'ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว'
        });
      }
    };

    if (emailVerification?.status === 'verifying') {
      verifyEmailFromLink(emailVerification.token);
    }

    const verifySession = async () => {
      try {
        await healthApi.check();
        if (isMounted) setBackendStatus('connected');

        if (getStoredToken()) {
          try {
            const me = await authApi.getMe();
            if (isMounted && me) {
              const updatedUser = toUserData(me, { isGuest: me.isGuest || false, lastLoginAt: me.lastLoginAt });
              setUser(updatedUser);
              persistUser(updatedUser);
            }
          } catch (err) {
            console.warn('Session verification failed:', err);
            if (err?.status === 401) {
              authApi.logout();
              clearMockLocalStorage();
              persistUser(null);
              if (isMounted) setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable:', err);
        if (isMounted) setBackendStatus('offline');
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (email, password, rememberMe = true) =>
    runAuth(async () => {
      try {
        const data = await authApi.login(email, password);
        const userData = signIn(data, { loginAt: new Date().toISOString() });
        rememberEmail(rememberMe ? email : '');
        return { success: true, user: userData };
      } catch (err) {
        console.warn('Login failed:', err);
        return { success: false, error: toAuthError(err, { fallback: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }) };
      }
    });

  const register = (fullName, email, password) =>
    runAuth(async () => {
      try {
        const data = await authApi.register(fullName, email, password);

        // BE เปิดยืนยันอีเมล: ยังไม่มีบัญชี/token จนกว่าผู้ใช้จะกดลิงก์ในอีเมล
        if (!data?.accessToken) {
          rememberEmail(email);
          setBackendStatus('connected');
          return {
            success: true,
            pendingVerification: true,
            message: data?.message || 'เราได้ส่งลิงก์ยืนยันไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย'
          };
        }

        const userData = signIn(data, { registeredAt: new Date().toISOString() });
        rememberEmail(email);
        return { success: true, user: userData };
      } catch (err) {
        console.warn('Register failed:', err);
        return { success: false, error: toAuthError(err, { fallback: 'ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบข้อมูล' }) };
      }
    });

  // token = Google ID token หรือ Facebook access token จาก SDK จริง
  const loginWithSocial = (provider, token) =>
    runAuth(async () => {
      try {
        const data = await authApi.loginSocial(provider, token);
        const userData = signIn(data, { provider, loginAt: new Date().toISOString() });
        return { success: true, user: userData };
      } catch (err) {
        console.warn(`${provider} login failed:`, err);
        const message = `เข้าสู่ระบบด้วย ${PROVIDER_NAMES[provider] || provider} ไม่สำเร็จ กรุณาลองใหม่หรือใช้อีเมล`;
        return { success: false, error: toAuthError(err, { fallback: message, unauthorized: message }) };
      }
    });

  const loginAsGuest = () => {
    const guestUser = {
      name: 'ผู้เยี่ยมชม (Guest)',
      email: 'guest@futurewallet.app',
      isGuest: true,
      loginAt: new Date().toISOString()
    };

    setUser(guestUser);
    persistUser(guestUser);
    return { success: true, user: guestUser };
  };

  const logout = () => {
    authApi.logout();
    clearMockLocalStorage();
    setUser(null);
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        savedEmail,
        backendStatus,
        isAuthLoading,
        emailVerification,
        clearEmailVerification: () => setEmailVerification(null),
        login,
        register,
        loginWithSocial,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

- [ ] **Step 7: Run all tests and build**

Run: `npm test`
Expected: all PASS.
Run: `npm run build`
Expected: build succeeds. (The old `AuthView.jsx` still compiles; its fake social modal now sends an object as token and gets a BE error notice — replaced in Task 4.)

- [ ] **Step 8: Commit**

```bash
git add src/context/authHelpers.js src/context/__tests__/authHelpers.test.js src/context/AuthContext.jsx src/shared/api/authApi.js
git commit -m "fix(auth): remove fake offline login and send real social tokens"
```

---

### Task 3: Social provider modules and SocialButtons

**Files:**
- Create: `src/features/auth/social/socialConfig.js`
- Test: `src/features/auth/social/__tests__/socialConfig.test.js`
- Create: `src/features/auth/social/loadScript.js`
- Create: `src/features/auth/social/googleAuth.js`
- Create: `src/features/auth/social/facebookAuth.js`
- Create: `src/features/auth/SocialButtons.jsx`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `getSocialConfig(env?) => { googleClientId, facebookAppId, facebookApiVersion, isGoogleEnabled, isFacebookEnabled, isAnyEnabled }`
  - `loadScript(src: string) => Promise<void>` (cached per src; cache cleared on failure)
  - `renderGoogleButton(el: HTMLElement, { clientId, text: 'signin_with'|'signup_with', onCredential(idToken) }) => Promise<void>`
  - `initFacebook({ appId, version }) => Promise<void>`; `loginWithFacebookPopup() => Promise<string|null>`
  - `<SocialButtons mode="login"|"register" disabled={bool} onToken={(provider, token) => void} onError={(message) => void} />` — renders nothing when no provider is enabled; renders the divider when at least one is.

- [ ] **Step 1: Write the failing test**

`src/features/auth/social/__tests__/socialConfig.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getSocialConfig } from '../socialConfig';

describe('getSocialConfig', () => {
  it('disables everything when env is empty', () => {
    expect(getSocialConfig({})).toMatchObject({
      isGoogleEnabled: false,
      isFacebookEnabled: false,
      isAnyEnabled: false,
      facebookApiVersion: 'v21.0'
    });
  });

  it('treats whitespace-only values as unset', () => {
    const config = getSocialConfig({ VITE_GOOGLE_CLIENT_ID: '   ', VITE_FACEBOOK_APP_ID: ' ' });
    expect(config.isAnyEnabled).toBe(false);
  });

  it('enables providers independently and trims ids', () => {
    const config = getSocialConfig({ VITE_GOOGLE_CLIENT_ID: ' abc.apps.googleusercontent.com ' });
    expect(config).toMatchObject({
      googleClientId: 'abc.apps.googleusercontent.com',
      isGoogleEnabled: true,
      isFacebookEnabled: false,
      isAnyEnabled: true
    });
  });

  it('uses custom facebook api version when set', () => {
    const config = getSocialConfig({ VITE_FACEBOOK_APP_ID: '123', VITE_FACEBOOK_API_VERSION: 'v22.0' });
    expect(config).toMatchObject({ facebookAppId: '123', facebookApiVersion: 'v22.0', isFacebookEnabled: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/auth/social/__tests__/socialConfig.test.js`
Expected: FAIL — cannot resolve `../socialConfig`.

- [ ] **Step 3: Write `src/features/auth/social/socialConfig.js`**

```js
/**
 * Social login config from Vite env. Client ID / App ID are public values;
 * an unset value hides that provider's button.
 */

const DEFAULT_FACEBOOK_API_VERSION = 'v21.0';

const readValue = (env, key) => String(env?.[key] || '').trim();

export const getSocialConfig = (env = import.meta.env) => {
  const googleClientId = readValue(env, 'VITE_GOOGLE_CLIENT_ID');
  const facebookAppId = readValue(env, 'VITE_FACEBOOK_APP_ID');
  return {
    googleClientId,
    facebookAppId,
    facebookApiVersion: readValue(env, 'VITE_FACEBOOK_API_VERSION') || DEFAULT_FACEBOOK_API_VERSION,
    isGoogleEnabled: !!googleClientId,
    isFacebookEnabled: !!facebookAppId,
    isAnyEnabled: !!googleClientId || !!facebookAppId
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/auth/social/__tests__/socialConfig.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `src/features/auth/social/loadScript.js`**

```js
const pending = new Map();

/** Injects a script once per src. A failed load is forgotten so a retry can try again. */
export const loadScript = (src) => {
  if (!pending.has(src)) {
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        pending.delete(src);
        script.remove();
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    });
    pending.set(src, promise);
  }
  return pending.get(src);
};
```

- [ ] **Step 6: Write `src/features/auth/social/googleAuth.js`**

```js
import { loadScript } from './loadScript';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const MAX_BUTTON_WIDTH = 400; // GIS limit

let initializedClientId = null;
// GIS ให้ initialize ได้ครั้งเดียว: callback ชี้ไปที่ handler ล่าสุดของปุ่มที่แสดงอยู่
let credentialHandler = null;

/**
 * Renders Google's official sign-in button into `el`.
 * `onCredential` receives the ID token that the BE verifies at /auth/google.
 */
export const renderGoogleButton = async (el, { clientId, text = 'signin_with', onCredential }) => {
  await loadScript(GIS_SRC);
  credentialHandler = onCredential;

  if (initializedClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => credentialHandler?.(response.credential),
      ux_mode: 'popup',
      auto_select: false
    });
    initializedClientId = clientId;
  }

  el.innerHTML = '';
  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    text,
    logo_alignment: 'center',
    locale: 'th',
    width: Math.min(el.offsetWidth || MAX_BUTTON_WIDTH, MAX_BUTTON_WIDTH)
  });
};
```

- [ ] **Step 7: Write `src/features/auth/social/facebookAuth.js`**

```js
import { loadScript } from './loadScript';

const FB_SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';

let initPromise = null;

/** Loads and initialises the Facebook SDK once. */
export const initFacebook = ({ appId, version }) => {
  if (!initPromise) {
    initPromise = loadScript(FB_SDK_SRC)
      .then(() => {
        window.FB.init({ appId, version, cookie: false, xfbml: false });
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
};

/**
 * Opens the Facebook login popup. Call it directly inside a click handler
 * (after initFacebook resolved) or the browser blocks the popup.
 * Resolves the access token, or null when the user cancels.
 */
export const loginWithFacebookPopup = () =>
  new Promise((resolve) => {
    window.FB.login((response) => resolve(response?.authResponse?.accessToken || null), {
      scope: 'public_profile,email'
    });
  });
```

- [ ] **Step 8: Write `src/features/auth/SocialButtons.jsx`**

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { getSocialConfig } from './social/socialConfig';
import { renderGoogleButton } from './social/googleAuth';
import { initFacebook, loginWithFacebookPopup } from './social/facebookAuth';

const socialConfig = getSocialConfig();

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      fill="#FFFFFF"
      d="M15.15 12.35l.43-2.8h-2.68v-1.82c0-.77.38-1.52 1.59-1.52h1.23V3.82c-.74-.1-1.63-.16-2.52-.16-2.57 0-4.25 1.56-4.25 4.38v2.01h-2.45v2.8h2.45v6.78c.5.08 1 .12 1.52.12s1.02-.04 1.52-.12v-6.78h2.66z"
    />
  </svg>
);

/**
 * Google + Facebook buttons. Hidden entirely when neither provider is configured.
 * Reports provider tokens through onToken(provider, token).
 */
export const SocialButtons = ({ mode = 'login', disabled = false, onToken, onError }) => {
  const googleRef = useRef(null);
  const [isFacebookReady, setIsFacebookReady] = useState(false);

  // เก็บ callback ล่าสุดโดยไม่ต้อง render ปุ่ม Google ใหม่ทุกครั้งที่ parent render
  const callbacksRef = useRef({ onToken, onError });
  callbacksRef.current = { onToken, onError };

  useEffect(() => {
    if (!socialConfig.isGoogleEnabled || !googleRef.current) return undefined;
    let cancelled = false;
    renderGoogleButton(googleRef.current, {
      clientId: socialConfig.googleClientId,
      text: mode === 'register' ? 'signup_with' : 'signin_with',
      onCredential: (idToken) => callbacksRef.current.onToken?.('google', idToken)
    }).catch(() => {
      if (!cancelled) callbacksRef.current.onError?.('ไม่สามารถโหลด Google ได้ กรุณาลองใหม่หรือใช้อีเมล');
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!socialConfig.isFacebookEnabled) return undefined;
    let cancelled = false;
    initFacebook({ appId: socialConfig.facebookAppId, version: socialConfig.facebookApiVersion })
      .then(() => {
        if (!cancelled) setIsFacebookReady(true);
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onError?.('ไม่สามารถโหลด Facebook ได้ กรุณาลองใหม่หรือใช้อีเมล');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!socialConfig.isAnyEnabled) return null;

  const handleFacebookClick = async () => {
    const accessToken = await loginWithFacebookPopup();
    if (accessToken) callbacksRef.current.onToken?.('facebook', accessToken);
  };

  const isRegister = mode === 'register';

  return (
    <>
      <div className={`auth-social-buttons${disabled ? ' is-disabled' : ''}`} aria-busy={disabled}>
        {socialConfig.isGoogleEnabled && <div ref={googleRef} className="auth-google-btn" />}
        {socialConfig.isFacebookEnabled && (
          <button
            type="button"
            className="auth-social-btn facebook-btn"
            onClick={handleFacebookClick}
            disabled={disabled || !isFacebookReady}
          >
            <FacebookIcon />
            <span>{isRegister ? 'สมัครด้วย Facebook' : 'ดำเนินการต่อด้วย Facebook'}</span>
          </button>
        )}
      </div>
      <div className="auth-divider">
        <span>{isRegister ? 'หรือสมัครด้วยอีเมล' : 'หรือใช้อีเมล'}</span>
      </div>
    </>
  );
};
```

- [ ] **Step 9: Add env vars to `.env.example`**

Append to `.env.example`:

```
# Google OAuth Web Client ID (ค่าสาธารณะ) — ไม่ตั้ง = ซ่อนปุ่ม Google
# ต้องเพิ่ม origin ของ FE (เช่น http://localhost:3000) ใน Authorized JavaScript origins
VITE_GOOGLE_CLIENT_ID=
# Facebook App ID (ค่าสาธารณะ) — ไม่ตั้ง = ซ่อนปุ่ม Facebook
# App Secret ใส่ที่ BE เท่านั้น (SocialAuth:FacebookAppSecret) ห้ามใส่ใน FE
VITE_FACEBOOK_APP_ID=
# Graph API version ของ Facebook SDK (ค่าเริ่มต้น v21.0)
VITE_FACEBOOK_API_VERSION=
```

- [ ] **Step 10: Run tests and build**

Run: `npm test` — Expected: all PASS.
Run: `npm run build` — Expected: succeeds (SocialButtons not yet imported; tree-shaken).

- [ ] **Step 11: Commit**

```bash
git add src/features/auth/social src/features/auth/SocialButtons.jsx .env.example
git commit -m "feat(auth): add real Google Identity Services and Facebook SDK buttons"
```

---

### Task 4: New auth UI (shell, forms, notice, styles)

**Files:**
- Create: `src/features/auth/AuthNotice.jsx`
- Create: `src/features/auth/FutureWalletLogo.jsx`
- Create: `src/features/auth/LoginForm.jsx`
- Create: `src/features/auth/RegisterForm.jsx`
- Rewrite: `src/features/auth/AuthView.jsx`
- Rewrite: `src/features/auth/auth.css`

**Interfaces:**
- Consumes: `validateLogin`, `validateRegister`, `passwordStrength` (Task 1); `useAuth()` `login/register/loginWithSocial/loginAsGuest/savedEmail/isAuthLoading/emailVerification/clearEmailVerification` (Task 2); `<SocialButtons mode disabled onToken onError />` (Task 3); `useWallet().addToast(message, 'success'|'info'|'danger'|'warning')`.
- Produces:
  - `<AuthNotice type="info"|"success"|"error" message onClose? />`
  - `<FutureWalletLogo size? />`
  - `<LoginForm initialEmail isLoading onSubmit({ email, password, rememberMe }) />`
  - `<RegisterForm isLoading onSubmit({ fullName, email, password }) />`
  - `<AuthView />` (no props; `App.jsx` unchanged)

- [ ] **Step 1: Write `src/features/auth/AuthNotice.jsx`**

```jsx
import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS = { info: Info, success: CheckCircle2, error: AlertCircle };

export const AuthNotice = ({ type = 'info', message, onClose }) => {
  if (!message) return null;
  const Icon = ICONS[type] || Info;
  return (
    <div className={`auth-notice auth-notice-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={16} className="auth-notice-icon" aria-hidden="true" />
      <span className="auth-notice-text">{message}</span>
      {onClose && (
        <button type="button" className="auth-notice-close" onClick={onClose} aria-label="ปิด">
          <X size={14} />
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Write `src/features/auth/FutureWalletLogo.jsx`**

```jsx
import React from 'react';

export const FutureWalletLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M5 11.5L9.5 22.5L14 13.5L18.5 22.5L24.5 9"
      stroke="#059669"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19.5 9H24.5V14" stroke="#059669" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

- [ ] **Step 3: Write `src/features/auth/LoginForm.jsx`**

```jsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { validateLogin } from './validation';

// Vite แทน import.meta.env.DEV เป็น false ตอน build จึงตัดบัญชีทดสอบออกจาก bundle production
const DEV_TEST_ACCOUNT = import.meta.env.DEV
  ? { email: 'test.user@walletly.app', password: 'Password123!' }
  : null;

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

  const fillTestAccount = () => {
    setEmail(DEV_TEST_ACCOUNT.email);
    setPassword(DEV_TEST_ACCOUNT.password);
    setErrors({});
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

      {DEV_TEST_ACCOUNT && (
        <div className="auth-dev-box">
          <div>
            <div className="auth-dev-box-title">บัญชีทดสอบ (แสดงเฉพาะ dev)</div>
            <div>{DEV_TEST_ACCOUNT.email}</div>
          </div>
          <button type="button" className="auth-dev-box-btn" onClick={fillTestAccount}>
            กรอกอัตโนมัติ
          </button>
        </div>
      )}
    </form>
  );
};
```

- [ ] **Step 4: Write `src/features/auth/RegisterForm.jsx`**

```jsx
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
```

- [ ] **Step 5: Rewrite `src/features/auth/AuthView.jsx`**

Replace the whole file with:

```jsx
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

        <SocialButtons mode={mode} disabled={isAuthLoading} onToken={handleSocialToken} onError={showError} />

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
```

- [ ] **Step 6: Rewrite `src/features/auth/auth.css`**

Replace the whole file with:

```css
/* ==========================================================================
   Future Wallet - Authentication UI
   ========================================================================== */

.future-auth-overlay {
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at center 40%, #252e3e 0%, #171d27 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  box-sizing: border-box;
  position: relative;
  overflow-x: hidden;
  font-family: 'Prompt', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.future-auth-overlay::before {
  content: '';
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(650px, 100vw);
  height: 650px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.04) 50%, transparent 70%);
  pointer-events: none;
}

/* Card */
.future-auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 2.25rem 2.25rem 1.75rem;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  animation: authCardFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes authCardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Brand */
.auth-brand-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.auth-brand-logo-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-brand-logo-icon svg {
  width: 100%;
  height: 100%;
}

.auth-brand-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.auth-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin: 0 0 1.5rem;
  letter-spacing: -0.01em;
}

/* Social */
.auth-social-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.auth-social-buttons.is-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.auth-google-btn {
  display: flex;
  justify-content: center;
  min-height: 44px;
  width: 100%;
}

.auth-social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  height: 44px;
  border-radius: 6px;
  border: 1px solid #dadce0;
  background: #ffffff;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  font-family: inherit;
}

.auth-social-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #9ca3af;
}

.auth-social-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  margin: 1.25rem 0;
  color: #9ca3af;
  font-size: 0.78rem;
  font-weight: 500;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.auth-divider span {
  padding: 0 0.85rem;
}

/* Notice */
.auth-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.45;
  margin-bottom: 1rem;
  border: 1px solid;
}

.auth-notice-info {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #1d4ed8;
}

.auth-notice-success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #047857;
}

.auth-notice-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #b91c1c;
}

.auth-notice-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-notice-text {
  flex: 1;
}

.auth-notice-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  display: flex;
  opacity: 0.7;
}

.auth-notice-close:hover {
  opacity: 1;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.auth-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  padding: 0 0.85rem;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-input-group:focus-within {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.auth-input-group.has-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

.auth-input-icon {
  display: flex;
  align-items: center;
  color: #6b7280;
  margin-right: 0.65rem;
  flex-shrink: 0;
}

.auth-input-field {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #1f2937;
  font-size: 0.9rem;
  font-family: inherit;
}

.auth-input-field::placeholder {
  color: #6b7280;
}

.auth-password-toggle {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.auth-password-toggle:hover {
  color: #1f2937;
}

.auth-field-error {
  font-size: 0.76rem;
  color: #ef4444;
  margin-top: -0.4rem;
  padding-left: 0.25rem;
}

/* Remember me */
.auth-options-row {
  display: flex;
  align-items: center;
  font-size: 0.84rem;
}

.auth-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #374151;
  user-select: none;
}

.auth-toggle-switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
}

.auth-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.auth-toggle-slider {
  position: absolute;
  inset: 0;
  cursor: pointer;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 20px;
}

.auth-toggle-slider::before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.auth-toggle-switch input:checked + .auth-toggle-slider {
  background-color: #059669;
}

.auth-toggle-switch input:checked + .auth-toggle-slider::before {
  transform: translateX(18px);
}

.auth-toggle-switch input:focus-visible + .auth-toggle-slider {
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.3);
}

/* Password strength */
.password-strength-bars {
  display: flex;
  gap: 6px;
  margin-bottom: 0.4rem;
}

.password-strength-bar {
  flex: 1;
  height: 5px;
  border-radius: 4px;
  background: #e5e7eb;
  transition: background-color 0.3s ease;
}

.password-strength-bar.weak-red {
  background-color: #ef4444;
}

.password-strength-bar.weak-orange {
  background-color: #f97316;
}

.password-strength-bar.medium-yellow {
  background-color: #eab308;
}

.password-strength-bar.strong-green {
  background-color: #10b981;
}

.password-strength-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #4b5563;
}

.password-strength-status {
  font-weight: 600;
}

/* Submit */
.auth-submit-btn {
  width: 100%;
  height: 46px;
  background: #059669;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  margin-top: 0.25rem;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
}

.auth-submit-btn:hover:not(:disabled) {
  background: #047857;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.35);
}

.auth-submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* DEV-only test account */
.auth-dev-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: #fffbeb;
  border: 1px dashed #f59e0b;
  font-size: 0.75rem;
  color: #78350f;
}

.auth-dev-box-title {
  font-weight: 600;
}

.auth-dev-box-btn {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  font-family: inherit;
}

/* Footer links */
.auth-footer-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.86rem;
  color: #64748b;
  flex-wrap: wrap;
}

.auth-switch-link-btn {
  background: none;
  border: none;
  color: #059669;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.86rem;
  padding: 0;
}

.auth-switch-link-btn:hover {
  color: #047857;
  text-decoration: underline;
}

.auth-guest-link {
  margin-top: 0.6rem;
  color: #6b7280;
  font-size: 0.82rem;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  padding: 0.25rem;
  font-family: inherit;
}

.auth-guest-link:hover {
  color: #059669;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .future-auth-overlay {
    padding: 1.5rem 1rem;
  }

  .future-auth-card {
    padding: 1.75rem 1.25rem 1.5rem;
    border-radius: 18px;
  }
}
```

- [ ] **Step 7: Run tests and build**

Run: `npm test` — Expected: all PASS.
Run: `npm run build` — Expected: succeeds with no unresolved imports.

- [ ] **Step 8: Verify the test account is not in the production bundle**

Run: `grep -rl "Password123" dist/ || echo "clean"`
Expected: `clean`

- [ ] **Step 9: Commit**

```bash
git add src/features/auth
git commit -m "feat(auth): redesign login and register screens"
```

---

### Task 5: Browser verification

**Files:** none (fix-forward in the owning file if a check fails, then re-run the check).

- [ ] **Step 1: Open the app**

Dev server on port 3000 (`walletly-dev` in `.claude/launch.json`, or the user's running `npm run dev`). Open `http://localhost:3000` with no auth in localStorage (`localStorage.clear()` then reload).

- [ ] **Step 2: Check the login screen with no social env set**

Expected: no Google/Facebook buttons, no divider; email + password fields, "จดจำอีเมล", "เข้าสู่ระบบ", amber DEV box, "สมัครสมาชิก", guest link. No console errors.

- [ ] **Step 3: Check validation and errors**

- Submit empty → inline field errors only, no toast.
- Valid email + wrong password → one red notice with the BE message, no toast.
- DEV box "กรอกอัตโนมัติ" → submit → enters the app, success toast "ยินดีต้อนรับ ...".

- [ ] **Step 4: Check register screen**

Logout, switch to "สมัครสมาชิก": fields render, strength bar updates, `abcdefgh` shows letter+digit error, no crash, switching back to login clears the notice.

- [ ] **Step 5: Check legacy offline user is dropped**

Run in page: `localStorage.removeItem('walletly_access_token'); localStorage.setItem('future_wallet_auth_user', JSON.stringify({ name: 'Old', email: 'x@y.z', isGuest: false, isOffline: true })); location.reload();`
Expected: login screen, not the app.

- [ ] **Step 6: Check social buttons render when env is set**

Add `VITE_GOOGLE_CLIENT_ID=placeholder.apps.googleusercontent.com` and `VITE_FACEBOOK_APP_ID=000000000000000` to `.env.development.local`, restart dev server.
Expected: Google official button renders (it may show an origin error on click with a placeholder ID — that is expected), Facebook button enabled after SDK loads, divider "หรือใช้อีเมล". Then remove the two placeholder lines and restart.

- [ ] **Step 7: Check phone width**

Resize to 375×812. Expected: card fits with side gutter, no horizontal scroll.

- [ ] **Step 8: Screenshot proof** of login (desktop + mobile) and register.
