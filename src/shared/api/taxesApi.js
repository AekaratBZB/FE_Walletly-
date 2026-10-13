import { apiClient } from './client';

export const taxesApi = {
  async getSetting(taxYear = 2026) {
    return apiClient(`/taxes?taxYear=${taxYear}`);
  },

  async saveSetting(taxData) {
    return apiClient('/taxes', {
      method: 'POST',
      body: taxData
    });
  },

  async calculateQuick(taxData) {
    return apiClient('/taxes/calculate', {
      method: 'POST',
      body: taxData
    });
  },

  async getBrackets(taxYear = 2026) {
    return apiClient(`/taxes/brackets?taxYear=${taxYear}`);
  }
};
