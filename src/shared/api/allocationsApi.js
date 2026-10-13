import { apiClient } from './client';

export const allocationsApi = {
  async getSetting() {
    return apiClient('/allocations');
  },

  async getAnalysis(year, month) {
    const query = new URLSearchParams();
    if (year) query.append('year', year);
    if (month) query.append('month', month);
    const queryString = query.toString();
    return apiClient(`/allocations/analysis${queryString ? `?${queryString}` : ''}`);
  },

  async applyTemplate({ templateKey, monthlyIncome, autoAssignCategories = true }) {
    return apiClient('/allocations/apply-template', {
      method: 'POST',
      body: {
        templateKey,
        monthlyIncome,
        autoAssignCategories
      }
    });
  },

  async updateSetting(settingData) {
    return apiClient('/allocations', {
      method: 'PUT',
      body: settingData
    });
  },

  async assignCategory(bucketId, categoryId) {
    return apiClient(`/allocations/buckets/${bucketId}/categories`, {
      method: 'POST',
      body: { categoryId }
    });
  },

  async removeCategory(bucketId, categoryId) {
    return apiClient(`/allocations/buckets/${bucketId}/categories/${categoryId}`, {
      method: 'DELETE'
    });
  }
};
