# Auth Redesign & Real Social Login — Design

Date: 2026-10-13
Status: Draft (awaiting review)
Scope: FE only (`D:\FE_wallet`). BE (`D:\BE_wallet_net`) already verifies social tokens; only config is missing.

## 1. Goal

The login screen currently offers six competing ways in (account chooser, Google, Facebook, email form, test-account box, guest), shows developer text to end users, and fakes social login. Make it a single clear flow where Google and Facebook sign-in work for real, and nothing pretends to succeed when it did not.

Success criteria:
- A user with a Google or Facebook account can sign in with one click once credentials are configured, and the BE issues real JWTs.
- With no credentials configured, social buttons do not render; email login and register still work.
- No dev-only text (SQL Server, JWT, endpoint paths, test passwords) appears in a production build.
- Login never "succeeds" without a BE token, except explicit Guest mode.
- Register page social buttons no longer crash (`handleSocial` ReferenceError).

Brand name stays **Future Wallet**.

## 2. Findings (current state)

| # | Problem | Location |
|---|---------|----------|
| 1 | Six entry points, unclear primary action | `AuthView.jsx` login card |
| 2 | Social login is a fake account-chooser modal; sends typed email to BE, never a real token | `AuthView.jsx:107-142, 280-342`, `AuthContext.jsx:257-322` |
| 3 | Dev text and test password shipped to users and bundle | `AuthView.jsx:107-142, 563-604`, toasts |
| 4 | Register social buttons call undefined `handleSocial` | `AuthView.jsx:653, 661` |
| 5 | Register divider reads "Social Login" above email form | `AuthView.jsx:670` |
| 6 | Forgot password shows success toast but calls nothing (BE has no endpoint) | `AuthView.jsx:353-363` |
| 7 | Offline fallback logs in with any password when BE errors (5xx/network); user has no token so every API call fails | `AuthContext.jsx:166-184, 233-247, 309-320` |
| 8 | Errors shown twice (inline box + toast) | `AuthView.jsx:229-230, 275-276` |
| 9 | 1,200-line component, mostly inline styles | `AuthView.jsx` |

BE facts (verified in `D:\BE_wallet_net`):
- `POST /api/auth/google { idToken }` — validated via Google `tokeninfo` (`aud` ∈ `SocialAuth:GoogleClientIds`, `iss`, `email_verified`).
- `POST /api/auth/facebook { accessToken }` — validated via Graph `debug_token` (`app_id` = `SocialAuth:FacebookAppId`) + `/me`.
- Body `email` / `displayName` / `avatarUrl` are ignored; profile comes from the provider.
- Response: `{ id, email, displayName, avatarUrl, accessToken, refreshToken, expiresAt }`.
- `SocialAuth:*` config is empty in repo and local user-secrets. No forgot/reset password endpoint.

## 3. Target UX

Login card (top to bottom):

```
[logo] Future Wallet
ยินดีต้อนรับกลับมา
[ Google official button ]      ← only if VITE_GOOGLE_CLIENT_ID set
[ ดำเนินการต่อด้วย Facebook ]    ← only if VITE_FACEBOOK_APP_ID set
──── หรือใช้อีเมล ────           ← divider only if any social button shown
<notice area: one message at a time>
อีเมล
รหัสผ่าน  [eye]
[x] จดจำฉัน
[ เข้าสู่ระบบ ]
(DEV only) บัญชีทดสอบ: test.user@walletly.app  [กรอกอัตโนมัติ]
ยังไม่มีบัญชี? สมัครสมาชิก
ทดลองใช้แบบไม่สมัคร (Guest)
```

Register card: same header, same social buttons (label "สมัครด้วย ..."; Google button text `signup_with`), divider "หรือสมัครด้วยอีเมล", name / email / password + strength bar, submit, link back to login.

Removed: account-chooser button and modal, `AVAILABLE_ACCOUNTS`, custom-account form, forgot-password link and modal (until BE supports it), "(API)" / "Database" wording in toasts.

Messages:
- Form errors and BE errors render once, in the notice area above the fields. No duplicate toast.
- Success toast only on successful sign-in ("ยินดีต้อนรับ {name}").
- Email-verification notices (verifying / sent / error) use the same notice area.
- Social popup closed by user: no error shown.
- Social provider script failed to load: notice "ไม่สามารถโหลด Google/Facebook ได้ กรุณาลองใหม่หรือใช้อีเมล".

## 4. Architecture

### 4.1 Files

```
src/features/auth/
  AuthView.jsx            # shell: mode state ('login' | 'register'), header, switch links (~100 lines)
  LoginForm.jsx           # email/password form, remember me, DEV test-account box
  RegisterForm.jsx        # name/email/password, strength bar
  SocialButtons.jsx       # renders Google + Facebook buttons per config; reports idToken/accessToken
  AuthNotice.jsx          # one notice box: type info|success|error, optional close
  FutureWalletLogo.jsx    # moved out of AuthView.jsx
  validation.js           # pure: validateLogin, validateRegister, passwordStrength
  social/
    socialConfig.js       # reads VITE_GOOGLE_CLIENT_ID, VITE_FACEBOOK_APP_ID, VITE_FACEBOOK_API_VERSION
    loadScript.js         # inject <script> once, returns cached promise
    googleAuth.js         # init GIS, renderButton(el, { text }), resolves credential via callback
    facebookAuth.js       # init FB SDK, login() -> accessToken | null (cancelled)
  __tests__/
    validation.test.js
    socialConfig.test.js
  auth.css                # all styles (inline styles moved here)
  index.js
```

### 4.2 Google (Google Identity Services)

- Load `https://accounts.google.com/gsi/client` only when `VITE_GOOGLE_CLIENT_ID` is set.
- `google.accounts.id.initialize({ client_id, callback, ux_mode: 'popup' })`; `google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'signin_with' | 'signup_with', width, locale: 'th' })`.
- The official rendered button is used (Google requires its branding; custom-styled buttons cannot get an ID token without the One Tap / popup prompt APIs).
- Callback `{ credential }` → `loginWithGoogle(credential)` → `authApi.loginSocial('google', { idToken })`.
- No One Tap auto-prompt (not requested; avoids surprise popups).

### 4.3 Facebook (JS SDK)

- Load `https://connect.facebook.net/en_US/sdk.js` only when `VITE_FACEBOOK_APP_ID` is set.
- `FB.init({ appId, version: VITE_FACEBOOK_API_VERSION || 'v21.0', cookie: false, xfbml: false })`.
- Our own styled button (Facebook permits it) → `FB.login(cb, { scope: 'public_profile,email' })`.
- `authResponse.accessToken` → `loginWithFacebook(accessToken)`; no `authResponse` = user cancelled → silently return.
- `FB.login` must run inside the click handler (popup blockers), so the SDK is preloaded on mount, not on click.

### 4.4 AuthContext changes

- Replace `loginWithSocial(provider, accountInfo)` with `loginWithSocial(provider, token)` — sends only `idToken` (Google) or `accessToken` (Facebook). Remove the fake default emails and avatar URLs.
- Extract shared `toUserData(dto, extra)` and `persistUser(user)` helpers (currently repeated 5 times).
- Remove all offline fallbacks in `login`, `register`, `loginWithSocial`. Network/5xx returns `{ success: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง' }`.
- `toAuthError(err)` pure helper: status 0/undefined/≥500 → connection message; 401 → "อีเมลหรือรหัสผ่านไม่ถูกต้อง"; 429 → "ลองหลายครั้งเกินไป กรุณารอสักครู่"; else BE message or fallback.
- `isAuthLoading` set via `try/finally` so it always resets.
- Guest mode unchanged (local only, `isGuest: true`).
- Session check on mount unchanged.

### 4.5 `authApi.loginSocial`

Signature becomes `loginSocial(provider, token)`; body `{ idToken: token }` or `{ accessToken: token }`. Nothing else in `src/shared/api` changes.

### 4.6 Config

`.env.example` gains:

```
# Google OAuth Web Client ID (public). ไม่ตั้ง = ซ่อนปุ่ม Google
VITE_GOOGLE_CLIENT_ID=
# Facebook App ID (public). ไม่ตั้ง = ซ่อนปุ่ม Facebook
VITE_FACEBOOK_APP_ID=
# Graph API version for FB SDK (default v21.0)
VITE_FACEBOOK_API_VERSION=
```

App Secret is BE-only and never goes into any FE file.

## 5. Error handling summary

| Case | Result |
|------|--------|
| BE unreachable / 5xx | Notice: connection error; user stays on login |
| Wrong credentials (401) | Notice: invalid email or password |
| Rate limited (429) | Notice: too many attempts |
| Social token rejected (400/401) | Notice: BE message, else "เข้าสู่ระบบด้วย {provider} ไม่สำเร็จ" |
| Social popup cancelled | Nothing |
| Provider script load fails | Notice: provider unavailable, use email |
| Env not set | Button not rendered |

## 6. Testing

- Vitest unit tests (pure modules): `validation.js` (login/register rules incl. BE password rule: ≥8, letter + digit, ≤72 bytes), `passwordStrength`, `socialConfig.js` (enabled flags from env), `toAuthError` mapping.
- Manual in browser (dev server, Cloud Run dev API): email login with test account, wrong password, register validation, register-page buttons do not crash, social buttons hidden with no env, guest mode, DEV box hidden in `npm run build && npm run preview`.
- Real Google/Facebook sign-in verified once the user supplies Client ID / App ID and sets BE secrets.

## 7. Out of scope

- Forgot/reset password (needs BE endpoint + email template) — separate task.
- Linking social accounts from settings (`/auth/link-social` exists in BE).
- Changing BE code or config (user sets secrets themselves).
- Navbar / rest of app styling.

## 8. User setup steps (outside code)

Google: Cloud Console → new project → OAuth consent screen (External, scopes `openid email profile`) → Credentials → OAuth client ID (Web) → Authorized JavaScript origins `http://localhost:3000` + deployed FE origin → copy Client ID → Publish app.

Facebook: developers.facebook.com → Create App (Facebook Login use case) → Settings › Basic: App ID, App Secret, Privacy Policy URL, data deletion URL → Facebook Login settings: allowed JS SDK domains `localhost` + FE domain → switch to Live.

Config:
- FE `.env.development.local` / deploy env: `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID`.
- BE user-secrets (local) or Cloud Run env: `SocialAuth:GoogleClientIds:0`, `SocialAuth:FacebookAppId`, `SocialAuth:FacebookAppSecret` (`SocialAuth__…` form for env vars).
