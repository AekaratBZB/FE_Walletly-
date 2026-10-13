const TOKEN_KEY = 'walletly_access_token';
const REFRESH_TOKEN_KEY = 'walletly_refresh_token';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredTokens = (accessToken, refreshToken) => {
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('Failed to store auth tokens:', e);
  }
};

export const clearStoredTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear auth tokens:', e);
  }
};

const getStoredRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

// BE ตรวจจับการใช้ refresh token ซ้ำ (reuse detection): ถ้าส่ง token เดิมซ้ำ จะ revoke ทุก session
// จึงต้อง refresh ทีละครั้งเท่านั้น ทั้งภายใน tab (shared promise) และข้าม tab (Web Locks)
let refreshPromise = null;

const performRefresh = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    if (response.status === 401) clearStoredTokens();
    return false;
  }

  const data = await response.json();
  setStoredTokens(data.accessToken, data.refreshToken);
  return true;
};

const refreshAccessToken = (expiredAccessToken) => {
  if (!refreshPromise) {
    const run = async () => {
      // tab อื่นอาจ refresh ไปแล้วระหว่างรอ lock: ใช้ token ใหม่ได้เลยโดยไม่ต้อง refresh ซ้ำ
      if (getStoredToken() !== expiredAccessToken) return !!getStoredToken();
      return performRefresh();
    };

    refreshPromise = (navigator.locks?.request
      ? navigator.locks.request('walletly-token-refresh', run)
      : run()
    )
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/verify-email', '/auth/google', '/auth/facebook'];

const isCredentialEndpoint = (endpoint) =>
  CREDENTIAL_ENDPOINTS.some((path) => endpoint.toLowerCase().startsWith(path));

export const apiClient = async (endpoint, options = {}, isRetry = false) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // Access token หมดอายุ: refresh แล้วลองใหม่ 1 ครั้ง (ไม่ทำกับ endpoint ที่ใช้เข้าสู่ระบบเอง)
    if (response.status === 401 && token && !isRetry && !isCredentialEndpoint(endpoint)) {
      const refreshed = await refreshAccessToken(token);
      if (refreshed) {
        return apiClient(endpoint, options, true);
      }
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        (data && typeof data === 'object' && (data.message || data.error || (data.errors && Object.values(data.errors).flat().join(', ')))) ||
        `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};
