import { apiClient, setStoredTokens, clearStoredTokens } from './client';

export const authApi = {
  // เมื่อ BE เปิดยืนยันอีเมล จะตอบ 202 { message } (ยังไม่มี token) และส่งลิงก์ยืนยันไปทางอีเมล
  // เมื่อปิดยืนยันอีเมล จะตอบ 200 พร้อม token เหมือน login
  async register(fullName, email, password) {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: {
        email,
        password,
        displayName: fullName
      }
    });
    if (data?.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },

  // ยืนยันอีเมลด้วย token จากลิงก์ในอีเมล: BE สร้างบัญชีแล้วคืน token เหมือน login
  async verifyEmail(token) {
    const data = await apiClient('/auth/verify-email', {
      method: 'POST',
      body: { token }
    });
    if (data?.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },

  async login(email, password) {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: {
        email,
        password
      }
    });
    if (data.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },

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

  async getMe() {
    return apiClient('/auth/me');
  },

  async refreshToken(refreshToken) {
    const data = await apiClient('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken }
    });
    if (data.accessToken) {
      setStoredTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },

  logout() {
    clearStoredTokens();
  }
};
