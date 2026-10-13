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
