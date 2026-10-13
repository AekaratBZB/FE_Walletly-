import { apiClient } from './client';

export const consentsApi = {
  async getLatest(anonymousId = null) {
    const query = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : '';
    return apiClient(`/consents${query}`);
  },

  async save(consentData, anonymousId = null) {
    const query = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : '';
    return apiClient(`/consents${query}`, {
      method: 'POST',
      body: consentData
    });
  }
};
