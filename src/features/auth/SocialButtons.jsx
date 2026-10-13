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
