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
