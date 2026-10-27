import { apiClient } from './client';

export const fixedCostsApi = {
  async getAll() {
    return apiClient('/fixed-costs');
  },

  async getSummary() {
    return apiClient('/fixed-costs/summary');
  },

  async getById(id) {
    return apiClient(`/fixed-costs/${id}`);
  },

  async create(data) {
    return apiClient('/fixed-costs', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiClient(`/fixed-costs/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/fixed-costs/${id}`, {
      method: 'DELETE'
    });
  },

  async pay(id, paymentData = {}) {
    return apiClient(`/fixed-costs/${id}/pay`, {
      method: 'POST',
      body: paymentData
    });
  },

  async unpay(id, data = {}) {
    return apiClient(`/fixed-costs/${id}/unpay`, {
      method: 'POST',
      body: data
    });
  },

  // data: { periodMonth: 'YYYY-MM-01', fixedCostIds: [], included: boolean }
  async setInclusion(data) {
    return apiClient('/fixed-costs/inclusion', {
      method: 'PUT',
      body: data
    });
  },

  async resetMonthly() {
    return apiClient('/fixed-costs/reset-monthly', {
      method: 'POST'
    });
  }
};
