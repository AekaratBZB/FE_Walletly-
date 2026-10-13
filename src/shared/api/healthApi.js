import { apiClient } from './client';

export const healthApi = {
  async check() {
    return apiClient('/health');
  },

  async checkDb() {
    return apiClient('/health/db-check');
  }
};
