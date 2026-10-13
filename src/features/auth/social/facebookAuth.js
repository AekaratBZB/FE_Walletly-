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
