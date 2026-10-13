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
